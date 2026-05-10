import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nxBin = resolve(repoRoot, "node_modules", "nx", "dist", "bin", "nx.js");
const args = process.argv.slice(2);

const child = spawn(process.execPath, [nxBin, ...args], {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    NX_DAEMON: "false"
  }
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
