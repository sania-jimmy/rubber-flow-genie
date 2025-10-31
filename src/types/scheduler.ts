export interface ProductConfig {
  id: string;
  name: string;
  piecesPerCompartment: number;
  totalPerBatch: number; // Total pieces from both compartments
  processingTime: number; // in minutes
  coolingTime: number; // in minutes
  moldRefillTime: number; // in minutes
  finishingTime: number; // in minutes
}

export interface ProductOrder {
  id: string;
  productId: string;
  quantity: number;
  requirementDate: Date;
  priority: "High" | "Medium" | "Low"; // Auto-calculated based on deadline
}

export interface BatchSchedule {
  productId: string;
  productName: string;
  batchNumber: number;
  pieces: number;
  startTime: number; // minutes from start of day
  endTime: number; // minutes from start of day
  day: number;
}

export interface DailySchedule {
  day: number;
  date: Date;
  batches: BatchSchedule[];
  totalTimeUsed: number; // in minutes
  idleTime: number; // in minutes
  overtime: number; // in minutes
}

export interface ProductionSummary {
  productId: string;
  productName: string;
  totalPieces: number;
  totalBatches: number;
  daysRequired: number;
  extraDays: number;
}

export interface ScheduleResult {
  dailySchedules: DailySchedule[];
  totalDays: number;
  productionSummary: ProductionSummary[];
  overallUtilization: number; // percentage
  totalIdleTime: number; // in minutes
  totalOvertime: number; // in minutes
}
