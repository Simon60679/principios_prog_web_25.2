import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

/**
 * Instância do Sequelize configurada para conexão com o banco de dados.
 * Utiliza variáveis de ambiente para definir as credenciais e parâmetros de conexão.
 */
const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize({
  dialect: isTest ? 'sqlite' : ((process.env.DB_DIALECT as "postgres" | "mysql") || "postgres"),
  storage: isTest ? ':memory:' : undefined,
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: false
});

export default sequelize;
