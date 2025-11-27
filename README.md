# 🚗 CarShare - Marketplace P2P de Aluguel de Carros

> Plataforma moderna que conecta proprietários de veículos com pessoas que precisam alugar carros, criando um marketplace peer-to-peer seguro, conveniente e transparente.

![CarShare](https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=400&fit=crop)

## 📋 Sobre o Projeto

O **CarShare** é uma solução completa de aluguel de carros P2P que permite:

- **Para Locatários**: Encontrar e alugar carros de pessoas físicas com preços competitivos e grande variedade
- **Para Proprietários**: Monetizar veículos ociosos e gerar renda extra de forma segura

## ✨ Funcionalidades Principais

### Para Locatários (Clientes)
- 🔍 **Busca Avançada**: Filtros por localização, tipo de veículo, preço, transmissão e mais
- 🗺️ **Mapa Interativo**: Visualização de carros disponíveis em mapa
- 📅 **Calendário de Disponibilidade**: Reserva com seleção de datas em tempo real
- 💳 **Pagamento Seguro**: Múltiplos métodos (Cartão, PIX, carteira digital)
- 💬 **Chat Integrado**: Comunicação direta com proprietários
- ⭐ **Sistema de Avaliações**: Reviews verificados de outros locatários

### Para Proprietários (Locadores)
- 🚙 **Cadastro de Veículos**: Upload de fotos, documentos e especificações
- 💰 **Gestão Financeira**: Dashboard com ganhos, extratos e repasses
- 📊 **Dashboard Completo**: Visão geral de reservas e calendário
- 🔒 **Segurança Total**: Verificação de documentos e seguro completo
- 📱 **Notificações**: Alertas em tempo real sobre reservas

### Funcionalidades de Apoio
- 🛡️ **Sistema de Segurança**: Verificação de CNH, documentos e seguros
- 🌟 **Avaliação Mútua**: Locatários e proprietários se avaliam
- 📞 **Suporte 24/7**: Assistência completa durante toda a jornada
- 🔐 **Pagamentos Protegidos**: Gateway seguro com proteção contra fraudes

## 🎨 Design System

O CarShare utiliza um design system moderno e vibrante:

### Cores Principais
- **Primary (Royal Blue)**: `hsl(217 91% 60%)` - Confiança e profissionalismo
- **Secondary (Turquoise)**: `hsl(174 62% 47%)` - Energia e inovação
- **Accent (Coral)**: `hsl(14 90% 62%)` - Ação e conversão

### Tipografia
- **Display**: Lexend - Para títulos impactantes
- **Body**: Inter - Para leitura confortável

### Componentes
- Cards com hover effects suaves
- Gradientes vibrantes em CTAs
- Animações de transição fluídas
- Layout responsivo mobile-first

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Biblioteca UI moderna
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Componentes acessíveis
- **React Router** - Roteamento
- **TanStack Query** - State management

### Backend (Próximos Passos)
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Storage
  - Real-time subscriptions
  - Edge Functions
- **Stripe** - Pagamentos seguros

## 📦 Estrutura do Projeto

```
src/
├── assets/          # Imagens e recursos estáticos
├── components/      # Componentes reutilizáveis
│   ├── ui/         # Componentes base (shadcn)
│   ├── Navbar.tsx
│   └── Footer.tsx
├── pages/          # Páginas da aplicação
│   ├── Index.tsx          # Landing page
│   ├── Browse.tsx         # Busca de carros
│   ├── CarDetails.tsx     # Detalhes do veículo
│   ├── BecomeOwner.tsx    # Página para proprietários
│   ├── HowItWorks.tsx     # Como funciona
│   └── NotFound.tsx       # 404
├── hooks/          # Custom hooks
├── lib/            # Utilitários
└── App.tsx         # Componente raiz
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Entre no diretório
cd carshare

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

## 📱 Páginas Implementadas

- ✅ **/** - Landing page com hero, benefícios, carros em destaque
- ✅ **/browse** - Busca de carros com filtros avançados
- ✅ **/cars/:id** - Detalhes completos do veículo com galeria
- ✅ **/become-owner** - Cadastro de proprietários com calculadora
- ✅ **/how-it-works** - Explicação do processo para ambos perfis

## 🔜 Próximas Implementações

### Backend (Supabase)
- [ ] Sistema de autenticação (email/senha, Google)
- [ ] Perfis de usuário (clientes e proprietários)
- [ ] CRUD de veículos com upload de imagens
- [ ] Sistema de reservas com calendário
- [ ] Sistema de pagamentos (Stripe)
- [ ] Chat em tempo real entre usuários
- [ ] Sistema de avaliações e reviews
- [ ] Notificações push
- [ ] Dashboard administrativo

### Features Adicionais
- [ ] Filtros avançados salvos
- [ ] Favoritos e wishlists
- [ ] Comparação de veículos
- [ ] Histórico de reservas
- [ ] Relatórios financeiros para proprietários
- [ ] Sistema de cupons e promoções
- [ ] Verificação de documentos (OCR)
- [ ] Integração com mapas (localização real)

## 📊 Schema do Banco de Dados

O projeto inclui um schema Prisma completo com:
- **Users**: Gerenciamento de usuários (roles, status, documentos)
- **Vehicles**: Cadastro completo de veículos
- **Bookings**: Sistema de reservas
- **Payments**: Transações financeiras
- **Reviews**: Avaliações mútuas
- **Notifications**: Sistema de notificações
- **Support**: Tickets de suporte

Ver arquivo `Schema_Prisma.docx` para detalhes completos.

## 🎯 Público-Alvo

### Locatários
- Idade: 25-45 anos
- Perfil: Profissionais urbanos, turistas
- Necessidades: Flexibilidade, preços competitivos

### Proprietários
- Idade: 30-55 anos
- Perfil: Donos de veículos buscando renda extra
- Necessidades: Processo simples, segurança, rentabilidade

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

Para dúvidas e suporte, entre em contato através:
- Email: contato@carshare.com.br
- Telefone: (11) 3000-0000

---

**Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)**
