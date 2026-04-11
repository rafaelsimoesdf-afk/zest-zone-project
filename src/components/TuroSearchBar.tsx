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
  compact?: boolean;
}

export function TuroSearchBar({
  initialLocation = "",
  initialFromDate,
  initialUntilDate,
  initialFromTime = "10:00",
  initialUntilTime = "10:00",
  compact = false,
}: TuroSearchBarProps) {
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

  // Compact version for navbar
  if (compact) {
    return (
      <button
        onClick={() => navigate("/browse")}
        className="flex items-center border border-border rounded-full shadow-sm hover:shadow-md transition-smooth px-4 py-2 gap-4 w-full max-w-lg bg-background"
      >
        <span className="text-sm font-medium text-foreground">Qualquer lugar</span>
        <span className="h-5 w-px bg-border" />
        <span className="text-sm font-medium text-foreground">Qualquer data</span>
        <span className="h-5 w-px bg-border" />
        <span className="text-sm text-muted-foreground">Buscar</span>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-auto">
          <Search className="w-4 h-4 text-primary-foreground" />
        </div>
      </button>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Desktop Version */}
      <div className="hidden md:flex items-center bg-background rounded-full shadow-airbnb border border-border hover:shadow-airbnb-hover transition-smooth">
        {/* Where Section */}
        <div className="flex-1 px-6 py-3 rounded-full hover:bg-muted transition-fast cursor-pointer">
          <div className="text-xs font-semibold text-foreground mb-0.5 text-left">Onde</div>
          <div className="flex items-center gap-2">
            <CityAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Busque destinos"
              className="border-0 bg-transparent h-6 p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-sm"
              hideIcon
            />
          </div>
        </div>

        <span className="h-8 w-px bg-border" />

        {/* From Date Section */}
        <div className="px-4 py-3 rounded-full hover:bg-muted transition-fast cursor-pointer">
          <div className="text-xs font-semibold text-foreground mb-0.5 text-left">De</div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {fromDate ? format(fromDate, "dd/MM/yyyy") : "Inserir datas"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
              <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-muted-foreground focus:ring-0 gap-1 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <span className="h-8 w-px bg-border" />

        {/* Until Date Section */}
        <div className="px-4 py-3 rounded-full hover:bg-muted transition-fast cursor-pointer">
          <div className="text-xs font-semibold text-foreground mb-0.5 text-left">Até</div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {untilDate ? format(untilDate, "dd/MM/yyyy") : "Inserir datas"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
              <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-muted-foreground focus:ring-0 gap-1 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
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
          <Search className="w-5 h-5 text-primary-foreground" />
        </Button>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden bg-background rounded-2xl shadow-airbnb border border-border p-4 space-y-4">
        {/* Where */}
        <div>
          <div className="text-xs font-semibold text-foreground mb-1">Onde</div>
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <CityAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Busque destinos"
              className="border-0 bg-transparent h-8 p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              hideIcon
            />
          </div>
        </div>

        {/* Dates Row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-xs font-semibold text-foreground mb-1">De</div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground">
                    {fromDate ? format(fromDate, "dd/MM/yyyy") : "Data"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-muted-foreground focus:ring-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-xs font-semibold text-foreground mb-1">Até</div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground">
                    {untilDate ? format(untilDate, "dd/MM/yyyy") : "Data"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                <SelectTrigger className="w-auto border-0 h-6 p-0 text-sm text-muted-foreground focus:ring-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
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
          className="w-full rounded-lg"
        >
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>
    </div>
  );
}
