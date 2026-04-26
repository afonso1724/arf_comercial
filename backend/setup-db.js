const { db } = require('./db');

const createNotificacoesTable = `
    CREATE TABLE IF NOT EXISTS notificacoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tipo VARCHAR(50),
        descricao TEXT,
        admin_id INT,
        cliente_id INT,
        venda_id INT,
        criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lida BOOLEAN DEFAULT 0,
        FOREIGN KEY (admin_id) REFERENCES usuarios(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (venda_id) REFERENCES vendas(id)
    )
`;

db.query(createNotificacoesTable, (err) => {
    if (err) console.error(err.message);
    else console.log('OK');
    db.end();
});
