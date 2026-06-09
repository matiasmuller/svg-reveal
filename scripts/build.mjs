import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "src/index.js");
const distPath = resolve(root, "dist/index.js");
const globalPath = resolve(root, "dist/svg-reveal.global.js");
const banner = "/* svg-reveal - generated from src/index.js */\n";

const source = await readFile(sourcePath, "utf8");

await mkdir(resolve(root, "dist"), { recursive: true });
await writeFile(distPath, `${banner}${source}`, "utf8");
await writeFile(globalPath, `${banner}${toGlobalBuild(source)}`, "utf8");

function toGlobalBuild(sourceCode) {
  const body = sourceCode
    .replace("export const DEFAULT_ANIMATION_OPTIONS", "const DEFAULT_ANIMATION_OPTIONS")
    .replace("export function parseSvgString", "function parseSvgString")
    .replace("export function animateSvg", "function animateSvg");

  return [
    "(function (globalThis) {",
    body,
    "",
    "  globalThis.SvgReveal = {",
    "    DEFAULT_ANIMATION_OPTIONS,",
    "    animateSvg,",
    "    parseSvgString",
    "  };",
    "})(globalThis);",
    ""
  ].join("\n");
}
