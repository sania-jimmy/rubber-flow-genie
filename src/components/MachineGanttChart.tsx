import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionSchedule } from "@/types/production";

interface MachineGanttChartProps {
  schedule: ProductionSchedule;
}

export const MachineGanttChart = ({ schedule }: MachineGanttChartProps) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500"
  ];

  // Calculate the total time span
  const maxTime = Math.max(
    ...schedule.machineSchedules.flatMap(ms => 
      ms.schedule.map(s => s.endTime)
    )
  );

  const timeSlots = Math.ceil(maxTime / 2); // 2-hour intervals
  const slotWidth = 60; // pixels per 2-hour slot

  return (
    <Card>
      <CardHeader>
        <CardTitle>Machine Schedule Timeline</CardTitle>
        <CardDescription>Visual timeline showing machine utilization over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max space-y-4 py-4">
            {/* Time header */}
            <div className="flex items-center mb-4">
              <div className="w-48 flex-shrink-0" />
              <div className="flex">
                {Array.from({ length: timeSlots }, (_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center border-l border-border px-1"
                    style={{ width: `${slotWidth}px` }}
                  >
                    <span className="text-xs font-medium">{i * 2}-{i * 2 + 2}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Machine timelines */}
            {schedule.machineSchedules.map((machineSchedule, machineIndex) => (
              <div key={machineSchedule.machineId} className="space-y-2">
                <div className="flex items-center">
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="text-sm font-medium">{machineSchedule.machineName}</div>
                    <div className="text-xs text-muted-foreground">
                      {machineSchedule.totalUtilization.toFixed(1)}% utilization
                    </div>
                  </div>
                  <div className="flex relative" style={{ width: `${timeSlots * slotWidth}px` }}>
                    {/* Machine instances */}
                    {Array.from({ length: Math.max(1, Math.ceil(machineSchedule.schedule.length / 10)) }, (_, instanceIndex) => {
                      const instanceSlots = machineSchedule.schedule.filter(
                        slot => slot.machineInstance === instanceIndex
                      );

                      return (
                        <div key={instanceIndex} className="mb-1">
                          <div className="text-xs text-muted-foreground mb-1">
                            Instance {instanceIndex + 1}
                          </div>
                          <div className="relative h-8 bg-gray-100 rounded">
                            {instanceSlots.map((slot, slotIndex) => {
                              const left = (slot.startTime / 2) * slotWidth;
                              const width = ((slot.endTime - slot.startTime) / 2) * slotWidth;

                              return (
                                <div
                                  key={slotIndex}
                                  className={`absolute top-0 h-full rounded text-white text-xs flex items-center justify-center ${
                                    slot.isIdle ? 'bg-gray-300' : colors[(machineIndex + instanceIndex) % colors.length]
                                  }`}
                                  style={{ left: `${left}px`, width: `${Math.max(width, 4)}px` }}
                                  title={`${slot.productName} (${slot.startTime.toFixed(1)}h - ${slot.endTime.toFixed(1)}h)`}
                                >
                                  {!slot.isIdle && (
                                    <span className="truncate px-1">
                                      {slot.productName}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-muted-foreground">Active Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <span className="text-muted-foreground">Machine Idle</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};