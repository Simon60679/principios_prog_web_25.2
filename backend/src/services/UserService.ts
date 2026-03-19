import userRepository from "../repository/UserRepository";
import cartRepository from "../repository/CartRepository";
import sequelize from "../config/database";
import { UserAttributes } from "../models/User";

class UserService {
    /**
     * Cria um novo usuário e inicializa seu carrinho de compras.
     * Utiliza uma transação para garantir que ambos sejam criados ou nenhum.
     * @param data - Dados do usuário (nome, email, senha).
     * @returns O usuário criado.
     */
    async createUser(data: { name: string, email: string, password: string }) {
        const t = await sequelize.transaction();

        try {
            const user = await userRepository.createUser(data, { transaction: t });

            await cartRepository.createCart({ userId: user.id }, { transaction: t });

            await t.commit();
            return user;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Recupera todos os usuários cadastrados.
     * @returns Lista de usuários.
     */
    async getAllUsers() {
        return await userRepository.getAllUsers();
    }

    /**
     * Remove um usuário pelo ID.
     * @param id - ID do usuário.
     * @returns True se deletado, False se não encontrado.
     */
    async deleteUser(id: number) {
        const user = await userRepository.findUserById(id);
        if (!user) {
            return false;
        }
        await userRepository.deleteUser(id);
        return true;
    }

    /**
     * Atualiza os dados de um usuário.
     * @param id - ID do usuário.
     * @param dataToUpdate - Objeto com os campos a atualizar.
     * @returns O usuário atualizado ou null se não encontrado.
     */
    async updateUser(id: number, dataToUpdate: Partial<UserAttributes>) {

        const userExists = await userRepository.findUserById(id);
        if (!userExists) {
            return null;
        }

        const affectedRows = await userRepository.updateUser(id, dataToUpdate);

        if (affectedRows > 0) {
            return await userRepository.findUserById(id);
        }

        return userExists;
    }
}

export default new UserService();