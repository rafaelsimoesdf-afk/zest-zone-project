import { Button } from "@/components/ui/button";
import { Car, Truck } from "lucide-react";

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
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([type]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {vehicleTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => toggleType(type.value)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:border-primary/50 ${
              selectedTypes.includes(type.value)
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
        <Button variant="outline" size="sm" onClick={onReset}>
          Limpar
        </Button>
        <Button size="sm" onClick={onApply}>
          Ver {resultsCount}+ resultados
        </Button>
      </div>
    </div>
  );
};
