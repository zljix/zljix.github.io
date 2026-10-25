import test from 'node:test';
import assert from 'node:assert/strict';
import {FileSystem,seed as coreSeed} from '../public/orbit/core.js';
import {createLocalStore as baseStore,studentStorageKey,LEGACY_STORAGE_KEY} from '../public/orbit/local-store.js';
import {parseBackup,serializeBackup} from '../public/orbit/recovery-model.js';

const student={version:1,firstName:'Ana',lastName:'Horvat'},seed=()=>coreSeed(student),STORAGE_KEY=studentStorageKey(student),createLocalStore=storage=>baseStore(storage,student);
function memoryStorage(){const map=new Map();return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};}
test('anonymous legacy work is kept intact and never assigned to a new student',()=>{
 const storage=memoryStorage(),old=coreSeed();old.learning.label='Raniji učenik';
 const legacy=JSON.stringify({format:'orbit-local',version:1,revision:12,state:old});storage.setItem(LEGACY_STORAGE_KEY,legacy);storage.setItem('orbit-os.offline.workspace.v1.shell12',legacy);
 const store=createLocalStore(storage);assert.equal(store.initial.learning.label,'');assert.deepEqual(store.initial.student,student);assert.equal(store.flush(),true);
 assert.equal(storage.getItem(LEGACY_STORAGE_KEY),legacy);assert.equal(storage.getItem('orbit-os.offline.workspace.v1.shell12'),legacy);
});
test('local workspace persists the full learning state and restores it in a new session',()=>{
  const storage=memoryStorage(),first=createLocalStore(storage);assert.equal(first.flush(),true);
  const fs=new FileSystem(first.initial,first.persist);fs.create('docs','Moj tekst.txt','file','Sačuvano lokalno');
  fs.transact(()=>{fs.state.learning.label='2B – Ana';fs.state.theme='sea';});
  const reopened=createLocalStore(storage);assert.equal(reopened.initial.learning.label,'2B – Ana');
  assert.equal(reopened.initial.theme,'sea');assert.ok(reopened.initial.nodes.some(n=>n.content==='Sačuvano lokalno'));
  assert.equal(reopened.hasPending(),false);assert.equal(reopened.label(),'Spremljeno lokalno');
});
test('blocked storage preserves edits in memory and supports a portable JSON copy',()=>{
  const local=createLocalStore(null),fs=new FileSystem(local.initial,local.persist);
  fs.create('docs','Privremeno.txt','file','Sadržaj bez pohrane');assert.equal(local.hasPending(),true);assert.equal(local.flush(),false);
  assert.ok(parseBackup(serializeBackup(fs.state)).state.nodes.some(n=>n.content==='Sadržaj bez pohrane'));
  assert.equal(local.status().kind,'memory');
});
test('quota failure leaves the old saved copy intact and retry saves the latest edit',()=>{
  const storage=memoryStorage(),local=createLocalStore(storage);local.flush();const saved=storage.getItem(STORAGE_KEY),write=storage.setItem;
  storage.setItem=()=>{throw new Error('QuotaExceededError');};const fs=new FileSystem(local.initial,local.persist);
  fs.write('welcome','Najnovija izmjena');assert.equal(storage.getItem(STORAGE_KEY),saved);assert.equal(local.hasPending(),true);
  storage.setItem=write;assert.equal(local.flush(),true);assert.equal(createLocalStore(storage).initial.nodes.find(n=>n.id==='welcome').content,'Najnovija izmjena');
});
test('malformed stored data is preserved rather than silently replaced',()=>{
  const storage=memoryStorage();storage.setItem(STORAGE_KEY,'{broken');const local=createLocalStore(storage);
  assert.equal(local.status().kind,'corrupt');assert.equal(local.flush(),false);local.persist(seed());
  assert.equal(storage.getItem(STORAGE_KEY),'{broken');assert.equal(local.original(),'{broken');
});
test('a stale tab cannot overwrite a detected newer workspace and its mutation rolls back',()=>{
  const storage=memoryStorage(),a=createLocalStore(storage);a.flush();const b=createLocalStore(storage);
  const first=new FileSystem(a.initial,a.persist),second=new FileSystem(b.initial,b.persist);
  first.write('welcome','Prvi prozor');assert.throws(()=>second.write('welcome','Zastarjeli prozor'),/drugom prozoru/);
  assert.notEqual(second.read('welcome'),'Zastarjeli prozor');assert.equal(createLocalStore(storage).initial.nodes.find(n=>n.id==='welcome').content,'Prvi prozor');
  assert.equal(b.status().kind,'conflict');
});
test('externally cleared storage is detected before overwriting it',()=>{
  const storage=memoryStorage(),local=createLocalStore(storage);local.flush();storage.map.clear();assert.equal(local.checkForChanges(),true);
  assert.throws(()=>local.persist(seed()),/drugom prozoru/);assert.equal(storage.getItem(STORAGE_KEY),null);
});
test('invalid imports cannot replace a saved workspace',()=>{
  const storage=memoryStorage(),local=createLocalStore(storage);local.flush();const raw=storage.getItem(STORAGE_KEY);
  assert.throws(()=>local.persist({version:2,nodes:[]}));assert.equal(storage.getItem(STORAGE_KEY),raw);
});
test('new work and portable restore preserve the complete prior workspace in a separate copy',()=>{
  const storage=memoryStorage(),local=createLocalStore(storage),fs=new FileSystem(local.initial,local.persist);
  fs.transact(()=>{fs.state.learning.label='Moj pokus';});fs.write('welcome','Prenosiva bilješka');fs.saveVersion('welcome','Prije izmjene');
  const text=serializeBackup(fs.state);fs.transact(()=>{fs.state=seed();});assert.equal(fs.state.learning.label,'');
  const imported=parseBackup(text);fs.transact(()=>{fs.state=imported.state;});
  assert.equal(fs.read('welcome'),'Prenosiva bilješka');assert.equal(fs.state.versions.length,1);assert.equal(createLocalStore(storage).initial.learning.label,'Moj pokus');
});
