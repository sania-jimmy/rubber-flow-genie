import Solver from "javascript-lp-solver";
import {
  ProductOrder,
  ProductConfig,
  DailySchedule,
  ScheduleResult,
  BatchSchedule,
} from "@/types/scheduler";

interface OrderWithMetrics extends ProductOrder {
  config: ProductConfig;
  batchesNeeded: number;
  totalTimePerBatch: number;
  totalTime: number;
  urgencyScore: number;
}

export function calculateScheduleMILP(
  orders: ProductOrder[],
  productConfigs: ProductConfig[],
  workingHoursPerDay: number,
  includeExtra: boolean
): ScheduleResult {
  const dailyCapacity = workingHoursPerDay * 60;
  const today = new Date();

  // Build config map
  const configMap = new Map<string, ProductConfig>();
  productConfigs.forEach((config) => configMap.set(config.id, config));

  // Calculate metrics for each order
  const ordersWithMetrics: OrderWithMetrics[] = orders.map((order) => {
    const config = configMap.get(order.productId)!;
    const batchesNeeded = Math.ceil(order.quantity / config.totalPerBatch);
    const totalTimePerBatch =
      config.processingTime +
      config.coolingTime +
      config.moldRefillTime +
      config.finishingTime;
    const totalTime = batchesNeeded * totalTimePerBatch;

    const daysUntilDeadline = Math.max(
      0,
      Math.ceil(
        (order.requirementDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const priorityWeight =
      order.priority === "High" ? 3 : order.priority === "Medium" ? 2 : 1;
    const urgencyScore = priorityWeight * 1000 - daysUntilDeadline;

    return {
      ...order,
      config,
      batchesNeeded,
      totalTimePerBatch,
      totalTime,
      urgencyScore,
    };
  });

  // Estimate max days needed
  const totalTimeNeeded = ordersWithMetrics.reduce(
    (sum, o) => sum + o.totalTime,
    0
  );
  const maxDays = Math.ceil(totalTimeNeeded / dailyCapacity) + 5;

  // Build MILP model
  const model: any = {
    optimize: "total_cost",
    opType: "min",
    constraints: {},
    variables: {},
    ints: {},
  };

  // Decision variables: x[order_id][batch][day] = 1 if batch is scheduled on day
  ordersWithMetrics.forEach((order) => {
    for (let batch = 1; batch <= order.batchesNeeded; batch++) {
      for (let day = 1; day <= maxDays; day++) {
        const varName = `x_${order.id}_b${batch}_d${day}`;
        model.variables[varName] = {
          total_cost: 0,
        };
        model.ints[varName] = 1;

        // Add to daily capacity constraint
        const dayConstraint = `day_${day}_capacity`;
        if (!model.constraints[dayConstraint]) {
          model.constraints[dayConstraint] = { max: dailyCapacity };
        }
        model.variables[varName][dayConstraint] = order.totalTimePerBatch;

        // Add deadline penalty
        const daysUntilDeadline = Math.ceil(
          (order.requirementDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (day > daysUntilDeadline) {
          model.variables[varName].total_cost +=
            (day - daysUntilDeadline) * 100 * order.urgencyScore;
        }

        // Add idle time penalty (prefer to use full days)
        model.variables[varName].total_cost += 0.1;
      }
    }

    // Constraint: each batch must be scheduled exactly once
    for (let batch = 1; batch <= order.batchesNeeded; batch++) {
      const batchConstraint = `order_${order.id}_batch_${batch}`;
      model.constraints[batchConstraint] = { equal: 1 };
      for (let day = 1; day <= maxDays; day++) {
        const varName = `x_${order.id}_b${batch}_d${day}`;
        model.variables[varName][batchConstraint] = 1;
      }
    }
  });

  // Solve the model
  const solution = Solver.Solve(model);

  // Parse solution and build schedule
  const dailySchedules: DailySchedule[] = [];

  if (solution.feasible) {
    // Extract scheduled batches
    const scheduledBatches: Array<{
      order: OrderWithMetrics;
      batch: number;
      day: number;
    }> = [];

    Object.keys(solution).forEach((key) => {
      if (key.startsWith("x_") && solution[key] === 1) {
        const parts = key.split("_");
        const orderId = parts[1];
        const batch = parseInt(parts[2].substring(1));
        const day = parseInt(parts[3].substring(1));

        const order = ordersWithMetrics.find((o) => o.id === orderId);
        if (order) {
          scheduledBatches.push({ order, batch, day });
        }
      }
    });

    // Sort by day and urgency
    scheduledBatches.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return b.order.urgencyScore - a.order.urgencyScore;
    });

    // Build daily schedules
    scheduledBatches.forEach(({ order, batch, day }) => {
      while (dailySchedules.length < day) {
        const date = new Date(today);
        date.setDate(date.getDate() + dailySchedules.length);
        dailySchedules.push({
          day: dailySchedules.length + 1,
          date,
          batches: [],
          totalTimeUsed: 0,
          idleTime: 0,
          overtime: 0,
        });
      }

      const daySchedule = dailySchedules[day - 1];
      const batchSchedule: BatchSchedule = {
        productId: order.productId,
        productName: order.config.name,
        batchNumber: batch,
        pieces: Math.min(
          order.config.totalPerBatch,
          order.quantity - (batch - 1) * order.config.totalPerBatch
        ),
        startTime: daySchedule.totalTimeUsed,
        endTime: daySchedule.totalTimeUsed + order.totalTimePerBatch,
        day,
      };

      daySchedule.batches.push(batchSchedule);
      daySchedule.totalTimeUsed += order.totalTimePerBatch;
    });
  } else {
    // Fallback to greedy algorithm if MILP fails
    return calculateScheduleGreedy(
      orders,
      productConfigs,
      workingHoursPerDay,
      includeExtra
    );
  }

  // Calculate idle time and overtime
  dailySchedules.forEach((day) => {
    if (day.totalTimeUsed < dailyCapacity) {
      day.idleTime = dailyCapacity - day.totalTimeUsed;
    } else if (day.totalTimeUsed > dailyCapacity) {
      day.overtime = day.totalTimeUsed - dailyCapacity;
    }
  });

  // Fill idle time with extra production if enabled
  if (includeExtra && dailySchedules.length > 0) {
    fillIdleTimeWithExtra(dailySchedules, ordersWithMetrics, dailyCapacity);
  }

  // Generate production summary
  const productionSummary = ordersWithMetrics.map((order) => {
    const daysUntilDeadline = Math.ceil(
      (order.requirementDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const daysRequired = Math.ceil(order.totalTime / dailyCapacity);
    const extraDays = Math.max(0, daysRequired - daysUntilDeadline);

    return {
      productId: order.productId,
      productName: order.config.name,
      totalPieces: order.quantity,
      totalBatches: order.batchesNeeded,
      daysRequired,
      extraDays,
    };
  });

  // Calculate overall metrics
  const totalMinutesAvailable = dailySchedules.length * dailyCapacity;
  const totalMinutesUsed = dailySchedules.reduce(
    (sum, day) => sum + day.totalTimeUsed,
    0
  );
  const overallUtilization = (totalMinutesUsed / totalMinutesAvailable) * 100;
  const totalIdleTime = dailySchedules.reduce(
    (sum, day) => sum + day.idleTime,
    0
  );
  const totalOvertime = dailySchedules.reduce(
    (sum, day) => sum + day.overtime,
    0
  );

  return {
    dailySchedules,
    totalDays: dailySchedules.length,
    productionSummary,
    overallUtilization,
    totalIdleTime,
    totalOvertime,
  };
}

// Greedy fallback algorithm
function calculateScheduleGreedy(
  orders: ProductOrder[],
  productConfigs: ProductConfig[],
  workingHoursPerDay: number,
  includeExtra: boolean
): ScheduleResult {
  const dailyCapacity = workingHoursPerDay * 60;
  const today = new Date();

  const configMap = new Map<string, ProductConfig>();
  productConfigs.forEach((config) => configMap.set(config.id, config));

  const ordersWithMetrics: OrderWithMetrics[] = orders.map((order) => {
    const config = configMap.get(order.productId)!;
    const batchesNeeded = Math.ceil(order.quantity / config.totalPerBatch);
    const totalTimePerBatch =
      config.processingTime +
      config.coolingTime +
      config.moldRefillTime +
      config.finishingTime;
    const totalTime = batchesNeeded * totalTimePerBatch;

    const daysUntilDeadline = Math.max(
      0,
      Math.ceil(
        (order.requirementDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const priorityWeight =
      order.priority === "High" ? 3 : order.priority === "Medium" ? 2 : 1;
    const urgencyScore = priorityWeight * 1000 - daysUntilDeadline;

    return {
      ...order,
      config,
      batchesNeeded,
      totalTimePerBatch,
      totalTime,
      urgencyScore,
    };
  });

  ordersWithMetrics.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const dailySchedules: DailySchedule[] = [];
  let currentDay = 0;

  for (const order of ordersWithMetrics) {
    let batchesRemaining = order.batchesNeeded;

    while (batchesRemaining > 0) {
      if (!dailySchedules[currentDay]) {
        const date = new Date(today);
        date.setDate(date.getDate() + currentDay);
        dailySchedules[currentDay] = {
          day: currentDay + 1,
          date,
          batches: [],
          totalTimeUsed: 0,
          idleTime: 0,
          overtime: 0,
        };
      }

      const daySchedule = dailySchedules[currentDay];
      const availableTime = dailyCapacity - daySchedule.totalTimeUsed;

      if (availableTime >= order.totalTimePerBatch) {
        const batchesToSchedule = Math.min(
          batchesRemaining,
          Math.floor(availableTime / order.totalTimePerBatch)
        );

        for (let i = 0; i < batchesToSchedule; i++) {
          const batch: BatchSchedule = {
            productId: order.productId,
            productName: order.config.name,
            batchNumber: order.batchesNeeded - batchesRemaining + i + 1,
            pieces: Math.min(
              order.config.totalPerBatch,
              order.quantity -
                (order.batchesNeeded - batchesRemaining + i) *
                  order.config.totalPerBatch
            ),
            startTime: daySchedule.totalTimeUsed,
            endTime: daySchedule.totalTimeUsed + order.totalTimePerBatch,
            day: currentDay + 1,
          };

          daySchedule.batches.push(batch);
          daySchedule.totalTimeUsed += order.totalTimePerBatch;
        }

        batchesRemaining -= batchesToSchedule;
      } else {
        currentDay++;
      }
    }
  }

  dailySchedules.forEach((day) => {
    if (day.totalTimeUsed < dailyCapacity) {
      day.idleTime = dailyCapacity - day.totalTimeUsed;
    } else if (day.totalTimeUsed > dailyCapacity) {
      day.overtime = day.totalTimeUsed - dailyCapacity;
    }
  });

  if (includeExtra) {
    fillIdleTimeWithExtra(dailySchedules, ordersWithMetrics, dailyCapacity);
  }

  const productionSummary = ordersWithMetrics.map((order) => {
    const daysUntilDeadline = Math.ceil(
      (order.requirementDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const daysRequired = Math.ceil(order.totalTime / dailyCapacity);
    const extraDays = Math.max(0, daysRequired - daysUntilDeadline);

    return {
      productId: order.productId,
      productName: order.config.name,
      totalPieces: order.quantity,
      totalBatches: order.batchesNeeded,
      daysRequired,
      extraDays,
    };
  });

  const totalMinutesAvailable = dailySchedules.length * dailyCapacity;
  const totalMinutesUsed = dailySchedules.reduce(
    (sum, day) => sum + day.totalTimeUsed,
    0
  );
  const overallUtilization = (totalMinutesAvailable > 0) 
    ? (totalMinutesUsed / totalMinutesAvailable) * 100 
    : 0;
  const totalIdleTime = dailySchedules.reduce(
    (sum, day) => sum + day.idleTime,
    0
  );
  const totalOvertime = dailySchedules.reduce(
    (sum, day) => sum + day.overtime,
    0
  );

  return {
    dailySchedules,
    totalDays: dailySchedules.length,
    productionSummary,
    overallUtilization,
    totalIdleTime,
    totalOvertime,
  };
}

function fillIdleTimeWithExtra(
  dailySchedules: DailySchedule[],
  ordersWithMetrics: OrderWithMetrics[],
  dailyCapacity: number
) {
  if (dailySchedules.length === 0) return;

  const lastDay = dailySchedules[dailySchedules.length - 1];
  if (lastDay.idleTime > 0) {
    const productCounts = new Map<string, { count: number; config: ProductConfig }>();
    
    dailySchedules.forEach((day) => {
      day.batches.forEach((batch) => {
        const order = ordersWithMetrics.find(o => o.productId === batch.productId);
        if (order) {
          const current = productCounts.get(batch.productId) || { count: 0, config: order.config };
          productCounts.set(batch.productId, { 
            count: current.count + batch.pieces, 
            config: order.config 
          });
        }
      });
    });

    const mostProduced = Array.from(productCounts.entries()).sort(
      (a, b) => b[1].count - a[1].count
    )[0];

    if (mostProduced) {
      const config = mostProduced[1].config;
      const totalTimePerBatch =
        config.processingTime +
        config.coolingTime +
        config.moldRefillTime +
        config.finishingTime;
      const extraBatches = Math.floor(lastDay.idleTime / totalTimePerBatch);

      for (let i = 0; i < extraBatches; i++) {
        const batch: BatchSchedule = {
          productId: config.id,
          productName: config.name,
          batchNumber: -1,
          pieces: config.totalPerBatch,
          startTime: lastDay.totalTimeUsed,
          endTime: lastDay.totalTimeUsed + totalTimePerBatch,
          day: lastDay.day,
        };

        lastDay.batches.push(batch);
        lastDay.totalTimeUsed += totalTimePerBatch;
        lastDay.idleTime -= totalTimePerBatch;
      }
    }
  }
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}
