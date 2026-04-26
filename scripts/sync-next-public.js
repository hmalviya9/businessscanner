const fs = require("fs");
const path = require("path");

const root = process.cwd();
const publicDir = path.join(root, "public");

const files = [
  "index.html",
  "pitch-coach.html",
  "styles.css",
  "app.js",
  "data/opportunities.json",
  "data/opportunities.js"
];

fs.mkdirSync(publicDir, { recursive: true });

for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(publicDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log("Next public assets synced.");
