import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { jsPDF } from "jspdf";

const FONT_DIR = join(process.cwd(), "lib/storefront/assets/fonts");

function readFontBase64(fileName: string) {
  return readFileSync(join(FONT_DIR, fileName)).toString("base64");
}

export function registerRobotoFonts(doc: jsPDF) {
  doc.addFileToVFS("Roboto-Regular.ttf", readFontBase64("Roboto-Regular.ttf"));
  doc.addFileToVFS("Roboto-Bold.ttf", readFontBase64("Roboto-Bold.ttf"));
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
}
