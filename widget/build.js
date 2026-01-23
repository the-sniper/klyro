const esbuild = require("esbuild");
const path = require("path");

async function build() {
  try {
    console.log("Building widget...");

    await esbuild.build({
      entryPoints: [path.resolve(__dirname, "src/index.js")],
      bundle: true,
      minify: true,
      outfile: path.resolve(__dirname, "../public/widget.js"),
      target: ["es2015"],
      format: "iife",
    });

    console.log("Widget built successfully!");
  } catch (err) {
    console.error("Widget build failed:", err);
    process.exit(1);
  }
}

build();
