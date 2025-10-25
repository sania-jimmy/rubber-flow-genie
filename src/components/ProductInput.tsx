import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Product } from "@/types/production";

interface ProductInputProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onRemoveProduct: (id: string) => void;
}

export const ProductInput = ({ products, onAddProduct, onRemoveProduct }: ProductInputProps) => {
  const [name, setName] = useState("");
  const [count, setCount] = useState("");
  const [date, setDate] = useState<Date>();
  const [processingTime, setProcessingTime] = useState("");

  const handleAdd = () => {
    if (!name || !count || !date || !processingTime) {
      return;
    }

    onAddProduct({
      name,
      count: parseInt(count),
      requirementDate: date,
      processingTimePerUnit: parseFloat(processingTime) / 60 // Convert minutes to hours
    });

    setName("");
    setCount("");
    setDate(undefined);
    setProcessingTime("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Add products that need to be scheduled for production</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              placeholder="e.g., Rubber Mat"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-count">Quantity</Label>
            <Input
              id="product-count"
              type="number"
              min="1"
              placeholder="Number of pieces"
              value={count}
              onChange={(e) => setCount(e.target.value)}
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
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processing-time">Processing Time (minutes/unit)</Label>
            <Input
              id="processing-time"
              type="number"
              step="1"
              min="1"
              placeholder="e.g., 30"
              value={processingTime}
              onChange={(e) => setProcessingTime(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>

        {products.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Added Products ({products.length})</h4>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Qty: {product.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(product.requirementDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(product.processingTimePerUnit * 60)}min/unit
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveProduct(product.id)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
