# Script PowerShell pour l'installation du système de rapports

# Fonctions d'aide
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

Write-ColorOutput Green "Installation du système de rapports..."

# Vérifier les prérequis
Write-ColorOutput Yellow "`nVérification des prérequis..."

# Node.js
if (-not (Test-Command node)) {
    Write-ColorOutput Red "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
}

# npm
if (-not (Test-Command npm)) {
    Write-ColorOutput Red "npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
}

# PostgreSQL
if (-not (Test-Command psql)) {
    Write-ColorOutput Red "PostgreSQL n'est pas installé. Veuillez l'installer d'abord."
    exit 1
}

# Redis
if (-not (Test-Command redis-cli)) {
    Write-ColorOutput Red "Redis n'est pas installé. Veuillez l'installer d'abord."
    exit 1
}

Write-ColorOutput Green "Tous les prérequis sont satisfaits."

# Installation des dépendances
Write-ColorOutput Yellow "`nInstallation des dépendances..."
npm install

# Configuration
Write-ColorOutput Yellow "`nConfiguration de l'environnement..."
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-ColorOutput Green "Fichier .env créé. Veuillez le configurer avec vos paramètres."
}

# Base de données
Write-ColorOutput Yellow "`nConfiguration de la base de données..."
npm run db:create
npm run db:migrate
npm run db:seed

# Build
Write-ColorOutput Yellow "`nBuild du projet..."
npm run build

# Tests
Write-ColorOutput Yellow "`nExécution des tests..."
npm test

Write-ColorOutput Green "`nInstallation terminée !"
Write-Output "`nPour démarrer le projet :"
Write-Output "1. Vérifiez la configuration dans le fichier .env"
Write-ColorOutput Yellow "2. Lancez le serveur de développement : npm run dev"
Write-ColorOutput Yellow "3. Ou lancez le serveur de production : npm start"
Write-ColorOutput Green "`nL'application sera accessible à : http://localhost:3000"
