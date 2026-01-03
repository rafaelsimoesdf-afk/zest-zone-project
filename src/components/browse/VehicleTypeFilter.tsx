import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface VehicleTypeFilterProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
  onReset: () => void;
  onApply: () => void;
  resultsCount: number;
}

const vehicleTypes = [
  { value: "sedan", label: "Sedan", icon: "🚗" },
  { value: "suv", label: "SUVs", icon: "🚙" },
  { value: "hatchback", label: "Hatchback", icon: "🚘" },
  { value: "pickup", label: "Pickup", icon: "🛻" },
  { value: "van", label: "Vans", icon: "🚐" },
  { value: "convertible", label: "Conversível", icon: "🏎️" },
  { value: "coupe", label: "Cupê", icon: "🚕" },
  { value: "wagon", label: "Wagon", icon: "🚃" },
];

export const VehicleTypeFilter = ({
  selectedTypes,
  onChange,
  onReset,
  onApply,
  resultsCount,
}: VehicleTypeFilterProps) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedTypes);

  useEffect(() => {
    setLocalSelected(selectedTypes);
  }, [selectedTypes]);

  const toggleType = (type: string) => {
    if (localSelected.includes(type)) {
      setLocalSelected(localSelected.filter((t) => t !== type));
    } else {
      setLocalSelected([type]);
    }
  };

  const handleReset = () => {
    setLocalSelected([]);
    onReset();
  };

  const handleApply = () => {
    onChange(localSelected);
    onApply();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {vehicleTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => toggleType(type.value)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:border-primary/50 ${
              localSelected.includes(type.value)
                ? "border-primary bg-primary/10"
                : "border-border"
            }`}
          >
            <span className="text-3xl mb-2">{type.icon}</span>
            <span className="text-sm font-medium">{type.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Limpar
        </Button>
        <Button size="sm" onClick={handleApply}>
          Ver {resultsCount}+ resultados
        </Button>
      </div>
    </div>
  );
};
