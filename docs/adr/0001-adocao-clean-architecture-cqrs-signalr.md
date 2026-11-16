# ADR-0001: Adoção de Clean Architecture, CQRS e SignalR para Torneios em Tempo Real

* **Status**: Aceito (Accepted)
* **Decisores**: Equipe de Arquitetura Judoo
* **Data**: 2026-11-14 (Marco M1/M4)
* **Padrão**: MADR 3.0.0 (Markdown Architectural Decision Records)

---

## Contexto e Declaração do Problema

A gestão de campeonatos oficiais de Judô segundo as regras da **Federação Internacional de Judô (FIJ)** exige controle milimétrico e simultâneo de múltiplos eventos de alta criticidade:
1. **Cronômetros Oficiais**: O combate principal (4 min) e o cronômetro de imobilização (*Osaekomi*, 10 a 20s) exigem latência zero na mesa do tatame (`juddo-desktop`) e sincronização imediata com os telões da arena (`juddo-web`) e transmissões ao vivo.
2. **Regras Estritas de Pontuação**: Aplicação instantânea de regras complexas (conversão de 2º *Waza-ari* em *Waza-ari-awasete-ippon*, 3º *Shido* em *Hansoku-make*, transição para *Golden Score* e pontuação *Yuko*).
3. **Escalabilidade e Concorrência**: Múltiplos tatames operando simultaneamente, centenas de atletas em pesagem na Secretaria e milhares de espectadores acessando as chaves eliminatórias.

Precisamos de uma arquitetura que desacople as regras de negócio das tecnologias de apresentação e banco, garanta baixa latência de rede e permita escalabilidade horizontal.

---

## Direcionadores de Decisão (Decision Drivers)

* **RF01**: Latência inferior a 100ms na propagação de pontos e cronômetro do tatame para os telões.
* **RF02**: Operação offline/resiliente da mesa do mesário à beira do tatame sem travamento de navegador.
* **RNF01 (SOLID & Testabilidade)**: Isolamento total das regras de domínio da FIJ para permitir 100% de cobertura por testes unitários sem dependência de banco de dados ou HTTP.
* **RNF02 (Desempenho)**: Leitura rápida de placares e chaves sem concorrência com as transações de escrita.

---

## Opções Consideradas

1. **Opção 1**: Monólito Tradicional MVC com HTTP Polling curto (requisições a cada 1 segundo).
2. **Opção 2**: Arquitetura orientada a microsserviços distribuídos com mensageria assíncrona (RabbitMQ/Kafka).
3. **Opção 3**: Clean Architecture com CQRS (`MediatR`), persistência híbrida (EF Core + Dapper), WebSockets bidirecionais (`ASP.NET Core SignalR`) e clientes desacoplados (React 18 SPA + Tauri Nativo).

---

## Resultado da Decisão (Decision Outcome)

Opção escolhida: **Opção 3 — Clean Architecture + CQRS + SignalR + React/Tauri**, porque:
- O **SignalR** fornece conexão persistente WebSocket com fallback automático, entregando eventos de tatame com latência de poucos milissegundos para telões e clientes web.
- O padrão **CQRS (Command Query Responsibility Segregation)** separa claramente:
  - **Commands (Escrita)**: Executados via Entity Framework Core, validando regras de domínio, transações e consistência estrita de chaves e pontuação.
  - **Queries (Leitura)**: Executadas via Dapper com queries SQL puras otimizadas, entregando placares em microssegundos sem overhead de rastreamento de entidades.
- A **Clean Architecture** garante aderência rigorosa ao **SOLID**:
  - `Judoo.Domain`: Totalmente puro (sem dependências externas), contendo as entidades de Luta, Placar, Atleta e regras da FIJ.
  - `Judoo.Application`: Casos de uso isolados em Handlers individuais via `MediatR` (Single Responsibility Principle).
  - `Judoo.Infrastructure`: Detalhes de persistência e comunicação (EF Core, Dapper, SignalR Hub, JWT).
  - `Judoo.Api`: Apenas entrega HTTP e orquestração de rotas.

### Consequências Positivas

* **Latência Sub-segundo**: Eventos de pontuação e cronômetro refletem instantaneamente no telão da arena via SignalR.
* **Testabilidade do Domínio**: Regras de *Ippon*, *Waza-ari*, *Golden Score* e *Shido* testadas isoladamente com tempo de execução em milissegundos.
* **Flexibilidade de Clientes**: A mesma API e hub atendem ao portal Web (`juddo-web`) e ao app desktop nativo dos mesários (`juddo-desktop`).
* **Respeito aos SLOs**: Facilidade para manter o SLO de latência de leitura $p95 < 200ms$ graças ao Dapper.

### Consequências Negativas / Trade-offs

* Maior número de classes e arquivos devido à separação em camadas e DTOs de Command/Query.
* Necessidade de manter mapeamentos consistentes entre o modelo do EF Core e queries do Dapper.

---

## Avaliação Comparativa das Opções

### Opção 1: Monólito MVC com Polling HTTP
* Ruim: Gera sobrecarga desnecessária de conexões HTTP (dezenas de requisições por segundo por cliente).
* Ruim: Latência média de 1 a 2 segundos nos telões, inaceitável para transmissão de Judô em tempo real.

### Opção 2: Microsserviços com Mensageria
* Bom: Alta resiliência de nós independentes.
* Ruim: Complexidade operacional desproporcional para o escopo de um ginásio/evento esportivo, exigindo gerenciadores de brokers (Kafka/Zookeeper/RabbitMQ).

### Opção 3: Clean Architecture + CQRS + SignalR (Escolhida)
* Bom: Atende aos requisitos de tempo real da FIJ com complexidade controlada.
* Bom: Fácil implantação via Docker Compose com 1 comando.
