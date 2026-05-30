import fs from "fs";
import path from "path";
import type { jsPDF } from "jspdf";

const FONTS_DIR = path.join(process.cwd(), "lib/storefront/assets/fonts");

let regularBase64: string | null = null;
let boldBase64: string | null = null;

function loadFontBase64(filename: string) {
  return fs.readFileSync(path.join(FONTS_DIR, filename)).toString("base64");
}

export function registerRobotoFonts(doc: jsPDF) {
  if (!regularBase64) {
    regularBase64 = loadFontBase64("Roboto-Regular-latin-ext.ttf");
    boldBase64 = loadFontBase64("Roboto-Bold-latin-ext.ttf");
  }

  doc.addFileToVFS("Roboto-Regular-latin-ext.ttf", regularBase64);
  doc.addFont("Roboto-Regular-latin-ext.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold-latin-ext.ttf", boldBase64!);
  doc.addFont("Roboto-Bold-latin-ext.ttf", "Roboto", "bold");
}
