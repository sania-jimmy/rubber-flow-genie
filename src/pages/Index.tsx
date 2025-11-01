import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductInput } from "@/components/ProductInput";
import { ScheduleResults } from "@/components/ScheduleResults";
import { GanttChart } from "@/components/GanttChart";
import { DailyScheduleView } from "@/components/DailyScheduleView";
import { Product, ProductionSchedule, MachineInventory, Machine } from "@/types/production";
import { FactorialScheduler } from "@/utils/factorialScheduler";
import { downloadScheduleAsCSV, downloadScheduleAsText } from "@/utils/downloadSchedule";
import { toast } from "sonner";
import { Factory, Sparkles, Download, FileText } from "lucide-react";

const Index = () => {
  const [workingHours, setWorkingHours] = useState("8");
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([
    { id: 'mixing-mill', name: 'Mixing Mill', type: 'Mixing Mill' },
    { id: 'hydraulic-press', name: 'Hydraulic Press', type: 'Hydraulic Press' },
    { id: 'rubber-cutter', name: 'Rubber Bale Cutter', type: 'Rubber Bale Cutter' }
  ]);
  const [machineInventory, setMachineInventory] = useState<MachineInventory[]>([
    { machineId: 'mixing-mill', machineName: 'Mixing Mill', count: 1 },
    { machineId: 'hydraulic-press', machineName: 'Hydraulic Press', count: 1 },
    { machineId: 'rubber-cutter', machineName: 'Rubber Bale Cutter', count: 1 }
  ]);
  const [schedule, setSchedule] = useState<ProductionSchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddProduct = (product: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID()
    };
    setProducts([...products, newProduct]);
    toast.success(`${product.name} added to production queue`);
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product removed");
  };

  const handleGenerateSchedule = () => {
    if (products.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    if (!workingHours || parseFloat(workingHours) <= 0) {
      toast.error("Please enter valid working hours");
      return;
    }

    setIsGenerating(true);
    toast.info("Optimizing production schedule...");

    // Simulate some processing time for the genetic algorithm
    setTimeout(() => {
      const scheduler = new FactorialScheduler(
        products,
        parseFloat(workingHours),
        machineInventory
      );
      const optimizedSchedule = scheduler.optimize();
      setSchedule(optimizedSchedule);
      setIsGenerating(false);
      toast.success("Schedule generated successfully!");
    }, 1500);
  };

  const handleDownloadCSV = () => {
    if (!schedule) return;
    downloadScheduleAsCSV(schedule, parseFloat(workingHours));
    toast.success("Schedule downloaded as CSV");
  };

  const handleDownloadText = () => {
    if (!schedule) return;
    downloadScheduleAsText(schedule, parseFloat(workingHours));
    toast.success("Schedule downloaded as text file");
  };

  const handleProcessingTimeChange = (id: string, timeInMinutes: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id
          ? { ...product, processingTimePerUnit: timeInMinutes / 60 } // Convert minutes to hours
          : product
      )
    );
  };

  useEffect(() => {
    if (schedule && schedule.products.length === 0) {
      toast.error("No valid schedule could be generated. Please check your inputs.");
    }
  }, [schedule]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Factory className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Rubber Factory Production Scheduler</h1>
              <p className="text-muted-foreground mt-1">
                Production planning using Factorial optimization
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Factory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Factory Settings</CardTitle>
            <CardDescription>Configure your factory's operational parameters and machine inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-xs space-y-2">
              <Label htmlFor="working-hours">Working Hours per Day</Label>
              <Input
                id="working-hours"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="e.g., 8"
              />
              <p className="text-sm text-muted-foreground">
                Total productive hours available per day
              </p>
            </div>

            {/* Machine Inventory */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Machine Inventory</h4>
              <div className="space-y-3">
                {machineInventory.map((machine, index) => (
                  <div key={machine.machineId} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{machine.machineName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`machine-count-${index}`} className="text-sm">Count:</Label>
                      <Input
                        id={`machine-count-${index}`}
                        type="number"
                        min="1"
                        max="10"
                        value={machine.count}
                        onChange={(e) => {
                          const newInventory = [...machineInventory];
                          newInventory[index].count = parseInt(e.target.value) || 1;
                          setMachineInventory(newInventory);
                        }}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Specify how many of each machine type are available in your factory
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product Input */}
        <ProductInput
          products={products}
          machines={machines}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
          onProcessingTimeChange={handleProcessingTimeChange}
        />

        {/* Generate Button */}
        {products.length > 0 && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
              className="min-w-64"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? "Optimizing Schedule..." : "Generate Optimal Schedule"}
            </Button>
          </div>
        )}

        {/* Results */}
        {schedule && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Download Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleDownloadText}>
                <FileText className="mr-2 h-4 w-4" />
                Download as Text
              </Button>
              <Button variant="outline" onClick={handleDownloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download as CSV
              </Button>
            </div>

            <ScheduleResults schedule={schedule} />
            <GanttChart schedule={schedule} />
            <DailyScheduleView 
              schedule={schedule} 
              workingHoursPerDay={parseFloat(workingHours)} 
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-6 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>• An initiative by Annette, Sania and Ron •</p>
            <p>Powered by Factorial optimization • Built for efficient factory planning</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
