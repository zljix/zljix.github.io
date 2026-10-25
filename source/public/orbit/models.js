import {defaultShell,validateShell} from './shell-model.js';
import {defaultCourse,validateCourse} from './course-model.js';
import {defaultGame,validateGame} from './game-model.js';
// Deterministic teaching models. Units are illustrative, not machine measurements.
import {defaultExplorer,validateExplorer} from './mechanisms-model.js';
import {defaultNetwork,validateNetwork} from './network-model.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export const CPU_EXAMPLES={
  basic:[{name:'P1',arrival:0,burst:6,ioAt:0,ioFor:0},{name:'P2',arrival:0,burst:3,ioAt:0,ioFor:0},{name:'P3',arrival:0,burst:2,ioAt:0,ioFor:0}],
  arrivals:[{name:'P1',arrival:0,burst:7,ioAt:0,ioFor:0},{name:'P2',arrival:2,burst:2,ioAt:0,ioFor:0},{name:'P3',arrival:4,burst:3,ioAt:0,ioFor:0}],
  io:[{name:'P1',arrival:0,burst:5,ioAt:2,ioFor:3},{name:'P2',arrival:0,burst:4,ioAt:0,ioFor:0},{name:'P3',arrival:1,burst:2,ioAt:0,ioFor:0}]
};
export function checkJobs(jobs){
  if(!Array.isArray(jobs)||jobs.length<1||jobs.length>8)throw new Error('Unesi od 1 do 8 procesa.');
  const names=new Set();
  for(const j of jobs){if(!j||typeof j.name!=='string'||!/^\w{1,12}$/.test(j.name)||names.has(j.name)||!int(j.arrival,0,30)||!int(j.burst,1,20)||!int(j.ioAt,0,j.burst-1)||!int(j.ioFor,0,20)||(j.ioAt===0)!==(j.ioFor===0))throw new Error('Provjeri procese: jedinstven naziv, dolazak 0–30, CPU 1–20; I/O je 0/0 ili prekid prije završetka.');names.add(j.name);}
  return copy(jobs);
}
export function scheduler(config){
  const jobs=checkJobs(config.jobs);if(!['fcfs','rr','sjf'].includes(config.algorithm)||!int(config.quantum,1,10))throw new Error('Neispravan algoritam ili kvant.');
  const s={algorithm:config.algorithm,quantum:config.quantum,t:0,current:null,queue:[],slice:0,timeline:[],last:null,jobs:jobs.map((j,id)=>({...j,id,used:0,wait:0,first:null,finish:null,wake:null,ioDone:false,state:'new'}))};admit(s);return s;
}
function admit(s){for(const j of s.jobs){if((j.state==='new'&&j.arrival<=s.t)||(j.state==='blocked'&&j.wake<=s.t)){j.state='ready';j.wake=null;s.queue.push(j.id);}}}
export function cpuStep(s){
  if(s.jobs.every(j=>j.state==='done'))return false;
  admit(s);
  if(s.current===null&&s.queue.length){
    if(s.algorithm==='sjf')s.queue.sort((a,b)=>nextBurst(s.jobs[a])-nextBurst(s.jobs[b]));
    s.current=s.queue.shift();s.slice=0;const j=s.jobs[s.current];j.state='running';if(j.first===null)j.first=s.t;
  }
  for(const id of s.queue)s.jobs[id].wait++;
  const running=s.current===null?null:s.jobs[s.current];
  const slot={start:s.t,end:s.t+1,id:running?.id??null,name:running?.name||'Prazno'};s.timeline.push(slot);s.last=slot;
  if(running){running.used++;s.slice++;}s.t++;
  // At a boundary, new arrivals and I/O completions precede RR requeueing.
  admit(s);
  if(running){
    if(running.used===running.burst){running.state='done';running.finish=s.t;s.current=null;}
    else if(!running.ioDone&&running.ioAt>0&&running.used===running.ioAt){running.state='blocked';running.wake=s.t+running.ioFor;running.ioDone=true;s.current=null;}
    else if(s.algorithm==='rr'&&s.slice===s.quantum){running.state='ready';s.queue.push(running.id);s.current=null;}
  }
  return true;
}
const nextBurst=j=>!j.ioDone&&j.ioAt>j.used?j.ioAt-j.used:j.burst-j.used;
export function cpuRun(config,steps=400){const s=scheduler(config);for(let i=0;i<Math.min(400,steps)&&cpuStep(s);i++);return s;}
export function cpuSummary(s){const done=s.jobs.every(j=>j.finish!==null);return {done,time:s.t,waiting:done?s.jobs.reduce((n,j)=>n+j.wait,0)/s.jobs.length:null,response:done?s.jobs.reduce((n,j)=>n+j.first-j.arrival,0)/s.jobs.length:null,turnaround:done?s.jobs.reduce((n,j)=>n+j.finish-j.arrival,0)/s.jobs.length:null};}
export function parseReferences(text){
  const tokens=text.trim().split(/[\s,;]+/).filter(Boolean);if(tokens.length<1||tokens.length>30||tokens.some(t=>!/^([0-7])([wW])?$/.test(t)))throw new Error('Unesi 1–30 pristupa stranicama 0–7; w označava zapis, npr. 0 1w 2 0.');return tokens.map(t=>({page:Number(t[0]),write:t.length>1}));
}
export function pager(config){
  if(!['fifo','lru'].includes(config.algorithm)||!int(config.frames,2,5))throw new Error('Odaberi FIFO ili LRU te 2–5 okvira.');
  const refs=parseReferences(config.sequence);return {algorithm:config.algorithm,frames:Array(config.frames).fill(null),refs,step:0,faults:0,hits:0,writebacks:0,history:[]};
}
export function pageStep(s){
  if(s.step>=s.refs.length)return false;const ref=s.refs[s.step];let frame=s.frames.findIndex(f=>f?.page===ref.page);const hit=frame>=0;let evicted=null,wroteBack=false;
  if(hit){s.hits++;s.frames[frame].last=s.step;s.frames[frame].dirty||=ref.write;}
  else{s.faults++;frame=s.frames.indexOf(null);if(frame<0){const metric=s.algorithm==='fifo'?'loaded':'last';frame=s.frames.reduce((best,f,i)=>f[metric]<s.frames[best][metric]?i:best,0);evicted=s.frames[frame].page;wroteBack=s.frames[frame].dirty;if(wroteBack)s.writebacks++;}s.frames[frame]={page:ref.page,dirty:ref.write,loaded:s.step,last:s.step};}
  s.history.push({page:ref.page,write:ref.write,frame,hit,evicted,wroteBack,frames:s.frames.map(f=>f?.page??null)});s.step++;return true;
}
export function pageRun(config,steps=30){const s=pager(config);for(let i=0;i<steps&&pageStep(s);i++);return s;}
export function translateAddress(s,address){if(!int(address,0,8191))throw new Error('Virtualna adresa mora biti između 0 i 8191.');const page=Math.floor(address/1024),offset=address%1024,frame=s.frames.findIndex(f=>f?.page===page);return {page,offset,frame:frame<0?null:frame,physical:frame<0?null:frame*1024+offset};}
export function emptyDisk(){return {files:[],next:1};}
export function validateDisk(d){if(!d||!Array.isArray(d.files)||d.files.length>32||!int(d.next,1,100000))throw new Error('Neispravan pokusni disk.');const used=new Set(),names=new Set(),ids=new Set();for(const f of d.files){if(!f||typeof f.id!=='string'||!/^D\d+$/.test(f.id)||ids.has(f.id)||typeof f.name!=='string'||f.name.length<1||f.name.length>30||names.has(f.name)||!Array.isArray(f.blocks)||f.blocks.length<1)throw new Error('Neispravan zapis na pokusnom disku.');names.add(f.name);ids.add(f.id);for(const n of f.blocks){if(!int(n,0,31)||used.has(n))throw new Error('Dva zapisa zauzimaju isti blok diska.');used.add(n);}}return copy(d);}
export function allocate(d,name,count,contiguous=false){
  if(!name.trim()||name.length>30||d.files.some(f=>f.name===name.trim()))throw new Error('Unesi jedinstven naziv do 30 znakova.');if(!int(count,1,32))throw new Error('Veličina mora biti 1–32 bloka.');const used=new Set(d.files.flatMap(f=>f.blocks));const free=Array.from({length:32},(_,i)=>i).filter(i=>!used.has(i));if(free.length<count)throw new Error('Nema dovoljno slobodnih blokova.');let blocks;
  if(contiguous){for(let i=0;i<=32-count;i++){const run=Array.from({length:count},(_,j)=>i+j);if(run.every(b=>!used.has(b))){blocks=run;break;}}if(!blocks)throw new Error('Dovoljno je ukupnog prostora, ali nema dovoljno velikog neprekinutog slobodnog niza.');}
  else blocks=free.slice(0,count);
  const file={id:'D'+d.next++,name:name.trim(),blocks};d.files.push(file);return file;
}
export const fragments=f=>f.blocks.reduce((n,b,i)=>n+(i===0||b!==f.blocks[i-1]+1?1:0),0);
export function defragment(d){let offset=0;for(const f of d.files){f.blocks=f.blocks.map(()=>offset++);}return d;}
export function fragmentedDisk(){const d=emptyDisk();allocate(d,'Sustav',6);const b=allocate(d,'Stari zapis',5);allocate(d,'Bilješke',4);allocate(d,'Slike',6);d.files=d.files.filter(f=>f.id!==b.id);allocate(d,'Projekt',8);return d;}
export function defaultLearning(){return {cpu:{algorithm:'fcfs',quantum:2,jobs:copy(CPU_EXAMPLES.basic),steps:0},memory:{algorithm:'fifo',frames:3,sequence:'0 1w 2 0 3 0 4 1 2 3 4',steps:0},disk:emptyDisk(),network:defaultNetwork(),explorer:defaultExplorer(),course:defaultCourse(),game:defaultGame(),shell:defaultShell(),evidence:{},answers:{},label:''};}
export function validateLearning(raw){
  const d=defaultLearning();if(!raw)return d;
  const cpu=raw.cpu||d.cpu;checkJobs(cpu.jobs);scheduler(cpu);if(!int(cpu.steps,0,400))throw new Error('Neispravan korak CPU modela.');
  const memory=raw.memory||d.memory;pager(memory);if(!int(memory.steps,0,30))throw new Error('Neispravan korak memorije.');
  const evidence={};for(const [k,v]of Object.entries(raw.evidence||{})){if(/^[a-zA-Z0-9_-]{1,50}$/.test(k)&&typeof v==='boolean')evidence[k]=v;}
  const answers={};for(const [k,v]of Object.entries(raw.answers||{})){if(/^[a-zA-Z0-9_-]{1,50}$/.test(k)&&typeof v==='string'&&v.length<=3000)answers[k]=v;}
  if(Object.keys(answers).length>40||Object.keys(evidence).length>80)throw new Error('Prevelik zapis vježbi.');
  const explorer=validateExplorer(raw.explorer),game=validateGame(raw.game);
  if(raw.game===undefined)for(const [id,d]of Object.entries(explorer.drafts))if(d.prediction||d.reflection)game.legacy[id]={variant:d.variant,prediction:d.prediction,reflection:d.reflection};
  return {cpu:{algorithm:cpu.algorithm,quantum:cpu.quantum,jobs:copy(cpu.jobs),steps:cpu.steps},memory:{algorithm:memory.algorithm,frames:memory.frames,sequence:memory.sequence,steps:memory.steps},disk:validateDisk(raw.disk||d.disk),network:validateNetwork(raw.network),explorer,course:validateCourse(raw.course),game,shell:validateShell(raw.shell),evidence,answers,label:typeof raw.label==='string'?raw.label.slice(0,80):''};
}
