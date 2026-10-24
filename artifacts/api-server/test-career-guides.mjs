import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const output = await mkdtemp(path.join(root, "node_modules/.career-tests-"));
try {
  await build({
    absWorkingDir: root,
    entryPoints: [
      "src/lib/career-role-seeds.test.ts",
      "src/lib/career-role-approval.test.ts",
      "src/lib/refresh-career-role-seeds.test.ts",
    ],
    outdir: output,
    bundle: true,
    platform: "node",
    format: "esm",
    outExtension: { ".js": ".mjs" },
    external: ["pg-native"],
    banner: {
      js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
  });
  const result = spawnSync(process.execPath, ["--test", ...[
    "career-role-seeds.test.mjs",
    "career-role-approval.test.mjs",
    "refresh-career-role-seeds.test.mjs",
  ].map((file) => path.join(output, file))], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(output, { recursive: true, force: true });
}
