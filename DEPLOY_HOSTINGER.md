# 🚀 Guia de Deploy na VPS Hostinger & Configuração de Secrets no GitHub

Este guia orienta passo a passo como preparar sua **VPS da Hostinger (Ubuntu/Debian)** e configurar as **GitHub Secrets** para que o deploy da aplicação **Judoo Web** ocorra de forma automática e contínua via **GitHub Actions** em três ambientes isolados:
- **Produção (`main`)**: Porta `3000`
- **Homologação (`homolog`)**: Porta `3001`
- **Desenvolvimento (`dev`)**: Porta `3002`

---

## 📋 Pré-requisitos
- Conta ativa na Hostinger com uma VPS contratada (recomendado: **Ubuntu 22.04 ou 24.04 64-bit**).
- Acesso SSH à VPS (IP da VPS e senha de `root` informados no hPanel da Hostinger).
- Permissão de Administrador no repositório GitHub (`https://github.com/jeffersonvital20/juddo-web`).

---

## 🖥️ Etapa 1: Preparação Inicial da VPS Hostinger

Acesse sua VPS pelo terminal local (ou pelo painel Web da Hostinger via Browser Terminal):

```bash
ssh root@SEU_IP_HOSTINGER
```

### 1.1. Atualizar pacotes do sistema
```bash
apt update && apt upgrade -y
```

### 1.2. Instalar Docker e Docker Compose
Execute o script oficial do Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

Habilite e inicialize o serviço do Docker:
```bash
systemctl enable docker
systemctl start docker
```

Verifique se o Docker e o Compose estão funcionando:
```bash
docker --version
docker compose version
```

### 1.3. Criar a estrutura de diretórios para as aplicações
```bash
mkdir -p /opt/judoo-web/prod
mkdir -p /opt/judoo-web/homolog
mkdir -p /opt/judoo-web/dev
```

---

## 🔑 Etapa 2: Gerar Chave SSH para o GitHub Actions

Para que o GitHub Actions acesse a VPS sem senha via SSH, precisamos criar um par de chaves SSH dedicado.

### 2.1. Gerar o par de chaves (na VPS ou na sua máquina local)
Na VPS (como `root`), execute:
```bash
ssh-keygen -t ed25519 -C "github-actions-judoo" -f ~/.ssh/id_ed25519_github -N ""
```

### 2.2. Autorizar a chave pública na VPS
Adicione a chave pública criada ao arquivo de chaves autorizadas:
```bash
cat ~/.ssh/id_ed25519_github.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 2.3. Copiar a chave privada
Exiba o conteúdo da **chave privada** (é este texto que iremos cadastrar no GitHub):
```bash
cat ~/.ssh/id_ed25519_github
```
> ⚠️ **Importante**: Copie **todo** o conteúdo exibido, incluindo as linhas:
> `-----BEGIN OPENSSH PRIVATE KEY-----`
> ...
> `-----END OPENSSH PRIVATE KEY-----`

---

## 🛡️ Etapa 3: Liberar as Portas no Firewall

No painel **hPanel da Hostinger**:
1. Vá em **VPS** > Selecione seu Servidor > **Segurança** > **Firewall**.
2. Crie ou confirme as seguintes regras de entrada (Protocolo TCP):
   - **22**: SSH (Acesso remoto)
   - **80** / **443**: HTTP / HTTPS (caso use Nginx reverse proxy com domínio)
   - **3000**: Judoo Web - Produção
   - **3001**: Judoo Web - Homologação
   - **3002**: Judoo Web - Desenvolvimento
   - **8080**, **8081**, **8082**: Portas das APIs do Backend (`juddo-backend`)

Caso use o firewall interno `ufw` na VPS:
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw allow 3002/tcp
ufw allow 8080/tcp
ufw allow 8081/tcp
ufw allow 8082/tcp
ufw enable
```

---

## 🔐 Etapa 4: Cadastrar as Secrets e Variáveis no GitHub

1. Acesse o seu repositório no GitHub:
   `https://github.com/jeffersonvital20/juddo-web`
2. Clique na aba superior **Settings** (Configurações).
3. No menu lateral esquerdo, vá em **Secrets and variables** > **Actions**.
4. Clique no botão verde **New repository secret**.

Cadastre as seguintes Secrets:

### 🔑 Secrets de Conexão à VPS (Obrigatórias):

| Nome da Secret | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `VPS_HOST` | `194.163.xxx.xxx` | IP público da sua VPS Hostinger (encontrado no painel) |
| `VPS_USER` | `root` | Usuário de acesso SSH da VPS |
| `VPS_PORT` | `22` | Porta SSH (padrão `22`) |
| `VPS_SSH_KEY` | *(Conteúdo da chave privada)* | Chave privada gerada na Etapa 2 (`id_ed25519_github`) |

---

### 🌐 Secrets de Portas dos Ambientes (Opcional - Já possuem padrão):

| Nome da Secret | Valor Padrão | Descrição |
| :--- | :--- | :--- |
| `WEB_PORT_PROD` | `3000` | Porta onde o container Web de Produção responderá |
| `WEB_PORT_STAGING` | `3001` | Porta do container Web de Homologação |
| `WEB_PORT_DEV` | `3002` | Porta do container Web de Desenvolvimento |
| `API_PORT_PROD` | `8080` | Porta do backend de Produção |
| `API_PORT_STAGING` | `8081` | Porta do backend de Homologação |
| `API_PORT_DEV` | `8082` | Porta do backend de Desenvolvimento |

---

### 🔗 Secrets de Integração com a API (Recomendado se usar Domínio ou IP Customizado):

Se você não informar estas variáveis, o workflow usará automaticamente `http://<VPS_HOST>:<API_PORT>/api`:

| Nome da Secret | Exemplo de Valor |
| :--- | :--- |
| `VITE_API_URL_PROD` | `http://194.163.xxx.xxx:8080/api` ou `https://api.judoo.com.br/api` |
| `VITE_HUB_URL_PROD` | `http://194.163.xxx.xxx:8080/hubs/tatame` ou `https://api.judoo.com.br/hubs/tatame` |
| `VITE_API_URL_STAGING` | `http://194.163.xxx.xxx:8081/api` |
| `VITE_HUB_URL_STAGING` | `http://194.163.xxx.xxx:8081/hubs/tatame` |
| `VITE_API_URL_DEV` | `http://194.163.xxx.xxx:8082/api` |
| `VITE_HUB_URL_DEV` | `http://194.163.xxx.xxx:8082/hubs/tatame` |

---

## 🚀 Etapa 5: Testar o Deploy Automático

1. Faça qualquer commit na branch desejada ou force a execução manual:
   ```bash
   # Exemplo: deploy no ambiente de Desenvolvimento
   git checkout dev
   git commit --allow-empty -m "ci: testar deploy automatico na vps hostinger"
   git push origin dev
   ```

2. No GitHub, abra a aba **Actions**:
   - Você verá o workflow **"Judoo Web - CI/CD Pipeline (GCP Compute Engine VPS)"** sendo executado.
   - Estágios:
     1. **Build (React 18 + Vite & Docker)**
     2. **Testes Unitários (Vitest)**
     3. **Testes de Integração (Vitest)**
     4. **Deploy SSH na VPS Hostinger**

3. Acesse a aplicação no seu navegador:
   - **Produção**: `http://SEU_IP_HOSTINGER:3000`
   - **Homologação**: `http://SEU_IP_HOSTINGER:3001`
   - **Desenvolvimento**: `http://SEU_IP_HOSTINGER:3002`

---

## 🔍 Comandos Úteis na VPS Hostinger

```bash
# Ver containers rodando (Produção, Homolog e Dev)
docker ps

# Ver logs da aplicação em tempo real
docker logs -f judoo-web-prod
docker logs -f judoo-web-homolog
docker logs -f judoo-web-dev

# Reiniciar um ambiente
docker restart judoo-web-prod
```
