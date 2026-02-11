import { Request, Response } from "express";
import userService from "../services/UserService";
import { UserAttributes } from "../models/User";

class UserController {
    async createUser(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ message: "Nome, email e senha são obrigatórios." });
            }

            const user = await userService.createUser({ name, email, password });
            return res.status(201).json(user);
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: "Este email já está cadastrado." });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ message: "Erro de validação", errors: error.errors.map((e: any) => e.message) });
            }
            return res.status(500).json({ message: "Erro ao criar o usuário", error: error.message });
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userService.getAllUsers();
            return res.json(users);
        } catch (error: any) {
            console.error("Erro ao obter usuários:", error);
            return res.status(500).json({ message: "Erro ao obter os usuários", error: error.message });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "ID inválido." });
            }

            const deleted = await userService.deleteUser(id);
            if (!deleted) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            return res.status(204).send();
        } catch (error: any) {
            console.error("Erro ao deletar usuário:", error);
            return res.status(500).json({ message: "Erro ao deletar o usuário", error: error.message });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id, 10);
            const dataToUpdate: Partial<UserAttributes> = req.body;

            if (isNaN(id)) {
                return res.status(400).json({ message: "ID de usuário inválido." });
            }

            if (Object.keys(dataToUpdate).length === 0) {
                return res.status(400).json({ message: "Corpo da requisição vazio. Forneça dados para atualização." });
            }

            const updatedUser = await userService.updateUser(id, dataToUpdate);

            if (updatedUser === null) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            return res.status(200).json({
                message: "Dados do usuário atualizados com sucesso.",
                user: updatedUser
            });

        } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error);
            return res.status(500).json({ message: "Erro interno ao atualizar usuário", error: error.message });
        }
    }
}

export default new UserController();