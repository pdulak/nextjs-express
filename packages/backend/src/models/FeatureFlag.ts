import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import sequelize from "../config/database";

class FeatureFlag extends Model<
  InferAttributes<FeatureFlag>,
  InferCreationAttributes<FeatureFlag>
> {
  declare id: CreationOptional<number>;
  declare registrationActive: boolean;
  declare forgotPasswordActive: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FeatureFlag.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    registrationActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    forgotPasswordActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "FeatureFlag",
  }
);

export default FeatureFlag;
