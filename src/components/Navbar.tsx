import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, User, LogOut, LayoutDashboard, Heart, MessageSquare, Shield, Bell, Wallet, Tag, Wrench, CalendarDays, Car, HelpCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useHasVehicles } from "@/hooks/useOwnerDashboard";
import { useUnreadMessagesCount } from "@/hooks/useMessages";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TuroSearchBar } from "@/components/TuroSearchBar";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: hasVehicles } = useHasVehicles();
  const { data: unreadCount } = useUnreadMessagesCount();
  const { data: unreadNotifications } = useUnreadNotificationsCount();
  const { data: userRoles } = useUserRoles(user?.id);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const isAdmin = userRoles?.some(role => role.role === 'admin') ?? false;

  const totalNotifications = (unreadCount || 0) + (unreadNotifications || 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <span className="text-xl sm:text-2xl font-display font-bold text-primary">
              InfiniteDrive
            </span>
          </Link>

          {/* Center Search (desktop, not on homepage) */}
          {!isHome && (
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <TuroSearchBar compact />
            </div>
          )}

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/become-owner"
              className="text-sm font-medium text-foreground hover:bg-muted rounded-full px-4 py-2 transition-fast"
            >
              Anuncie seu carro
            </Link>

            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 border border-border rounded-full p-1.5 pl-3 hover:shadow-md transition-smooth">
                    <Menu className="w-4 h-4 text-muted-foreground" />
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                      {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {totalNotifications > 9 ? "9+" : totalNotifications}
                        </span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl shadow-airbnb p-1">
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/messages" className="cursor-pointer flex items-center">
                      <MessageSquare className="mr-3 h-4 w-4" />
                      Mensagens
                      {unreadCount && unreadCount > 0 ? (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                          {unreadCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/notifications" className="cursor-pointer flex items-center">
                      <Bell className="mr-3 h-4 w-4" />
                      Notificações
                      {unreadNotifications && unreadNotifications > 0 ? (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                          {unreadNotifications}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-3 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/my-bookings" className="cursor-pointer">
                      <CalendarDays className="mr-3 h-4 w-4" />
                      Minhas Reservas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/favorites" className="cursor-pointer">
                      <Heart className="mr-3 h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/my-vehicles" className="cursor-pointer">
                      <Car className="mr-3 h-4 w-4" />
                      Meus Veículos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/my-listings" className="cursor-pointer">
                      <Tag className="mr-3 h-4 w-4" />
                      Meus Anúncios
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/my-services" className="cursor-pointer">
                      <Wrench className="mr-3 h-4 w-4" />
                      Meus Serviços
                    </Link>
                  </DropdownMenuItem>
                  {hasVehicles && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg py-2.5">
                        <Link to="/owner-dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-3 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg py-2.5">
                        <Link to="/owner-withdrawals" className="cursor-pointer">
                          <Wallet className="mr-3 h-4 w-4" />
                          Saques
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/support" className="cursor-pointer">
                      <HelpCircle className="mr-3 h-4 w-4" />
                      Central de Ajuda
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg py-2.5">
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-3 h-4 w-4" />
                        Administração
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="rounded-lg py-2.5">
                    <LogOut className="mr-3 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 border border-border rounded-full p-1.5 pl-3 hover:shadow-md transition-smooth">
                    <Menu className="w-4 h-4 text-muted-foreground" />
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-airbnb p-1">
                  <DropdownMenuItem asChild className="rounded-lg py-2.5 font-medium">
                    <Link to="/auth" className="cursor-pointer">Cadastrar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/auth" className="cursor-pointer">Entrar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/become-owner" className="cursor-pointer">Anuncie seu carro</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg py-2.5">
                    <Link to="/support" className="cursor-pointer">Ajuda</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden flex items-center gap-2 border border-border rounded-full p-1.5 pl-3 hover:shadow-md transition-smooth">
                <Menu className="w-4 h-4 text-muted-foreground" />
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full ${user ? 'bg-primary' : 'bg-muted'} flex items-center justify-center`}>
                    <User className={`w-4 h-4 ${user ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalNotifications > 9 ? "9+" : totalNotifications}
                    </span>
                  )}
                </div>
              </button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <span className="text-xl font-display font-bold text-primary">InfiniteDrive</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {/* Navigation Links */}
                {[
                  { to: "/browse", label: "Buscar Carros" },
                  { to: "/how-it-works", label: "Como Funciona" },
                  { to: "/app-driver-rentals", label: "Motoristas de App" },
                  { to: "/classifieds", label: "Classificados" },
                  { to: "/services", label: "Serviços" },
                  { to: "/become-owner", label: "Anuncie seu Carro" },
                ].map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-6 space-y-1 border-t border-border">
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
                {user ? (
                  <div className="space-y-1">
                    {[
                      { to: "/profile", icon: User, label: "Meu Perfil" },
                      { to: "/favorites", icon: Heart, label: "Favoritos" },
                      { to: "/messages", icon: MessageSquare, label: "Mensagens", badge: unreadCount },
                      { to: "/notifications", icon: Bell, label: "Notificações", badge: unreadNotifications },
                      { to: "/my-bookings", icon: CalendarDays, label: "Minhas Reservas" },
                      { to: "/my-vehicles", icon: Car, label: "Meus Veículos" },
                      { to: "/my-listings", icon: Tag, label: "Meus Anúncios" },
                      { to: "/my-services", icon: Wrench, label: "Meus Serviços" },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-fast"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                        {item.badge && item.badge > 0 ? (
                          <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    ))}
                    {hasVehicles && (
                      <>
                        <Link
                          to="/owner-dashboard"
                          className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-fast"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                          Dashboard
                        </Link>
                        <Link
                          to="/owner-withdrawals"
                          className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-fast"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          Saques
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-fast"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        Administração
                      </Link>
                    )}
                    <Link
                      to="/support"
                      className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-fast"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      Central de Ajuda
                    </Link>
                    <div className="pt-2 border-t border-border mt-2">
                      <button
                        className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-fast w-full"
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 text-muted-foreground" />
                        Sair
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full" size="sm" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Cadastrar
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Entrar
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
