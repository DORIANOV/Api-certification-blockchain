#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Installation du système de rapports...${NC}"

# Vérifier les prérequis
echo -e "\n${YELLOW}Vérification des prérequis...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}Redis n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

echo -e "${GREEN}Tous les prérequis sont satisfaits.${NC}"

# Installation des dépendances
echo -e "\n${YELLOW}Installation des dépendances...${NC}"
npm install

# Configuration
echo -e "\n${YELLOW}Configuration de l'environnement...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}Fichier .env créé. Veuillez le configurer avec vos paramètres.${NC}"
fi

# Base de données
echo -e "\n${YELLOW}Configuration de la base de données...${NC}"
npm run db:create
npm run db:migrate
npm run db:seed

# Build
echo -e "\n${YELLOW}Build du projet...${NC}"
npm run build

# Tests
echo -e "\n${YELLOW}Exécution des tests...${NC}"
npm test

echo -e "\n${GREEN}Installation terminée !${NC}"
echo -e "\nPour démarrer le projet :"
echo -e "1. Vérifiez la configuration dans le fichier .env"
echo -e "2. Lancez le serveur de développement : ${YELLOW}npm run dev${NC}"
echo -e "3. Ou lancez le serveur de production : ${YELLOW}npm start${NC}"
echo -e "\nL'application sera accessible à : ${GREEN}http://localhost:3000${NC}"
