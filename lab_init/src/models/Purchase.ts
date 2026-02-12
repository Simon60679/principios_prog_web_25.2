import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export interface PurchaseAttributes {
  id: number;
  userId: number;
  totalAmount: number;
  purchaseDate: Date;
}

export interface PurchaseCreationAttributes
  extends Optional<PurchaseAttributes, "id" | "purchaseDate" | "totalAmount"> { }

/**
 * @swagger
 * components:
 *   schemas:
 *     Purchase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da compra
 *         userId:
 *           type: integer
 *           description: ID do usuário que fez a compra
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Valor total da compra
 *         purchaseDate:
 *           type: string
 *           format: date-time
 *           description: Data e hora da compra
 *       example:
 *         id: 1
 *         userId: 2
 *         totalAmount: 2500.50
 *         purchaseDate: "2023-10-27T10:00:00Z"
 */
export class Purchase
  extends Model<PurchaseAttributes, PurchaseCreationAttributes>
  implements PurchaseAttributes {
  public id!: number;
  public userId!: number;
  public totalAmount!: number;
  public purchaseDate!: Date;
}

Purchase.init(
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
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    tableName: "purchases",
    timestamps: false,
  }
);

export default Purchase;