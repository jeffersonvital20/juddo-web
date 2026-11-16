# 🌐 Judoo Web — Portal de Gestão de Torneios, Secretaria e Telão de Arena (FIJ)

Aplicação web moderna e responsiva desenvolvida em **React 18 + TypeScript + Vite** para a gestão completa de torneios de Judô em tempo real, seguindo as regras oficiais da **Federação Internacional de Judô (FIJ)**.

O **Judoo Web** conecta-se à API (`juddo-backend`) via REST e WebSockets (**SignalR**) para atualizar instantaneamente chaves, pesagens, status de tatames e o **Telão de Arena** a cada evento registrado na mesa do mesário (`juddo-desktop`).

---

## 🚀 Tecnologias Utilizadas

- **Core**: [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 5](https://vitejs.dev/)
- **Roteamento**: [React Router DOM v6](https://reactrouter.com/) com controle de acesso por perfil (RBAC)
- **Gerenciamento de Estado Assíncrono & Cache**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Tempo Real (WebSockets)**: [`@microsoft/signalr`](https://www.npmjs.com/package/@microsoft/signalr) conectado ao hub `/hubs/tatame`
- **Estilização & UI**: [Tailwind CSS 3](https://tailwindcss.com/) (com suporte nativo a **Modo Claro / Escuro**), `clsx` e `tailwind-merge`
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Containerização**: **Docker** (build multi-stage com **Node 20 Alpine** + servidor **Nginx Alpine**) e **Docker Compose**

---

## 🧩 Módulos da Aplicação

- **Início & Autenticação (`/`)**: Landing page institucional, visão geral e login integrado via JWT.
- **Painel Geral (`/admin`)**: Monitoramento em tempo real dos tatames, lutas em andamento e indicadores do evento.
- **Campeonatos (`/campeonatos`)**: Criação e gestão de torneios, categorias de peso/idade e áreas de combate (tatames).
- **Lutadores (`/atletas`)**: Cadastro de atletas e agremiações/academias.
- **Secretaria de Pesagem (`/pesagem`)**: Registro oficial de peso aferido, validação automática de limite da categoria e aprovação/reprovação.
- **Chaves / Brackets (`/chaves`)**: Geração automática de chaves eliminatórias e acompanhamento de avanço de fases.
- **Telão da Arena (`/telao`)**: Interface dedicada em tela cheia para projeção nos telões do ginásio, exibindo placar ao vivo (Ippon, Waza-ari, Shido, Osaekomi, Golden Score e cronômetro) sincronizado via SignalR.
- **Configurações (`/configuracoes`)**: Gestão de usuários, perfis de acesso e parâmetros da plataforma.
- **Download do App Desktop (`/downloads/judoo-desktop-windows-x64.zip`)**: Download direto do executável oficial da mesa do mesário para Windows.

---

## 📥 Download do Aplicativo Desktop (Mesa do Mesário)

Para os mesários e operadores de tatame que necessitam de **latência zero**, suporte a **atalhos rápidos de teclado** e operação confiável sem depender de abas de navegador:

1. **Pela Página Inicial do Judoo Web**:
   - Acesse a Home (`http://localhost:5173` ou `http://localhost:3000`).
   - Clique no botão **"Baixar App Desktop (Mesa)"** no banner principal ou no card do **judoo-desktop**.
2. **Download Direto**:
   - [Baixar Judoo Desktop para Windows (x64)](http://localhost:3000/downloads/judoo-desktop-windows-x64.zip) (disponível em `public/downloads/judoo-desktop-windows-x64.zip`).
3. **Instalação / Execução**:
   - Descompacte o arquivo `.zip` em uma pasta de sua preferência.
   - Execute o arquivo `judoo-desktop.exe`.
   - O aplicativo se conectará automaticamente à API e ao hub SignalR do tatame.

---

## ⚙️ Pré-requisitos

- [Node.js 20+](https://nodejs.org/) e `npm`
- Ou [Docker](https://www.docker.com/) + **Docker Compose**
- Backend (`juddo-backend`) rodando (padrão em `http://localhost:8080`)

---

## 💻 Como Rodar Localmente (Desenvolvimento)

1. Acesse a pasta do projeto e instale as dependências:
   ```bash
   cd juddo-web
   npm install
   ```

2. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   # Ambiente de Desenvolvimento (.env.development)
   npm run dev

   # Ou em modo Homologação (.env.staging)
   npm run dev:staging

   # Ou em modo Produção (.env.production)
   npm run dev:prod
   ```

3. Acesse no navegador:
   - **Aplicação Web**: [http://localhost:5173](http://localhost:5173)
   - **Telão da Arena**: [http://localhost:5173/telao](http://localhost:5173/telao)

---

## 📦 Como Gerar o Build de Produção

```bash
# Build para Produção
npm run build:prod

# Build para Homologação (Staging)
npm run build:staging

# Visualizar o build localmente
npm run preview
```

Os arquivos otimizados serão gerados na pasta `dist/`.

---

## 🐳 Como Rodar com Docker

### 1. Modo Produção / Nginx (porta `3000`)
```bash
docker compose up -d --build
```
Acesse em: [http://localhost:3000](http://localhost:3000)

### 2. Modo Desenvolvimento com Hot-Reload via Docker (porta `5173`)
```bash
docker compose --profile dev up --build
```
Acesse em: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testes Automatizados (Unitários e de Integração)

O projeto conta com suíte de testes automatizados utilizando **Vitest**, **React Testing Library** e **JSDOM**:

```bash
# Executar todos os testes (Unitários + Integração)
npm test

# Executar apenas os Testes Unitários (src/__tests__/unit)
npm run test:unit

# Executar apenas os Testes de Integração (src/__tests__/integration)
npm run test:integration
```

---

## 🔄 Ambientes e Pipeline CI/CD (GitHub Actions)

Assim como no `juddo-backend`, o `judoo-web` possui arquivos de configuração dedicados para **3 ambientes** (`.env.development`, `.env.staging`, `.env.production`) e pipeline completa em [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) com 4 estágios:

1. **1. Build (React 18 + Vite & Docker)**
2. **2. Testes Unitários (`npm run test:unit`)**
3. **3. Testes de Integração (`npm run test:integration`)**
4. **4. Deploy Automático por Branch (GCP Compute Engine VPS)**:
   - Branch `dev` → Ambiente **Desenvolvimento** (`WEB_PORT=3002`)
   - Branch `homolog` → Ambiente **Homologação / Staging** (`WEB_PORT=3001`)
   - Branch `main` → Ambiente **Produção** (`WEB_PORT=3000`)

👉 **Configuração de Secrets e Deploy na VPS**:
As credenciais de acesso SSH (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) e portas de cada ambiente são gerenciadas de forma 100% segura através do **GitHub Secrets** (`Settings > Secrets and variables > Actions`), sem expor endereços IP ou credenciais no código-fonte.

---

## 🔧 Variáveis de Ambiente

O projeto possui arquivos pré-configurados por ambiente na raiz:
- `.env.development` (Desenvolvimento local)
- `.env.staging` (Homologação)
- `.env.production` (Produção)

| Variável | Descrição | Exemplo (`development`) |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | Identificador do ambiente (`development`, `staging`, `production`) | `development` |
| `VITE_ENV_LABEL` | Rótulo exibido no cabeçalho da interface | `Desenvolvimento` |
| `VITE_API_URL` | URL base da API REST do `juddo-backend` | `http://localhost:8080/api` |
| `VITE_HUB_URL` | URL do Hub SignalR de tempo real | `http://localhost:8080/hubs/tatame` |
