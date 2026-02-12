import { Model, DataTypes, Optional } from "sequelize";
import User from "./User";
import CartItem from "./CartItem";
import sequelize from "../config/database";

export interface ProductAttributes {
  id: number;
  userId: number;
  name: string;
  price: number;
  stock: number;
  description: string;
}

export interface ProductCreationAttributes
  extends Optional<ProductAttributes, "id" | "stock"> { }

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do produto
 *         userId:
 *           type: integer
 *           description: ID do vendedor (usuário)
 *         name:
 *           type: string
 *           description: Nome do produto
 *         price:
 *           type: number
 *           format: float
 *           description: Preço do produto
 *         stock:
 *           type: integer
 *           description: Quantidade em estoque
 *         description:
 *           type: string
 *           description: Descrição do produto
 *       example:
 *         id: 1
 *         userId: 1
 *         name: "Notebook Gamer"
 *         price: 4500.00
 *         stock: 10
 *         description: "Notebook de alta performance"
 */
export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public price!: number;
  public stock!: number;
  public description!: string;
  public readonly User?: User;
  public readonly seller?: User;
  public readonly CartItems?: CartItem[];
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "products",
    timestamps: false,
  }
);

export default Product;
