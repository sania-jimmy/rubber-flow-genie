export interface Product {
  id: string;
  name: string;
  count: number;
  requirementDate: Date;
  processingTimePerUnit: number; // in hours
  machineSequence: ProductMachineConfig[];
}

export interface Machine {
  id: string;
  name: string;
  type: 'Mixing Mill' | 'Hydraulic Press' | 'Rubber Bale Cutter' | 'Custom';
}

export interface MachineInventory {
  machineId: string;
  machineName: string;
  count: number; // number of machines available
}

export interface ProductMachineConfig {
  machineId: string;
  machineName: string;
  batchSize: number; // units processed per batch
  processingTimePerBatch: number; // hours per batch
}

export interface FactorySettings {
  workingHoursPerDay: number;
  machineInventory: MachineInventory[];
}

export interface ScheduledProduct extends Product {
  startDay: number;
  totalDaysRequired: number;
  piecesPerDay: number;
  extraDays: number;
  productionOrder: number;
}

export interface MachineSchedule {
  machineId: string;
  machineName: string;
  machineInstances: number;
  schedule: MachineTimeSlot[];
  totalUtilization: number; // percentage
  totalIdleTime: number; // hours
}

export interface MachineTimeSlot {
  startTime: number; // hours from schedule start
  endTime: number; // hours from schedule start
  productId: string;
  productName: string;
  batchNumber: number;
  totalBatches: number;
  machineInstance: number;
  isIdle?: boolean;
}

export interface ProductionSchedule {
  products: ScheduledProduct[];
  totalDays: number;
  dailySchedule: DailySchedule[];
  machineSchedules: MachineSchedule[];
  totalMachineIdleTime: number;
  averageMachineUtilization: number;
}

export interface DailySchedule {
  day: number;
  date: Date;
  products: {
    productId: string;
    productName: string;
    pieces: number;
    hoursUsed: number;
    machineInstance: number; // Added to track machine assignment
  }[];
  totalHoursUsed: number;
}
