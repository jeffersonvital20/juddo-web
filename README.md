> **Nota de Arquitetura**: Este projeto segue as diretrizes e padrões da **Linha B**.

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

## 🏛️ Padrões de Projeto (Design Patterns) Justificados (M1)

1. **Observer Pattern (SignalR Hub + React Query)**:
   - **Justificativa**: O telão da arena e as chaves de combate precisam reagir a eventos do tatame (pontuações de *Ippon*, *Waza-ari*, tempo de *Osaekomi* e penalidades *Shido*) sem necessidade de requisições contínuas de *polling*. O hub SignalR atua como o *Subject* e os componentes inscritos atuam como *Observers*, atualizando a interface com latência de rede sub-segundo.
2. **Adapter Pattern (`src/services/api.ts`)**:
   - **Justificativa**: Converte os contratos da API REST e DTOs do backend (.NET 8) para tipos TypeScript estritos do frontend, encapsulando normalizações de enums, tokens JWT Bearer e estratégias de fallback offline/demo.
3. **Provider / Dependency Inversion Pattern (React Contexts)**:
   - **Justificativa**: Os contextos `AuthContext` e `ThemeContext` fornecem inversão de controle para controle de acesso por perfil (RBAC) e alternância de tema sem acoplamento direto dos componentes consumidores.

---

## 🧪 Testes Automatizados & Cobertura Mínima Declarada (M2)

O projeto conta com suíte de testes automatizados utilizando **Vitest**, **React Testing Library** e **JSDOM**, com **cobertura mínima de código declarada e respeitada** em `vite.config.ts`:

```bash
# Executar todos os testes (Unitários + Integração)
npm test

# Executar apenas os Testes Unitários (src/__tests__/unit)
npm run test:unit

# Executar apenas os Testes de Integração (src/__tests__/integration)
npm run test:integration

# Executar Análise de Cobertura de Código com Thresholds (@vitest/coverage-v8)
npm run test:coverage
```

### Limiares (Thresholds) de Cobertura Configurados:
- **Linhas (Lines)**: $\ge 45\%$
- **Funções (Functions)**: $\ge 35\%$
- **Ramos (Branches)**: $\ge 50\%$
- **Instruções (Statements)**: $\ge 45\%$

---

## 🔄 Pipeline CI/CD: Install, Lint & Test (M3)

A pipeline do **GitHub Actions** em [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) valida continuamente os 3 ambientes (`dev`, `homolog`, `main`) através dos seguintes passos obrigatórios:
1. **Install**: `npm ci`
2. **Lint**: `npm run lint` (`tsc --noEmit` para validação rigorosa de tipagem estática e ausência de erros)
3. **Testes Unitários & Integração**: Vitest com geração de relatórios JUnit
4. **Deploy Automático na VPS**: Deploy via SSH e Docker Compose por branch

---

## 📊 Observabilidade, Métricas e SLO Simples (M3)

- **Logs Estruturados**: Interceptadores HTTP e console logging estruturado com níveis de severidade (`INFO`, `WARN`, `ERROR`).
- **Métrica Principal**: Tempo de resposta do endpoint e status de conectividade do WebSocket (`tatame_signalr_connected`).
- **SLO (Service Level Objective)**:
  - **Latência $p95$**: $95\%$ das interações e consultas do portal web devem responder em menos de **$200\text{ms}$** ($p95 < 200\text{ms}$).
  - **Disponibilidade**: Disponibilidade do Telão e da Mesa $\ge 99.5\%$ durante os eventos.

---

## 📑 Registros de Decisão Arquitetural (ADRs) (M4)

As decisões de engenharia do projeto são documentadas no padrão internacional **MADR (Markdown Architectural Decision Records)** na pasta `docs/adr/`:
- **[ADR-0001: Adoção de Clean Architecture, CQRS e SignalR para Torneios em Tempo Real](docs/adr/0001-adocao-clean-architecture-cqrs-signalr.md)**

---

## ⚡ Testes de Carga com k6 & OpenAPI (M4)

- **OpenAPI 3.0**: Especificação formal do endpoint principal disponível em [`openapi/openapi.json`](openapi/openapi.json).
- **Smoke Test k6**: Script de teste de carga e validação de SLO disponível em [`k6/smoke-test-campeonatos.js`](k6/smoke-test-campeonatos.js).
  ```bash
  # Executar o smoke test medindo p95 < 200ms
  k6 run k6/smoke-test-campeonatos.js
  ```

---
