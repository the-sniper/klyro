const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// Every served copy of the widget is produced here, from one source file.
// They used to be copied around by hand and drifted out of sync.
const IIFE_TARGETS = [
  path.resolve(__dirname, "../public/widget.js"),
  // Referenced by public/widget-demo.html.
  path.resolve(__dirname, "../public/klyro-widget.js"),
];

async function build() {
  try {
    console.log("Building widget...");

    // 1. IIFE Build (for script tags)
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, "src/index.js")],
      bundle: true,
      minify: true,
      outfile: path.resolve(__dirname, "dist/widget.js"),
      target: ["es2015"],
      format: "iife",
    });

    // 2. CJS Build (for npm imports)
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, "src/index.js")],
      bundle: true,
      minify: true,
      outfile: path.resolve(__dirname, "dist/index.js"),
      target: ["es2015"],
      format: "cjs",
    });

    // 3. Publish the IIFE build everywhere it is served from
    const bundle = path.resolve(__dirname, "dist/widget.js");
    for (const target of IIFE_TARGETS) {
      fs.copyFileSync(bundle, target);
      console.log(`  copied -> ${path.relative(path.resolve(__dirname, ".."), target)}`);
    }

    console.log("Widget built successfully!");
  } catch (err) {
    console.error("Widget build failed:", err);
    process.exit(1);
  }
}

build();
