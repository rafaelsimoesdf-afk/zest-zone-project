import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-smooth">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
              CarShare
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
              to="/become-owner"
              className="text-sm font-medium text-foreground hover:text-primary transition-fast"
            >
              Anuncie seu Carro
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">
                <User className="w-4 h-4 mr-2" />
                Entrar
              </Link>
            </Button>
            <Button
              size="sm"
              className="bg-gradient-accent hover:opacity-90 transition-fast shadow-md"
              asChild
            >
              <Link to="/signup">Cadastrar</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-fast"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link
              to="/browse"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-fast"
              onClick={() => setIsMenuOpen(false)}
            >
              Buscar Carros
            </Link>
            <Link
              to="/how-it-works"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-fast"
              onClick={() => setIsMenuOpen(false)}
            >
              Como Funciona
            </Link>
            <Link
              to="/become-owner"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-fast"
              onClick={() => setIsMenuOpen(false)}
            >
              Anuncie seu Carro
            </Link>
            <div className="pt-3 space-y-2 border-t border-border">
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Link>
              </Button>
              <Button
                className="w-full bg-gradient-accent hover:opacity-90 transition-fast"
                size="sm"
                asChild
              >
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  Cadastrar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
