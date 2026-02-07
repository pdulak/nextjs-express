import User from "./User";
import Permission from "./Permission";
import UserPermission from "./UserPermission";
import FeatureFlag from "./FeatureFlag";

// Associations
User.hasMany(UserPermission, { foreignKey: "userId" });
UserPermission.belongsTo(User, { foreignKey: "userId" });

Permission.hasMany(UserPermission, { foreignKey: "permissionId" });
UserPermission.belongsTo(Permission, { foreignKey: "permissionId" });

export { User, Permission, UserPermission, FeatureFlag };
