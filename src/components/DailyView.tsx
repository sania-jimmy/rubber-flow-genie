import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScheduleResult } from "@/types/scheduler";
import { format } from "date-fns";
import { formatMinutes, formatTime } from "@/utils/milpScheduler";

interface DailyViewProps {
  result: ScheduleResult;
  workingHoursPerDay: number;
}

export const DailyView = ({ result, workingHoursPerDay }: DailyViewProps) => {
  const dailyCapacity = workingHoursPerDay * 60;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Daily Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Minute-by-minute breakdown of production
          </p>
        </div>

        <div className="space-y-6">
          {result.dailySchedules.map((day) => {
            const utilization = (day.totalTimeUsed / dailyCapacity) * 100;
            const isOvertime = day.totalTimeUsed > dailyCapacity;

            return (
              <div key={day.day} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Day {day.day}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(day.date, "MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatMinutes(day.totalTimeUsed)} / {formatMinutes(dailyCapacity)}
                    </p>
                    <p className={`text-sm ${isOvertime ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {utilization.toFixed(1)}% utilization
                      {isOvertime && ` (+${formatMinutes(day.overtime)} overtime)`}
                      {day.idleTime > 0 && ` (${formatMinutes(day.idleTime)} idle)`}
                    </p>
                  </div>
                </div>

                <Progress value={Math.min(utilization, 100)} className="h-2" />

                <div className="space-y-2">
                  {day.batches.map((batch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{batch.productName}</span>
                        <span className="text-muted-foreground ml-2">
                          Batch #{batch.batchNumber > 0 ? batch.batchNumber : "Extra"}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {batch.pieces} pieces
                      </div>
                      <div className="text-muted-foreground ml-4">
                        {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
