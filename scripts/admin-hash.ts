import { hashPassword } from "../lib/admin/auth";

/** Usage: npm run admin:hash -- "your-long-password"  → prints the value for ADMIN_PASSWORD_HASH. */
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run admin:hash -- "your-long-password"   (at least 12 characters)');
  process.exit(1);
}
console.log(hashPassword(password));
