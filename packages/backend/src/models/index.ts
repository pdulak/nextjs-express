import User from "./User";
import Permission from "./Permission";
import UserPermission from "./UserPermission";
import FeatureFlag from "./FeatureFlag";
import BloodPressure from "./BloodPressure";
import Music from "./Music";
import B2File from "./B2File";
import B2FileDownload from "./B2FileDownload";

// Associations
User.hasMany(UserPermission, { foreignKey: "userId" });
UserPermission.belongsTo(User, { foreignKey: "userId" });

Permission.hasMany(UserPermission, { foreignKey: "permissionId" });
UserPermission.belongsTo(Permission, { foreignKey: "permissionId" });

B2File.hasMany(B2FileDownload, { foreignKey: "b2FileId", as: "downloads" });
B2FileDownload.belongsTo(B2File, { foreignKey: "b2FileId" });

export { User, Permission, UserPermission, FeatureFlag, BloodPressure, Music, B2File, B2FileDownload };
