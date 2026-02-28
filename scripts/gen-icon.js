const fs = require('fs');
const zlib = require('zlib');

const width = 256, height = 256;
const pixels = Buffer.alloc(width * height * 4, 0);

function setPixel(x, y, r, g, b) {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    const idx = (y * width + x) * 4;
    pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = 255;
  }
}

function fillRect(x, y, w, h, r, g, b) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x+dx, y+dy, r, g, b);
}

// Fill background #1a1a2e
for (let i = 0; i < width * height; i++) {
  pixels[i*4] = 0x1a; pixels[i*4+1] = 0x1a; pixels[i*4+2] = 0x2e; pixels[i*4+3] = 255;
}

// Border in red (#e94560)
for (let x = 0; x < 256; x++) { fillRect(x, 0, 1, 4, 0xe9, 0x45, 0x60); fillRect(x, 252, 1, 4, 0xe9, 0x45, 0x60); }
for (let y = 0; y < 256; y++) { fillRect(0, y, 4, 1, 0xe9, 0x45, 0x60); fillRect(252, y, 4, 1, 0xe9, 0x45, 0x60); }

// V shape in gold (#ffd700) - pixel art blocks
const bs = 16;
const vLeft = [[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]];
const vRight = [[13,3],[12,4],[11,5],[10,6],[9,7],[8,8]];
for (const [bx, by] of [...vLeft, ...vRight]) {
  fillRect(bx*bs, by*bs, bs, bs, 0xff, 0xd7, 0x00);
}
// V bottom
fillRect(7*bs, 9*bs, bs*2, bs, 0xff, 0xd7, 0x00);

// G shape in cyan (#00d4ff) offset to right
const gx = 8, gy = 3;
const gBlocks = [
  [gx+1,gy],[gx+2,gy],[gx+3,gy], // top
  [gx,gy+1],[gx,gy+2],[gx,gy+3],[gx,gy+4],[gx,gy+5], // left
  [gx+1,gy+5],[gx+2,gy+5],[gx+3,gy+5], // bottom
  [gx+3,gy+3],[gx+3,gy+4], // right inner
  [gx+2,gy+3], // horizontal bar
];
// actually skip G, just do a clean V

// Create PNG
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([137,80,78,71,13,10,26,10]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const rawData = Buffer.alloc(height * (1 + width * 4));
for (let y = 0; y < height; y++) {
  rawData[y * (1 + width * 4)] = 0;
  pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
}
const compressed = zlib.deflateSync(rawData);

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0))
]);

fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/icon.png', png);
console.log('Created build/icon.png (' + png.length + ' bytes)');
