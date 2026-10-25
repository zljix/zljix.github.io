import {SHELL_LESSONS,SHELL_MODES,SHELL_MAX_XP,shellLesson} from './shell-data.js';
import {shellSeed,executeShell,shellPrompt} from './shell-engine.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const cache=new Map();
export function defaultShell(){return {version:1,track:'cmd',level:'cmd-1',view:'map',records:{}};}
// Only command/hint/reset history is persisted. Disk contents, completed flags,
// XP and transcripts are reconstructed; imported totals are never trusted.
export function replayShell(id,record={events:[]}){
  const lesson=shellLesson(id);if(!lesson)throw Error('Nepoznata razina terminala.');
  if(!object(record)||!Array.isArray(record.events)||record.events.length>400)throw Error('Neispravan ili prevelik zapis razine terminala.');
  const signature=JSON.stringify(record.events),cached=cache.get(id);
  if(cached?.signature===signature)return copy(cached.result);
  let state=shellSeed(lesson.dialect,lesson.entries),cursor=0,log=[],last=null;
  const earned=Array(5).fill(false),attempts=Array(5).fill(0),help=Array(5).fill(false),firstMode=Array(5).fill(null);
  for(const event of record.events){
    if(!object(event))throw Error('Neispravna radnja terminala.');
    if(event.type==='reset'){state=shellSeed(lesson.dialect,lesson.entries);cursor=0;log=[];last=null;continue;}
    if(!SHELL_MODES[event.mode])throw Error('Neispravna težina terminala.');
    if(event.type==='hint'){
      if(cursor>=SHELL_MODES[event.mode].count||event.mode==='hard'&&!attempts[cursor])throw Error('Pomoć za ovaj zadatak još nije dostupna.');
      help[cursor]=true;continue;
    }
    if(event.type!=='command'||typeof event.line!=='string'||!event.line.trim()||event.line.length>400||/[\r\n\u0000]/.test(event.line))throw Error('Neispravan unos u terminalu.');
    if(cursor>=SHELL_MODES[event.mode].count)throw Error('Ova putanja razine već je dovršena.');
    const prompt=shellPrompt(state),result=executeShell(state,event.line),step=cursor;
    state=result.state;attempts[step]++;firstMode[step]??=event.mode;
    const completed=lesson.steps[step].check(result),fresh=completed&&!earned[step];
    if(completed){earned[step]=true;cursor++;}
    if(result.clear)log=[];
    log.push({prompt,line:event.line,output:result.output,ok:result.ok,code:result.code,step,completed,fresh});
    if(log.length>30)log.shift();last=log.at(-1);
  }
  const result={state,cursor,earned,attempts,help,firstMode,log,last,xp:earned.filter(Boolean).length*20};
  cache.set(id,{signature,result:copy(result)});return result;
}
export function validateShell(raw){
  if(raw===undefined)return defaultShell();
  if(!object(raw)||raw.version!==1||!['cmd','linux','powershell'].includes(raw.track)||!shellLesson(raw.level)||!['map','intro','practice'].includes(raw.view)||!object(raw.records)||Object.keys(raw.records).length>SHELL_LESSONS.length)throw Error('Neispravan napredak terminalskih razina.');
  const next={version:1,track:raw.track,level:raw.level,view:raw.view,records:{}};
  for(const [id,r] of Object.entries(raw.records)){replayShell(id,r);next.records[id]={events:r.events.map(e=>e.type==='reset'?{type:'reset'}:e.type==='hint'?{type:'hint',mode:e.mode}:{type:'command',line:e.line,mode:e.mode})};}
  return next;
}
export function shellProgress(shell,id){return replayShell(id,shell?.records[id]);}
export function shellStats(shell){const lessons=SHELL_LESSONS.map(l=>({id:l.id,dialect:l.dialect,...shellProgress(shell,l.id)}));return {total:lessons.reduce((n,r)=>n+r.xp,0),max:SHELL_MAX_XP,cmd:lessons.filter(l=>l.dialect==='cmd').reduce((n,r)=>n+r.xp,0),linux:lessons.filter(l=>l.dialect==='linux').reduce((n,r)=>n+r.xp,0),powershell:lessons.filter(l=>l.dialect==='powershell').reduce((n,r)=>n+r.xp,0),completed:lessons.filter(l=>l.earned.slice(0,3).every(Boolean)).length};}
export function shellUnlocked(shell,id){const l=shellLesson(id);return !!l&&(l.num===1||shellProgress(shell,l.dialect+'-'+(l.num-1)).earned.slice(0,3).every(Boolean));}
function add(shell,id,event){
  if(!shellUnlocked(shell,id))throw Error('Najprije dovrši tri temeljna zadatka prethodne razine ove putanje.');
  const record=shell.records[id]||{events:[]};if(record.events.length>=400)throw Error('Dosegnuto je 400 radnji ove razine. Izvezi rad prije pokretanja novog radnog prostora.');
  const next={events:[...record.events,event]},result=replayShell(id,next);shell.records[id]=next;return result;
}
export function shellCommand(shell,id,line,mode){return add(shell,id,{type:'command',line,mode});}
export function shellHint(shell,id,mode){return add(shell,id,{type:'hint',mode});}
export function resetShellLevel(shell,id){return add(shell,id,{type:'reset'});}
export function openShellLevel(shell,id){if(!shellUnlocked(shell,id))throw Error('Otvori prethodnu razinu i dovrši njezina tri temeljna zadatka.');shell.level=id;shell.track=shellLesson(id).dialect;shell.view='intro';}
export function shellReportText(shell){
  const stats=shellStats(shell);
  return ['DOS/CMD, LINUX SHELL I POWERSHELL',`Ukupno: ${stats.total}/${stats.max} XP. DOS/CMD: ${stats.cmd}/600; Linux: ${stats.linux}/600; PowerShell: ${stats.powershell}/600.`,
    'Svaki potvrđeni zadatak donosi 20 XP samo jednom. Dozvoljeni su pomoć, pogreške i ispravci.',
    ...SHELL_LESSONS.filter(l=>shell?.records[l.id]).flatMap(l=>{const r=shellProgress(shell,l.id);return ['',`${l.dialect.toUpperCase()} ${l.num}. ${l.title} — ${r.xp}/100 XP`,...l.steps.map((s,i)=>`${i+1}. ${s.title}: ${r.earned[i]?'riješeno, 20 XP':'nije riješeno'}; naredbi: ${r.attempts[i]}; prva težina: ${r.firstMode[i]||'—'}; zatražena pomoć: ${r.help[i]?'da':'ne'}.`)];})].join('\n');
}
export function shellReport(shell,esc){return '<h2>DOS/CMD, Linux Shell i PowerShell</h2><pre class="shell-report">'+esc(shellReportText(shell))+'</pre>';}
