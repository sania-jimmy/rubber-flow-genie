import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionSchedule } from "@/types/production";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface DailyScheduleViewProps {
  schedule: ProductionSchedule;
  workingHoursPerDay: number;
}

export const DailyScheduleView = ({ schedule, workingHoursPerDay }: DailyScheduleViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Production Breakdown</CardTitle>
        <CardDescription>
          Detailed view of production activities for each day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {schedule.dailySchedule.map((day) => {
            const utilizationPercent = (day.totalHoursUsed / workingHoursPerDay) * 100;
            const isOvertime = utilizationPercent > 100;

            return (
              <div
                key={day.day}
                className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Day {day.day}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(day.date, "EEEE, MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {day.totalHoursUsed.toFixed(1)} / {workingHoursPerDay}h
                    </p>
                    <p className={`text-xs ${isOvertime ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {utilizationPercent.toFixed(0)}% utilization
                      {isOvertime && " (Overtime!)"}
                    </p>
                  </div>
                </div>

                <Progress 
                  value={Math.min(utilizationPercent, 100)} 
                  className="h-2"
                />

                <div className="space-y-2 pt-2 border-t">
                  {day.products.map((product, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-secondary/50 rounded p-2"
                    >
                      <span className="font-medium">{product.productName}</span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{product.pieces} pieces</span>
                        <span>{product.hoursUsed.toFixed(1)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
