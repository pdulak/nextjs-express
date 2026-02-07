import readline from "readline/promises";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";
import { User, Permission, UserPermission } from "../models";

async function seed() {
  await sequelize.sync();

  const count = await User.count();
  if (count > 0) {
    console.log("Users already exist in the database. Seed aborted.");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const email = await rl.question("Admin email: ");
  const password = await rl.question("Admin password: ");
  rl.close();

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: "Admin",
    email,
    password: hashedPassword,
    is_active: true,
  });

  const [userPerm] = await Permission.findOrCreate({
    where: { code: "user" },
    defaults: { name: "User", code: "user" },
  });
  const [adminPerm] = await Permission.findOrCreate({
    where: { code: "admin" },
    defaults: { name: "Admin", code: "admin" },
  });

  await UserPermission.bulkCreate([
    { userId: user.id, permissionId: userPerm.id },
    { userId: user.id, permissionId: adminPerm.id },
  ]);

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
