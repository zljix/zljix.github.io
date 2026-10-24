import test from 'node:test';
import assert from 'node:assert/strict';
import {FileSystem,seed,validateState,modeString} from '../public/orbit/core.js';
import {CPU_EXAMPLES,cpuRun,cpuSummary,pageRun,translateAddress,emptyDisk,allocate,defragment,fragmentedDisk,fragments,validateLearning} from '../public/orbit/models.js';

test('Version 1 migration preserves every file and supplies safe model defaults',()=>{
 const old=seed();old.version=1;delete old.users;delete old.learning;delete old.activeUser;
 old.nodes.push({id:'old-user-note',parent:'docs',type:'file',name:'Moja stara biljeska.txt',content:'Sačuvani tekst.'});
 const result=validateState(old);assert.equal(result.version,2);assert.equal(result.nodes.find(n=>n.id==='old-user-note').content,'Sačuvani tekst.');assert.equal(result.activeUser,'ucenik');assert.equal(result.nodes.find(n=>n.id==='old-user-note').mode,'644');assert.equal(result.users.length,4);
});
test('Owner, group and others are separate permission classes',()=>{
 const fs=new FileSystem(seed());const f=fs.create('docs','dozvole.txt','file','Sadržaj');fs.chmod(f.id,'640');
 assert.equal(modeString('640'),'rw-r-----');fs.switchUser('kolega');assert.equal(fs.read(f.id),'Sadržaj');assert.throws(()=>fs.write(f.id,'X'),/Pristup odbijen/);
 fs.switchUser('gost');assert.throws(()=>fs.read(f.id),/Pristup odbijen/);assert.throws(()=>fs.chmod(f.id,'777'),/vlasnik/);
 fs.switchUser('ucenik');fs.chmod(f.id,'044');assert.equal(fs.can(f.id,'r'),false,'Owner must not fall through to group/other grants');
 fs.switchUser('nastavnik');assert.equal(fs.read(f.id),'Sadržaj');
});
test('Directory traversal, create/delete permissions and read-only files follow the model',()=>{
 const fs=new FileSystem(seed());const dir=fs.create('docs','Privatno','dir'),f=fs.create(dir.id,'zapis.txt','file','X');fs.chmod(dir.id,'700');fs.chmod(f.id,'644');fs.switchUser('kolega');assert.throws(()=>fs.read(f.id),/Pristup odbijen/);assert.throws(()=>fs.resolve('/Dokumenti/Privatno/zapis.txt'),/Pristup odbijen/);
 fs.switchUser('ucenik');fs.chmod(f.id,'444');fs.remove(f.id);assert.equal(fs.get(f.id),undefined,'Unlink depends on the parent directory, not file write permission');
});
test('Trash restores content, ownership and descendants; copies are independent',()=>{
 const fs=new FileSystem(seed());const dir=fs.create('docs','Vratiti','dir');const file=fs.create(dir.id,'a.txt','file','Izvor');fs.chmod(file.id,'600');const key=fs.trash(dir.id);assert.equal(fs.get(dir.id),undefined);fs.restore(key);assert.equal(fs.read(file.id),'Izvor');assert.equal(fs.get(file.id).mode,'600');
 const copy=fs.copyTo(dir.id,'docs','Kopija');const copiedFile=fs.children(copy)[0];fs.write(copiedFile.id,'Novo');assert.equal(fs.read(file.id),'Izvor');assert.throws(()=>fs.moveTo(dir.id,dir.id),/same sebe/);
 const key2=fs.trash(copy);fs.create('docs','Kopija','dir');assert.throws(()=>fs.restore(key2),/Naziv već postoji/);assert.equal(fs.state.archive.length,1);
});
test('A forbidden terminal-style operation never changes content and is logged',()=>{
 const fs=new FileSystem(seed());const f=fs.create('docs','sigurno.txt','file','Čuvaj');fs.chmod(f.id,'600');fs.switchUser('gost');assert.throws(()=>fs.write(f.id,'Prepisano'));assert.equal(fs.get(f.id).content,'Čuvaj');assert.equal(fs.state.events.at(-1).kind,'odbijeno');
});
test('FCFS, RR and SJF produce known timing results',()=>{
 const c={jobs:CPU_EXAMPLES.basic,algorithm:'fcfs',quantum:2};const f=cpuRun(c),r=cpuRun({...c,algorithm:'rr'}),s=cpuRun({...c,algorithm:'sjf'});
 assert.deepEqual(f.jobs.map(j=>j.finish),[6,9,11]);assert.equal(cpuSummary(f).waiting,5);
 assert.deepEqual(r.jobs.map(j=>j.finish),[11,9,6]);assert.equal(cpuSummary(r).response,2);
 assert.deepEqual(s.jobs.map(j=>j.finish),[11,5,2]);assert.equal(cpuSummary(s).waiting,7/3);
});
test('I/O blocking, arrivals and RR queue boundaries preserve timing invariants',()=>{
 for(const algorithm of ['fcfs','rr','sjf'])for(const jobs of [CPU_EXAMPLES.basic,CPU_EXAMPLES.arrivals,CPU_EXAMPLES.io]){
  const result=cpuRun({jobs,algorithm,quantum:2});assert.equal(cpuSummary(result).done,true);
  for(const j of result.jobs){assert.equal(j.finish-j.arrival,j.burst+j.ioFor+j.wait);assert.ok(j.first>=j.arrival);assert.equal(result.timeline.filter(s=>s.id===j.id).length,j.burst);}
 }
 const s=cpuRun({jobs:[{name:'A',arrival:0,burst:3,ioAt:0,ioFor:0},{name:'B',arrival:2,burst:1,ioAt:0,ioFor:0}],algorithm:'rr',quantum:2});assert.deepEqual(s.timeline.map(t=>t.name),['A','A','B','A']);
 const io=cpuRun({jobs:CPU_EXAMPLES.io,algorithm:'fcfs',quantum:2},2);assert.equal(io.jobs[0].state,'blocked');assert.equal(io.jobs[0].wake,5);assert.ok(!io.queue.includes(0));
});
test('Paging distinguishes FIFO from LRU, writes dirty victims, translates addresses',()=>{
 const base={sequence:'0w 1 2 0 3',frames:3,algorithm:'fifo'};const fifo=pageRun(base),lru=pageRun({...base,algorithm:'lru'});
 assert.equal(fifo.history.at(-1).evicted,0);assert.equal(lru.history.at(-1).evicted,1);assert.equal(fifo.writebacks,1);assert.equal(lru.writebacks,0);
 assert.equal(fifo.faults,4);assert.equal(fifo.hits,1);assert.deepEqual(translateAddress(lru,10),{page:0,offset:10,frame:0,physical:10});assert.equal(translateAddress(lru,1024).physical,null);assert.throws(()=>translateAddress(lru,8192));
});
test('Block allocation and compaction preserve file sizes and unique allocation',()=>{
 const d=fragmentedDisk();assert.equal(d.files.find(f=>f.name==='Projekt').blocks.length,8);assert.equal(fragments(d.files.find(f=>f.name==='Projekt')),2);const sizes=d.files.map(f=>f.blocks.length);defragment(d);assert.deepEqual(d.files.map(f=>f.blocks.length),sizes);assert.ok(d.files.every(f=>fragments(f)===1));assert.equal(new Set(d.files.flatMap(f=>f.blocks)).size,sizes.reduce((a,b)=>a+b,0));
 const x=emptyDisk();for(let i=0;i<8;i++)allocate(x,'X'+i,4);x.files=x.files.filter((_,i)=>i%2===0);assert.throws(()=>allocate(x,'Veliki',8,true),/neprekinutog/);allocate(x,'Veliki',8,false);
});
test('Imported simulation inputs cannot contain infinite or excessive work',()=>{
 assert.throws(()=>validateLearning({cpu:{algorithm:'rr',quantum:0,jobs:CPU_EXAMPLES.basic,steps:0}}));assert.throws(()=>validateLearning({memory:{algorithm:'fifo',frames:3,sequence:'900',steps:0}}));assert.throws(()=>validateLearning({disk:{files:[{id:'D1',name:'a',blocks:[0,0]}],next:2}}));
});
