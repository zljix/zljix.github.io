import {COURSE,lessonById} from './course-data.js';

const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
export const STAGES=['Razumij','Pogledaj primjer','Isprobaj','Provjeri'];
export function defaultCourse(){return {version:1,lesson:COURSE[0].id,stage:0,overview:true,records:{}};}
export function defaultRecord(lesson){return {example:0,exampleSeen:0,variant:lesson.experiment.variants[0].id,prediction:null,step:-1,answers:lesson.quiz.map(()=>null),firstAnswers:lesson.quiz.map(()=>null),attempts:lesson.quiz.map(()=>0),reflection:'',finished:false};}
export function courseRecord(course,lesson){return course.records[lesson.id]||defaultRecord(lesson);}
export function currentVariant(lesson,record){return lesson.experiment.variants.find(v=>v.id===record.variant);}
export function readyToFinish(lesson,r){return r.exampleSeen===lesson.example.steps.length-1&&r.prediction!==null&&r.step===currentVariant(lesson,r)?.steps.length-1&&lesson.quiz.every((q,i)=>r.answers[i]===q.answer)&&r.reflection.trim().length>0;}
export function courseProgress(course,group='Osnove'){const lessons=COURSE.filter(l=>l.group===group);return {done:lessons.filter(l=>course.records[l.id]?.finished).length,total:lessons.length};}

// Additive migration: old workspaces simply receive an untouched course.
// Reject malformed imported progress instead of trusting a completion flag.
export function validateCourse(raw){
  if(raw===undefined||raw===null)return defaultCourse();
  if(!object(raw)||raw.version!==1||!lessonById(raw.lesson)||!int(raw.stage,0,3)||typeof raw.overview!=='boolean'||!object(raw.records)||Object.keys(raw.records).length>COURSE.length)throw new Error('Neispravan zapis vođenih lekcija.');
  const result={version:1,lesson:raw.lesson,stage:raw.stage,overview:raw.overview,records:{}};
  for(const [id,r] of Object.entries(raw.records)){
    const lesson=lessonById(id),variant=lesson&&object(r)&&currentVariant(lesson,r);
    if(!lesson||!variant||!int(r.example,0,lesson.example.steps.length-1)||!int(r.exampleSeen,r.example,lesson.example.steps.length-1)||!int(r.step,-1,variant.steps.length-1)||(r.prediction!==null&&!int(r.prediction,0,lesson.experiment.choices.length-1))||(r.step>=0&&r.prediction===null)||typeof r.reflection!=='string'||r.reflection.length>3000||typeof r.finished!=='boolean')throw new Error('Neispravan napredak lekcije.');
    for(const key of ['answers','firstAnswers','attempts'])if(!Array.isArray(r[key])||r[key].length!==lesson.quiz.length)throw new Error('Neispravna provjera razumijevanja.');
    for(let i=0;i<lesson.quiz.length;i++){
      const n=lesson.quiz[i].options.length-1;
      if((r.answers[i]!==null&&!int(r.answers[i],0,n))||(r.firstAnswers[i]!==null&&!int(r.firstAnswers[i],0,n))||!int(r.attempts[i],0,100)||((r.answers[i]===null)!==(r.firstAnswers[i]===null))||((r.answers[i]===null)!==(r.attempts[i]===0)))throw new Error('Neispravni odgovori lekcije.');
    }
    if(r.finished&&!readyToFinish(lesson,r))throw new Error('Lekcija je označena dovršenom bez potrebnog rada.');
    result.records[id]={example:r.example,exampleSeen:r.exampleSeen,variant:r.variant,prediction:r.prediction,step:r.step,answers:[...r.answers],firstAnswers:[...r.firstAnswers],attempts:[...r.attempts],reflection:r.reflection,finished:r.finished};
  }
  return result;
}

// All lesson actions pass through the same rules, including import/export tests.
export function changeCourse(course,action){
  const next=validateCourse(course);
  if(action.type==='overview'){next.overview=true;return next;}
  if(action.type==='open'){
    if(!lessonById(action.id))throw new Error('Nepoznata lekcija.');
    if(next.lesson!==action.id)next.stage=0;
    next.lesson=action.id;next.overview=false;return next;
  }
  const l=lessonById(next.lesson),r=next.records[l.id]||defaultRecord(l);
  next.records[l.id]=r;
  if(action.type==='stage'){
    if(!int(action.value,0,3))throw new Error('Nepoznat korak lekcije.');
    next.stage=action.value;
  }else if(action.type==='example'){if(![-1,1].includes(action.delta))throw new Error('Neispravan pomak primjera.');r.example=Math.max(0,Math.min(l.example.steps.length-1,r.example+action.delta));r.exampleSeen=Math.max(r.exampleSeen,r.example);}
  else if(action.type==='variant'){
    if(!l.experiment.variants.some(v=>v.id===action.id))throw new Error('Nepoznat uvjet pokusa.');
    r.variant=action.id;r.prediction=null;r.step=-1;r.finished=false;
  }else if(action.type==='predict'){
    if(r.step>=0)throw new Error('Za novo predviđanje prvo ponovi pokus.');
    r.prediction=action.value;
  }else if(action.type==='step'){
    if(r.prediction===null)throw new Error('Prvo odaberi što očekuješ.');
    r.step=Math.min(currentVariant(l,r).steps.length-1,r.step+1);
  }else if(action.type==='replay'){r.prediction=null;r.step=-1;r.finished=false;}
  else if(action.type==='answer'){
    const q=l.quiz[action.question];
    if(!q||!int(action.value,0,q.options.length-1))throw new Error('Neispravan odgovor.');
    const i=action.question;if(r.firstAnswers[i]===null)r.firstAnswers[i]=action.value;
    r.answers[i]=action.value;r.attempts[i]=Math.min(100,r.attempts[i]+1);
    if(action.value!==q.answer)r.finished=false;
  }else if(action.type==='reflect'){
    r.reflection=action.value;
    if(!r.reflection.trim())r.finished=false;
  }else if(action.type==='finish'){
    if(!readyToFinish(l,r))throw new Error('Dovrši primjer, pokus, provjere i svoje objašnjenje.');
    r.finished=true;
  }else throw new Error('Nepoznata radnja lekcije.');
  return validateCourse(next);
}

export function courseReport(course,esc){
  course=validateCourse(course);
  return `<h2>Učenje od početka</h2><p class="report-note">Dovršeno znači: pregledan primjer, završen jedan pokus s predviđanjem, riješene obje samoprovjere i upisano vlastito objašnjenje. Pogrešni odgovori mogu se ispraviti uz pomoć. Slobodno objašnjenje nije automatski ocijenjeno.</p>${COURSE.filter(l=>course.records[l.id]).map(l=>{
    const r=course.records[l.id],v=currentVariant(l,r),done=r.step===v.steps.length-1;
    return `<section class="report-lesson"><h3>${esc(l.title)} · ${r.finished?'Dovršene aktivnosti':'U tijeku'}</h3><p>Uvjet: ${esc(v.label)}. Predviđanje: ${esc(r.prediction===null?'Nije odabrano':l.experiment.choices[r.prediction])} · Pokus: ${done?'Dovršen':'Nije dovršen'}.</p>${done?`<p>Ishod: ${esc(v.conclusion)}</p>`:''}<ul>${l.quiz.map((q,i)=>`<li>${esc(q.q)}<br>Prvi odgovor: ${esc(r.firstAnswers[i]===null?'Nije upisan':q.options[r.firstAnswers[i]])} · Zadnji: ${esc(r.answers[i]===null?'Nije upisan':q.options[r.answers[i]])} · Pokušaji: ${r.attempts[i]}.</li>`).join('')}</ul><p><strong>${esc(l.reflection)}</strong></p><div class="answer">${esc(r.reflection||'Objašnjenje još nije upisano.')}</div></section>`;
  }).join('')||'<p>Vođene lekcije još nisu započete.</p>'}`;
}
export function courseReportText(course){
  course=validateCourse(course);
  return ['UČENJE OD POČETKA','Samoprovjere dopuštaju ispravke. Slobodna objašnjenja nisu automatski ocijenjena.',...COURSE.filter(l=>course.records[l.id]).flatMap(l=>{
    const r=course.records[l.id],v=currentVariant(l,r);
    return ['',l.title+' — '+(r.finished?'dovršene aktivnosti':'u tijeku'),'Uvjet: '+v.label,'Predviđanje: '+(r.prediction===null?'nije odabrano':l.experiment.choices[r.prediction]),'Pokus: '+(r.step===v.steps.length-1?'dovršen':'nije dovršen'),...l.quiz.flatMap((q,i)=>[q.q,'Prvi odgovor: '+(r.firstAnswers[i]===null?'nije upisan':q.options[r.firstAnswers[i]]),'Zadnji odgovor: '+(r.answers[i]===null?'nije upisan':q.options[r.answers[i]])+'; pokušaji: '+r.attempts[i]]),l.reflection,r.reflection||'(nije upisano)'];
  })].join('\n');
}
