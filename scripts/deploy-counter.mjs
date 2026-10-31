// Build with the production SITE_URL, then deploy. Works the same in PowerShell 5.1, cmd and bash
// (inline `SITE_URL=... npm run build` does not work in PowerShell).
import { execSync } from "node:child_process";

const env = { ...process.env, SITE_URL: "https://nbu.racason.workers.dev" };
execSync("npm run build", { stdio: "inherit", env });
execSync("npx wrangler deploy", { stdio: "inherit", env });
