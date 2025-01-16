# Guide d'Intégration API

## 1. Obtenir votre Clé API

1. Connectez-vous à votre compte sur https://app.reports.com
2. Allez dans Settings > API Keys
3. Cliquez sur "Generate New API Key"
4. Conservez précieusement votre clé : elle ne sera plus jamais affichée

## 2. Authentification

Incluez votre clé API dans chaque requête avec le header :
```http
Authorization: Bearer YOUR_API_KEY
```

Exemple avec cURL :
```bash
curl -X GET "https://api.reports.com/v1/reports" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json"
```

## 3. Exemples d'Intégration

### JavaScript/Node.js
```javascript
const ReportsAPI = require('reports-api-client');

const client = new ReportsAPI({
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // ou 'sandbox' pour les tests
});

// Créer un rapport
async function createReport() {
  try {
    const report = await client.reports.create({
      name: 'Monthly Analytics',
      type: 'analytics',
      config: {
        period: '1M',
        metrics: ['views', 'revenue']
      }
    });
    console.log(report.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Programmer un rapport
async function scheduleReport(reportId) {
  try {
    const schedule = await client.reports.schedule({
      reportId: reportId,
      frequency: 'weekly',
      dayOfWeek: 1, // Lundi
      recipients: ['team@company.com']
    });
    console.log(schedule.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Python
```python
from reports_api import ReportsClient

client = ReportsClient(
    api_key='YOUR_API_KEY',
    environment='production'
)

# Créer un rapport
def create_report():
    try:
        report = client.reports.create(
            name='Monthly Analytics',
            type='analytics',
            config={
                'period': '1M',
                'metrics': ['views', 'revenue']
            }
        )
        return report.id
    except Exception as e:
        print(f'Error: {str(e)}')

# Programmer un rapport
def schedule_report(report_id):
    try:
        schedule = client.reports.schedule(
            report_id=report_id,
            frequency='weekly',
            day_of_week=1,  # Lundi
            recipients=['team@company.com']
        )
        return schedule.id
    except Exception as e:
        print(f'Error: {str(e)}')
```

### PHP
```php
<?php
require_once 'vendor/autoload.php';

use Reports\Client;

$client = new Client([
    'api_key' => 'YOUR_API_KEY',
    'environment' => 'production'
]);

// Créer un rapport
function createReport() {
    try {
        $report = $client->reports->create([
            'name' => 'Monthly Analytics',
            'type' => 'analytics',
            'config' => [
                'period' => '1M',
                'metrics' => ['views', 'revenue']
            ]
        ]);
        return $report->id;
    } catch (Exception $e) {
        echo 'Error: ' . $e->getMessage();
    }
}

// Programmer un rapport
function scheduleReport($reportId) {
    try {
        $schedule = $client->reports->schedule([
            'report_id' => $reportId,
            'frequency' => 'weekly',
            'day_of_week' => 1, // Lundi
            'recipients' => ['team@company.com']
        ]);
        return $schedule->id;
    } catch (Exception $e) {
        echo 'Error: ' . $e->getMessage();
    }
}
```

## 4. Gestion des Erreurs

```javascript
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset": "2024-01-10T21:00:00Z"
    }
  }
}
```

Codes d'erreur communs :
- `401`: Clé API invalide
- `403`: Permission refusée
- `429`: Rate limit dépassé
- `402`: Limite du plan atteinte

## 5. Bonnes Pratiques

1. **Sécurité**
   - Ne partagez JAMAIS votre clé API
   - Utilisez des variables d'environnement
   - Rotez régulièrement vos clés

2. **Performance**
   - Mettez en cache les réponses
   - Utilisez la pagination
   - Gérez les rate limits

3. **Monitoring**
   - Loggez les erreurs
   - Surveillez l'usage
   - Configurez des alertes

## 6. Webhooks

Configuration :
```javascript
const webhook = await client.webhooks.create({
  url: 'https://your-server.com/webhook',
  events: ['report.completed', 'report.failed'],
  secret: 'your_webhook_secret'
});
```

## 7. Support

- Documentation : https://docs.reports.com
- Support : support@reports.com
- Status : https://status.reports.com
