// 仅生成浏览器交付用等比例 WebP；美术创作、抠图由内置 image_gen 完成。
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/24175/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=process.cwd();
const source=path.join(root,'outputs/event-team-art-20261006');
const output=path.join(root,'previews/team-bingo-event-v3/assets');
await fs.mkdir(output,{recursive:true});
const records=[];
for(const name of ['geopelia','hikari','para','salt','iro']) {
  const original=path.join(source,'chibi',`${name}.png`);
  const metadata=await sharp(original).metadata();
  if(!metadata.hasAlpha) throw new Error(`${name}: 缺少透明通道`);
  const target=path.join(output,`${name}.webp`);
  await sharp(original).resize({width:700,height:700,fit:'inside',withoutEnlargement:true}).webp({quality:92,alphaQuality:100}).toFile(target);
  records.push({file:`${name}.webp`,bytes:(await fs.stat(target)).size,hasAlpha:true});
}
await sharp(path.join(source,'event-edge-frame.png')).resize({width:1000,height:1000,fit:'inside',withoutEnlargement:true}).webp({quality:92,alphaQuality:100}).toFile(path.join(output,'event-edge-frame.webp'));
records.push({file:'event-edge-frame.webp',bytes:(await fs.stat(path.join(output,'event-edge-frame.webp'))).size});
console.log(JSON.stringify({assets:records,totalBytes:records.reduce((sum,item)=>sum+item.bytes,0),sourceArtwork:'unchanged'},null,2));
