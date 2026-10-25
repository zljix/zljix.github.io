import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import {signBackup,verifyBackup} from '../public/orbit/backup-integrity.js';
import {serializeBackup,parseBackup} from '../public/orbit/recovery-model.js';
import {createStudent} from '../public/orbit/identity.js';
import {seed,FileSystem} from '../public/orbit/core.js';
import {createLocalStore} from '../public/orbit/local-store.js';
import {shellCommand} from '../public/orbit/shell-model.js';
import {gameStats} from '../public/orbit/game-model.js';

const ana=createStudent('Ana','Horvat'),ivo=createStudent('Ivo','Ivić');
async function exported(){
  const fs=new FileSystem(seed(ana));
  fs.transact(()=>shellCommand(fs.state.learning.shell,'cmd-1','dir','easy'));
  return JSON.parse(await serializeBackup(fs.state,'2026-10-25T16:00:00.000Z'));
}
test('browser HMAC agrees with Node crypto over UTF-8 canonical data',async()=>{
  const source=await readFile(new URL('../public/orbit/backup-integrity.js',import.meta.url),'utf8');
  const key=Buffer.from(source.match(/KEY_HEX='([0-9a-f]{64})'/)[1],'hex');
  const payload={z:[true,null,42,'Živković'],a:{b:'čćđšž',a:false}};
  const canonical='{"a":{"a":false,"b":"čćđšž"},"z":[true,null,42,"Živković"]}';
  const expected=createHmac('sha256',key).update('zljixOS/backup/v3\n'+canonical).digest('hex');
  const signature=await signBackup(payload);assert.equal(signature.value,expected);
  await verifyBackup(payload,signature);
});
test('editing both names in a text editor cannot transfer earned results',async()=>{
  const raw=await exported();assert.equal(gameStats(raw.workspace).total,20);
  raw.student=ivo;raw.workspace.student=ivo;
  await assert.rejects(parseBackup(JSON.stringify(raw),ivo),/Provjera potpisa nije uspjela/);
});
test('every owner, progress, content and metadata edit is rejected before normalization',async()=>{
  const original=await exported();
  const changes=[
    b=>b.student.firstName='Ivo',b=>b.workspace.student.lastName='Ivić',
    b=>{b.student.firstName=' Ana ';b.workspace.student.firstName=' Ana ';},
    b=>b.exportedAt='2026-10-24T16:00:00.000Z',
    b=>b.workspace.learning.shell.records['cmd-1'].events[0].line='cd dokumenti',
    b=>b.workspace.learning.answers.recovery='Tuđi odgovor',
    b=>b.workspace.nodes.find(n=>n.id==='welcome').content='Drugi tekst',
    b=>b.workspace.learning.label='Promijenjeno',b=>b.workspace.learning.shell.xp=99999,
    b=>delete b.workspace.learning.answers,b=>b.extra='nepotpisano',
    b=>b.workspace.nodes.reverse(),b=>b.integrity.value='0'.repeat(64),
    b=>b.integrity.algorithm='none',b=>b.integrity.keyId='local-v2',b=>delete b.integrity,
    b=>b.integrity.value=b.integrity.value.slice(1),b=>b.integrity.extra=true
  ];
  for(const change of changes){const b=structuredClone(original);change(b);await assert.rejects(parseBackup(JSON.stringify(b),ana),/potpisa/,String(change));}
});
test('a signature from a blank target profile cannot be attached to someone else’s results',async()=>{
  const raw=await exported(),blank=JSON.parse(await serializeBackup(seed(ivo)));
  raw.student=ivo;raw.workspace.student=ivo;raw.integrity=blank.integrity;raw.exportedAt=blank.exportedAt;
  await assert.rejects(parseBackup(JSON.stringify(raw),ivo),/potpisa/);
});
test('no legacy, raw workspace, stripped-format or local-store wrapper bypass exists',async()=>{
  const raw=await exported();
  const candidates=[raw.workspace,{format:'orbit-backup',formatVersion:1,exportedAt:raw.exportedAt,workspace:raw.workspace},
    {...raw,formatVersion:2},{...raw,formatVersion:4},{...raw,format:undefined},
    {format:'orbit-local',version:1,revision:1,state:raw.workspace}];
  for(const b of candidates)await assert.rejects(parseBackup(JSON.stringify(b),ana),/potpis/);
});
test('indentation and object-key order can change without altering the signed values',async()=>{
  const original=await exported();
  const reverse=value=>Array.isArray(value)?value.map(reverse):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([k,v])=>[k,reverse(v)])):value;
  const restored=await parseBackup(JSON.stringify(reverse(original),null,4),createStudent('ana','HORVAT'));
  assert.equal(restored.integrityVerified,true);assert.equal(gameStats(restored.state).total,20);
  assert.deepEqual(restored.state,original.workspace);
});
test('export is a stable snapshot even if the current workspace changes while signing',async()=>{
  const state=seed(ana),pending=serializeBackup(state);
  state.student=ivo;state.learning.label='Naknadna promjena';
  const restored=await parseBackup(await pending,ana);
  assert.deepEqual(restored.state.student,ana);assert.equal(restored.state.learning.label,'');
});
test('rejected imports leave the saved workspace and points unchanged; a valid copy restores',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  const store=createLocalStore(storage,ana);store.flush();const fs=new FileSystem(store.initial,store.persist);
  fs.write('welcome','Sačuvaj ovaj tekst');const before=JSON.stringify(fs.state),saved=storage.getItem(store.key);
  const raw=await exported(),changed=structuredClone(raw);changed.workspace.student=ivo;changed.student=ivo;
  await assert.rejects(async()=>{const copy=await parseBackup(JSON.stringify(changed),ana);fs.transact(()=>{fs.state=copy.state;});},/potpisa/);
  assert.equal(JSON.stringify(fs.state),before);assert.equal(storage.getItem(store.key),saved);
  const copy=await parseBackup(JSON.stringify(raw),ana);fs.transact(()=>{fs.state=copy.state;});
  assert.equal(gameStats(createLocalStore(storage,ana).initial).total,20);
});
test('missing browser cryptography fails closed instead of exporting or importing unsigned data',async()=>{
  const raw=await exported(),descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{}});
  try{await assert.rejects(serializeBackup(seed(ana)),/ne podržava provjeru/);await assert.rejects(parseBackup(JSON.stringify(raw),ana),/ne podržava provjeru/);}
  finally{Object.defineProperty(globalThis,'crypto',descriptor);}
});
test('invalid, overlarge and excessively nested files are bounded without changing results',async()=>{
  await assert.rejects(parseBackup('{'),/valjani JSON/);
  await assert.rejects(parseBackup(' '.repeat(8000001)),/prevelika/);
  const raw=await exported();let deep=null;for(let i=0;i<70;i++)deep={a:deep};raw.extra=deep;
  await assert.rejects(parseBackup(JSON.stringify(raw),ana),/preduboko/);
});
