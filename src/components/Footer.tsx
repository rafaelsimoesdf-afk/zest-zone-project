import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Suporte */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-3">
              {[
                { to: "/support", label: "Central de Ajuda" },
                { to: "/how-it-works", label: "Como Funciona" },
                { to: "#", label: "Garantias e Seguros" },
                { to: "#", label: "Opções de cancelamento" },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-fast">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locatários */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Para Locatários</h3>
            <ul className="space-y-3">
              {[
                { to: "/browse", label: "Buscar Carros" },
                { to: "/classifieds", label: "Classificados" },
                { to: "/services", label: "Serviços" },
                { to: "/app-driver-rentals", label: "Motoristas de App" },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-fast">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Proprietários */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Para Proprietários</h3>
            <ul className="space-y-3">
              {[
                { to: "/become-owner", label: "Anuncie seu Carro" },
                { to: "#", label: "Proteção do Veículo" },
                { to: "#", label: "Guia do Proprietário" },
                { to: "#", label: "Calcule seus Ganhos" },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-fast">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* InfiniteDrive */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">InfiniteDrive</h3>
            <ul className="space-y-3">
              {[
                { to: "#", label: "Termos de Uso" },
                { to: "#", label: "Política de Privacidade" },
                { to: "#", label: "Sobre Nós" },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-fast">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} InfiniteDrive. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-foreground hover:underline transition-fast">Privacidade</Link>
            <span>·</span>
            <Link to="#" className="hover:text-foreground hover:underline transition-fast">Termos</Link>
            <span>·</span>
            <Link to="#" className="hover:text-foreground hover:underline transition-fast">Mapa do Site</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
