import test from 'node:test';
import assert from 'node:assert/strict';
import {SHELL_LESSONS} from '../public/orbit/shell-data.js';
import {shellDemonstration} from '../public/orbit/shell-demo.js';
import {defaultShell,shellStats} from '../public/orbit/shell-model.js';
import {questionParts,retryFeedback} from '../public/orbit/learning-guide.js';
import {taskById} from '../public/orbit/game-data.js';
import {HARD_FINAL_BANK} from '../public/orbit/difficulty-data.js';

test('all 18 worked terminal examples execute in their prepared space without modifying scored work',()=>{
 const work=defaultShell(),before=JSON.stringify(work);
 for(const lesson of SHELL_LESSONS){const example=shellDemonstration(lesson);
  assert.equal(example.steps.length,lesson.examples.length);
  for(const step of example.steps)assert.equal(step.ok,true,lesson.id+': '+step.command+' — '+step.output);
 }
 assert.equal(JSON.stringify(work),before);assert.equal(shellStats(work).total,0);
});
test('terminal demonstration shows an observable map change and file creation',()=>{
 const walk=shellDemonstration(SHELL_LESSONS.find(l=>l.id==='powershell-1'));
 assert.notEqual(walk.steps[2].before,walk.steps[2].after);
 assert.match(walk.steps[3].output,/Dobrodosao/);
 const write=shellDemonstration(SHELL_LESSONS.find(l=>l.id==='cmd-2'));
 assert.ok(write.steps[1].changed.some(p=>p.endsWith('poruka.txt')));
});
test('question display separates situation without losing the initial counter or actor definitions',()=>{
 const t=taskById('c-threads-warm'),p=questionParts(t);
 assert.match(p.context,/T1 i T2 dvije su dretve istog procesa/);assert.match(p.context,/početno 0/);
 assert.equal(p.prompt,'Koliki je zajednički x?');assert.equal(p.context+' '+p.prompt,t.q);
 for(const q of HARD_FINAL_BANK){const parts=questionParts(q);assert.ok(parts.context.length>0,q.id);assert.ok(parts.prompt.length<100,q.id);assert.equal(parts.context+' '+parts.prompt,q.q);}
});
test('first wrong answer prompts reasoning; correct-answer explanation is available after retry',()=>{
 const t=taskById('c-cpu-warm');
 assert.notEqual(retryFeedback(t,{last:[0],tries:1,help:false}),t.why);
 assert.equal(retryFeedback(t,{last:[0],tries:2,help:false}),t.why);
});
