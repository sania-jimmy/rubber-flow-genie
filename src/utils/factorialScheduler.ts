import {
  Product,
  ScheduledProduct,
  ProductionSchedule,
  DailySchedule,
  MachineInventory,
  MachineSchedule,
  MachineTimeSlot
} from "@/types/production";

interface ScheduleEvaluation {
  schedule: ProductionSchedule;
  totalLateDeliveries: number;
  totalCompletionTime: number;
  totalIdleTime: number;
  averageUtilization: number;
  score: number;
}

export class FactorialScheduler {
  private setupTime = 5 / 60; // 5 minutes in hours

  constructor(
    private products: Product[],
    private workingHoursPerDay: number,
    private machineInventory: MachineInventory[]
  ) {}

  public optimize(): ProductionSchedule {
    if (this.products.length === 0) {
      return this.createEmptySchedule();
    }

    // Generate all permutations of product orders
    const permutations = this.generatePermutations(this.products.map((_, i) => i));

    let bestEvaluation: ScheduleEvaluation | null = null;

    for (const order of permutations) {
      const evaluation = this.evaluateSchedule(order);
      if (!bestEvaluation || evaluation.score < bestEvaluation.score) {
        bestEvaluation = evaluation;
      }
    }

    return bestEvaluation!.schedule;
  }

  private generatePermutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];

    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const remaining = arr.filter((_, index) => index !== i);
      const perms = this.generatePermutations(remaining);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  private evaluateSchedule(productOrder: number[]): ScheduleEvaluation {
    const machineSchedules = this.initializeMachineSchedules();
    const scheduledProducts: ScheduledProduct[] = [];
    let currentTime = 0; // in hours
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process products in the given order
    for (let orderIndex = 0; orderIndex < productOrder.length; orderIndex++) {
      const productIndex = productOrder[orderIndex];
      const product = this.products[productIndex];

      const productSchedule = this.scheduleProduct(product, machineSchedules, currentTime, orderIndex + 1);
      scheduledProducts.push(productSchedule);

      // Update current time to after this product's completion
      currentTime = Math.max(currentTime, productSchedule.completionTime || 0);
    }

    // Calculate evaluation metrics
    const totalCompletionTime = currentTime;
    const totalLateDeliveries = this.calculateLateDeliveries(scheduledProducts);
    const { totalIdleTime, averageUtilization } = this.calculateMachineMetrics(machineSchedules);

    // Calculate score (lower is better)
    // Primary: late deliveries, Secondary: completion time, Tertiary: idle time
    const score = totalLateDeliveries * 10000 + totalCompletionTime * 100 + totalIdleTime;

    // Create the production schedule
    const schedule = this.createProductionSchedule(scheduledProducts, machineSchedules);

    return {
      schedule,
      totalLateDeliveries,
      totalCompletionTime,
      totalIdleTime,
      averageUtilization,
      score
    };
  }

  private scheduleProduct(
    product: Product,
    machineSchedules: Map<string, MachineSchedule>,
    startTime: number,
    productionOrder: number
  ): ScheduledProduct & { completionTime?: number } {
    let currentTime = startTime;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each machine in sequence
    for (const machineConfig of product.machineSequence) {
      const machineSchedule = machineSchedules.get(machineConfig.machineId)!;
      const machineInventory = this.machineInventory.find(m => m.machineId === machineConfig.machineId)!;

      // Calculate total batches needed
      const totalBatches = Math.ceil(product.count / machineConfig.batchSize);

      // Schedule each batch
      for (let batch = 0; batch < totalBatches; batch++) {
        // Find available machine instance and time slot
        const { startTime: batchStartTime, machineInstance } = this.findAvailableSlot(
          machineSchedule,
          machineInventory.count,
          currentTime,
          machineConfig.processingTimePerBatch,
          product.id
        );

        // Add setup time if switching products
        const actualStartTime = this.addSetupTimeIfNeeded(
          machineSchedule,
          machineInstance,
          batchStartTime,
          product.id
        );

        const endTime = actualStartTime + machineConfig.processingTimePerBatch;

        // Add to machine schedule
        machineSchedule.schedule.push({
          startTime: actualStartTime,
          endTime,
          productId: product.id,
          productName: product.name,
          batchNumber: batch + 1,
          totalBatches,
          machineInstance
        });

        // Update current time for next batch/machine
        currentTime = Math.max(currentTime, endTime);
      }
    }

    // Calculate completion metrics
    const completionTime = currentTime;
    const daysUntilDeadline = Math.floor(
      (product.requirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const completionDay = Math.ceil(completionTime / this.workingHoursPerDay);
    const extraDays = Math.max(0, completionDay - daysUntilDeadline);

    return {
      ...product,
      startDay: Math.floor(startTime / this.workingHoursPerDay),
      totalDaysRequired: Math.ceil((completionTime - startTime) / this.workingHoursPerDay),
      piecesPerDay: Math.floor(product.count / Math.ceil((completionTime - startTime) / this.workingHoursPerDay)),
      extraDays,
      productionOrder,
      completionTime
    };
  }

  private findAvailableSlot(
    machineSchedule: MachineSchedule,
    machineCount: number,
    earliestStart: number,
    duration: number,
    productId: string
  ): { startTime: number; machineInstance: number } {
    let currentTime = earliestStart;

    while (true) {
      // Check each machine instance
      for (let instance = 0; instance < machineCount; instance++) {
        if (this.isMachineAvailable(machineSchedule, instance, currentTime, currentTime + duration)) {
          return { startTime: currentTime, machineInstance: instance };
        }
      }
      // If no machine available, try next time slot
      currentTime += 0.25; // Check every 15 minutes
    }
  }

  private isMachineAvailable(
    machineSchedule: MachineSchedule,
    instance: number,
    startTime: number,
    endTime: number
  ): boolean {
    // Check if this machine instance is busy during the requested time
    for (const slot of machineSchedule.schedule) {
      if (slot.machineInstance === instance &&
          !(endTime <= slot.startTime || startTime >= slot.endTime)) {
        return false;
      }
    }
    return true;
  }

  private addSetupTimeIfNeeded(
    machineSchedule: MachineSchedule,
    instance: number,
    proposedStart: number,
    productId: string
  ): number {
    // Find the last slot on this machine instance
    const lastSlot = machineSchedule.schedule
      .filter(slot => slot.machineInstance === instance)
      .sort((a, b) => b.endTime - a.endTime)[0];

    if (lastSlot && lastSlot.productId !== productId) {
      // Different product, add setup time
      return Math.max(proposedStart, lastSlot.endTime + this.setupTime);
    }

    return proposedStart;
  }

  private initializeMachineSchedules(): Map<string, MachineSchedule> {
    const schedules = new Map<string, MachineSchedule>();

    for (const machine of this.machineInventory) {
      schedules.set(machine.machineId, {
        machineId: machine.machineId,
        machineName: machine.machineName,
        machineInstances: machine.count,
        schedule: [],
        totalUtilization: 0,
        totalIdleTime: 0
      });
    }

    return schedules;
  }

  private calculateLateDeliveries(products: ScheduledProduct[]): number {
    return products.filter(p => p.extraDays > 0).length;
  }

  private calculateMachineMetrics(machineSchedules: Map<string, MachineSchedule>): {
    totalIdleTime: number;
    averageUtilization: number;
  } {
    let totalIdleTime = 0;
    let totalUtilization = 0;
    let machineCount = 0;

    for (const schedule of machineSchedules.values()) {
      const maxTime = schedule.schedule.length > 0
        ? Math.max(...schedule.schedule.map(s => s.endTime))
        : 0;

      const busyTime = schedule.schedule.reduce((sum, slot) => sum + (slot.endTime - slot.startTime), 0);
      const utilization = maxTime > 0 ? (busyTime / (maxTime * schedule.machineInstances)) * 100 : 0;

      schedule.totalUtilization = utilization;
      schedule.totalIdleTime = maxTime * schedule.machineInstances - busyTime;

      totalIdleTime += schedule.totalIdleTime;
      totalUtilization += utilization;
      machineCount++;
    }

    return {
      totalIdleTime,
      averageUtilization: machineCount > 0 ? totalUtilization / machineCount : 0
    };
  }

  private createProductionSchedule(
    scheduledProducts: ScheduledProduct[],
    machineSchedules: Map<string, MachineSchedule>
  ): ProductionSchedule {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total days
    const maxCompletionTime = Math.max(...scheduledProducts.map(p => (p as any).completionTime || 0));
    const totalDays = Math.ceil(maxCompletionTime / this.workingHoursPerDay);

    // Create daily schedule (simplified version)
    const dailySchedule: DailySchedule[] = [];
    for (let day = 0; day < totalDays; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      const dayStartTime = day * this.workingHoursPerDay;
      const dayEndTime = (day + 1) * this.workingHoursPerDay;

      const hourlyBreakdown = Array.from(machineSchedules.values()).flatMap(schedule =>
        schedule.schedule
          .filter(slot => slot.startTime >= dayStartTime && slot.endTime <= dayEndTime)
          .map(slot => ({
            productId: slot.productId,
            productName: slot.productName,
            pieces: slot.totalBatches, // Assuming total batches represent pieces
            hoursUsed: slot.endTime - slot.startTime,
            machineInstance: slot.machineInstance
          }))
      );

      dailySchedule.push({
        day: day + 1,
        date,
        products: hourlyBreakdown,
        totalHoursUsed: hourlyBreakdown.reduce((sum, slot) => sum + slot.hoursUsed, 0)
      });
    }

    // Fill idle slots in machine schedules
    for (const schedule of machineSchedules.values()) {
      schedule.schedule.sort((a, b) => a.startTime - b.startTime);

      // Add idle slots between busy periods for each machine instance
      const idleSlots: MachineTimeSlot[] = [];
      const maxTime = schedule.schedule.length > 0
        ? Math.max(...schedule.schedule.map(s => s.endTime))
        : 0;

      for (let instance = 0; instance < schedule.machineInstances; instance++) {
        const instanceSlots = schedule.schedule.filter(slot => slot.machineInstance === instance);
        let lastEndTime = 0;

        for (const slot of instanceSlots) {
          if (slot.startTime > lastEndTime) {
            idleSlots.push({
              startTime: lastEndTime,
              endTime: slot.startTime,
              productId: '',
              productName: 'Idle',
              batchNumber: 0,
              totalBatches: 0,
              machineInstance: instance,
              isIdle: true
            });
          }
          lastEndTime = Math.max(lastEndTime, slot.endTime);
        }

        // Add idle time from last slot to end
        if (lastEndTime < maxTime) {
          idleSlots.push({
            startTime: lastEndTime,
            endTime: maxTime,
            productId: '',
            productName: 'Idle',
            batchNumber: 0,
            totalBatches: 0,
            machineInstance: instance,
            isIdle: true
          });
        }
      }

      schedule.schedule.push(...idleSlots);
      schedule.schedule.sort((a, b) => a.startTime - b.startTime);
    }

    const { totalIdleTime, averageUtilization } = this.calculateMachineMetrics(machineSchedules);

    return {
      products: scheduledProducts,
      totalDays,
      dailySchedule,
      machineSchedules: Array.from(machineSchedules.values()),
      totalMachineIdleTime: totalIdleTime,
      averageMachineUtilization: averageUtilization
    };
  }

  private createEmptySchedule(): ProductionSchedule {
    return {
      products: [],
      totalDays: 0,
      dailySchedule: [],
      machineSchedules: [],
      totalMachineIdleTime: 0,
      averageMachineUtilization: 0
    };
  }
}