import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,FileSystem,validateState} from '../public/orbit/core.js';
import {SHELL_LESSONS} from '../public/orbit/shell-data.js';
import {defaultShell,replayShell,shellCommand,shellGuidance,shellSolution,shellHint,shellProgress,shellReportText,validateShell} from '../public/orbit/shell-model.js';
import {shellNode} from '../public/orbit/shell-engine.js';
import {CPU_EXAMPLES,pageRun,cpuRun,cpuSummary} from '../public/orbit/models.js';
import {labChecks,gameStats,finalQuestions,runScore,validateGame,finalSummary,finishFinal} from '../public/orbit/game-model.js';
import {LEGACY_FINAL_BANKS} from '../public/orbit/final-legacy.js';
import {TASKS} from '../public/orbit/game-data.js';
import {choiceIndices} from '../public/orbit/game-ui.js';
import {recordCpuProof,recordMemoryProof,checkMemoryTranslation,MEMORY_LAB_SEQUENCE,labProofText} from '../public/orbit/lab-evidence.js';
import {completeCpuLab,completeRemainingSimulationLabs} from './lab-fixture.js';
import {newThreadPlay,canStepThread,stepThread,threadsDone} from '../public/orbit/thread-play-model.js';

test('All Linux permission goals accept an absolute target from another working directory',()=>{
 const commands=['cd /','chmod 600 /home/ucenik/biljeska.txt','chmod 400 /home/ucenik/biljeska.txt','cat /home/ucenik/biljeska.txt','echo Promjena>/home/ucenik/biljeska.txt','chmod u+w /home/ucenik/biljeska.txt','echo Promjena>/home/ucenik/biljeska.txt'];
 const r=replayShell('linux-5',{events:commands.map(line=>({type:'command',line,mode:'hard',tracking:2}))});
 assert.equal(r.xp,100);assert.equal(r.cursor,5);assert.equal(shellNode(r.state,'/home/ucenik/biljeska.txt').mode,'600');assert.equal(shellNode(r.state,'/home/ucenik/biljeska.txt').content,'Promjena\n');
 const wrong=replayShell('linux-5',{events:['cd /','echo Druga>biljeska.txt','chmod 600 biljeska.txt'].map(line=>({type:'command',line,mode:'hard',tracking:2}))});assert.equal(wrong.xp,0);
});
test('Explicit solution use, automatic guidance and requested hints survive export without double awards',()=>{
 const s=defaultShell();shellGuidance(s,'cmd-1');shellGuidance(s,'cmd-1');shellSolution(s,'cmd-1','easy');shellSolution(s,'cmd-1','easy');shellCommand(s,'cmd-1','dir','easy');
 const restored=validateShell(JSON.parse(JSON.stringify(s))),r=shellProgress(restored,'cmd-1');assert.equal(r.xp,20);assert.equal(r.guidance[0],true);assert.equal(r.solutions[0],true);assert.equal(r.help[0],true);assert.equal(r.hints[0],false);assert.equal(restored.records['cmd-1'].events.length,3);assert.match(shellReportText(restored),/otvoren postupak: da; zatražena pomoć: da/);
 const old=defaultShell();old.records['cmd-1']={events:[{type:'command',line:'dir',mode:'easy'}]};assert.match(shellReportText(validateShell(old)),/ranije se nije bilježilo/);
 const h=defaultShell();assert.throws(()=>shellSolution(h,'cmd-1','hard'),/Pomoć/);shellCommand(h,'cmd-1','bad','hard');assert.throws(()=>shellSolution(h,'cmd-1','hard'),/natuknicu/);shellHint(h,'cmd-1','hard');shellSolution(h,'cmd-1','hard');assert.equal(shellProgress(h,'cmd-1').solutions[0],true);
});
test('Old command traces remain importable when a corrected checker completes a goal earlier',()=>{
 const r=replayShell('linux-5',{events:['cd /','chmod 600 /home/ucenik/biljeska.txt','cd /home/ucenik','chmod 600 biljeska.txt','chmod 400 biljeska.txt','cat biljeska.txt','pwd'].map(line=>({type:'command',line,mode:'easy'}))});assert.equal(r.xp,60);assert.equal(r.cursor,3);
});
test('CPU laboratory requires the specified runs and comparison, rather than old completion flags',()=>{
 const fs=new FileSystem(seed());fs.evidence('cpu_fcfs');fs.evidence('cpu_rr');assert.equal(gameStats(fs.state).lab,0);
 fs.transact(()=>{fs.state.learning.cpu={jobs:structuredClone(CPU_EXAMPLES.basic),algorithm:'fcfs',quantum:2,steps:400};recordCpuProof(fs.state.learning);fs.state.learning.cpu.algorithm='rr';recordCpuProof(fs.state.learning);});
 assert.deepEqual(labChecks(fs.state)[3],[true,true,false,false,false]);assert.equal(gameStats(fs.state).lab,0);
 fs.transact(()=>completeCpuLab(fs.state.learning));assert.equal(gameStats(fs.state).lab,10);
 const restored=new FileSystem(JSON.parse(JSON.stringify(fs.state)));assert.deepEqual(labChecks(restored.state)[3],Array(5).fill(true));assert.match(labProofText(restored.state.learning),/kvant 6/);
 const bad=seed();bad.learning.cpu={jobs:structuredClone(CPU_EXAMPLES.arrivals),algorithm:'rr',quantum:2,steps:400};recordCpuProof(bad.learning,true);assert.equal(labChecks(bad)[3].some(Boolean),false);
});
test('Memory and I/O laboratories require the observed state, matching inputs and checked translation',()=>{
 const s=seed(),l=s.learning;l.memory={algorithm:'fifo',frames:3,sequence:MEMORY_LAB_SEQUENCE,steps:30};recordMemoryProof(l);l.memory.algorithm='lru';recordMemoryProof(l);
 assert.deepEqual(labChecks(s)[5],[true,true,false,false]);assert.throws(()=>checkMemoryTranslation(l,1024,{page:0,offset:1,physical:null}),/Provjeri/);
 recordMemoryProof(l,true);checkMemoryTranslation(l,1024,{page:1,offset:0,physical:null});assert.deepEqual(labChecks(validateState(s))[5],Array(4).fill(true));
 const tampered=structuredClone(s);tampered.learning.labProof.memory.translation.answer.page=2;assert.throws(()=>validateState(tampered),/Prijevod/);
 const other=seed();other.learning.memory={algorithm:'fifo',frames:2,sequence:MEMORY_LAB_SEQUENCE,steps:30};recordMemoryProof(other.learning);assert.equal(labChecks(other)[5][0],false);
 completeRemainingSimulationLabs(other.learning);assert.deepEqual(labChecks(other)[4],Array(3).fill(true));
});
test('Earlier laboratory points survive migration but are identified as lacking new evidence',()=>{
 const s=seed();delete s.learning.labProof;s.learning.game.labs=[3,5];const fs=new FileSystem(s);assert.equal(gameStats(fs.state).lab,20);assert.match(labProofText(fs.state.learning),/Ranije priznati bodovi/);assert.equal(labChecks(fs.state)[3].every(Boolean),false);
});
test('New finals use separate cases, full plausible options and changing conditions',()=>{
 const practice=new Set(TASKS.map(t=>t.q));
 for(const mode of ['easy','moderate','hard'])for(let round=1;round<=60;round++)for(const q of finalQuestions(round,mode)){
  assert.equal(practice.has(q.q),false);assert.equal(new Set(q.options).size,4,q.id);assert.equal(choiceIndices(q,mode).length,4);assert.ok(q.why.length>30);assert.ok(q.reviewTopics.every(t=>['hardware','os','process','cpu','memory','read','threads','deadlock'].includes(t)));
 }
 assert.notDeepEqual(finalQuestions(1).map(q=>q.q),finalQuestions(3).map(q=>q.q));
});
test('Every legacy difficulty retains its exact original questions, score and active attempt',()=>{
 for(const mode of ['easy','moderate','hard']){
  const bank=LEGACY_FINAL_BANKS[mode],original=bank.filter((_,i)=>i%2===(1+Math.floor(i/2))%2);
  const g=seed().learning.game;g.round=1;g.runs=[{round:1,difficulty:mode,answers:original.map(q=>q.answer)}];const restored=validateGame(g);assert.equal(runScore(restored.runs[0]),100);assert.deepEqual(finalQuestions(1,mode,1),original);assert.equal(finalSummary(restored,mode).best,null);
  g.runs=[];g.active={round:1,difficulty:mode,cursor:5,answers:original.map(q=>q.answer)};const s=seed();s.learning.game=validateGame(g);assert.equal(finishFinal(s),100);assert.equal(s.learning.game.runs[0].bankVersion,1);
 }
});
test('Terminal-only Easy work cannot earn an OS mastery rank',()=>{
 const s=seed();for(const l of SHELL_LESSONS)for(const step of l.steps.slice(0,3))for(const command of step.solution)shellCommand(s.learning.shell,l.id,command,'easy');
 const r=gameStats(s);assert.equal(r.total,1080);assert.equal(r.foundations,0);assert.equal(r.title,'Početnik');assert.ok(!r.rankHint.includes('-'));
});
test('Every legal learner-selected schedule preserves two increments with a whole-operation lock',()=>{
 const outcomes=lock=>{const values=new Set();function visit(s){if(threadsDone(s)){values.add(s.x);assert.equal(s.log.length,6);return;}for(const i of [0,1])if(canStepThread(s,i))visit(stepThread(s,i));}visit(newThreadPlay(4,lock));return [...values].sort();};
 assert.deepEqual(outcomes('none'),[5,6]);assert.deepEqual(outcomes('write'),[5,6]);assert.deepEqual(outcomes('whole'),[6]);
 const s=stepThread(newThreadPlay(4,'whole'),0);assert.throws(()=>stepThread(s,1),/lokot/);assert.equal(s.x,4);assert.equal(s.threads[0].local,4);
});
