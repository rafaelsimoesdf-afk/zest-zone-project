import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrandModelFilterProps {
  brandId: string;
  modelId: string;
  brands?: { id: string; name: string }[];
  models?: { id: string; name: string }[];
  onBrandChange: (brandId: string) => void;
  onChange: (brandId: string, modelId: string) => void;
  onReset: () => void;
  onApply: () => void;
  getPreviewCount: (brandId: string, modelId: string) => number;
}

export const BrandModelFilter = ({
  brandId,
  modelId,
  brands,
  models,
  onBrandChange,
  onChange,
  onReset,
  onApply,
  getPreviewCount,
}: BrandModelFilterProps) => {
  const [localBrandId, setLocalBrandId] = useState(brandId);
  const [localModelId, setLocalModelId] = useState(modelId);

  useEffect(() => {
    setLocalBrandId(brandId);
    setLocalModelId(modelId);
  }, [brandId, modelId]);

  const handleBrandChange = (value: string) => {
    setLocalBrandId(value);
    setLocalModelId("all");
    // Notify parent to load models for this brand
    onBrandChange(value);
  };

  const handleModelChange = (value: string) => {
    setLocalModelId(value);
  };

  const handleReset = () => {
    setLocalBrandId("all");
    setLocalModelId("all");
    onReset();
  };

  const handleApply = () => {
    onChange(localBrandId, localModelId);
    onApply();
  };

  const previewCount = getPreviewCount(localBrandId, localModelId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Marca</label>
        <Select value={localBrandId} onValueChange={handleBrandChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Marcas</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Modelo</label>
        <Select
          value={localModelId}
          onValueChange={handleModelChange}
          disabled={localBrandId === "all"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Modelos</SelectItem>
            {models?.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Limpar
        </Button>
        <Button size="sm" onClick={handleApply}>
          Ver {previewCount} resultados
        </Button>
      </div>
    </div>
  );
};
