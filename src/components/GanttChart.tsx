import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionSchedule } from "@/types/production";
import { format } from "date-fns";

interface GanttChartProps {
  schedule: ProductionSchedule;
}

export const GanttChart = ({ schedule }: GanttChartProps) => {
  const colors = [
    "bg-chart-1",
    "bg-chart-2", 
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5"
  ];

  const maxDay = schedule.totalDays;
  const dayWidth = maxDay > 30 ? 30 : 40;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Timeline</CardTitle>
        <CardDescription>Visual representation of the production schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max space-y-4 py-4">
            {/* Timeline header */}
            <div className="flex items-center">
              <div className="w-48 flex-shrink-0" />
              <div className="flex">
                {Array.from({ length: maxDay }, (_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center border-l border-border px-1"
                    style={{ width: `${dayWidth}px` }}
                  >
                    <span className="text-xs font-medium">D{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product bars */}
            {schedule.products.map((product, index) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const startDate = new Date(today);
              startDate.setDate(startDate.getDate() + product.startDay);

              return (
                <div key={product.id} className="flex items-center">
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="text-sm font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.count} units
                    </div>
                  </div>
                  <div className="flex relative" style={{ width: `${maxDay * dayWidth}px` }}>
                    {/* Empty space before start */}
                    <div style={{ width: `${product.startDay * dayWidth}px` }} />
                    
                    {/* Production bar */}
                    <div
                      className={`${colors[index % colors.length]} rounded h-12 flex items-center justify-center text-white text-xs font-medium relative group cursor-pointer transition-all hover:opacity-90`}
                      style={{ width: `${product.totalDaysRequired * dayWidth}px` }}
                    >
                      <span className="truncate px-2">
                        {product.totalDaysRequired} days
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border z-10 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs">Start: {format(startDate, "MMM dd")}</p>
                          <p className="text-xs">Duration: {product.totalDaysRequired} days</p>
                          <p className="text-xs">{product.piecesPerDay} pieces/day</p>
                          {product.extraDays > 0 && (
                            <p className="text-xs text-destructive font-semibold">
                              Delayed by {product.extraDays} days
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Deadline marker */}
                    {product.extraDays > 0 && (
                      <div
                        className="absolute h-12 border-r-2 border-dashed border-destructive"
                        style={{ 
                          left: `${(product.startDay + product.totalDaysRequired - product.extraDays) * dayWidth}px`
                        }}
                      >
                        <div className="absolute -top-6 right-0 text-xs text-destructive whitespace-nowrap">
                          ⚠ Deadline
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-chart-1 rounded" />
            <span className="text-muted-foreground">Production Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-r-2 border-dashed border-destructive" />
            <span className="text-muted-foreground">Deadline Marker</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
