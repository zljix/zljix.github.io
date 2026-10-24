import test from 'node:test';
import assert from 'node:assert/strict';
import {FileSystem,seed,validateState,clone} from '../public/orbit/core.js';
import {serializeBackup,parseBackup,workspaceStats,compareBackup,recoverSelected} from '../public/orbit/recovery-model.js';

test('Manual versions survive edits, reload, rename and deletion; recovery never overwrites',()=>{
  let fs=new FileSystem(seed());const n=fs.create('docs','Pokus.txt','file','Prvi tekst.');const v=fs.saveVersion(n.id,'Prije promjene');
  fs.write(n.id,'Drugi tekst.');fs.rename(n.id,'Novi-naziv.txt');fs=new FileSystem(JSON.parse(JSON.stringify(fs.state)));
  assert.equal(fs.readVersion(v).content,'Prvi tekst.');const recovered=fs.recoverVersion(v);
  assert.equal(fs.read(n.id),'Drugi tekst.');assert.equal(fs.read(recovered),'Prvi tekst.');assert.notEqual(recovered,n.id);assert.equal(fs.get(recovered).parent,'docs');
  assert.equal(fs.state.learning.evidence.versionRecovered,true);
  fs.remove(n.id);assert.equal(fs.read(fs.recoverVersion(v)),'Prvi tekst.');
  assert.equal(new Set(fs.children('docs').map(n=>n.name)).size,fs.children('docs').length);
});
test('History respects its author and current read permission; identical recovery is not exercise evidence',()=>{
  const fs=new FileSystem(seed()),n=fs.create('docs','Primjer.txt','file','Sačuvano'),v=fs.saveVersion(n.id);
  fs.recoverVersion(v);assert.equal(fs.state.learning.evidence.versionRecovered,undefined);
  fs.switchUser('kolega');assert.throws(()=>fs.readVersion(v));assert.throws(()=>fs.deleteVersion(v));
  const other=fs.saveVersion(n.id,'Pročitana verzija');fs.switchUser('ucenik');fs.chmod(n.id,'600');
  fs.switchUser('kolega');assert.throws(()=>fs.readVersion(other));assert.equal(fs.savedVersions().length,0);
  fs.switchUser('nastavnik');assert.equal(fs.readVersion(v).content,'Sačuvano');
});
test('History limits and storage errors roll back without losing current text or old versions',()=>{
  const fs=new FileSystem(seed());fs.write('welcome','A'.repeat(250000));
  fs.saveVersion('welcome','1');fs.saveVersion('welcome','2');fs.saveVersion('welcome','3');
  const before=clone(fs.state);assert.throws(()=>fs.saveVersion('welcome','4'));assert.deepEqual(fs.state,before);
  const bad=clone(before);bad.versions[0].at='not-a-date';assert.throws(()=>validateState(bad));
  bad.versions=Array(31).fill(before.versions[0]);assert.throws(()=>validateState(bad));
  fs.persist=()=>{throw new Error('Nema mjesta');};assert.throws(()=>fs.recoverVersion(before.versions[0].id));assert.deepEqual(fs.state,before);
});
test('Envelope backups round-trip all data and legacy raw backups migrate additively',()=>{
  const fs=new FileSystem(seed());fs.state.learning.answers.recovery='Provjeren sadržaj.';fs.saveVersion('welcome','Početak');
  const exported=serializeBackup(fs.state,'2026-10-22T16:00:00.000Z'),parsed=parseBackup(exported);
  assert.deepEqual(parsed.state,fs.state);assert.equal(parsed.exportedAt,'2026-10-22T16:00:00.000Z');
  const old=clone(fs.state);delete old.versions;delete old.learning.network;
  const legacy=parseBackup(JSON.stringify(old));assert.equal(legacy.legacy,true);assert.deepEqual(legacy.state.versions,[]);assert.equal(legacy.state.learning.answers.recovery,'Provjeren sadržaj.');
  assert.throws(()=>parseBackup(exported.slice(0,-5)));assert.throws(()=>parseBackup(JSON.stringify({format:'orbit-backup',formatVersion:4,workspace:fs.state})));
  assert.equal(workspaceStats(fs.state).versions,1);
});
test('Backup comparison uses paths rather than IDs and does not reveal denied live text',()=>{
  const fs=new FileSystem(seed()),incoming=clone(fs.state),before=clone(fs.state);
  incoming.nodes.find(n=>n.id==='welcome').id='different-id';
  let rows=compareBackup(fs,incoming);assert.equal(rows.find(r=>r.id==='different-id').status,'same');assert.deepEqual(fs.state,before);
  incoming.nodes.find(n=>n.id==='different-id').content='Stariji sadržaj';rows=compareBackup(fs,incoming);assert.equal(rows.find(r=>r.id==='different-id').status,'changed');
  fs.chmod('welcome','600');fs.switchUser('gost');rows=compareBackup(fs,incoming);assert.equal(rows.find(r=>r.id==='different-id').status,'blocked');assert.equal('content' in rows[0],false);
});
test('Selective recovery preserves folder hierarchy, assigns new IDs and leaves current data intact',()=>{
  const fs=new FileSystem(seed()),folder=fs.create('docs','Projekt','dir'),source=fs.create(folder.id,'rezultat.txt','file','Izvorno');
  const snapshot=clone(fs.state);fs.write(source.id,'Novo');fs.state.learning.answers.recovery='Moj trenutačni osvrt';
  const result=recoverSelected(fs,snapshot,[source.id]),restored=fs.resolve(result.path+'/Dokumenti/Projekt/rezultat.txt');
  assert.equal(restored.content,'Izvorno');assert.notEqual(restored.id,source.id);assert.equal(fs.read(source.id),'Novo');
  assert.equal(restored.owner,'ucenik');assert.equal(restored.mode,'644');assert.equal(fs.state.learning.answers.recovery,'Moj trenutačni osvrt');assert.equal(result.count,1);
  assert.equal(fs.state.learning.evidence.backupRecovered,true);assert.equal(fs.children(result.folderId).length,1);
  const next=recoverSelected(fs,snapshot,[source.id]);assert.notEqual(next.path,result.path);
});
test('Selective recovery rejects invalid selection, insufficient permissions and failed persistence atomically',()=>{
  const fs=new FileSystem(seed()),snapshot=clone(fs.state),before=clone(fs.state);
  assert.throws(()=>recoverSelected(fs,snapshot,[]));assert.throws(()=>recoverSelected(fs,snapshot,['docs']));assert.deepEqual(fs.state,before);
  fs.persist=()=>{throw new Error('Spremanje nije dostupno');};assert.throws(()=>recoverSelected(fs,snapshot,['welcome']));assert.deepEqual(fs.state,before);
  fs.persist=()=>{};fs.switchUser('gost');const guest=clone(fs.state);assert.throws(()=>recoverSelected(fs,snapshot,['welcome']));assert.deepEqual(fs.state.nodes,guest.nodes);
  const full=new FileSystem(seed());for(let i=full.state.nodes.length;i<999;i++)full.state.nodes.push({id:'n'+i,parent:'docs',name:i+'.txt',type:'file',content:'',owner:'ucenik',group:'razred',mode:'644'});
  const capacity=clone(full.state);assert.throws(()=>recoverSelected(full,snapshot,['welcome']));assert.deepEqual(full.state,capacity);
});
