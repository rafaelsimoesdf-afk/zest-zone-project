import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, User, LogOut, LayoutDashboard, Heart, MessageSquare, Shield, Bell, Wallet, Tag, Wrench, CalendarDays, Car } from "lucide-react";
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

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: hasVehicles } = useHasVehicles();
  const { data: unreadCount } = useUnreadMessagesCount();
  const { data: unreadNotifications } = useUnreadNotificationsCount();
  const { data: userRoles } = useUserRoles(user?.id);
  
  const isAdmin = userRoles?.some(role => role.role === 'admin') ?? false;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <span className="text-2xl sm:text-3xl font-display font-bold text-primary group-hover:scale-105 transition-smooth">
              InfiniteDrive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/browse"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Buscar Carros
            </Link>
            <Link
              to="/how-it-works"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Como Funciona
            </Link>
            <Link
              to="/app-driver-rentals"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Motoristas de App
            </Link>
            <Link
              to="/classifieds"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Classificados
            </Link>
            <Link
              to="/services"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Serviços
            </Link>
            <Link
              to="/become-owner"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Anuncie seu Carro
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Minha Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="cursor-pointer flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Mensagens
                      {unreadCount && unreadCount > 0 ? (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                          {unreadCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      Notificações
                      {unreadNotifications && unreadNotifications > 0 ? (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                          {unreadNotifications}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="cursor-pointer">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Minhas Reservas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-vehicles" className="cursor-pointer">
                      <Car className="mr-2 h-4 w-4" />
                      Meus Veículos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings" className="cursor-pointer">
                      <Tag className="mr-2 h-4 w-4" />
                      Meus Anúncios
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-services" className="cursor-pointer">
                      <Wrench className="mr-2 h-4 w-4" />
                      Meus Serviços
                    </Link>
                  </DropdownMenuItem>
                  {hasVehicles && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/owner-dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard Proprietário
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/owner-withdrawals" className="cursor-pointer">
                          <Wallet className="mr-2 h-4 w-4" />
                          Saques
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Administração
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gray-800 text-white hover:bg-gray-700"
                  asChild>
                  <Link to="/auth">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-fast">
                <Menu className="w-6 h-6 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <span className="text-2xl font-display font-bold text-primary">InfiniteDrive</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                <Link to="/browse" className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast" onClick={() => setMobileMenuOpen(false)}>
                  Buscar Carros
                </Link>
                <Link to="/how-it-works" className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast" onClick={() => setMobileMenuOpen(false)}>
                  Como Funciona
                </Link>
                <Link to="/app-driver-rentals" className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast" onClick={() => setMobileMenuOpen(false)}>
                  Motoristas de App
                </Link>
                <Link to="/classifieds" className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast" onClick={() => setMobileMenuOpen(false)}>
                  Classificados
                </Link>
                <Link to="/services" className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast" onClick={() => setMobileMenuOpen(false)}>
                  Serviços
                </Link>
                <Link to="/become-owner" className="block py-3 text-sm font-medium text-foreground hover:text-primary transition-fast" onClick={() => setMobileMenuOpen(false)}>
                  Anuncie seu Carro
                </Link>
              </div>

              <div className="mt-6 pt-6 space-y-2 border-t border-border">
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
                {user ? (
                  <>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4 mr-2" />
                        Meu Perfil
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/favorites" onClick={() => setMobileMenuOpen(false)}>
                        <Heart className="w-4 h-4 mr-2" />
                        Favoritos
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full relative" size="sm" asChild>
                      <Link to="/messages" onClick={() => setMobileMenuOpen(false)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensagens
                        {unreadCount && unreadCount > 0 ? (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1.5 py-0">
                            {unreadCount}
                          </Badge>
                        ) : null}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full relative" size="sm" asChild>
                      <Link to="/notifications" onClick={() => setMobileMenuOpen(false)}>
                        <Bell className="w-4 h-4 mr-2" />
                        Notificações
                        {unreadNotifications && unreadNotifications > 0 ? (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1.5 py-0">
                            {unreadNotifications}
                          </Badge>
                        ) : null}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}>
                        Minhas Reservas
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/my-vehicles" onClick={() => setMobileMenuOpen(false)}>
                        Meus Veículos
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/my-listings" onClick={() => setMobileMenuOpen(false)}>
                        <Tag className="w-4 h-4 mr-2" />
                        Meus Anúncios
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/my-services" onClick={() => setMobileMenuOpen(false)}>
                        <Wrench className="w-4 h-4 mr-2" />
                        Meus Serviços
                      </Link>
                    </Button>
                    {hasVehicles && (
                      <>
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link to="/owner-dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard Proprietário
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link to="/owner-withdrawals" onClick={() => setMobileMenuOpen(false)}>
                            <Wallet className="w-4 h-4 mr-2" />
                            Saques
                          </Link>
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <Button variant="outline" className="w-full" size="sm" asChild>
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Shield className="w-4 h-4 mr-2" />
                          Administração
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4 mr-2" />
                        Entrar
                      </Link>
                    </Button>
                    <Button
                      className="w-full"
                      size="sm"
                      asChild
                    >
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Cadastrar
                      </Link>
                    </Button>
                  </>
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
