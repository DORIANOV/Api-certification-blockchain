-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des œuvres
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id),
    metadata_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des distributions de royalties
CREATE TABLE royalty_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT REFERENCES works(token_id),
    recipient_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les rapports programmés
CREATE TABLE scheduled_reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'works', 'royalties', 'analytics'
    schedule VARCHAR(50) NOT NULL, -- Expression cron
    filters JSONB DEFAULT '{}',
    recipients TEXT[] NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Table pour les modèles de rapports
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT false -- true pour les modèles système, false pour les modèles utilisateur
);

-- Index pour améliorer les performances
CREATE INDEX idx_works_creator ON works(creator_id);
CREATE INDEX idx_royalty_distributions_token ON royalty_distributions(token_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_scheduled_reports_type ON scheduled_reports(type);
CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_templates_type ON report_templates(type);
CREATE INDEX idx_report_templates_system ON report_templates(is_system);

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_works_updated_at
    BEFORE UPDATE ON works
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion des modèles système par défaut
INSERT INTO report_templates (name, description, type, config, is_system) VALUES
(
    'Rapport mensuel des œuvres',
    'Vue d''ensemble mensuelle des nouvelles œuvres et leurs performances',
    'works',
    '{
        "sections": [
            {
                "type": "summary",
                "title": "Résumé",
                "metrics": ["total_works", "new_works", "total_royalties"]
            },
            {
                "type": "chart",
                "title": "Distribution par catégorie",
                "chartType": "pie",
                "data": {
                    "query": "category_distribution"
                }
            },
            {
                "type": "table",
                "title": "Top 10 des œuvres",
                "columns": ["title", "creator", "royalties", "created_at"],
                "sort": {"column": "royalties", "direction": "desc"},
                "limit": 10
            }
        ],
        "filters": {
            "period": "1M"
        }
    }',
    true
),
(
    'Rapport de distribution des royalties',
    'Analyse détaillée des distributions de royalties',
    'royalties',
    '{
        "sections": [
            {
                "type": "summary",
                "title": "Résumé",
                "metrics": ["total_amount", "total_distributions", "unique_recipients"]
            },
            {
                "type": "chart",
                "title": "Tendance des distributions",
                "chartType": "line",
                "data": {
                    "query": "royalties_trend"
                }
            },
            {
                "type": "table",
                "title": "Dernières distributions",
                "columns": ["date", "work", "amount", "recipient"],
                "sort": {"column": "date", "direction": "desc"},
                "limit": 20
            }
        ],
        "filters": {
            "period": "1M",
            "minAmount": 0
        }
    }',
    true
),
(
    'Rapport d''analyse des tendances',
    'Analyse approfondie des tendances et métriques clés',
    'analytics',
    '{
        "sections": [
            {
                "type": "summary",
                "title": "Métriques clés",
                "metrics": ["active_users", "new_registrations", "total_volume"]
            },
            {
                "type": "chart",
                "title": "Activité utilisateur",
                "chartType": "bar",
                "data": {
                    "query": "user_activity"
                }
            },
            {
                "type": "chart",
                "title": "Volume des transactions",
                "chartType": "line",
                "data": {
                    "query": "transaction_volume"
                }
            },
            {
                "type": "table",
                "title": "Top créateurs",
                "columns": ["creator", "works", "royalties", "followers"],
                "sort": {"column": "royalties", "direction": "desc"},
                "limit": 10
            }
        ],
        "filters": {
            "period": "1M"
        }
    }',
    true
);
