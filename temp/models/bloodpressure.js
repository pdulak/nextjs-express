'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BloodPressure extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BloodPressure.init({
    dateTime: DataTypes.DATE,
    systolic: DataTypes.INTEGER,
    diastolic: DataTypes.INTEGER,
    pulse: DataTypes.INTEGER,
    weight: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'BloodPressure',
  });
  return BloodPressure;
};