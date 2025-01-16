import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');

// Configuration des scénarios de charge
export const options = {
  scenarios: {
    // Test de charge constant
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
    // Test de montée en charge
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
    // Test de pics de charge
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 10 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% des requêtes sous 1s
    'http_req_duration{type:template_preview}': ['p(95)<2000'], // Prévisualisations sous 2s
    'http_req_duration{type:report_generation}': ['p(95)<5000'], // Génération sous 5s
    errors: ['rate<0.1'], // Moins de 10% d'erreurs
  },
};

// Paramètres de test
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

// Données de test
const TEST_TEMPLATE = {
  name: 'Load Test Template',
  type: 'works',
  config: {
    sections: [
      {
        type: 'summary',
        metrics: ['total_works', 'new_works']
      },
      {
        type: 'chart',
        chartType: 'line',
        data: { query: 'works_trend' }
      }
    ],
    filters: { period: '1M' }
  }
};

// Configuration des requêtes
const params = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
};

// Fonctions utilitaires
function checkResponse(response, checkName) {
  const checks = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000
  });
  errorRate.add(!checks);
}

// Scénario principal
export default function () {
  // 1. Créer un modèle
  const createTemplateResponse = http.post(
    `${BASE_URL}/api/report-templates`,
    JSON.stringify(TEST_TEMPLATE),
    params
  );
  checkResponse(createTemplateResponse, 'create_template');
  const templateId = createTemplateResponse.json('id');

  // 2. Prévisualiser le modèle
  const previewResponse = http.get(
    `${BASE_URL}/api/report-templates/${templateId}/preview`,
    { ...params, tags: { type: 'template_preview' } }
  );
  checkResponse(previewResponse, 'preview_template');

  // 3. Créer un rapport programmé
  const scheduleResponse = http.post(
    `${BASE_URL}/api/scheduled-reports`,
    JSON.stringify({
      name: 'Load Test Schedule',
      template_id: templateId,
      cron: '0 9 * * *',
      recipients: ['test@example.com']
    }),
    params
  );
  checkResponse(scheduleResponse, 'create_schedule');
  const scheduleId = scheduleResponse.json('id');

  // 4. Générer un rapport
  const generateResponse = http.post(
    `${BASE_URL}/api/scheduled-reports/${scheduleId}/execute`,
    null,
    { ...params, tags: { type: 'report_generation' } }
  );
  checkResponse(generateResponse, 'generate_report');

  // 5. Lister les rapports avec filtres
  const listResponse = http.get(
    `${BASE_URL}/api/scheduled-reports?type=works&status=active&page=1&limit=20`,
    params
  );
  checkResponse(listResponse, 'list_reports');

  // Pause entre les itérations
  sleep(1);
}

// Nettoyage après les tests
export function teardown() {
  // Supprimer les données de test si nécessaire
  const cleanupResponse = http.post(
    `${BASE_URL}/api/test/cleanup`,
    null,
    params
  );
  console.log('Cleanup status:', cleanupResponse.status);
}
