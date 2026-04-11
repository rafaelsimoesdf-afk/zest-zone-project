import { Link, useLocation } from "react-router-dom";
import { Search, CarFront, Newspaper, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/browse", icon: Search, label: "Buscar Carros" },
  { to: "/app-driver-rentals", icon: CarFront, label: "Motoristas" },
  { to: "/classifieds", icon: Newspaper, label: "Classificados" },
  { to: "/services", icon: Wrench, label: "Serviços" },
];

const BottomTabBar = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            tab.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
