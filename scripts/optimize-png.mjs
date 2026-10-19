/** Recompresión PNG sin cambiar un solo píxel ni el filtro original. Sin dependencias. */
import { readFile, writeFile } from "node:fs/promises";
import { deflateSync, inflateSync } from "node:zlib";
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
for (const path of process.argv.slice(2)) {
  const png = await readFile(path),
    chunks = [];
  for (let i = 8; i < png.length; ) {
    const length = png.readUInt32BE(i),
      type = png.toString("ascii", i + 4, i + 8);
    chunks.push({
      type,
      bytes: png.subarray(i, i + length + 12),
      data: png.subarray(i + 8, i + 8 + length),
    });
    i += length + 12;
  }
  const original = inflateSync(
    Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data)),
  );
  const packed = deflateSync(original, { level: 9 }),
    idat = Buffer.alloc(packed.length + 12);
  idat.writeUInt32BE(packed.length, 0);
  idat.write("IDAT", 4);
  packed.copy(idat, 8);
  idat.writeUInt32BE(crc32(idat.subarray(4, -4)), idat.length - 4);
  if (!inflateSync(packed).equals(original)) throw new Error("PNG alterado");
  let inserted = false;
  const output = [png.subarray(0, 8)];
  for (const chunk of chunks)
    if (chunk.type !== "IDAT") output.push(chunk.bytes);
    else if (!inserted) {
      output.push(idat);
      inserted = true;
    }
  const optimized = Buffer.concat(output);
  if (optimized.length < png.length) await writeFile(path, optimized);
  console.log(
    `${path}: ${png.length} → ${Math.min(optimized.length, png.length)} bytes, píxeles idénticos`,
  );
}
