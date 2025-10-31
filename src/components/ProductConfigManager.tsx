import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { ProductConfig } from "@/types/scheduler";

interface ProductConfigManagerProps {
  configs: ProductConfig[];
  onAddConfig: (config: Omit<ProductConfig, "id">) => void;
  onRemoveConfig: (id: string) => void;
}

export const ProductConfigManager = ({
  configs,
  onAddConfig,
  onRemoveConfig,
}: ProductConfigManagerProps) => {
  const [name, setName] = useState("");
  const [piecesPerCompartment, setPiecesPerCompartment] = useState("");
  const [processingTime, setProcessingTime] = useState("");
  const [coolingTime, setCoolingTime] = useState("");
  const [moldRefillTime, setMoldRefillTime] = useState("");
  const [finishingTime, setFinishingTime] = useState("");

  const handleAdd = () => {
    if (!name || !piecesPerCompartment || !processingTime || !coolingTime || !moldRefillTime || !finishingTime) {
      return;
    }

    const pieces = parseInt(piecesPerCompartment);
    onAddConfig({
      name,
      piecesPerCompartment: pieces,
      totalPerBatch: pieces * 2, // 2 compartments
      processingTime: parseFloat(processingTime),
      coolingTime: parseFloat(coolingTime),
      moldRefillTime: parseFloat(moldRefillTime),
      finishingTime: parseFloat(finishingTime),
    });

    setName("");
    setPiecesPerCompartment("");
    setProcessingTime("");
    setCoolingTime("");
    setMoldRefillTime("");
    setFinishingTime("");
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Product Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Define product types with their processing parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="e.g., Mud Flap"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="piecesPerCompartment">Pieces per Compartment</Label>
            <Input
              id="piecesPerCompartment"
              type="number"
              min="1"
              placeholder="e.g., 4"
              value={piecesPerCompartment}
              onChange={(e) => setPiecesPerCompartment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processingTime">Processing Time (min)</Label>
            <Input
              id="processingTime"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g., 1"
              value={processingTime}
              onChange={(e) => setProcessingTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coolingTime">Cooling Time (min)</Label>
            <Input
              id="coolingTime"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g., 10"
              value={coolingTime}
              onChange={(e) => setCoolingTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moldRefillTime">Mold Refill Time (min)</Label>
            <Input
              id="moldRefillTime"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g., 3"
              value={moldRefillTime}
              onChange={(e) => setMoldRefillTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="finishingTime">Finishing Time (min)</Label>
            <Input
              id="finishingTime"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g., 5"
              value={finishingTime}
              onChange={(e) => setFinishingTime(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Product Type
        </Button>

        {configs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Configured Products ({configs.length})</h4>
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                    <div>
                      <span className="font-medium">{config.name}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {config.piecesPerCompartment}×2 = {config.totalPerBatch} pcs/batch
                    </div>
                    <div className="text-muted-foreground">Process: {config.processingTime}min</div>
                    <div className="text-muted-foreground">Cool: {config.coolingTime}min</div>
                    <div className="text-muted-foreground">Refill: {config.moldRefillTime}min</div>
                    <div className="text-muted-foreground">Finish: {config.finishingTime}min</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveConfig(config.id)}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
