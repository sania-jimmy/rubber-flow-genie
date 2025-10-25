export interface Product {
  id: string;
  name: string;
  count: number;
  requirementDate: Date;
  processingTimePerUnit: number; // in hours
}

export interface FactorySettings {
  workingHoursPerDay: number;
}

export interface ScheduledProduct extends Product {
  startDay: number;
  totalDaysRequired: number;
  piecesPerDay: number;
  extraDays: number;
  productionOrder: number;
}

export interface ProductionSchedule {
  products: ScheduledProduct[];
  totalDays: number;
  dailySchedule: DailySchedule[];
}

export interface DailySchedule {
  day: number;
  date: Date;
  products: {
    productId: string;
    productName: string;
    pieces: number;
    hoursUsed: number;
  }[];
  totalHoursUsed: number;
}
