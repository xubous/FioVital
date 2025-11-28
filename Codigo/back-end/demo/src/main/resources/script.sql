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


CREATE TABLE alerta (
    id SERIAL PRIMARY KEY,
    paciente_id TEXT NOT NULL,
    cuidador_id TEXT NOT NULL,
    bpm TEXT NOT NULL,
    tipo TEXT NOT NULL,
    mensagem TEXT,             
    lido TEXT NOT NULL,
    criado_em TEXT NOT NULL
);
