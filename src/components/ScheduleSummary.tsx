import { Card } from "@/components/ui/card";
import { ScheduleResult } from "@/types/scheduler";
import { Calendar, Factory, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMinutes } from "@/utils/milpScheduler";

interface ScheduleSummaryProps {
  result: ScheduleResult;
}

export const ScheduleSummary = ({ result }: ScheduleSummaryProps) => {
  const delayedProducts = result.productionSummary.filter(p => p.extraDays > 0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Schedule Summary</h3>
          <p className="text-sm text-muted-foreground">
            Optimized schedule using MILP algorithm
          </p>
        </div>

        {delayedProducts.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {delayedProducts.length} product{delayedProducts.length > 1 ? "s" : ""} will be delayed beyond requirement date
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="text-2xl font-bold text-foreground">{result.totalDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Factory className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Products Scheduled</p>
                <p className="text-2xl font-bold text-foreground">{result.productionSummary.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Delayed Products</p>
                <p className="text-2xl font-bold text-foreground">{delayedProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold text-foreground">{result.overallUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Idle Time</p>
            <p className="text-lg font-semibold">{formatMinutes(result.totalIdleTime)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Overtime</p>
            <p className="text-lg font-semibold">{formatMinutes(result.totalOvertime)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Batches</p>
            <p className="text-lg font-semibold">
              {result.productionSummary.reduce((sum, p) => sum + p.totalBatches, 0)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
