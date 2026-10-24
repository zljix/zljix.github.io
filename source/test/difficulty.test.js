import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,FileSystem,validateState} from '../public/orbit/core.js';
import {COURSE} from '../public/orbit/course-data.js';
import {changeCourse} from '../public/orbit/course-model.js';
import {TASKS,taskById} from '../public/orbit/game-data.js';
import {DIFFICULTIES,EASY_FINAL_BANK,HARD_FINAL_BANK} from '../public/orbit/difficulty-data.js';
import {chooseDifficulty,pathXP,pathCompleted,gameStats,finalUnlocked,submitTask,revealHint,startFinal,answerFinal,finishFinal,finalQuestions,runScore,bestFinal,validValue,scoreReport,scoreReportText} from '../public/orbit/game-model.js';
import {taskHTML,choiceIndices} from '../public/orbit/game-ui.js';
import {escapeReport} from '../public/orbit/reports.js';
const act=(fs,a)=>fs.transact(()=>{fs.state.learning.course=changeCourse(fs.state.learning.course,a);});
const mode=(fs,id)=>fs.transact(()=>chooseDifficulty(fs.state,id));
const submit=(fs,t)=>fs.transact(()=>submitTask(fs.state,t.id,Array.isArray(t.answer)?t.answer:[t.answer]));
function foundation(fs,id){
 const l=COURSE.find(l=>l.id===id);act(fs,{type:'open',id});submit(fs,taskById(`c-${id}-warm`));
 for(let i=1;i<l.example.steps.length;i++)act(fs,{type:'example',delta:1});submit(fs,taskById(`c-${id}-order`));
 for(const v of l.experiment.variants){act(fs,{type:'variant',id:v.id});act(fs,{type:'predict',value:v.correct});for(const step of v.steps)act(fs,{type:'step'});}
 for(const k of ['compare','q0','q1','transfer'])submit(fs,taskById(`c-${id}-${k}`));
}
function finish(fs){const a=fs.state.learning.game.active;for(const [i,q] of finalQuestions(a.round,a.difficulty).entries())fs.transact(()=>answerFinal(fs.state,i,q.answer));return fs.transact(()=>finishFinal(fs.state));}
test('Difficulty changes preserve existing points, gate extensions and add each award only once',()=>{
 const fs=new FileSystem(seed()),g=()=>fs.state.learning.game;
 assert.equal(g().difficulty,'easy');assert.throws(()=>chooseDifficulty(fs.state,'expert'),/težina/);
 const apply=taskById('c-hardware-apply'),hard=taskById('c-hardware-challenge');assert.throws(()=>submit(fs,apply),/težinu/);
 mode(fs,'hard');assert.throws(()=>submit(fs,apply),/100 XP/);foundation(fs,'hardware');assert.equal(pathCompleted(g(),'hardware'),false);assert.throws(()=>submit(fs,hard),/Moderate/);
 mode(fs,'easy');assert.ok(pathCompleted(g(),'hardware'));assert.equal(pathXP(g(),'hardware'),100);
 mode(fs,'moderate');submit(fs,apply);assert.equal(pathXP(g(),'hardware'),120);assert.ok(pathCompleted(g(),'hardware'));assert.throws(()=>submit(fs,hard),/težinu/);
 mode(fs,'hard');submit(fs,hard);assert.equal(pathXP(g(),'hardware'),140);assert.ok(pathCompleted(g(),'hardware'));const answers=structuredClone(g().answers);
 for(const d of DIFFICULTIES){mode(fs,d.id);submit(fs,taskById('c-hardware-warm'));assert.equal(gameStats(fs.state).total,140);}
 assert.deepEqual(g().answers,answers);assert.deepEqual(validateState(structuredClone(fs.state)).learning.game,g());
});
test('Easy narrows choices and provides an ordering start; Hard initially requires an independent attempt',()=>{
 const fs=new FileSystem(seed()),t=taskById('c-hardware-warm');
 let html=taskHTML(t.id,fs.state,escapeReport);assert.equal((html.match(/type="radio"/g)||[]).length,2);assert.ok(html.includes('Vodič · Easy'));
 assert.ok(choiceIndices(t,'easy').includes(t.answer));const incorrect=t.options.findIndex((_,i)=>i!==t.answer);assert.ok(choiceIndices(t,'easy',incorrect).includes(incorrect));
 mode(fs,'moderate');html=taskHTML(t.id,fs.state,escapeReport);assert.equal((html.match(/type="radio"/g)||[]).length,3);
 mode(fs,'hard');assert.throws(()=>fs.transact(()=>revealHint(fs.state,t.id)),/samostalno/);fs.transact(()=>submitTask(fs.state,t.id,[incorrect]));html=taskHTML(t.id,fs.state,escapeReport);assert.ok(!html.includes(t.why));
 fs.transact(()=>revealHint(fs.state,t.id));submit(fs,t);assert.equal(fs.state.learning.game.answers[t.id].firstMode,'hard');assert.equal(fs.state.learning.game.answers[t.id].help,true);
});
test('Final difficulty has its own question bank and stays fixed through a pause, mode change and JSON restore',()=>{
 const fs=new FileSystem(seed());for(const l of COURSE)foundation(fs,l.id);
 fs.transact(()=>startFinal(fs.state));assert.equal(fs.state.learning.game.active.difficulty,'easy');mode(fs,'hard');assert.equal(finalUnlocked(fs.state.learning.game),false);
 fs.transact(()=>startFinal(fs.state));assert.equal(fs.state.learning.game.active.difficulty,'easy');assert.equal(finish(fs),100);assert.equal(bestFinal(fs.state.learning.game,'easy'),100);assert.equal(bestFinal(fs.state.learning.game,'hard'),0);
 assert.throws(()=>fs.transact(()=>startFinal(fs.state)),/osam/);
 for(const t of TASKS.filter(t=>t.area==='extension'))submit(fs,t);assert.equal(finalUnlocked(fs.state.learning.game),true);fs.transact(()=>startFinal(fs.state));mode(fs,'easy');
 const restored=new FileSystem(JSON.parse(JSON.stringify(fs.state)));assert.equal(restored.state.learning.game.active.difficulty,'hard');assert.equal(finish(restored),100);assert.equal(bestFinal(restored.state.learning.game,'hard'),100);assert.equal(gameStats(restored.state).final,100);
 assert.ok(scoreReport(restored.state,escapeReport).includes('Najbolji rezultati po težini'));assert.ok(scoreReportText(restored.state).includes('hard'));
});
test('Legacy final answers keep their original keys and score; legacy answer assistance is retained',()=>{
 const s=seed(),g=s.learning.game;delete g.difficulty;g.round=1;g.runs=[{round:1,answers:finalQuestions(1).map(q=>q.answer)}];
 g.answers['c-hardware-warm']={first:[0],last:[0],tries:1,help:true};
 const restored=validateState(s).learning.game;assert.equal(restored.difficulty,'easy');assert.equal(restored.runs[0].difficulty,'moderate');assert.equal(runScore(restored.runs[0]),100);assert.equal(restored.answers['c-hardware-warm'].firstMode,'moderate');assert.equal(restored.answers['c-hardware-warm'].help,true);
 s.learning.game.difficulty='unknown';assert.throws(()=>validateState(s),/težine/);
});
test('All difficulty banks are complete, use distinct alternatives and alternate variants for every topic',()=>{
 for(const bank of [EASY_FINAL_BANK,HARD_FINAL_BANK]){assert.equal(bank.length,20);for(const t of bank){assert.ok(validValue(t,[t.answer]),t.id);assert.equal(new Set(t.options).size,t.options.length,t.id);assert.ok(t.why.length>20,t.id);}}
 for(const d of DIFFICULTIES){const a=finalQuestions(1,d.id),b=finalQuestions(2,d.id);assert.equal(a.length,10);assert.equal(new Set(a.map(q=>q.topic)).size,10);assert.ok(a.every((q,i)=>q.id!==b[i].id));}
});
test('Bounded history retains each difficulty best and the latest result',()=>{
 const s=seed(),g=s.learning.game;g.round=20;g.runs=Array.from({length:20},(_,i)=>({round:i+1,difficulty:i===0?'hard':i===1?'moderate':'easy',answers:finalQuestions(i+1,i===0?'hard':i===1?'moderate':'easy').map(q=>q.answer)}));
 g.round=21;g.active={round:21,difficulty:'easy',cursor:9,answers:finalQuestions(21,'easy').map(q=>(q.answer+1)%q.options.length)};
 const fs=new FileSystem(s);assert.equal(fs.transact(()=>finishFinal(fs.state)),0);assert.equal(fs.state.learning.game.runs.length,20);assert.equal(runScore(fs.state.learning.game.runs.at(-1)),0);for(const d of DIFFICULTIES)assert.equal(bestFinal(fs.state.learning.game,d.id),100);
});
