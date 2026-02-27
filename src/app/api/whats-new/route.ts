import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "WHATS_NEW.md");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/markdown",
      },
    });
  } catch (error) {
    console.error("Error reading WHATS_NEW.md:", error);
    return new NextResponse("Unable to load release notes at this time.", {
      status: 500,
    });
  }
}
