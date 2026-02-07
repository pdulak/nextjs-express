import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import sequelize from "../config/database";

class BloodPressure extends Model<InferAttributes<BloodPressure>, InferCreationAttributes<BloodPressure>> {
  declare id: CreationOptional<number>;
  declare dateTime: Date;
  declare systolic: number;
  declare diastolic: number;
  declare pulse: number;
  declare weight: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BloodPressure.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dateTime: DataTypes.DATE,
    systolic: DataTypes.INTEGER,
    diastolic: DataTypes.INTEGER,
    pulse: DataTypes.INTEGER,
    weight: DataTypes.FLOAT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "BloodPressure",
  }
);

export default BloodPressure;
