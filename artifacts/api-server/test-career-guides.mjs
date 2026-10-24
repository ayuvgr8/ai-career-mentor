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
      "src/lib/launch-flow.test.ts",
      "src/lib/resume-pdf.test.ts",
      "src/lib/voice-session.test.ts",
      "src/lib/agentic-llm-adapter.test.ts",
    ],
    outdir: output,
    bundle: true,
    platform: "node",
    format: "esm",
    outExtension: { ".js": ".mjs" },
    external: ["pg-native", "@napi-rs/canvas", "pdfjs-dist", "pino", "pino-http"],
    banner: {
      js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
  });
  const result = spawnSync(process.execPath, ["--test", ...[
    "career-role-seeds.test.mjs",
    "career-role-approval.test.mjs",
    "refresh-career-role-seeds.test.mjs",
    "launch-flow.test.mjs",
    "resume-pdf.test.mjs",
    "voice-session.test.mjs",
    "agentic-llm-adapter.test.mjs",
  ].map((file) => path.join(output, file))], { stdio: "inherit", env: { ...process.env, LOG_LEVEL: 'silent', AI_INTEGRATIONS_OPENAI_BASE_URL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://ai.invalid/v1', AI_INTEGRATIONS_OPENAI_API_KEY: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || 'synthetic-test-key' } });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(output, { recursive: true, force: true });
}
