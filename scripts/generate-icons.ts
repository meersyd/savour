/** Reproducible, original geometric Savour mark. No external assets or fonts. */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const size = 1024;
const olive = [70, 84, 60];
const cream = [250, 248, 245];
const terra = [201, 119, 85];
function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number, angle = 0) {
  const dx = x - cx,
    dy = y - cy;
  const a = dx * Math.cos(angle) + dy * Math.sin(angle);
  const b = -dx * Math.sin(angle) + dy * Math.cos(angle);
  return (a / rx) ** 2 + (b / ry) ** 2 <= 1;
}
function pixel(x: number, y: number, transparent: boolean): number[] {
  if (
    (ellipse(x, y, 512, 512, 235, 212) && y >= 512) ||
    (x >= 412 && x <= 612 && y >= 740 && y <= 764)
  )
    return [...cream, 255];
  if (ellipse(x, y, 512, 495, 240, 25)) return [...terra, 255];
  if (ellipse(x, y, 454, 379, 44, 89, -0.55) || ellipse(x, y, 559, 340, 45, 98, 0.6))
    return [...cream, 255];
  return transparent ? [0, 0, 0, 0] : [...olive, 255];
}
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}
function png(transparent: boolean) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const samples = [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ].map(([dx, dy]) => pixel(x + dx, y + dy, transparent));
      const offset = y * (1 + size * 4) + 1 + x * 4;
      for (let channel = 0; channel < 4; channel++)
        raw[offset + channel] = Math.round(
          samples.reduce((sum, sample) => sum + sample[channel], 0) / 4,
        );
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
writeFileSync('assets/icon.png', png(false));
writeFileSync('assets/android-icon-foreground.png', png(true));
