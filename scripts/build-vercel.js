const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outDir = path.join(root, "public");

const files = [
  "index.html",
  "pitch-coach.html",
  "styles.css",
  "app.js",
  "data/opportunities.json",
  "data/opportunities.js"
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(outDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log(`Vercel static output written to ${outDir}`);
