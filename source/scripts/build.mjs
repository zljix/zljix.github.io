import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const source=path.join(root,'public/orbit');
const {build}=await import(process.env.ORBIT_ESBUILD_PATH?pathToFileURL(process.env.ORBIT_ESBUILD_PATH).href:'esbuild');
async function bundle(entry){return (await build({entryPoints:[path.join(source,entry)],bundle:true,write:false,format:'iife',target:['chrome100','firefox100','safari16'],minify:false,charset:'utf8',legalComments:'none'})).outputFiles[0].text;}
async function makeHTML(entry,mobile=false){
  let html=await readFile(path.join(source,'index.html'),'utf8');
  for(const [,file] of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]){
    const css=await readFile(path.join(source,file),'utf8');
    html=html.replace(`<link rel="stylesheet" href="${file}">`,()=>`<style>\n${css.replace(/<\/style/gi,'<\\/style')}\n</style>`);
  }
  html=html.replace(/<script type="module" src="app.js"><\/script>/,'');
  const csp=mobile?
    "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'":
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'";
  html=html.replace('<meta name="viewport"',()=>`<meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="viewport"`);
  if(mobile){
    html=html.replace('<html lang="hr">','<html lang="hr" data-distribution="pwa">');
    html=html.replace('</head>','<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Orbit OS"></head>');
  }
  // Avoid interpreting literal dollar expressions during replacement, and keep
  // preview injectors out of closing tags in the printable report template.
  const script=(await bundle(entry)).replace(/<\/(script|body|head|html)/gi,match=>'<\\/'+match.slice(2));
  return html.replace('</body>',()=>`<script>\n${script}\n</script>\n</body>`);
}
await mkdir(path.join(root,'dist/mobitel'),{recursive:true});
const desktop=await makeHTML('app.js');
await writeFile(path.join(root,'dist/Orbit-OS.html'),desktop);
const mobile=await makeHTML('mobile-entry.js',true);
const manifest={id:'./',name:'Orbit OS — učenje operacijskih sustava',short_name:'Orbit OS',description:'Struktura, funkcije i mehanizmi operacijskog sustava. Pokusi i odgovori na tvom uređaju.',lang:'hr',start_url:'./index.html',scope:'./',display:'standalone',background_color:'#28233b',theme_color:'#28233b',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const workerTemplate=await readFile(path.join(source,'sw-template.js'),'utf8');
const hash=createHash('sha256').update(mobile).update(manifestText).update(workerTemplate);
for(const icon of ['icon-192.png','icon-512.png','apple-touch-icon.png']){
  hash.update(await readFile(path.join(source,'icons',icon)));
  await copyFile(path.join(source,'icons',icon),path.join(root,'dist/mobitel',icon));
}
const worker=workerTemplate.replace('__ORBIT_BUILD__','0.10.0-'+hash.digest('hex').slice(0,16));
await writeFile(path.join(root,'dist/mobitel/index.html'),mobile);
await writeFile(path.join(root,'dist/mobitel/manifest.webmanifest'),manifestText);
await writeFile(path.join(root,'dist/mobitel/sw.js'),worker);
console.log(`Desktop: ${Buffer.byteLength(desktop)} bytes. Mobile: ${Buffer.byteLength(mobile)} bytes + offline worker, manifest and icons.`);
