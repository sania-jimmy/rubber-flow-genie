import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductionSchedule } from "@/types/production";
import { format } from "date-fns";
import { AlertCircle, Calendar, Clock, Factory } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";
import "./ScheduleResults.css"; // Add a CSS file for styling the timeline

interface ScheduleResultsProps {
  schedule: ProductionSchedule;
}

const VisualTimeline = ({ schedule }: { schedule: ProductionSchedule["products"] }) => {
  return (
    <div className="visual-timeline">
      {schedule.map((product, index) => (
        <div key={index} className="timeline-day">
          <div className="day-label">Product {product.name}</div>
          <div className="timeline-items">
            <div className="timeline-item">
              {product.count} pieces - {product.totalDaysRequired} days
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ScheduleResults = ({ schedule }: ScheduleResultsProps) => {
  if (!schedule || !schedule.products || schedule.products.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No schedule data available. Please generate a schedule to view results.</p>
      </div>
    );
  }

  const hasDelays = schedule.products.some((p) => p.extraDays > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Production Schedule Summary</CardTitle>
          <CardDescription>
            Optimized schedule using Factorial optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Days Required
                </p>
                <p className="text-2xl font-bold">{schedule.totalDays}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
              <Factory className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Products Scheduled
                </p>
                <p className="text-2xl font-bold">{schedule.products.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Delayed Products</p>
                <p className="text-2xl font-bold">
                  {schedule.products.filter((p) => p.extraDays > 0).length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">%</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Machine Utilization
                </p>
                <p className="text-2xl font-bold">
                  {schedule.averageMachineUtilization.toFixed(1)}%
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
          <CardDescription>
            Products ordered by optimal production sequence
          </CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Visual Timeline</CardTitle>
          <CardDescription>
            Overview of production schedule and timelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VisualTimeline schedule={schedule.products} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Production Schedule</CardTitle>
          <CardDescription>
            Detailed schedule showing product processing times and machine assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {schedule.dailySchedule.map((day) => (
              <div
                key={day.day}
                className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
              >
                <div className="flex justify-between">
                  <span className="font-bold">Day {day.day}</span>
                  <span>{format(day.date, "PPP")}</span>
                </div>
                <div className="space-y-2">
                  {day.products.map((product, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{product.productName}</span>
                      <span>
                        {product.hoursUsed.toFixed(2)} hours on Machine {product.machineInstance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
