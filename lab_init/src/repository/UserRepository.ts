import User, { UserCreationAttributes } from "../models/User";
import { UserAttributes } from "../models/User";
import { Transaction } from "sequelize";

export class UserRepository {
  async createUser(user: UserCreationAttributes, options?: { transaction?: Transaction }) {
    return await User.create(user, options);
  }

  async getAllUsers() {
    return await User.findAll();
  }

  async findUserByEmail(email: string) {
    return await User.findOne({ where: { email } });
  }

  async findUserById(id: number) {
    return await User.findByPk(id);
  }

  async deleteUser(id: number) {
    return await User.destroy({ where: { id } });
  }

  async updateUser(id: number, dataToUpdate: Partial<UserAttributes>) {
    delete dataToUpdate.id;

    const [affectedRows] = await User.update(dataToUpdate, {
      where: { id: id }
    });

    return affectedRows;
  }
}

export default new UserRepository();
