import { Request, Response } from "express";
import userService from "../services/UserService";
import { UserAttributes } from "../models/User";
import User from "../models/User";
import bcrypt from "bcrypt";

class UserController {
    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Cria um novo usuário
     *     tags: [Usuários]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/User'
     *     responses:
     *       201:
     *         description: Usuário criado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Dados inválidos
     *       409:
     *         description: Email já cadastrado
     */
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

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Retorna a lista de todos os usuários
     *     tags: [Usuários]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de usuários
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/User'
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userService.getAllUsers();
            return res.json(users);
        } catch (error: any) {
            console.error("Erro ao obter usuários:", error);
            return res.status(500).json({ message: "Erro ao obter os usuários", error: error.message });
        }
    }

    /**
     * @swagger
     * /users/{id}:
     *   delete:
     *     summary: Deleta um usuário pelo ID
     *     tags: [Usuários]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID do usuário
     *     responses:
     *       204:
     *         description: Usuário deletado com sucesso
     *       404:
     *         description: Usuário não encontrado
     */
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

    /**
     * @swagger
     * /users/{id}:
     *   patch:
     *     summary: Atualiza dados de um usuário
     *     tags: [Usuários]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID do usuário
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/User'
     *     responses:
     *       200:
     *         description: Usuário atualizado com sucesso
     *       404:
     *         description: Usuário não encontrado
     */
    async updateUser(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.id, 10);
            const userAuthenticatedId = (req as any).user.id;
            const { name, email, currentPassword, newPassword } = req.body;

            // Validação Básica
            if (isNaN(userId) || userId !== userAuthenticatedId) {
                return res.status(403).json({ message: "Acesso negado. Você só pode alterar o seu próprio perfil." });
            }

            if (!currentPassword) {
                return res.status(400).json({ message: "A senha atual é obrigatória para salvar as alterações." });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            // Trava de Segurança
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "A senha atual está incorreta." });
            }

            // Validação de Email
            if (email && email !== user.email) {
                const emailExists = await User.findOne({ where: { email } });
                if (emailExists) {
                    return res.status(409).json({ message: "Este email já está sendo utilizado por outra conta." });
                }
            }

            const updateData: any = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;

            if (newPassword) {
                // hash manualmente, desligar os hoos do banco
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(newPassword, salt);
            }

            // Salva direto no banco desligando os hooks
            await User.update(updateData, {
                where: { id: userId },
                hooks: false
            });

            // 6. Busca os dados para devolver ao Frontend
            const updatedUser = await User.findByPk(userId);

            return res.status(200).json({ 
                message: "Perfil atualizado com sucesso!",
                user: { id: updatedUser?.id, name: updatedUser?.name, email: updatedUser?.email }
            });

        } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error);
            return res.status(500).json({ message: "Erro interno ao atualizar perfil", error: error.message });
        }
    }
}

export default new UserController();