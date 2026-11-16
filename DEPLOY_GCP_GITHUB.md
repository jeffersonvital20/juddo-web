# 🚀 Guia Passo a Passo: Pipeline CI/CD e Ambientes (`judoo-web`) no GitHub e Google Cloud (GCP)

Este guia documenta a configuração dos **3 ambientes** (`development`, `homologacao` e `production`) e da pipeline automatizada em `.github/workflows/ci-cd.yml` para a aplicação web **`judoo-web`**, seguindo o mesmo padrão arquitetural do `juddo-backend`.

---

## 🔄 Arquitetura da Pipeline e Ambientes

A pipeline `.github/workflows/ci-cd.yml` possui **4 estágios encadeados**:

1. **1. Build (React 18 + Vite & Docker)**:
   - Instala as dependências (`npm ci`), valida a compilação TypeScript (`tsc`) e gera os bundles Vite para os 3 modos (`build:dev`, `build:staging`, `build:prod`).
   - Faz upload do artefato compilado (`dist/`) e valida o build da imagem Docker multi-stage (`Node 20 Alpine` → `Nginx Alpine`).
2. **2. Testes Unitários (`unit-tests`)**:
   - Executa `src/__tests__/unit` via **Vitest**, validando o serviço de API (`fetchWithAuth`, renovação automática de JWT, chamadas REST), `AuthContext` e `ThemeContext`.
   - Exporta o relatório JUnit XML (`unit-tests.xml`) como artefato do GitHub Actions.
3. **3. Testes de Integração (`integration-tests`)**:
   - Executa `src/__tests__/integration` via **Vitest + React Testing Library**, testando fluxos completos: controle de acesso por perfil no menu (RBAC), cadastro de campeonatos, pesagem oficial, chaves no formato Copa + pontuação Yuko e módulo exclusivo de configurações do Admin.
   - Exporta o relatório JUnit XML (`integration-tests.xml`) como artefato.
4. **4. Deploy Automático por Branch na VM GCP**:
   - **Branch `dev`** → Ambiente **`development`** (Porta Web padrão: `3002`, conectada à API Dev `8082`)
   - **Branch `homolog`** → Ambiente **`homologacao`** (Porta Web padrão: `3001`, conectada à API Homolog `8081`)
   - **Branch `main`** → Ambiente **`production`** (Porta Web padrão: `3000`, conectada à API Prod `8080`)

---

## 🌐 Mapeamento de Portas na VM (Frontend + Backend)

| Ambiente | Branch Git | Container Web (`judoo-web`) | Porta Web | Container API (`juddo-backend`) | Porta API |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Produção** | `main` | `judoo-web-prod-web` | `3000` | `judoo-prod-api` | `8080` |
| **Homologação** | `homolog` | `judoo-web-homolog-web` | `3001` | `judoo-homolog-api` | `8081` |
| **Desenvolvimento** | `dev` | `judoo-web-dev-web` | `3002` | `judoo-dev-api` | `8082` |

### Liberar as Portas do Frontend no Firewall do GCP
No Cloud Shell do Google Cloud (ou em **Rede VPC → Firewall**), libere as portas `3000`, `3001` e `3002`:

```bash
gcloud compute firewall-rules create allow-judoo-web \
  --allow tcp:3000,3001,3002 \
  --direction=INGRESS \
  --source-ranges=0.0.0.0/0
```

---

## 🔐 Secrets para Cadastrar no Repositório GitHub (`juddo-web`)

No seu repositório do GitHub, acesse **Settings → Secrets and variables → Actions → New repository secret**:

| Name (Nome da Secret) | Valor a preencher | Obrigatória? |
| :--- | :--- | :---: |
| `VPS_HOST` | IP Externo da VM no GCP (ex.: `34.95.120.45`) | **Sim** |
| `VPS_USER` | Usuário SSH da VM (ex.: `ubuntu`) | **Sim** |
| `VPS_SSH_KEY` | Chave privada SSH (`~/.ssh/github_actions`) | **Sim** |
| `VPS_PORT` | `22` | Opcional (padrão `22`) |
| `WEB_PORT_DEV` | `3002` | Opcional (padrão `3002`) |
| `WEB_PORT_STAGING` | `3001` | Opcional (padrão `3001`) |
| `WEB_PORT_PROD` | `3000` | Opcional (padrão `3000`) |
| `API_PORT_DEV` | `8082` | Opcional (padrão `8082`) |
| `API_PORT_STAGING` | `8081` | Opcional (padrão `8081`) |
| `API_PORT_PROD` | `8080` | Opcional (padrão `8080`) |

---

## 🚀 Fluxo de Publicação (Dev → Homolog → Prod)

### 1. Publicar em Desenvolvimento (`dev`)
```bash
git checkout -b dev
git add .
git commit -m "ci: adiciona pipeline CI/CD, ambientes e testes automatizados no judoo-web"
git push -u origin dev
```
- URL após o deploy: `http://SEU_IP_DA_VM:3002` (exibe o selo verde **Dev** no cabeçalho).

### 2. Promover para Homologação (`homolog`)
```bash
git checkout -b homolog
git merge dev
git push -u origin homolog
```
- URL após o deploy: `http://SEU_IP_DA_VM:3001` (exibe o selo âmbar **Homologação** no cabeçalho).

### 3. Publicar em Produção (`main`)
```bash
git checkout main
git merge homolog
git push origin main
```
- URL após o deploy: `http://SEU_IP_DA_VM:3000`
