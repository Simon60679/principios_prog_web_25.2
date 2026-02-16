// Força o ambiente de teste antes de carregar qualquer outra coisa
process.env.NODE_ENV = 'test';

console.log("Ambiente de teste configurado: SQLite em memória");