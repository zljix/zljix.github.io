import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const dir=new URL('../dist/mobitel/',import.meta.url);
const html=await readFile(new URL('index.html',dir),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi)];
assert.equal(scripts.length,1);new vm.Script(scripts[0][1]);
assert.ok(html.includes('data-distribution="pwa"'));assert.ok(html.includes("worker-src 'self'"));
assert.ok(html.includes('manifest.webmanifest'));assert.ok(!/<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"/i.test(html));
const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',dir),'utf8'));
assert.equal(manifest.start_url,'./index.html');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
for(const icon of [...manifest.icons,{src:'apple-touch-icon.png',sizes:'180x180'}]){
  const png=await readFile(new URL(icon.src,dir));assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(png.readUInt32BE(20),Number(icon.sizes.split('x')[1]));
}
const worker=await readFile(new URL('sw.js',dir),'utf8');new vm.Script(worker);assert.ok(!worker.includes('__ORBIT_BUILD__'));
assert.equal(await readFile(new URL('downloads/zljixOS.html',dir),'utf8'),await readFile(new URL('../zljixOS.html',dir),'utf8'));
assert.ok(worker.includes('downloads/zljixOS.html'));
console.log('Mobile package verified: inline app, scoped manifest, complete icons, valid offline worker.');
