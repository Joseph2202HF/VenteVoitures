-- AutoGest - Schema PostgreSQL
CREATE TABLE IF NOT EXISTS client (
    idcli   VARCHAR(20) PRIMARY KEY,
    nom     VARCHAR(100) NOT NULL,
    contact VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS voiture (
    idvoit  VARCHAR(20) PRIMARY KEY,
    design  VARCHAR(100) NOT NULL,
    prix    BIGINT NOT NULL,
    nombre  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS achat (
    numachat VARCHAR(20) PRIMARY KEY,
    idcli    VARCHAR(20) NOT NULL REFERENCES client(idcli),
    idvoit   VARCHAR(20) NOT NULL REFERENCES voiture(idvoit),
    date     DATE NOT NULL,
    qte      INT NOT NULL DEFAULT 1
);

-- Table facture
CREATE TABLE IF NOT EXISTS facture (
    numfact    VARCHAR(20) PRIMARY KEY,
    idcli      VARCHAR(20) NOT NULL REFERENCES client(idcli),
    datefact   DATE NOT NULL DEFAULT CURRENT_DATE,
    montant    BIGINT NOT NULL DEFAULT 0,
    statut     VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
        CHECK (statut IN ('EN_ATTENTE', 'PAYEE', 'ANNULEE'))
);

-- Table de liaison facture <-> achat
CREATE TABLE IF NOT EXISTS ligne_facture (
    idligne    SERIAL PRIMARY KEY,
    numfact    VARCHAR(20) NOT NULL REFERENCES facture(numfact) ON DELETE CASCADE,
    numachat   VARCHAR(20) NOT NULL REFERENCES achat(numachat),

    CONSTRAINT uq_achat_facture UNIQUE(numachat)
);

-- Données de test
INSERT INTO client VALUES ('C001','NJIVASON Eric','034 12 543 11'),('C002','RAKOTO Jean','033 45 678 90') ON CONFLICT DO NOTHING;
INSERT INTO voiture VALUES ('V001','MITSUBISHI PAJERO',40000000,5),('V002','PEUGEOT 308',5000000,10),('V003','TOYOTA HILUX',35000000,3) ON CONFLICT DO NOTHING;
INSERT INTO achat VALUES ('ACH001','C001','V001','2024-01-15',1),('ACH002','C001','V002','2024-02-20',2),('ACH003','C002','V003','2024-03-10',1) ON CONFLICT DO NOTHING;
