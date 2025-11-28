CREATE TABLE paciente (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    data_nascimento TEXT NOT NULL,
    historico_medico TEXT,
    senha TEXT NOT NULL,
    endereco TEXT
);

CREATE TABLE cuidador (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    data_nascimento TEXT NOT NULL,
    especialidade TEXT,
    senha TEXT NOT NULL
);

CREATE TABLE batimento (
    id SERIAL PRIMARY KEY,
    batimento INTEGER,
    hora TEXT
);


CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    paciente_email VARCHAR(255) NOT NULL,
    cuidador_email VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(50) DEFAULT 'push',
    lida BOOLEAN DEFAULT FALSE
);