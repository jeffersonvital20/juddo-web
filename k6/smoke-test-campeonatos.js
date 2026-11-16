import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================================
// JUDOO API - K6 SMOKE TEST COM MEDIÇÃO DE SLO (p95 < 200ms)
// Critério M4: OpenAPI do endpoint principal e 1 smoke test k6 com p95 medido
// ============================================================================

export const options = {
  // Cenário de Smoke Test: Carga mínima para validar estabilidade e latência
  vus: 5,
  duration: '30s',
  thresholds: {
    // SLO 1: 95% das requisições devem responder em menos de 200ms (p95 medido)
    http_req_duration: ['p(95)<200'],
    // Taxa de falhas deve ser inferior a 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export default function () {
  // 1. Smoke test do endpoint principal: Listagem de Campeonatos
  const resCampeonatos = http.get(`${BASE_URL}/api/campeonatos`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-smoke-test-judoo',
    },
  });

  check(resCampeonatos, {
    'status é 200 (OK)': (r) => r.status === 200,
    'tempo de resposta p95 abaixo do limiar': (r) => r.timings.duration < 200,
  });

  // 2. Smoke test do endpoint de Health Check & Métricas
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    'health check status é 200': (r) => r.status === 200,
  });

  sleep(1);
}
