import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { ProductOrder, ProductConfig } from "@/types/scheduler";
import { cn } from "@/lib/utils";

interface OrderInputProps {
  orders: ProductOrder[];
  productConfigs: ProductConfig[];
  onAddOrder: (order: Omit<ProductOrder, "id" | "priority">) => void;
  onRemoveOrder: (id: string) => void;
}

export const OrderInput = ({
  orders,
  productConfigs,
  onAddOrder,
  onRemoveOrder,
}: OrderInputProps) => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState<Date>();

  const handleAdd = () => {
    if (!productId || !quantity || !date) {
      return;
    }

    onAddOrder({
      productId,
      quantity: parseInt(quantity),
      requirementDate: date,
    });

    setProductId("");
    setQuantity("");
    setDate(undefined);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Production Orders</h3>
          <p className="text-sm text-muted-foreground">
            Add orders to be scheduled (priority calculated automatically based on deadlines)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product Type</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {productConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Number of pieces"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Requirement Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Order
        </Button>

        {orders.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Added Orders ({orders.length})</h4>
            <div className="space-y-2">
              {orders.map((order) => {
                const config = productConfigs.find(c => c.id === order.productId);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <span className="font-medium text-sm">{config?.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {order.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Due: {format(order.requirementDate, "MMM dd, yyyy")}
                      </div>
                      <div className="text-sm">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          order.priority === "High" && "bg-destructive/10 text-destructive",
                          order.priority === "Medium" && "bg-warning/10 text-warning",
                          order.priority === "Low" && "bg-primary/10 text-primary"
                        )}>
                          {order.priority} Priority
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveOrder(order.id)}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
