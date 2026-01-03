import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  onChange: (min: number, max: number) => void;
  onReset: () => void;
  onApply: () => void;
  resultsCount: number;
}

export const PriceFilter = ({
  minPrice,
  maxPrice,
  onChange,
  onReset,
  onApply,
  resultsCount,
}: PriceFilterProps) => {
  const [localRange, setLocalRange] = useState([minPrice, maxPrice]);

  useEffect(() => {
    setLocalRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const handleSliderChange = (values: number[]) => {
    setLocalRange(values);
    onChange(values[0], values[1]);
  };

  const handleReset = () => {
    setLocalRange([10, 500]);
    onReset();
  };

  return (
    <div className="space-y-6">
      <div className="text-sm font-medium">
        R${localRange[0]} - R${localRange[1]}+/dia
      </div>

      <div className="px-2">
        <Slider
          value={localRange}
          onValueChange={handleSliderChange}
          min={10}
          max={500}
          step={10}
          className="w-full"
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Limpar
        </Button>
        <Button size="sm" onClick={onApply}>
          Ver {resultsCount}+ resultados
        </Button>
      </div>
    </div>
  );
};
