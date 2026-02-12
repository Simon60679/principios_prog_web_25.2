import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface SaleAttributes {
  id: number;
  sellerId: number;
  totalAmount: number;
  saleDate: Date;
}

export interface SaleCreationAttributes
  extends Optional<SaleAttributes, "id" | "saleDate" | "totalAmount"> { }

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da venda
 *         sellerId:
 *           type: integer
 *           description: ID do vendedor
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Valor total da venda
 *         saleDate:
 *           type: string
 *           format: date-time
 *           description: Data e hora da venda
 *       example:
 *         id: 1
 *         sellerId: 1
 *         totalAmount: 150.00
 *         saleDate: "2023-10-27T14:30:00Z"
 */
export class Sale
  extends Model<SaleAttributes, SaleCreationAttributes>
  implements SaleAttributes {
  public id!: number;
  public sellerId!: number;
  public totalAmount!: number;
  public saleDate!: Date;
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    tableName: "sales",
    timestamps: false,
  }
);

export default Sale;