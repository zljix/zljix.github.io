import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSE} from '../public/orbit/course-data.js';
import {defaultCourse,defaultRecord,validateCourse,changeCourse,readyToFinish,courseProgress,courseReport,courseReportText} from '../public/orbit/course-model.js';
import {FileSystem,seed,validateState} from '../public/orbit/core.js';
import {parseBackup,serializeBackup} from '../public/orbit/recovery-model.js';
import {createLocalStore} from '../public/orbit/local-store.js';
import {escapeReport} from '../public/orbit/reports.js';

function completedCourse(id='hardware'){
  const l=COURSE.find(l=>l.id===id);let c=changeCourse(defaultCourse(),{type:'open',id});
  for(let i=1;i<l.example.steps.length;i++)c=changeCourse(c,{type:'example',delta:1});
  c=changeCourse(c,{type:'predict',value:0});
  for(const step of l.experiment.variants[0].steps)c=changeCourse(c,{type:'step'});
  for(let i=0;i<l.quiz.length;i++)c=changeCourse(c,{type:'answer',question:i,value:l.quiz[i].answer});
  c=changeCourse(c,{type:'reflect',value:'Moje objašnjenje je za pregled nastavniku, a ne automatsku ocjenu.'});
  return changeCourse(c,{type:'finish'});
}
test('0.8.2 migration preserves files, notes, previous experiments and all pre-course fields',()=>{
  const fs=new FileSystem(seed());fs.write('welcome','Stvarni učenikov tekst');fs.transact(()=>{fs.state.learning.label='3C – Učenik';fs.state.learning.answers.cpu='Stari osvrt';});
  const old=structuredClone(fs.state);delete old.learning.course;
  const migrated=validateState(old);assert.deepEqual(migrated.learning.course,defaultCourse());
  const originalFields=structuredClone(migrated);delete originalFields.learning.course;
  assert.deepEqual(originalFields,old);
});
test('all eight lessons and 18 conditions contain complete, distinct teaching material',()=>{
  assert.equal(COURSE.length,8);assert.equal(new Set(COURSE.map(l=>l.id)).size,8);
  assert.equal(COURSE.filter(l=>l.group==='Osnove').length,6);
  let variants=0;
  for(const l of COURSE){
    assert.ok(l.intro.length>=2&&l.terms.length>=3&&l.example.steps.length>=2);
    assert.equal(l.quiz.length,2);assert.ok(l.reflection&&l.summary&&l.goal&&l.limit);
    for(const q of l.quiz){assert.ok(q.answer>=0&&q.answer<q.options.length);assert.equal(q.feedback.length,q.options.length);assert.ok(q.feedback.every(Boolean));}
    for(const v of l.experiment.variants){variants++;assert.ok(v.steps.length>=2);assert.ok(l.experiment.choices[v.correct]);assert.ok(v.conclusion);for(const s of v.steps){assert.equal(s.length,3);assert.ok(s[2].every(pair=>pair.length===2));}}
  }
  assert.equal(variants,18);
});
test('completion requires learning activities, but an incorrect initial prediction does not prevent learning',()=>{
  let c=defaultCourse();assert.throws(()=>changeCourse(c,{type:'finish'}),/Dovrši/);
  c=changeCourse(c,{type:'stage',value:3});assert.throws(()=>changeCourse(c,{type:'finish'}),/Dovrši/);
  c=completedCourse();assert.equal(c.records.hardware.finished,true);assert.equal(courseProgress(c).done,1);
  const l=COURSE[0],r=c.records.hardware;assert.notEqual(r.prediction,l.experiment.variants[0].correct,'Wrong prediction is valid learning evidence');
  c=changeCourse(c,{type:'example',delta:-1});assert.equal(c.records.hardware.finished,true,'Reviewing an earlier example step does not erase completion');
  c=changeCourse(c,{type:'reflect',value:'   '});assert.equal(c.records.hardware.finished,false);assert.equal(readyToFinish(l,c.records.hardware),false);
});
test('prediction is locked after starting and changing the condition requires a new prediction and observation',()=>{
  let c=defaultCourse();assert.throws(()=>changeCourse(c,{type:'step'}),/Prvo/);
  c=completedCourse();assert.throws(()=>changeCourse(c,{type:'predict',value:1}),/ponovi/);
  c=changeCourse(c,{type:'variant',id:'saved'});assert.equal(c.records.hardware.prediction,null);assert.equal(c.records.hardware.step,-1);assert.equal(c.records.hardware.finished,false);
  assert.ok(c.records.hardware.reflection);assert.equal(c.records.hardware.answers[0],COURSE[0].quiz[0].answer);
  assert.throws(()=>changeCourse(c,{type:'step'}),/Prvo/);
});
test('first responses are retained when a learner corrects an answer using feedback',()=>{
  let c=defaultCourse(),l=COURSE[0],right=l.quiz[0].answer,wrong=(right+1)%l.quiz[0].options.length;
  c=changeCourse(c,{type:'answer',question:0,value:wrong});c=changeCourse(c,{type:'answer',question:0,value:right});
  assert.equal(c.records.hardware.firstAnswers[0],wrong);assert.equal(c.records.hardware.answers[0],right);assert.equal(c.records.hardware.attempts[0],2);
  assert.match(courseReportText(c),/pokušaji: 2/);
});
test('course progress and current stage round-trip through local reload and portable backup',()=>{
  const map=new Map(),storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
  const local=createLocalStore(storage,{version:1,firstName:'Ana',lastName:'Horvat'});local.flush();const fs=new FileSystem(local.initial,local.persist);
  fs.transact(()=>{fs.state.learning.course=changeCourse(completedCourse(),{type:'stage',value:3});});
  const reloaded=createLocalStore(storage,{version:1,firstName:'Ana',lastName:'Horvat'});assert.deepEqual(reloaded.initial.learning.course,fs.state.learning.course);
  const imported=parseBackup(serializeBackup(fs.state)).state;assert.deepEqual(imported.learning.course,fs.state.learning.course);
  assert.equal(imported.learning.course.stage,3);assert.equal(imported.learning.course.overview,false);
});
test('malformed and forged progress cannot replace an existing workspace',()=>{
  const fs=new FileSystem(seed()),saved=structuredClone(fs.state);
  const mutations=[c=>c.version=99,c=>c.records.unknown=defaultRecord(COURSE[0]),c=>c.records.hardware.finished=true,c=>c.records.hardware.step=900,c=>c.records.hardware.prediction=-4,c=>c.records.hardware.answers=[null],c=>c.records.hardware.reflection='x'.repeat(3001),c=>c.records.hardware.firstAnswers[0]=0];
  for(const mutate of mutations){const c=defaultCourse();c.records.hardware=defaultRecord(COURSE[0]);mutate(c);assert.throws(()=>fs.transact(()=>{fs.state.learning.course=c;}));assert.deepEqual(fs.state,saved);}
});
test('all course paths can be completed and reports escape learner markup without hiding first answers',()=>{
  for(const l of COURSE){const c=completedCourse(l.id);assert.equal(c.records[l.id].finished,true);validateCourse(c);}
  let c=completedCourse();c=changeCourse(c,{type:'reflect',value:'<img src=x onerror=alert(1)> & "tekst"'});
  const html=courseReport(c,escapeReport);assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));assert.match(html,/Prvi odgovor:/);assert.match(html,/nije automatski ocijenjeno/);
});
