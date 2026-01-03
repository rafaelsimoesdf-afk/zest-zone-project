import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface YearFilterProps {
  minYear: number;
  maxYear: number;
  onChange: (min: number, max: number) => void;
  onReset: () => void;
  onApply: () => void;
  getPreviewCount: (min: number, max: number) => number;
}

export const YearFilter = ({
  minYear,
  maxYear,
  onChange,
  onReset,
  onApply,
  getPreviewCount,
}: YearFilterProps) => {
  const currentYear = new Date().getFullYear();
  const [localRange, setLocalRange] = useState([minYear, maxYear]);

  useEffect(() => {
    setLocalRange([minYear, maxYear]);
  }, [minYear, maxYear]);

  const handleSliderChange = (values: number[]) => {
    setLocalRange(values);
  };

  const handleReset = () => {
    setLocalRange([2000, currentYear]);
    onReset();
  };

  const handleApply = () => {
    onChange(localRange[0], localRange[1]);
    onApply();
  };

  const getLabel = () => {
    if (localRange[0] === 2000 && localRange[1] === currentYear) {
      return "Todos os anos";
    }
    return `${localRange[0]} - ${localRange[1]}`;
  };

  const previewCount = getPreviewCount(localRange[0], localRange[1]);

  return (
    <div className="space-y-6">
      <div className="text-sm font-medium">{getLabel()}</div>

      <div className="px-2">
        <Slider
          value={localRange}
          onValueChange={handleSliderChange}
          min={2000}
          max={currentYear}
          step={1}
          className="w-full"
        />
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
