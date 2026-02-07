'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FeatureFlag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FeatureFlag.init({
    registrationActive: DataTypes.BOOLEAN,
    forgotPasswordActive: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'FeatureFlag',
  });
  return FeatureFlag;
};