# Guide Développeur

## Prérequis

1. **Node.js & npm**
   - Node.js v16 ou supérieur
   - npm v7 ou supérieur

2. **Base de données**
   - PostgreSQL v13+
   - Redis v6+

3. **Autres outils**
   - Git
   - VS Code (recommandé)

## Installation Rapide

```bash
# 1. Cloner le repo
git clone <repository-url>
cd folder-5

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Initialiser la base de données
npm run db:create
npm run db:migrate
npm run db:seed

# 5. Lancer en développement
npm run dev

# OU en production
npm run build
npm start
```

## Structure du Projet

```
folder-5/
├── src/
│   ├── api/           # Routes API
│   ├── services/      # Services métier
│   ├── models/        # Modèles de données
│   └── utils/         # Utilitaires
├── tests/
│   ├── unit/         # Tests unitaires
│   ├── integration/  # Tests d'intégration
│   └── security/     # Tests de sécurité
└── docs/            # Documentation
```

## Scripts Disponibles

```bash
# Développement
npm run dev          # Lance le serveur de dev
npm run test        # Lance tous les tests
npm run lint        # Vérifie le code
npm run format      # Formate le code

# Base de données
npm run db:create   # Crée la base de données
npm run db:migrate  # Lance les migrations
npm run db:seed     # Remplit avec des données de test

# Production
npm run build       # Build le projet
npm start          # Lance en production
```

## Configuration

Fichier `.env` requis :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reports_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=1h

# API
PORT=3000
NODE_ENV=development
```

## Tests

```bash
# Tous les tests
npm test

# Tests spécifiques
npm run test:unit
npm run test:integration
npm run test:security
```

## Docker

```bash
# Lancer avec Docker
docker-compose up -d

# Arrêter
docker-compose down
```

## Développement Local

1. **API Documentation**
   ```
   http://localhost:3000/api-docs
   ```

2. **Monitoring**
   ```
   http://localhost:3000/metrics
   ```

3. **Health Check**
   ```
   http://localhost:3000/health
   ```

## Débogage

1. **Logs**
   ```bash
   # Voir les logs
   npm run logs

   # Logs en temps réel
   npm run logs:watch
   ```

2. **Debug Mode**
   ```bash
   # Lancer en mode debug
   npm run dev:debug
   ```


## Support Développeur

- Documentation : `/docs`
- Issues : GitHub Issues
- Chat : Slack Channel
