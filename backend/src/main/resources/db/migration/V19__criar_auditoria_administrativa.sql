CREATE TABLE auditoria_administrativa (
    id BIGSERIAL PRIMARY KEY,
    acao VARCHAR(80) NOT NULL,
    usuario_id BIGINT NULL,
    usuario_login VARCHAR(80) NOT NULL,
    detalhes VARCHAR(500) NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auditoria_administrativa_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE SET NULL
);

CREATE INDEX idx_auditoria_administrativa_acao
ON auditoria_administrativa(acao);

CREATE INDEX idx_auditoria_administrativa_data_hora
ON auditoria_administrativa(data_hora);
