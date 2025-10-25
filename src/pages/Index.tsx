import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductInput } from "@/components/ProductInput";
import { ScheduleResults } from "@/components/ScheduleResults";
import { GanttChart } from "@/components/GanttChart";
import { DailyScheduleView } from "@/components/DailyScheduleView";
import { Product, ProductionSchedule } from "@/types/production";
import { GeneticAlgorithmScheduler } from "@/utils/geneticAlgorithm";
import { downloadScheduleAsCSV, downloadScheduleAsText } from "@/utils/downloadSchedule";
import { toast } from "sonner";
import { Factory, Sparkles, Download, FileText } from "lucide-react";

const Index = () => {
  const [workingHours, setWorkingHours] = useState("8");
  const [products, setProducts] = useState<Product[]>([]);
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
      const scheduler = new GeneticAlgorithmScheduler(
        products,
        parseFloat(workingHours)
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
                AI-powered production planning using Genetic Algorithm optimization
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
            <CardDescription>Configure your factory's operational parameters</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Product Input */}
        <ProductInput
          products={products}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
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
          <p>Powered by Genetic Algorithm optimization • Built for efficient factory planning</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
