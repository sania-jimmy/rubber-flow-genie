import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Settings } from "lucide-react";
import { Product, Machine, ProductMachineConfig } from "@/types/production";

interface ProductInputProps {
  products: Product[];
  machines: Machine[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onRemoveProduct: (id: string) => void;
  onProcessingTimeChange?: (id: string, timeInMinutes: number) => void;
}

export const ProductInput = ({ products, machines, onAddProduct, onRemoveProduct }: ProductInputProps) => {
  const [name, setName] = useState("");
  const [count, setCount] = useState("");
  const [date, setDate] = useState<Date>();
  const [machineSequence, setMachineSequence] = useState<ProductMachineConfig[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [batchSize, setBatchSize] = useState("");
  const [processingTimePerBatch, setProcessingTimePerBatch] = useState("");

  const handleAddMachine = () => {
    if (!selectedMachineId || !batchSize || !processingTimePerBatch) return;

    const machine = machines.find(m => m.id === selectedMachineId);
    if (!machine) return;

    const newMachineConfig: ProductMachineConfig = {
      machineId: selectedMachineId,
      machineName: machine.name,
      batchSize: parseInt(batchSize),
      processingTimePerBatch: parseFloat(processingTimePerBatch) / 60 // Convert minutes to hours
    };

    setMachineSequence([...machineSequence, newMachineConfig]);
    setSelectedMachineId("");
    setBatchSize("");
    setProcessingTimePerBatch("");
  };

  const handleRemoveMachine = (index: number) => {
    setMachineSequence(machineSequence.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!name || !count || !date || machineSequence.length === 0) {
      return;
    }

    onAddProduct({
      name,
      count: parseInt(count),
      requirementDate: date,
      processingTimePerUnit: 0, // Not used in factorial scheduling
      machineSequence
    });

    setName("");
    setCount("");
    setDate(undefined);
    setMachineSequence([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Add products and configure their machine processing sequences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Product Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Machine Sequence Configuration */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Machine Processing Sequence</h4>
          
          {/* Add Machine Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Machine</Label>
              <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Input
                id="batch-size"
                type="number"
                min="1"
                placeholder="Units per batch"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processing-time-batch">Processing Time (minutes/batch)</Label>
              <Input
                id="processing-time-batch"
                type="number"
                step="1"
                min="1"
                placeholder="e.g., 150"
                value={processingTimePerBatch}
                onChange={(e) => setProcessingTimePerBatch(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddMachine} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </div>
          </div>

          {/* Machine Sequence Display */}
          {machineSequence.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Processing Sequence:</h5>
              <div className="space-y-2">
                {machineSequence.map((config, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{config.machineName}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.batchSize} units/batch • {config.processingTimePerBatch}h/batch
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMachine(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleAdd} 
          className="w-full md:w-auto"
          disabled={machineSequence.length === 0}
        >
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
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h5 className="font-semibold">{product.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        Qty: {product.count} • Due: {format(product.requirementDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Machine Sequence:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.machineSequence.map((config, index) => (
                        <div key={index} className="text-xs bg-secondary p-2 rounded">
                          <span className="font-mono">#{index + 1}</span> {config.machineName}
                          <br />
                          {config.batchSize} units • {config.processingTimePerBatch}h
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
