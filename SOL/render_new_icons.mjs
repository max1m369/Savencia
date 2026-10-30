import fs from "node:fs/promises";
import sharp from "sharp";

async function renderIcon(svgPath, outPngPath, width = 280) {
  const svgBuf = await fs.readFile(svgPath);
  await sharp(svgBuf)
    .resize({ width: width })
    .png({ compressionLevel: 9 })
    .toFile(outPngPath);
  console.log(`Rendered ${svgPath} -> ${outPngPath}`);
}

await renderIcon("../icon_moscow.svg", "../icon_moscow.png", 320);
await renderIcon("../icon_ufa.svg", "../icon_ufa.png", 320);
await renderIcon("../icon_belebey.svg", "../icon_belebey.png", 320);
console.log("All 3 city icons rendered successfully!");
