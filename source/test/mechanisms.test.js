import test from 'node:test';
import assert from 'node:assert/strict';
import {MECHANISMS,traceMechanism,defaultExplorer,validateExplorer,saveMechanismRecord} from '../public/orbit/mechanisms-model.js';
import {FileSystem,seed,validateState} from '../public/orbit/core.js';
import {buildWorkReport} from '../public/orbit/reports.js';
import {explorerReportText} from '../public/orbit/explorer.js';
const run=(id,variant)=>traceMechanism(id,variant).steps;
test('Process instances have independent identities; ending a process leaves the program',()=>{
  const one=run('process','one'),two=run('process','two');
  assert.equal(one.at(-1).state.programs,1);assert.equal(one.at(-1).state.instances,0);
  assert.equal(two.at(-1).state.instances,1);assert.equal(two.at(-1).state.cpu,'P2');
  assert.equal(two.find(s=>s.key==='create-2').state.instances,2);
  assert.match(two.find(s=>s.key==='create-2').state.memory,/2 odvojena/);
});
test('Read permission denial precedes descriptors and I/O; cache avoids blocking',()=>{
  const disk=run('read','disk'),cache=run('read','cache'),denied=run('read','denied');
  assert.ok(!denied.some(s=>s.state.descriptor||s.key==='read'||s.key==='device'));
  assert.match(denied.at(-1).state.result,/EACCES/);
  assert.ok(cache.every(s=>s.state.io==='Nema zahtjeva'&&!s.state.process.includes('čeka')));
  assert.equal(cache.at(-1).state.result,disk.at(-1).state.result);
  assert.equal(disk.find(s=>s.key==='blocked').state.cpu,'P2');
  assert.ok(disk.findIndex(s=>s.key==='interrupt')<disk.findIndex(s=>s.key==='wake'));
  assert.match(disk.find(s=>s.key==='wake').state.process,/P1: spreman/);
  assert.equal(disk.at(-1).state.cpu,'P1');assert.equal(disk.at(-1).state.mode,'Korisnički');
});
test('A timer interrupt changes privilege mode but need not switch the process',()=>{
  const alone=run('cpu','alone'),ready=run('cpu','ready');
  assert.equal(alone.find(s=>s.key==='timer').state.mode,'Jezgreni');
  assert.equal(alone.at(-1).state.cpu,'P1');assert.equal(alone.at(-1).state.pc,120);
  assert.equal(ready.at(-1).state.cpu,'P2');assert.equal(ready.at(-1).state.pc,60);
  assert.match(ready.at(-1).state.saved,/P1: PC 120/);
});
test('Page hit uses MMU directly; valid missing page writes back then retries; invalid address is rejected',()=>{
  const hit=run('memory','hit'),miss=run('memory','missing'),bad=run('memory','invalid');
  assert.equal(hit.at(-1).state.physical,2060);assert.ok(hit.every(s=>s.state.mode==='Korisnički'));
  assert.equal(miss.at(-1).state.physical,12);assert.equal(miss.at(-1).state.writebacks,1);
  assert.ok(miss.findIndex(s=>s.key==='writeback')<miss.findIndex(s=>s.key==='load'));
  assert.ok(miss.findIndex(s=>s.key==='mapped')<miss.findIndex(s=>s.key==='retry'));
  assert.ok(miss.filter(s=>s.state.process.includes('čeka I/O')).every(s=>s.state.cpu==='P2'));
  assert.ok(!bad.some(s=>s.key==='load'||s.key==='retry'||s.state.physical!==undefined));
  assert.match(bad.at(-1).state.process,/završen/);
});
test('The same two increments lose one update without exclusion and preserve both under a mutex',()=>{
  const race=run('threads','race'),locked=run('threads','mutex');
  assert.equal(race.at(-1).state.x,1);assert.equal(locked.at(-1).state.x,2);
  assert.equal(locked.at(-1).state.lock,'Slobodan');
  assert.ok(locked.filter(s=>/T[12](read|add|write)/.test(s.key)).every(s=>s.state.lock===s.state.cpu));
});
test('Opposite resource ordering produces a wait cycle; common ordering releases all resources',()=>{
  const dead=run('deadlock','cycle').at(-1).state,ok=run('deadlock','ordered').at(-1).state;
  assert.equal(dead.cycle,true);assert.equal(dead.r1,'P1');assert.equal(dead.r2,'P2');
  assert.equal(ok.cycle,false);assert.equal(ok.r1,'Slobodan');assert.equal(ok.r2,'Slobodan');
});
test('All variants produce bounded independent snapshots and a deterministic final outcome',()=>{
  for(const m of MECHANISMS)for(const [v] of m.variants){
    const a=run(m.id,v),b=run(m.id,v);assert.deepEqual(a,b);
    assert.ok(a.length>=3&&a.length<=20);assert.notEqual(a.at(-1).state.result,'Još nema ishoda');
    const saved=a[1].state.cpu;a[0].state.cpu='modified';assert.equal(a[1].state.cpu,saved);
  }
  assert.throws(()=>run('missing','any'));assert.throws(()=>run('cpu','unknown'));
});
test('Migration keeps old work and explorer state survives serialized reload',()=>{
  const old=seed();delete old.learning.explorer;old.learning.answers.test='Stari odgovor';
  const fs=new FileSystem(old);assert.deepEqual(fs.state.learning.explorer,defaultExplorer());
  fs.transact(()=>{fs.state.learning.explorer.drafts.read={variant:'cache',step:3,prediction:'Bez diska',reflection:''};});
  const restored=validateState(JSON.parse(JSON.stringify(fs.state)));
  assert.equal(restored.learning.answers.test,'Stari odgovor');assert.equal(restored.learning.explorer.drafts.read.step,3);
});
test('Recording requires all steps and nonempty answers; variants preserve independent observations',()=>{
  let x=defaultExplorer();x.drafts.cpu={variant:'alone',step:0,prediction:'P1 nastavlja',reflection:'Nema spremnog P2.'};
  assert.throws(()=>saveMechanismRecord(x,'cpu'),/završetka/);
  x.drafts.cpu.step=run('cpu','alone').length;
  x=saveMechanismRecord(x,'cpu');
  x.drafts.cpu={...x.drafts.cpu,variant:'ready',step:run('cpu','ready').length,prediction:'P2 preuzima CPU'};
  x=saveMechanismRecord(x,'cpu');assert.equal(x.records.length,2);
  assert.equal(x.records[0].prediction,'P1 nastavlja');
  x.drafts.cpu.reflection='Izmijenjen osvrt';x=saveMechanismRecord(x,'cpu');assert.equal(x.records.length,2);
  x.drafts.cpu.reflection=' ';assert.throws(()=>saveMechanismRecord(x,'cpu'),/objašnjenje/);
});
test('Invalid progress and oversized or duplicated records are rejected without damaging the workspace',()=>{
  const fs=new FileSystem(seed()),before=JSON.stringify(fs.state);
  assert.throws(()=>fs.transact(()=>{fs.state.learning.explorer.drafts.memory={variant:'hit',step:50,prediction:'',reflection:''};}));
  assert.equal(JSON.stringify(fs.state),before);
  const bad=defaultExplorer();bad.drafts.cpu={variant:'alone',step:0,prediction:'x'.repeat(1201),reflection:''};assert.throws(()=>validateExplorer(bad));
  bad.drafts={};bad.records=[{id:'cpu',variant:'alone',prediction:'a',reflection:'b',at:'not a date'}];assert.throws(()=>validateExplorer(bad));
  bad.records[0].at=new Date().toISOString();bad.records.push({...bad.records[0]});assert.throws(()=>validateExplorer(bad));
});
test('Report includes predicted and actual outcomes and escapes all learner text',()=>{
  const fs=new FileSystem(seed()),x=fs.state.learning.explorer;
  x.drafts.threads={variant:'race',step:8,prediction:'<script>alert(1)</script>',reflection:'<img src=x onerror=alert(1)>'};
  fs.state.learning.explorer=saveMechanismRecord(x,'threads');
  const html=buildWorkReport({lessons:[],checks:[],learning:fs.state.learning});
  assert.match(html,/dobiveno 1/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<img src=x'));
  const text=explorerReportText(fs.state.learning.explorer);assert.match(text,/Predviđanje:/);assert.match(text,/Objašnjenje:/);
});
