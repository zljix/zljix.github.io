import {shellStats,shellReport,shellReportText} from './shell-model.js';
import {SHELL_MAX_XP} from './shell-data.js';
import {COURSE} from './course-data.js';
import {TASKS,taskById,FINAL_BANK} from './game-data.js';
import {MECHANISMS,traceMechanism} from './mechanisms-model.js';
import {NETWORK_CASES,NETWORK_DIAGNOSES} from './network-model.js';
import {DIFFICULTIES,difficultyById,EASY_FINAL_BANK,HARD_FINAL_BANK} from './difficulty-data.js';

const copy=x=>JSON.parse(JSON.stringify(x));
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const courseKeys=COURSE.flatMap(l=>l.experiment.variants.map(v=>l.id+':'+v.id));
const mechanismKeys=MECHANISMS.flatMap(l=>l.variants.map(v=>l.id+':'+v[0]));
export const MAX_XP=1720+SHELL_MAX_XP;
export function defaultGame(){return {version:1,difficulty:'easy',screen:'lessons',legacy:{},answers:{},observed:[],mechanisms:[],labs:[],round:0,active:null,runs:[]};}
export function blankAnswer(){return {first:null,last:null,tries:0,help:false,firstMode:null,lastMode:null};}
export function chooseDifficulty(state,id){if(!difficultyById(id))throw Error('Nepoznata težina.');state.learning.game.difficulty=id;}
export function correct(task,value){const expected=Array.isArray(task.answer)?task.answer:[task.answer];return Array.isArray(value)&&value.length===expected.length&&value.every((n,i)=>n===expected[i]);}
export function validValue(task,value){
  if(!Array.isArray(value))return false;
  if(task.type==='choice')return value.length===1&&int(value[0],0,task.options.length-1);
  if(task.type==='pair')return value.length===task.fields.length&&value.every((n,i)=>int(n,0,task.fields[i].options.length-1));
  return value.length===task.items.length&&new Set(value).size===value.length&&value.every(n=>int(n,0,task.items.length-1));
}
export function solved(game,id){const r=game.answers[id];return !!r&&correct(taskById(id),r.last);}
export function lessonTasks(id){return TASKS.filter(t=>t.area==='course'&&t.lesson===id);}
export function lessonXP(game,id){return lessonTasks(id).reduce((n,t)=>n+(solved(game,t.id)?t.points:0),0);}
export function completedLesson(game,id){return lessonXP(game,id)===100;}
export function pathTasks(id,mode){return [...lessonTasks(id),...TASKS.filter(t=>t.area==='extension'&&t.lesson===id&&(mode==='hard'||mode==='moderate'&&t.difficulty==='moderate'))];}
export function pathXP(game,id,mode=game.difficulty){return pathTasks(id,mode).reduce((n,t)=>n+(solved(game,t.id)?t.points:0),0);}
export function pathCompleted(game,id,mode=game.difficulty){return pathXP(game,id,mode)===difficultyById(mode).target;}
export function finalUnlocked(game,mode=game.difficulty){return COURSE.every(l=>pathCompleted(game,l.id,mode));}
export function finalQuestions(round,mode='moderate'){const bank=mode==='easy'?EASY_FINAL_BANK:mode==='hard'?HARD_FINAL_BANK:FINAL_BANK;return bank.filter((_,i)=>i%2===(round+Math.floor(i/2))%2);}
export function runScore(run){return finalQuestions(run.round,run.difficulty).reduce((n,q,i)=>n+(q.answer===run.answers[i]?10:0),0);}
export function bestFinal(game,mode){return Math.max(0,...game.runs.filter(r=>(r.difficulty||'moderate')===mode).map(runScore));}
export function validateGame(raw){
  if(raw===undefined)return defaultGame();
  if(!obj(raw)||raw.version!==1||!['lessons','final'].includes(raw.screen)||!obj(raw.answers)||Object.keys(raw.answers).length>TASKS.length||!int(raw.round,0,100000)||!Array.isArray(raw.runs)||raw.runs.length>20)throw Error('Neispravan zapis bodovanja.');
  const result=defaultGame();result.screen=raw.screen;result.round=raw.round;
  result.difficulty=raw.difficulty??'easy';if(!difficultyById(result.difficulty))throw Error('Neispravan odabir težine.');
  for(const [id,r]of Object.entries(raw.answers)){
    const t=taskById(id);if(!t||!obj(r)||!int(r.tries,0,10000)||typeof r.help!=='boolean'||(r.tries===0?(r.first!==null||r.last!==null):(!validValue(t,r.first)||!validValue(t,r.last)))||(r.tries===1&&JSON.stringify(r.first)!==JSON.stringify(r.last)))throw Error('Neispravan odgovor za automatsko bodovanje.');
    const firstMode=r.firstMode===undefined?(r.tries?'moderate':null):r.firstMode,lastMode=r.lastMode===undefined?(r.tries?'moderate':null):r.lastMode;
    if(r.tries?(!difficultyById(firstMode)||!difficultyById(lastMode)):(firstMode!==null||lastMode!==null))throw Error('Neispravna težina odgovora.');
    result.answers[id]={first:copy(r.first),last:copy(r.last),tries:r.tries,help:r.help,firstMode,lastMode};
  }
  for(const [field,allowed]of [['observed',courseKeys],['mechanisms',mechanismKeys],['labs',Array.from({length:11},(_,i)=>i)]]){
    const a=raw[field];if(!Array.isArray(a)||a.length>allowed.length||new Set(a).size!==a.length||a.some(v=>!allowed.includes(v)))throw Error('Neispravni dokazi aktivnosti.');result[field]=[...a];
  }
  const seen=new Set();for(const run of raw.runs){const mode=run?.difficulty??'moderate';if(!obj(run)||!difficultyById(mode)||!int(run.round,1,raw.round)||seen.has(run.round)||!Array.isArray(run.answers)||run.answers.length!==10||run.answers.some((v,i)=>!int(v,0,finalQuestions(run.round,mode)[i].options.length-1)))throw Error('Neispravan rezultat završnog izazova.');seen.add(run.round);result.runs.push({round:run.round,difficulty:mode,answers:[...run.answers]});}
  if(raw.active!==null){const a=raw.active,mode=a?.difficulty??'moderate';if(!obj(a)||!difficultyById(mode)||a.round!==raw.round||seen.has(a.round)||!int(a.round,1,100000)||!int(a.cursor,0,9)||!Array.isArray(a.answers)||a.answers.length!==10||a.answers.some((v,i)=>v!==null&&!int(v,0,finalQuestions(a.round,mode)[i].options.length-1)))throw Error('Neispravan pokušaj završnog izazova.');result.active={round:a.round,difficulty:mode,cursor:a.cursor,answers:[...a.answers]};}
  const legacy=raw.legacy||{};
  if(!obj(legacy)||Object.keys(legacy).length>MECHANISMS.length)throw Error('Neispravna arhiva bilježaka.');
  for(const [id,d] of Object.entries(legacy)){
    const m=MECHANISMS.find(m=>m.id===id);
    if(!m||!obj(d)||!m.variants.some(v=>v[0]===d.variant)||typeof d.prediction!=='string'||d.prediction.length>1200||typeof d.reflection!=='string'||d.reflection.length>2000)throw Error('Neispravan raniji nacrt pokusa.');
    result.legacy[id]={variant:d.variant,prediction:d.prediction,reflection:d.reflection};
  }
  // Scores and badges are derived. A supplied XP value is never trusted.
  return result;
}
export function labChecks(state){const l=state.learning.evidence,f=state.nodes.find(n=>n.parent==='docs'&&n.type==='dir'&&n.name==='Moja_vjezba'),n=f&&state.nodes.find(n=>n.parent===f.id&&n.type==='file'&&n.name==='biljeska.txt');return [[!!f,!!n&&n.content.trim().length>=20,state.lesson.minimized&&state.lesson.ended],[!!l.copied,!!l.restored,!!l.backupExport],[!!l.permissionChanged,!!l.permissionGroup,!!l.permissionDenied],[!!l.cpu_fcfs,!!l.cpu_rr],[!!l.cpu_io,!!l.cpu_sjf],[!!l.memory_fifo,!!l.memory_lru],[!!l.disk_fragmented,!!l.disk_compacted],[!!l.terminalWrite,!!l.terminalRead],[!!l.network_local,!!l.network_dns,!!l.network_http],[!!l.network_case_dns,!!l.network_case_gateway,!!l.network_case_icmp],[!!l.versionSaved,!!l.versionRecovered,!!l.backupReviewed,!!l.backupRecovered]];}
export function syncGameEvidence(state){
  const g=state.learning.game;const add=(key,value)=>{if(!g[key].includes(value))g[key].push(value);};
  for(const l of COURSE){const r=state.learning.course.records[l.id],v=r&&l.experiment.variants.find(v=>v.id===r.variant);if(v&&r.prediction!==null&&r.step===v.steps.length-1)add('observed',l.id+':'+v.id);}
  for(const l of MECHANISMS){const d=state.learning.explorer.drafts[l.id];if(d&&d.step===traceMechanism(l.id,d.variant).steps.length)add('mechanisms',l.id+':'+d.variant);}
  labChecks(state).forEach((checks,i)=>{if(checks.every(Boolean))add('labs',i);});
}
export function taskBlock(state,t){
  const g=state.learning.game;
  if(t.area==='lab')return g.labs.includes(t.index)?'':'Najprije dovrši označene radnje laboratorija.';
  if(t.area==='mechanism')return g.mechanisms.includes(t.lesson+':'+t.variant)?'':'Najprije prođi prikazani mehanizam do kraja.';
  if(t.area==='extension'){
    if(g.difficulty==='easy'||t.difficulty==='hard'&&g.difficulty!=='hard')return 'Za ovaj zadatak odaberi odgovarajuću višu težinu.';
    if(!completedLesson(g,t.lesson))return 'Najprije prikupi osnovnih 100 XP ove misije.';
    if(t.difficulty==='hard'&&!solved(g,`c-${t.lesson}-apply`))return 'Najprije riješi primjenu za Moderate.';
    return '';
  }
  if(t.id.endsWith('-warm'))return '';
  if(!solved(g,`c-${t.lesson}-warm`))return 'Najprije riješi kratku provjeru u koraku Razumij.';
  if(t.id.endsWith('-order')){const l=COURSE.find(l=>l.id===t.lesson),r=state.learning.course.records[l.id];return r?.exampleSeen===l.example.steps.length-1?'':'Najprije prođi riješeni primjer do kraja.';}
  if(!solved(g,`c-${t.lesson}-order`))return 'Najprije složi redoslijed nakon riješenog primjera.';
  if(t.id.endsWith('-compare'))return COURSE.find(l=>l.id===t.lesson).experiment.variants.every(v=>g.observed.includes(t.lesson+':'+v.id))?'':'Najprije dovrši sve prikazane uvjete pokusa i usporedi ishode.';
  if(!solved(g,`c-${t.lesson}-compare`))return 'Najprije usporedi dva uvjeta i riješi pitanje u koraku Isprobaj.';
  if(t.id.endsWith('-transfer')&&![0,1].every(i=>solved(g,`c-${t.lesson}-q${i}`)))return 'Najprije riješi obje kratke provjere u ovom koraku.';
  return '';
}
export function submitTask(state,id,value){const t=taskById(id),g=state.learning.game;if(t?.type==='order'&&Array.isArray(value)&&new Set(value).size!==value.length)throw Error('Svaki događaj odaberi samo jednom.');if(!t||!validValue(t,value))throw Error('Odaberi odgovor u svim poljima.');const block=taskBlock(state,t);if(block)throw Error(block==='Najprije dovrši označene radnje laboratorija.'?'Najprije dovrši označene radnje laboratorija.':block);if(solved(g,id))return false;const r=g.answers[id]||blankAnswer();if(!r.first){r.first=[...value];r.firstMode=g.difficulty;}r.last=[...value];r.lastMode=g.difficulty;r.tries=Math.min(10000,r.tries+1);g.answers[id]=r;return correct(t,value);}
export function revealHint(state,id){const t=taskById(id),g=state.learning.game;if(!t)throw Error('Nepoznat zadatak.');if(solved(g,id))return;if(g.difficulty==='hard'&&['course','extension'].includes(t.area)&&!g.answers[id]?.tries)throw Error('Na težini Hard najprije pokušaj samostalno.');g.answers[id]||=blankAnswer();g.answers[id].help=true;}
export function startFinal(state){const g=state.learning.game;if(g.active){g.screen='final';return;}if(!finalUnlocked(g))throw Error('Za završni izazov dovrši svih osam misija na odabranoj težini.');g.round++;g.active={round:g.round,difficulty:g.difficulty,cursor:0,answers:Array(10).fill(null)};g.screen='final';}
export function answerFinal(state,index,value){const a=state.learning.game.active;if(!a||!int(index,0,9)||!int(value,0,finalQuestions(a.round,a.difficulty)[index].options.length-1))throw Error('Neispravan odgovor završnog izazova.');a.answers[index]=value;}
export function finishFinal(state){
  const g=state.learning.game,a=g.active;if(!a||a.answers.some(v=>v===null))throw Error('Odgovori na svih deset pitanja prije predaje.');
  const score=runScore(a);g.runs.push({round:a.round,difficulty:a.difficulty,answers:[...a.answers]});g.active=null;
  if(g.runs.length>20){
    // Preserve a best attempt for EACH difficulty as well as the newly submitted attempt.
    const keep=new Set([g.runs.at(-1).round]);for(const d of DIFFICULTIES){const runs=g.runs.filter(r=>r.difficulty===d.id);if(runs.length)keep.add(runs.reduce((a,b)=>runScore(b)>runScore(a)?b:a).round);}
    g.runs.splice(g.runs.findIndex(r=>!keep.has(r.round)),1);
  }
  return score;
}
export function gameStats(state){
  const g=state.learning.game,course=TASKS.filter(t=>['course','extension'].includes(t.area)&&solved(g,t.id)).reduce((s,t)=>s+t.points,0),lab=g.labs.length*10+TASKS.filter(t=>t.area==='lab'&&solved(g,t.id)).reduce((s,t)=>s+t.points,0),mechanisms=TASKS.filter(t=>t.area==='mechanism'&&solved(g,t.id)).reduce((s,t)=>s+t.points,0);
  const net=state.learning.network.records.filter(r=>r.diagnosis!==null&&r.diagnosis!==undefined&&r.diagnosis===NETWORK_DIAGNOSES[r.id]?.answer).length*20,final=Math.max(0,...g.runs.map(runScore)),shell=shellStats(state.learning.shell).total,total=course+lab+mechanisms+net+final+shell;
  const attempted=Object.entries(g.answers).filter(([,r])=>r.tries>0),first=attempted.filter(([id,r])=>!r.help&&correct(taskById(id),r.first)).length,help=attempted.filter(([,r])=>r.help).length;
  const levels=[[0,'Početnik'],[150,'Istraživač'],[400,'Analitičar'],[700,'Poznavatelj sustava'],[1000,'OS navigator']];const level=levels.filter(([n])=>total>=n).at(-1),next=levels[levels.indexOf(level)+1];
  return {course,lab,mechanisms,net,final,shell,total,max:MAX_XP,first,attempted:attempted.length,help,level:levels.indexOf(level)+1,title:level[1],next:next?.[0]??null};
}
export function badges(state){const g=state.learning.game,s=gameStats(state);return [
 ['start','Prvi korak','Dovrši osnovnih 100 XP prve misije.',completedLesson(g,'hardware')],
 ['basics','Čvrsti temelji','Riješi osnovne zadatke u svih šest početnih misija.',COURSE.filter(l=>l.group==='Osnove').every(l=>completedLesson(g,l.id))],
 ['compare','Istraživač uvjeta','Prođi svih 18 uvjeta u vođenim pokusima.',g.observed.length===courseKeys.length],
 ['retry','Učim iz pogreške','Ispravi barem jedan prethodno pogrešan odgovor.',Object.entries(g.answers).some(([id,r])=>r.first&&!correct(taskById(id),r.first)&&solved(g,id))],
 ['sync','Zajednički podatci','Riješi osnovne zadatke o dretvama i zastoju.',completedLesson(g,'threads')&&completedLesson(g,'deadlock')],
 ['lab','Praktičar','Dovrši radnje i zaključke u tri laboratorija.',g.labs.filter(i=>solved(g,'lab-'+i)).length>=3],
 ['cmd','CMD istraživač','Dovrši svih pet zadataka u svih šest DOS/CMD razina.',shellStats(state.learning.shell).cmd===600],
 ['powershell','PowerShell istraživač','Dovrši svih pet zadataka u svih šest PowerShell razina.',shellStats(state.learning.shell).powershell===600],
 ['linux','Shell istraživač','Dovrši svih pet zadataka u svih šest Linux razina.',shellStats(state.learning.shell).linux===600],
 ['final','Povezujem OS','Ostvari najmanje 80/100 na završnom izazovu.',s.final>=80]
 ].map(([id,title,description,earned])=>({id,title,description,earned}));}
export function reviewTasks(game){return TASKS.filter(t=>game.answers[t.id]?.tries&&!solved(game,t.id));}
export function answerText(t,value){if(!value)return 'Nije odgovoreno';if(t.type==='choice')return t.options[value[0]];if(t.type==='pair')return t.fields.map((f,i)=>f.label+': '+f.options[value[i]]).join(' · ');return value.map((v,i)=>(i+1)+'. '+t.items[v]).join(' → ');}
export function scoreReport(state,esc){
  const s=gameStats(state),g=state.learning.game,b=badges(state),answered=TASKS.filter(t=>g.answers[t.id]?.tries);
  return `<h2>Automatski bodovi · ${s.total}/${s.max} XP</h2><p>Rang ${s.level}: ${esc(s.title)}. Prvi odgovor točan bez zatražene pomoći: ${s.first}/${s.attempted} zadataka. Pomoć korištena u ${s.help} zadataka.</p><table><tr><th>Aktivnost</th><th>Bodovi</th></tr>${[['Misije i dodatni slučajevi',s.course,1120],['Laboratoriji',s.lab,220],['Detaljni mehanizmi',s.mechanisms,140],['Mrežni izazovi',s.net,140],['DOS/CMD, Linux Shell i PowerShell',s.shell,SHELL_MAX_XP],['Završni izazov — najbolji rezultat',s.final,100]].map(([a,n,m])=>`<tr><td>${a}</td><td>${n}/${m}</td></tr>`).join('')}</table><p>Značke: ${b.filter(b=>b.earned).map(b=>esc(b.title)).join(', ')||'Još nema osvojenih znački.'}</p><p class="report-note">XP označava riješene zadatke uz mogućnost ispravka. Završni izazov daje odvojeni rezultat bez pomoći unutar pokušaja. Bodovi se računaju lokalno iz odgovora i dokaza aktivnosti; nisu zaštićeni ispitni zapis. Mrežne dijagnoze i vježbe terminala nisu uključene u statistiku prvih odgovora. Easy sadrži ugrađeno vođenje; prvi odgovori na različitim težinama nisu izravno usporedivi.</p><table><tr><th>Misija</th><th>Napredak</th></tr>${COURSE.map(l=>`<tr><td>${esc(l.title)}</td><td>${pathXP(g,l.id)}/${difficultyById(g.difficulty).target} XP · ${difficultyById(g.difficulty).label}</td></tr>`).join('')}</table>${shellReport(state.learning.shell,esc)}<h2>Automatska provjera odgovora</h2>${answered.map(t=>{const r=g.answers[t.id];return `<section class="report-lesson"><h3>${esc(t.q)}</h3><p>Prvi odgovor: ${esc(answerText(t,r.first))}</p><p>Zadnji odgovor: ${esc(answerText(t,r.last))}</p><p><strong>${solved(g,t.id)?'Točno':'Još nije točno'} · ${solved(g,t.id)?t.points:0}/${t.points} XP.</strong> Pokušaji: ${r.tries} · težina prvog / zadnjeg: ${r.firstMode} / ${r.lastMode} · pomoć: ${r.help?'korištena':'nije korištena'}.</p><p>${esc(t.why)}</p></section>`;}).join('')||'<p>Još nema predanih odgovora.</p>'}<h2>Završni izazov</h2><p>Najbolji rezultati po težini: ${DIFFICULTIES.map(d=>d.label+": "+bestFinal(g,d.id)+"/100").join(" · ")}. U XP ulazi jedan najbolji rezultat.</p>${g.active?`<p>Pokušaj ${g.active.round} · ${g.active.difficulty} u tijeku: ${g.active.answers.filter(v=>v!==null).length}/10 odgovora. Rezultat se prikazuje nakon predaje.</p>`:''}${g.runs.map(r=>`<p>Pokušaj ${r.round} · ${r.difficulty}: <strong>${runScore(r)}/100</strong>.</p>`).join('')||'<p>Još nema predanih pokušaja.</p>'}${g.runs.length?finalQuestions(g.runs.at(-1).round,g.runs.at(-1).difficulty).map((q,i)=>`<section class="report-lesson"><h3>${esc(q.q)}</h3><p>Odgovor: ${esc(q.options[g.runs.at(-1).answers[i]])}. ${q.answer===g.runs.at(-1).answers[i]?'Točno · 10 bodova.':'Netočno · 0 bodova.'}</p><p>${esc(q.why)}</p></section>`).join(''):''}`;
}
export function scoreReportText(state){const s=gameStats(state),g=state.learning.game;return `AUTOMATSKO BODOVANJE\nUkupno: ${s.total}/${s.max} XP\nRang ${s.level}: ${s.title}\nMisije: ${s.course}/1120; laboratoriji: ${s.lab}/220; mehanizmi: ${s.mechanisms}/140; mreža: ${s.net}/140.\nZavršni izazov (najbolji): ${s.final}/100\nPo težini: ${DIFFICULTIES.map(d=>d.label+": "+bestFinal(g,d.id)+"/100").join(" · ")}\nPrvi odgovor točan bez zatražene pomoći: ${s.first}/${s.attempted} (bez mrežnih dijagnoza i vježbi terminala)\n`+COURSE.map(l=>l.title+': '+pathXP(g,l.id)+'/'+difficultyById(g.difficulty).target+' XP · '+difficultyById(g.difficulty).label).join('\n')+'\n\n'+shellReportText(state.learning.shell)+'\n\nODGOVORI\n'+TASKS.filter(t=>g.answers[t.id]?.tries).map(t=>{const r=g.answers[t.id];return [t.q,'Prvi: '+answerText(t,r.first),'Zadnji: '+answerText(t,r.last),`${solved(g,t.id)?t.points:0}/${t.points} XP · pokušaji: ${r.tries} · težina prvog / zadnjeg: ${r.firstMode} / ${r.lastMode} · pomoć: ${r.help?'da':'ne'}`,t.why].join('\n');}).join('\n\n')+'\n\nZAVRŠNI POKUŠAJI\n'+g.runs.map(r=>`Pokušaj ${r.round} · ${r.difficulty}: ${runScore(r)}/100`).join('\n');}
