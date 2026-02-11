import userRepository from "../repository/UserRepository";
import cartRepository from "../repository/CartRepository";
import sequelize from "../config/database";
import { UserAttributes } from "../models/User";

class UserService {
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

    async getAllUsers() {
        return await userRepository.getAllUsers();
    }

    async deleteUser(id: number) {
        const user = await userRepository.findUserById(id);
        if (!user) {
            return false;
        }
        await userRepository.deleteUser(id);
        return true;
    }

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