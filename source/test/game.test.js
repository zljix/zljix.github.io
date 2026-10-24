import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,FileSystem,validateState} from '../public/orbit/core.js';
import {COURSE} from '../public/orbit/course-data.js';
import {changeCourse} from '../public/orbit/course-model.js';
import {TASKS,FINAL_BANK,taskById} from '../public/orbit/game-data.js';
import {MECHANISMS,traceMechanism} from '../public/orbit/mechanisms-model.js';
import {NETWORK_CASES,NETWORK_DIAGNOSES,defaultNetworkConfig,startNetworkCase,recordNetworkProbe,completeNetworkCase,NET} from '../public/orbit/network-model.js';
import {correct,validValue,solved,lessonXP,gameStats,completedLesson,finalUnlocked,submitTask,revealHint,startFinal,answerFinal,finishFinal,finalQuestions,runScore,validateGame,reviewTasks,badges,MAX_XP,scoreReport} from '../public/orbit/game-model.js';
import {escapeReport} from '../public/orbit/reports.js';
import {optionOrder,taskHTML} from '../public/orbit/game-ui.js';
const answer=t=>Array.isArray(t.answer)?[...t.answer]:[t.answer];
const act=(fs,action)=>fs.transact(()=>{fs.state.learning.course=changeCourse(fs.state.learning.course,action);});
const submit=(fs,id,value=answer(taskById(id)))=>fs.transact(()=>submitTask(fs.state,id,value));
function mission(fs,id){
 const l=COURSE.find(l=>l.id===id);act(fs,{type:'open',id});submit(fs,`c-${id}-warm`);
 for(let i=1;i<l.example.steps.length;i++)act(fs,{type:'example',delta:1});submit(fs,`c-${id}-order`);
 for(const v of l.experiment.variants){act(fs,{type:'variant',id:v.id});act(fs,{type:'predict',value:v.correct});for(const step of v.steps)act(fs,{type:'step'});}
 submit(fs,`c-${id}-compare`);submit(fs,`c-${id}-q0`);submit(fs,`c-${id}-q1`);submit(fs,`c-${id}-transfer`);
}
function final(fs,wrong=0){fs.transact(()=>startFinal(fs.state));finalQuestions(fs.state.learning.game.round).forEach((q,i)=>fs.transact(()=>answerFinal(fs.state,i,i<wrong?(q.answer+1)%q.options.length:q.answer)));return fs.transact(()=>finishFinal(fs.state));}
test('Every authored task has valid answers, stable shuffled options and complete scoring totals',()=>{
 assert.equal(new Set(TASKS.map(t=>t.id)).size,TASKS.length);
 for(const t of [...TASKS,...FINAL_BANK]){assert.ok(validValue(t,answer(t)),t.id);assert.ok(correct(t,answer(t)));assert.ok(t.why.length>20);const list=t.options||t.items||t.fields[0].options;assert.deepEqual([...optionOrder(t.id,list.length)].sort(),list.map((_,i)=>i));}
 for(const l of COURSE)assert.equal(TASKS.filter(t=>t.lesson===l.id&&t.area==='course').reduce((s,t)=>s+t.points,0),100);
 assert.equal(TASKS.filter(t=>t.area==='mechanism').reduce((s,t)=>s+t.points,0),140);
 assert.equal(TASKS.reduce((s,t)=>s+t.points,0)+110+140+100,MAX_XP);
 for(let r=1;r<5;r++){assert.equal(finalQuestions(r).length,10);assert.equal(new Set(finalQuestions(r).map(q=>q.topic)).size,10);}
 assert.ok(finalQuestions(1).every((q,i)=>q.id!==finalQuestions(2)[i].id));
});
test('Reading and clicking alone earn no mission XP; prerequisites and all experiment conditions are required',()=>{
 const fs=new FileSystem(seed());act(fs,{type:'open',id:'memory'});act(fs,{type:'stage',value:3});
 assert.equal(gameStats(fs.state).total,0);assert.throws(()=>submit(fs,'c-memory-q0'),/Razumij/);
 submit(fs,'c-memory-warm');assert.throws(()=>submit(fs,'c-memory-order'),/primjer/);
 for(let i=1;i<COURSE.find(l=>l.id==='memory').example.steps.length;i++)act(fs,{type:'example',delta:1});submit(fs,'c-memory-order');
 const l=COURSE.find(l=>l.id==='memory');for(const v of l.experiment.variants.slice(0,2)){act(fs,{type:'variant',id:v.id});act(fs,{type:'predict',value:0});for(const s of v.steps)act(fs,{type:'step'});}
 assert.throws(()=>submit(fs,'c-memory-compare'),/sve prikazane/);assert.equal(lessonXP(fs.state.learning.game,'memory'),30);
});
test('Wrong answers give feedback and review, corrections earn XP once while first answer and hints persist',()=>{
 const fs=new FileSystem(seed()),id='c-hardware-warm',t=taskById(id);assert.equal(submit(fs,id,[(t.answer+1)%t.options.length]),false);assert.equal(gameStats(fs.state).total,0);assert.equal(reviewTasks(fs.state.learning.game)[0].id,id);
 fs.transact(()=>revealHint(fs.state,id));assert.equal(submit(fs,id),true);const before=structuredClone(fs.state.learning.game);assert.equal(submit(fs,id),false);assert.deepEqual(fs.state.learning.game,before);
 assert.equal(gameStats(fs.state).total,10);assert.equal(gameStats(fs.state).first,0);assert.equal(gameStats(fs.state).help,1);assert.equal(reviewTasks(fs.state.learning.game).length,0);assert.equal(badges(fs.state).find(b=>b.id==='retry').earned,true);
 const html=taskHTML(id,fs.state,escapeReport);assert.ok(html.includes('Riješeno'));assert.ok(html.includes('10 XP spremljeno'));assert.ok(html.includes('disabled'));
});
test('Ordering rejects duplicated events and transfer requires both outcome and reason',()=>{
 const fs=new FileSystem(seed());mission(fs,'hardware');assert.equal(completedLesson(fs.state.learning.game,'hardware'),true);
 const t=taskById('c-hardware-order');assert.equal(validValue(t,[0,0,2]),false);
 const pair=taskById('c-hardware-transfer');assert.equal(correct(pair,[pair.answer[0],0]),false);assert.equal(validValue(pair,[pair.answer[0],null]),false);
 assert.throws(()=>submit(fs,t.id,[0,0,2]),/jednom/);
});
test('All eight missions reach 800 XP and revisiting experiments never removes earned progress',()=>{
 const fs=new FileSystem(seed());for(const l of COURSE)mission(fs,l.id);
 assert.equal(gameStats(fs.state).course,800);assert.equal(fs.state.learning.game.observed.length,18);assert.ok(finalUnlocked(fs.state.learning.game));
 act(fs,{type:'open',id:'hardware'});act(fs,{type:'replay'});assert.equal(lessonXP(fs.state.learning.game,'hardware'),100);
 assert.equal(badges(fs.state).filter(b=>b.earned).length,4);assert.equal(gameStats(fs.state).total,800);
});
test('Mechanism and lab conclusions require actual completed activity, remain isolated and cannot repeat-award',()=>{
 const fs=new FileSystem(seed()),m=MECHANISMS[0],v=m.variants[0][0],id=`m-${m.id}-${v}-outcome`;
 assert.throws(()=>submit(fs,id),/mehanizam/);assert.throws(()=>submit(fs,'lab-3'),/radnje/);
 fs.transact(()=>{fs.state.learning.explorer.drafts[m.id]={variant:v,step:traceMechanism(m.id,v).steps.length,prediction:'Predviđam',reflection:''};});
 submit(fs,id);submit(fs,`m-${m.id}-${v}-reason`);assert.equal(gameStats(fs.state).mechanisms,10);
 fs.evidence('cpu_fcfs');assert.equal(gameStats(fs.state).lab,0);fs.evidence('cpu_rr');assert.equal(gameStats(fs.state).lab,10);submit(fs,'lab-3');assert.equal(gameStats(fs.state).lab,20);fs.evidence('cpu_rr');assert.equal(gameStats(fs.state).lab,20);
});
test('Final challenge unlocks only after missions, grades only complete attempts and counts the best once',()=>{
 const fs=new FileSystem(seed());assert.throws(()=>startFinal(fs.state),/osam/);for(const l of COURSE)mission(fs,l.id);
 fs.transact(()=>startFinal(fs.state));const round=fs.state.learning.game.round;fs.transact(()=>startFinal(fs.state));assert.equal(fs.state.learning.game.round,round);assert.throws(()=>finishFinal(fs.state),/deset/);assert.equal(gameStats(fs.state).final,0);
 assert.equal(final(fs,3),70);assert.equal(gameStats(fs.state).final,70);assert.equal(final(fs,5),50);assert.equal(gameStats(fs.state).final,70);assert.equal(final(fs),100);assert.equal(gameStats(fs.state).total,900);
});
test('A bounded final history preserves the best score, returns the submitted score and safely roundtrips an active attempt',()=>{
 const fs=new FileSystem(seed());for(const l of COURSE)mission(fs,l.id);assert.equal(final(fs),100);for(let i=0;i<22;i++)assert.equal(final(fs,10),0);
 assert.equal(fs.state.learning.game.runs.length,20);assert.equal(gameStats(fs.state).final,100);assert.equal(runScore(fs.state.learning.game.runs.at(-1)),0);
 fs.transact(()=>startFinal(fs.state));fs.transact(()=>answerFinal(fs.state,2,1));const copy=validateState(JSON.parse(JSON.stringify(fs.state)));assert.deepEqual(copy.learning.game,fs.state.learning.game);
});
test('Migration preserves old files, notes and mechanism drafts without inventing correctness; imported XP is ignored',()=>{
 const old=seed();delete old.learning.game;old.learning.answers.basics='<stari osvrt>';old.learning.explorer.drafts.process={variant:'one',step:1,prediction:'Moje predviđanje',reflection:'Nedovršeni nacrt'};
 const migrated=validateState(old);assert.deepEqual(migrated.nodes,validateState(seed()).nodes);assert.equal(migrated.learning.answers.basics,'<stari osvrt>');assert.equal(migrated.learning.game.legacy.process.reflection,'Nedovršeni nacrt');assert.equal(gameStats(migrated).total,0);
 const forged={...migrated.learning.game,xp:999999,badges:['all']};const valid=validateGame(forged);assert.equal(valid.xp,undefined);assert.deepEqual(valid.answers,{});
 const bad=structuredClone(valid);bad.answers.unknown={first:[0],last:[0],tries:1,help:false};assert.throws(()=>validateGame(bad));
});
test('Every scored category can reach the documented 1400 XP; repeated network completion does not inflate it',()=>{
 const fs=new FileSystem(seed());for(const l of COURSE)mission(fs,l.id);
 for(const m of MECHANISMS)for(const [v]of m.variants){fs.transact(()=>{fs.state.learning.explorer.drafts[m.id]={variant:v,step:traceMechanism(m.id,v).steps.length,prediction:'Ishod',reflection:''};});submit(fs,`m-${m.id}-${v}-outcome`);submit(fs,`m-${m.id}-${v}-reason`);}
 const folder=fs.create('docs','Moja_vjezba','dir');fs.create(folder.id,'biljeska.txt','file','Spremljena bilješka s dovoljno teksta.');fs.transact(()=>{fs.state.lesson={minimized:true,ended:true};for(const key of ['copied','restored','backupExport','permissionChanged','permissionGroup','permissionDenied','cpu_fcfs','cpu_rr','cpu_io','cpu_sjf','memory_fifo','memory_lru','disk_fragmented','disk_compacted','terminalWrite','terminalRead','network_local','network_dns','network_http','network_case_dns','network_case_gateway','network_case_icmp','versionSaved','versionRecovered','backupReviewed','backupRecovered'])fs.state.learning.evidence[key]=true;});
 for(let i=0;i<11;i++)submit(fs,'lab-'+i);
 for(const t of NETWORK_CASES){fs.transact(()=>{const n=startNetworkCase(fs.state.learning.network,t.id);if(t.id==='cable')recordNetworkProbe(n,'ping',NET.peer);else if(t.id==='icmp')recordNetworkProbe(n,'ping',NET.web);else recordNetworkProbe(n,'curl','http://'+NET.host);if(t.id!=='icmp'){n.config=defaultNetworkConfig();n.revision++;}recordNetworkProbe(n,'ping',NET.peer);recordNetworkProbe(n,'ping',NET.web);recordNetworkProbe(n,'nslookup',NET.host);recordNetworkProbe(n,'curl','http://'+NET.host);n.diagnosis=NETWORK_DIAGNOSES[t.id].answer;completeNetworkCase(n);completeNetworkCase(n);fs.state.learning.network=n;});}
 final(fs);const s=gameStats(fs.state);assert.deepEqual([s.course,s.lab,s.mechanisms,s.net,s.final,s.total],[800,220,140,140,100,1400]);assert.equal(badges(fs.state).filter(b=>b.earned).length,6);
 const html=scoreReport(fs.state,escapeReport);assert.ok(html.includes('1400/1400 XP'));assert.ok(html.includes('Zadnji odgovor:'));assert.ok(html.includes('Pokušaj 1'));
});

test('The newest final result is retained even after twenty perfect results',()=>{const fs=new FileSystem(seed());for(const l of COURSE)mission(fs,l.id);for(let i=0;i<20;i++)final(fs);assert.equal(final(fs,10),0);assert.equal(runScore(fs.state.learning.game.runs.at(-1)),0);assert.equal(gameStats(fs.state).final,100);assert.equal(fs.state.learning.game.runs.length,20);});
