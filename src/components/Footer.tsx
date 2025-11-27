import { Link } from "react-router-dom";
import { Car, Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
                CarShare
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              A plataforma que conecta proprietários e locatários de veículos de forma segura e prática.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Para Locatários */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Para Locatários</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/browse"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Buscar Carros
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Garantias e Seguros
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Proprietários */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Para Proprietários</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/become-owner"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Anuncie seu Carro
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Calcule seus Ganhos
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Proteção do Veículo
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-fast"
                >
                  Guia do Proprietário
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                contato@carshare.com.br
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                (11) 3000-0000
              </li>
            </ul>
            <div className="mt-4 space-y-2">
              <Link
                to="#"
                className="block text-sm text-muted-foreground hover:text-primary transition-fast"
              >
                Central de Ajuda
              </Link>
              <Link
                to="#"
                className="block text-sm text-muted-foreground hover:text-primary transition-fast"
              >
                Termos de Uso
              </Link>
              <Link
                to="#"
                className="block text-sm text-muted-foreground hover:text-primary transition-fast"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CarShare. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
