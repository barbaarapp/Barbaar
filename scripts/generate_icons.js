import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.join(process.cwd(), 'public', 'barbaar_icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

sizes.forEach(({ folder, size, fgSize }) => {
  const dirPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Generate standard ic_launcher.png & ic_launcher_round.png
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), pngData);
  fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), pngData);

  // Generate foreground ic_launcher_foreground.png (108dp base)
  const resvgFg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: fgSize },
  });
  const pngFgData = resvgFg.render().asPng();
  fs.writeFileSync(path.join(dirPath, 'ic_launcher_foreground.png'), pngFgData);

  console.log(`Generated icons for ${folder}: size=${size}px, fgSize=${fgSize}px`);
});

console.log('All icons generated successfully!');
