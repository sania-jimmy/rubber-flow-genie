import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleResult } from "@/types/scheduler";
import { format } from "date-fns";

interface ProductionDetailsProps {
  result: ScheduleResult;
}

export const ProductionDetails = ({ result }: ProductionDetailsProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Production Details</h3>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown by product
          </p>
        </div>

        <div className="space-y-3">
          {result.productionSummary.map((product, index) => (
            <div
              key={product.productId}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                    <h4 className="font-semibold text-lg">{product.productName}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.totalPieces} pieces • {product.totalBatches} batches
                  </p>
                </div>
                {product.extraDays > 0 && (
                  <Badge variant="destructive">
                    {product.extraDays} day{product.extraDays > 1 ? "s" : ""} overdue
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Days Required</p>
                  <p className="font-semibold">{product.daysRequired} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batches per Day</p>
                  <p className="font-semibold">
                    ~{Math.ceil(product.totalBatches / product.daysRequired)} batches
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pieces per Batch</p>
                  <p className="font-semibold">
                    ~{Math.ceil(product.totalPieces / product.totalBatches)} pieces
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
