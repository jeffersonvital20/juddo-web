# Stage 1: Build da aplicação React + Vite
FROM node:20-alpine AS build
WORKDIR /app

# Argumento para o ambiente de compilação (development, staging, production)
ARG BUILD_MODE=production

# Copia manifests e instala dependências
COPY package.json package-lock.json ./
RUN npm ci

# Copia código-fonte e compila de acordo com o ambiente
COPY . .
RUN if [ "$BUILD_MODE" = "staging" ]; then npm run build:staging; \
    elif [ "$BUILD_MODE" = "development" ]; then npm run build:dev; \
    else npm run build:prod; fi

# Stage 2: Servidor Web Nginx de Alta Performance
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
