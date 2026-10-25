import {CPU_EXAMPLES,checkJobs,cpuRun,cpuSummary,pageRun,translateAddress} from './models.js';

export const MEMORY_LAB_SEQUENCE='0 1w 2 0 3 0 4 1 2 3 4';
const copy=x=>JSON.parse(JSON.stringify(x));
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const sameJobs=(jobs,kind)=>Array.isArray(jobs)&&jobs.length===CPU_EXAMPLES[kind].length&&jobs.every((j,i)=>['name','arrival','burst','ioAt','ioFor'].every(k=>j[k]===CPU_EXAMPLES[kind][i][k]));
const sameMemory=c=>c.frames===3&&c.sequence.trim().replace(/[\s,;]+/g,' ').toLowerCase()===MEMORY_LAB_SEQUENCE;
export function defaultLabProof(){return {version:1,cpu:{},memory:{}};}

export function validateLabProof(raw){
  if(raw===undefined)return defaultLabProof();
  if(!object(raw)||raw.version!==1||!object(raw.cpu)||!object(raw.memory))throw Error('Neispravan dokaz laboratorija.');
  const next=defaultLabProof();
  const cpuKeys=['fcfs','rr2','rr1','rr6','comparison','ioFcfs','ioSjf','ioBlocked'];
  const memoryKeys=['fifo','lru','comparison','translation'];
  for(const [key,v] of Object.entries(raw.cpu)){
    if(!cpuKeys.includes(key)||!object(v)||!Number.isInteger(v.steps)||v.steps<0||v.steps>400)throw Error('Neispravan CPU pokus.');
    const c={algorithm:v.algorithm,quantum:v.quantum,jobs:checkJobs(v.jobs),steps:v.steps};
    const run=cpuRun(c,c.steps);
    next.cpu[key]={...c,result:cpuSummary(run)};
  }
  for(const [key,v] of Object.entries(raw.memory)){
    if(!memoryKeys.includes(key)||!object(v)||!Number.isInteger(v.steps)||v.steps<0||v.steps>30)throw Error('Neispravan memorijski pokus.');
    const c={algorithm:v.algorithm,frames:v.frames,sequence:v.sequence,steps:v.steps};
    const run=pageRun(c,c.steps);
    next.memory[key]={...c,result:{faults:run.faults,hits:run.hits,writebacks:run.writebacks}};
    if(key==='translation'){
      const t=translateAddress(run,v.address);
      if(!object(v.answer)||v.answer.page!==t.page||v.answer.offset!==t.offset||v.answer.physical!==t.physical)throw Error('Prijevod adrese nije potvrđen točnim odgovorom.');
      next.memory[key].address=v.address;next.memory[key].answer={page:t.page,offset:t.offset,physical:t.physical};
    }
  }
  return next;
}

export function recordCpuProof(learning,comparison=false){
  const c=learning.cpu,s=cpuRun(c,c.steps),done=cpuSummary(s).done,p=learning.labProof.cpu;
  if(sameJobs(c.jobs,'basic')){
    if(comparison&&done&&c.algorithm==='rr'&&c.quantum===2)p.comparison=copy(c);
    if(done&&c.algorithm==='fcfs')p.fcfs=copy(c);
    if(done&&c.algorithm==='rr'&&[1,2,6].includes(c.quantum))p['rr'+c.quantum]=copy(c);
  }
  if(sameJobs(c.jobs,'io')){
    if(c.algorithm==='fcfs'&&s.jobs.some(j=>j.state==='blocked'))p.ioBlocked=copy(c);
    if(done&&c.algorithm==='fcfs')p.ioFcfs=copy(c);
    if(done&&c.algorithm==='sjf')p.ioSjf=copy(c);
  }
}
export function recordMemoryProof(learning,comparison=false){
  const c=learning.memory,s=pageRun(c,c.steps);
  if(!sameMemory(c)||s.step!==s.refs.length)return;
  learning.labProof.memory[comparison?'comparison':c.algorithm]=copy(c);
}
export function checkMemoryTranslation(learning,address,answer){
  const c=learning.memory,s=pageRun(c,c.steps),t=translateAddress(s,address);
  if(answer.page!==t.page||answer.offset!==t.offset||answer.physical!==t.physical)throw Error('Provjeri tablicu: stranica je cijeli dio adresa / 1024, pomak je ostatak. Fizičku adresu računaj samo ako je stranica prisutna.');
  if(!sameMemory(c)||c.algorithm!=='lru'||s.step!==s.refs.length||address!==1024)throw Error('Za potvrdu laboratorija dovrši početni slijed s LRU-om i tri okvira pa prevedi adresu 1024.');
  learning.labProof.memory.translation={...copy(c),address,answer:{...answer}};
}

export function labEvidenceChecks(learning){
  const p=learning.labProof||defaultLabProof();
  const cpu=(key,algorithm,kind='basic',quantum)=>{
    const c=p.cpu[key];return !!c&&sameJobs(c.jobs,kind)&&c.algorithm===algorithm&&(quantum===undefined||c.quantum===quantum)&&cpuSummary(cpuRun(c,c.steps)).done;
  };
  const blocked=p.cpu.ioBlocked;
  const memory=(key,algorithm)=>{const c=p.memory[key];if(!c||!sameMemory(c)||algorithm&&c.algorithm!==algorithm)return false;const s=pageRun(c,c.steps);return s.step===s.refs.length;};
  const tr=p.memory.translation;
  return {
    cpu:[cpu('fcfs','fcfs'),cpu('rr2','rr', 'basic',2),cpu('rr1','rr','basic',1),cpu('rr6','rr','basic',6),cpu('comparison','rr','basic',2)],
    io:[cpu('ioFcfs','fcfs','io'),!!blocked&&sameJobs(blocked.jobs,'io')&&blocked.algorithm==='fcfs'&&cpuRun(blocked,blocked.steps).jobs.some(j=>j.state==='blocked'),cpu('ioSjf','sjf','io')],
    memory:[memory('fifo','fifo'),memory('lru','lru'),memory('comparison'),memory('translation','lru')&&tr.address===1024]
  };
}

export function labProofText(learning){
  const p=validateLabProof(learning.labProof),checks=labEvidenceChecks(learning),old=learning.game.labs.filter(i=>[3,4,5].includes(i)&&!(i===3?checks.cpu:i===4?checks.io:checks.memory).every(Boolean));
  return ['DOKAZI LABORATORIJSKIH POKUSA',
    ...(old.length?['Ranije priznati bodovi ostaju sačuvani. Za vježbe '+old.map(i=>i+1).join(', ')+' nisu još prikupljeni svi dokazi novog postupka.']:[]),
    ...Object.entries(p.cpu).map(([key,c])=>`CPU ${key}: ${c.algorithm}, kvant ${c.quantum}, procesi ${c.jobs.map(j=>`${j.name}(dolazak ${j.arrival}, CPU ${j.burst}, I/O ${j.ioAt}/${j.ioFor})`).join('; ')}; korak ${c.steps}; odziv ${c.result.response??'—'}, čekanje ${c.result.waiting??'—'}.`),
    ...Object.entries(p.memory).map(([key,c])=>`Memorija ${key}: ${c.algorithm}, ${c.frames} okvira, slijed ${c.sequence}; korak ${c.steps}; promašaji ${c.result.faults}, upisi ${c.result.writebacks}.${c.answer?` Adresa ${c.address}: stranica ${c.answer.page}, pomak ${c.answer.offset}, fizička ${c.answer.physical??'nije prisutna'}.`:''}`)
  ].join('\n');
}
