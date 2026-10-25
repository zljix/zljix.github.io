import {shellSeed,executeShell,shellPath} from './shell-engine.js';

// An independent, reproducible worked example. Never touches the scored record.
export function shellDemonstration(lesson){
 let entries=lesson.entries;
 if(lesson.num===3)entries=[{path:lesson.dialect==='powershell'?'rad.txt':'izvjestaj.txt',content:'Primjer izvjestaja.\n'},{path:'arhiva',type:'dir'}];
 if(lesson.id==='cmd-5')entries=[{path:'radno/visak.txt',content:'Privremeni primjer.\n'},{path:'stari.txt',content:'Sacuvaj kopiju.\n'},{path:'arhiva',type:'dir'}];
 if(lesson.id==='linux-5')entries=[...lesson.entries,{path:'primjer.txt',content:'Tekst s dozvolama.\n',mode:'640'}];
 if(lesson.num===6&&lesson.dialect!=='powershell')entries=[...entries,{path:'privremeno.txt',content:'Privremeni primjer.\n'},{path:'prazna_mapa',type:'dir'}];
 let state=shellSeed(lesson.dialect,entries);
 const initial={path:shellPath(state),files:state.nodes.filter(n=>n.path!=='/').map(n=>shellPath(state,n.path))};
 const steps=lesson.examples.map(example=>{
  const before=state,result=executeShell(state,example.command);state=result.state;
  const changed=state.nodes.filter(n=>!before.nodes.some(p=>p.path===n.path&&p.type===n.type&&p.content===n.content&&p.mode===n.mode)).map(n=>shellPath(state,n.path));
  const removed=before.nodes.filter(n=>!state.nodes.some(p=>p.path===n.path)).map(n=>shellPath(before,n.path));
  return {...example,ok:result.ok,output:result.output,before:shellPath(before),after:shellPath(state),changed,removed};
 });
 return {initial,steps};
}
