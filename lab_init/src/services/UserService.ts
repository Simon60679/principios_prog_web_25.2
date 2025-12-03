import userRepository from "../repositories/UserRepository";

class UserService {
    async createUser(data: { name: string, email: string, password: string }) {
        // Validação de regras de negócio (ex: verificar se o email já existe)
        // ...
        
        return await userRepository.createUser(data);
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
}

export default new UserService();