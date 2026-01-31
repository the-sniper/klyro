const esbuild = require("esbuild");
const path = require("path");

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

    console.log("Widget built successfully!");
  } catch (err) {
    console.error("Widget build failed:", err);
    process.exit(1);
  }
}

build();
