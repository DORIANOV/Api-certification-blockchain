# API Publique - Documentation

## Authentication

```bash
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh-token
```

## Reports

```bash
# Création et gestion
POST   /api/v1/reports
GET    /api/v1/reports
GET    /api/v1/reports/:id
PUT    /api/v1/reports/:id
DELETE /api/v1/reports/:id

# Programmation
POST   /api/v1/reports/schedule
GET    /api/v1/reports/scheduled
DELETE /api/v1/reports/schedule/:id

# Export
GET    /api/v1/reports/:id/export
```

## Templates

```bash

GET    /api/v1/templates
GET    /api/v1/templates/:id

POST   /api/v1/templates/custom
PUT    /api/v1/templates/custom/:id
```

## Usage & Limites

```bash
GET    /api/v1/usage/current
GET    /api/v1/usage/history
GET    /api/v1/limits
```

## Webhook Notifications

```bash
POST   /api/v1/webhooks/configure
GET    /api/v1/webhooks/status
```

## Rate Limits

- Free: 100 requêtes/heure
- Pro: 1000 requêtes/heure
- Enterprise: 10000 requêtes/heure
- A modifier selon le prix de la requete sur en utilisant polygon

## Formats de Réponse

```json
{
  "success": true,
  "data": {},
  "meta": {
    "usage": {
      "current": 45,
      "limit": 100
    }
  }
}
```

## Codes d'Erreur

- 429: Rate limit exceeded
- 402: Payment required
- 403: Plan limitation
- 401: Authentication required
