import { Product, ScheduledProduct, ProductionSchedule, DailySchedule } from "@/types/production";

export class LinearScheduler {
  constructor(
    private products: Product[],
    private workingHoursPerDay: number
  ) {}

  public optimize(): ProductionSchedule {
    // Sort products by deadline (earliest first)
    const sortedProducts = this.products
      .map((product, index) => ({ product, originalIndex: index }))
      .sort((a, b) => a.product.requirementDate.getTime() - b.product.requirementDate.getTime());

    // Create order array based on sorted products
    const order = sortedProducts.map(item => item.originalIndex);

    return this.createSchedule(order);
  }

  private createSchedule(order: number[]): ProductionSchedule {
    const scheduledProducts: ScheduledProduct[] = [];
    const dailySchedule: DailySchedule[] = [];
    let currentDay = 0;
    let currentDayHours = 0; // Track hours used in current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < order.length; i++) {
      const productIndex = order[i];
      const product = this.products[productIndex];

      const startDay = currentDay;
      let remainingPieces = product.count;
      let totalDaysRequired = 0;
      let productStartDay = currentDay;

      // Schedule this product starting from current day/hour
      while (remainingPieces > 0) {
        // Initialize day if needed
        if (!dailySchedule[currentDay]) {
          const date = new Date(today);
          date.setDate(date.getDate() + currentDay);
          dailySchedule[currentDay] = {
            day: currentDay + 1,
            date,
            products: [],
            totalHoursUsed: 0
          };
        }

        // Calculate how many pieces can fit in remaining hours today
        const availableHours = this.workingHoursPerDay - currentDayHours;
        const piecesCanFitToday = Math.floor(availableHours / product.processingTimePerUnit);
        const piecesToday = Math.min(remainingPieces, Math.max(1, piecesCanFitToday));
        const hoursUsed = piecesToday * product.processingTimePerUnit;

        // Add to daily schedule
        dailySchedule[currentDay].products.push({
          productId: product.id,
          productName: product.name,
          pieces: piecesToday,
          hoursUsed
        });
        dailySchedule[currentDay].totalHoursUsed += hoursUsed;

        remainingPieces -= piecesToday;
        currentDayHours += hoursUsed;
        totalDaysRequired++;

        // Move to next day if current day is full or nearly full
        if (currentDayHours >= this.workingHoursPerDay - 0.01 && remainingPieces > 0) {
          currentDay++;
          currentDayHours = 0;
        }
      }

      // Calculate average pieces per day for display
      const piecesPerDay = Math.floor(product.count / totalDaysRequired);

      const daysUntilDeadline = Math.floor(
        (product.requirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const completionDay = currentDayHours > 0 ? currentDay + 1 : currentDay;
      const extraDays = Math.max(0, completionDay - daysUntilDeadline);

      scheduledProducts.push({
        ...product,
        startDay: productStartDay,
        totalDaysRequired,
        piecesPerDay,
        extraDays,
        productionOrder: i + 1
      });
    }

    // Calculate total days (if last day has any hours used, count it)
    const totalDays = currentDayHours > 0 ? currentDay + 1 : currentDay;

    return {
      products: scheduledProducts,
      totalDays,
      dailySchedule: dailySchedule.filter(d => d !== undefined)
    };
  }
}