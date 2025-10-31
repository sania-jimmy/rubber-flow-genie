import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { ProductConfig, ProductOrder, ScheduleResult } from "@/types/scheduler";
import { ProductConfigManager } from "@/components/ProductConfigManager";
import { OrderInput } from "@/components/OrderInput";
import { ScheduleSummary } from "@/components/ScheduleSummary";
import { ProductionDetails } from "@/components/ProductionDetails";
import { DailyView } from "@/components/DailyView";
import { calculateScheduleMILP } from "@/utils/milpScheduler";
import { toast } from "sonner";

const Index = () => {
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [includeExtra, setIncludeExtra] = useState<boolean>(false);
  const [productConfigs, setProductConfigs] = useState<ProductConfig[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddConfig = (config: Omit<ProductConfig, "id">) => {
    const newConfig: ProductConfig = {
      ...config,
      id: Date.now().toString(),
    };
    setProductConfigs([...productConfigs, newConfig]);
    toast.success(`Product type "${config.name}" added`);
  };

  const handleRemoveConfig = (id: string) => {
    // Remove config and all orders that use this product
    setProductConfigs(productConfigs.filter((c) => c.id !== id));
    setOrders(orders.filter((o) => o.productId !== id));
    setSchedule(null);
    toast.info("Product type removed");
  };

  const calculatePriority = (requirementDate: Date): "High" | "Medium" | "Low" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilDeadline = Math.ceil(
      (requirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline <= 3) return "High";
    if (daysUntilDeadline <= 7) return "Medium";
    return "Low";
  };

  const handleAddOrder = (order: Omit<ProductOrder, "id" | "priority">) => {
    const priority = calculatePriority(order.requirementDate);
    const newOrder: ProductOrder = {
      ...order,
      id: Date.now().toString(),
      priority,
    };
    setOrders([...orders, newOrder]);
    toast.success(`Order added with ${priority} priority`);
  };

  const handleRemoveOrder = (id: string) => {
    setOrders(orders.filter((o) => o.id !== id));
    setSchedule(null);
  };

  const handleGenerateSchedule = () => {
    if (productConfigs.length === 0) {
      toast.error("Please add at least one product type in configuration");
      return;
    }

    if (orders.length === 0) {
      toast.error("Please add at least one order");
      return;
    }

    if (workingHours <= 0) {
      toast.error("Working hours must be greater than 0");
      return;
    }

    setIsGenerating(true);
    toast.info("Calculating optimal schedule using MILP...");

    setTimeout(() => {
      try {
        const result = calculateScheduleMILP(
          orders,
          productConfigs,
          workingHours,
          includeExtra
        );
        setSchedule(result);
        setIsGenerating(false);
        toast.success("Schedule optimized successfully!");
      } catch (error) {
        console.error("Scheduling error:", error);
        setIsGenerating(false);
        toast.error("Failed to generate schedule. Please try again.");
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Rubber Factory Production Scheduler
            </h1>
          </div>
          <p className="text-muted-foreground">
            Production planning using MILP optimization
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Factory Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure your factory's operational parameters
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="workingHours">Working Hours per Day</Label>
                <Input
                  id="workingHours"
                  type="number"
                  min="1"
                  max="24"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Total productive hours available per day
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includeExtra">Fill Idle Time</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="includeExtra"
                    checked={includeExtra}
                    onCheckedChange={setIncludeExtra}
                  />
                  <Label htmlFor="includeExtra" className="cursor-pointer">
                    Include extra production to maximize capacity
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <ProductConfigManager
          configs={productConfigs}
          onAddConfig={handleAddConfig}
          onRemoveConfig={handleRemoveConfig}
        />

        {productConfigs.length > 0 && (
          <OrderInput
            orders={orders}
            productConfigs={productConfigs}
            onAddOrder={handleAddOrder}
            onRemoveOrder={handleRemoveOrder}
          />
        )}

        {orders.length > 0 && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? "Optimizing..." : "Generate Optimal Schedule"}
            </Button>
          </div>
        )}

        {schedule && (
          <div className="space-y-8">
            <ScheduleSummary result={schedule} />
            <ProductionDetails result={schedule} />
            <DailyView result={schedule} workingHoursPerDay={workingHours} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
