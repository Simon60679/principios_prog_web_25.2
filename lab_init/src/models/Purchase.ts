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