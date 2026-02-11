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