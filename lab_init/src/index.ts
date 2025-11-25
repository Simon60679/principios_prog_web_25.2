import express, { Request, Response } from "express";
import dotenv from "dotenv";
import sequelize from "./config/database";
import userRepository from "./repositories/UserRepository";

dotenv.config();

const app = express();
app.use(express.json());

// Rota para criar usuário
app.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validação básica de entrada
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nome, email e senha são obrigatórios." });
    }

    const user = await userRepository.createUser({ name, email, password });
    return res.status(201).json(user);
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return res
      .status(500)
      .json({ message: "Erro ao criar o usuário", error: error.message });
  }
});

// Rota para listar usuários
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await userRepository.getAllUsers();
    return res.json(users);
  } catch (error: any) {
    console.error("Erro ao obter usuários:", error);
    return res
      .status(500)
      .json({ message: "Erro ao obter os usuários", error: error.message });
  }
});

// Sincronizar banco e subir servidor
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ force: true }) // CUIDADO: apaga e recria as tabelas a cada reinicialização!
  .then(() => {
    console.log("Banco de dados conectado e sincronizado!");
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
  });
