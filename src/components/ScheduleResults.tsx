import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductionSchedule } from "@/types/production";
import { format } from "date-fns";
import { AlertCircle, Calendar, Clock, Factory } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ScheduleResultsProps {
  schedule: ProductionSchedule;
}

export const ScheduleResults = ({ schedule }: ScheduleResultsProps) => {
  const hasDelays = schedule.products.some(p => p.extraDays > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Production Schedule Summary</CardTitle>
          <CardDescription>
            Optimized schedule using Genetic Algorithm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Days Required</p>
                <p className="text-2xl font-bold">{schedule.totalDays}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
              <Factory className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Products Scheduled</p>
                <p className="text-2xl font-bold">{schedule.products.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Delayed Products</p>
                <p className="text-2xl font-bold">
                  {schedule.products.filter(p => p.extraDays > 0).length}
                </p>
              </div>
            </div>
          </div>

          {hasDelays && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Production Delays Detected</AlertTitle>
              <AlertDescription>
                Some products will require extra days beyond their requirement date.
                Consider increasing working hours or prioritizing critical orders.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimized Production Order</CardTitle>
          <CardDescription>Products ordered by optimal production sequence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedule.products.map((product) => (
              <div
                key={product.id}
                className="p-4 border rounded-lg space-y-3 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        #{product.productionOrder}
                      </Badge>
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      {product.extraDays > 0 && (
                        <Badge variant="destructive">
                          +{product.extraDays} days delay
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(product.requirementDate, "PPP")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{product.count} pieces</p>
                    <p className="text-xs text-muted-foreground">
                      {product.processingTimePerUnit}h per unit
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Days Required</p>
                    <p className="font-semibold">{product.totalDaysRequired} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pieces per Day</p>
                    <p className="font-semibold">{product.piecesPerDay} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Start Day</p>
                    <p className="font-semibold">Day {product.startDay + 1}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
