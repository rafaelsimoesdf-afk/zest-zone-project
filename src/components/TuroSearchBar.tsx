import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { cn } from "@/lib/utils";

const timeOptions = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30"
];

interface TuroSearchBarProps {
  initialLocation?: string;
  initialFromDate?: string;
  initialUntilDate?: string;
  initialFromTime?: string;
  initialUntilTime?: string;
}

export function TuroSearchBar({
  initialLocation = "",
  initialFromDate,
  initialUntilDate,
  initialFromTime = "10:00",
  initialUntilTime = "10:00",
}: TuroSearchBarProps = {}) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initialLocation);
  const [fromDate, setFromDate] = useState<Date | undefined>(
    initialFromDate ? new Date(initialFromDate + "T00:00:00") : undefined
  );
  const [untilDate, setUntilDate] = useState<Date | undefined>(
    initialUntilDate ? new Date(initialUntilDate + "T00:00:00") : undefined
  );
  const [fromTime, setFromTime] = useState(initialFromTime);
  const [untilTime, setUntilTime] = useState(initialUntilTime);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("city", location);
    if (fromDate) params.set("from", format(fromDate, "yyyy-MM-dd"));
    if (untilDate) params.set("until", format(untilDate, "yyyy-MM-dd"));
    if (fromTime) params.set("fromTime", fromTime);
    if (untilTime) params.set("untilTime", untilTime);
    
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Desktop Version */}
      <div className="hidden md:flex items-center !bg-white rounded-full shadow-xl border-l-4 border-l-primary" style={{ backgroundColor: 'white' }}>
        {/* Where Section */}
        <div className="flex-1 px-6 py-3 border-r border-gray-200">
          <div className="text-xs font-medium text-gray-500 mb-1 text-left">Onde</div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <CityAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Cidade ou endereço"
              className="border-0 bg-transparent h-6 p-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 text-sm"
              hideIcon
            />
          </div>
        </div>

        {/* From Date Section */}
        <div className="px-4 py-3 border-r border-gray-200">
          <div className="text-xs font-medium text-gray-500 mb-1 text-left">De</div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-gray-900 hover:text-primary transition-colors">
                  {fromDate ? format(fromDate, "dd/MM/yyyy") : "Selecionar"}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Select value={fromTime} onValueChange={setFromTime}>
              <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-gray-900 focus:ring-0 gap-1 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time} className="text-gray-900">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Until Date Section */}
        <div className="px-4 py-3">
          <div className="text-xs font-medium text-gray-500 mb-1 text-left">Até</div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-gray-900 hover:text-primary transition-colors">
                  {untilDate ? format(untilDate, "dd/MM/yyyy") : "Selecionar"}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={untilDate}
                  onSelect={setUntilDate}
                  disabled={(date) => date < (fromDate || new Date())}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Select value={untilTime} onValueChange={setUntilTime}>
              <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-gray-900 focus:ring-0 gap-1 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time} className="text-gray-900">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          size="icon"
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 m-2 flex-shrink-0"
        >
          <Search className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden !bg-white rounded-2xl shadow-xl border-l-4 border-l-primary p-4 space-y-4" style={{ backgroundColor: 'white' }}>
        {/* Where */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Onde</div>
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <CityAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Cidade ou endereço"
              className="border-0 bg-transparent h-8 p-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
              hideIcon
            />
          </div>
        </div>

        {/* Dates Row */}
        <div className="flex gap-4">
          {/* From */}
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 mb-1">De</div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-gray-900">
                    {fromDate ? format(fromDate, "dd/MM/yyyy") : "Data"}
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Select value={fromTime} onValueChange={setFromTime}>
                <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-gray-900 focus:ring-0 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-gray-900">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Until */}
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 mb-1">Até</div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-gray-900">
                    {untilDate ? format(untilDate, "dd/MM/yyyy") : "Data"}
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={untilDate}
                    onSelect={setUntilDate}
                    disabled={(date) => date < (fromDate || new Date())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Select value={untilTime} onValueChange={setUntilTime}>
                <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-gray-900 focus:ring-0 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-gray-900">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>
    </div>
  );
}
