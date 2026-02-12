import { Model, DataTypes, Optional } from "sequelize";
import User from "./User";
import CartItem from "./CartItem";
import sequelize from "../config/database";

export interface CartAttributes {
  userId: number;
}

export interface CartCreationAttributes { }

/**
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID do usuário dono do carrinho
 *       example:
 *         userId: 1
 */
export class Cart
  extends Model<CartAttributes, CartCreationAttributes>
  implements CartAttributes {
  public userId!: number;
  public readonly User?: User;
  public readonly CartItems?: CartItem[];
  public readonly items?: CartItem[];
}

Cart.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      }
    }
  },
  {
    sequelize,
    tableName: "carts",
    timestamps: false,
  }
);

export default Cart;