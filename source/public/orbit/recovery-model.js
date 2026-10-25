import {requireSameStudent,validateStudent} from './identity.js';
import {validateState,uid} from './core.js';
import {signBackup,verifyBackup} from './backup-integrity.js';

export async function serializeBackup(state,date=new Date().toISOString()){
  const workspace=validateState(state),student=validateStudent(workspace.student);
  if(!student)throw Error('Prije izvoza unesi ime i prezime.');
  if(typeof date!=='string'||!Number.isFinite(Date.parse(date)))throw Error('Neispravan datum izvoza.');
  const payload={format:'zljixos-backup',formatVersion:3,student,exportedAt:date,workspace};
  return JSON.stringify({...payload,integrity:await signBackup(payload)},null,2);
}
export async function parseBackup(text,expectedStudent){
  if(typeof text!=='string'||text.length>8000000)throw new Error('JSON kopija je prevelika.');
  let raw;try{raw=JSON.parse(text);}catch{throw new Error('Datoteka nije valjani JSON. Provjeri je li kopirana u cijelosti.');}
  if(raw?.format!=='zljixos-backup'||raw.formatVersion!==3)throw Error('Ova kopija nema podržan kontrolni potpis. Stare i nepotpisane JSON kopije više se ne učitavaju. Ako je rad još u izvornom pregledniku, otvori novo izdanje igre i ponovno izvezi JSON.');
  const {integrity,...payload}=raw;
  await verifyBackup(payload,integrity);
  if(typeof raw.exportedAt!=='string'||!Number.isFinite(Date.parse(raw.exportedAt)))throw Error('Neispravan datum kopije.');
  const state=validateState(raw.workspace),owner=validateStudent(raw.student);
  requireSameStudent(owner,state.student);
  if(expectedStudent)requireSameStudent(expectedStudent,state.student);
  return {state,exportedAt:raw.exportedAt,legacy:false,integrityVerified:true};
}
export function workspaceStats(state){return {files:state.nodes.filter(n=>n.type==='file').length,folders:state.nodes.filter(n=>n.type==='dir'&&n.id!=='root').length,versions:state.versions?.length||0,trash:state.archive.length,reflections:Object.values(state.learning.answers).filter(v=>v.trim()).length};}
export function nodePaths(nodes){
  const map=new Map(nodes.map(n=>[n.id,n])),paths=new Map();
  for(const n of nodes){const parts=[];let item=n;while(item&&item.id!=='root'){parts.unshift(item.name);item=map.get(item.parent);}paths.set(n.id,'/'+parts.join('/'));}return paths;
}
export function compareBackup(fs,incoming){
  if(fs.state.student)requireSameStudent(fs.state.student,incoming.student);
  const paths=nodePaths(incoming.nodes),livePaths=nodePaths(fs.state.nodes),live=new Map(fs.state.nodes.map(n=>[livePaths.get(n.id).toLocaleLowerCase('hr'),n]));
  return incoming.nodes.filter(n=>n.type==='file').map(n=>{
    const path=paths.get(n.id),current=live.get(path.toLocaleLowerCase('hr'));
    const readable=current?.type==='file'&&fs.can(current.id,'r');
    const status=!current?'missing':current.type!=='file'?'conflict':!readable?'blocked':current.content===n.content?'same':'changed';
    return {id:n.id,path,name:n.name,status,currentId:current?.id||null};
  }).sort((a,b)=>a.path.localeCompare(b.path,'hr'));
}
export function recoverSelected(fs,raw,selectedIds){
  const incoming=validateState(raw);
  if(fs.state.student)requireSameStudent(fs.state.student,incoming.student);
  if(!Array.isArray(selectedIds)||!selectedIds.length)throw new Error('Odaberi barem jednu datoteku iz kopije.');
  const wanted=new Set(selectedIds),files=incoming.nodes.filter(n=>wanted.has(n.id)&&n.type==='file');
  if(wanted.size!==files.length)throw new Error('Odabir sadrži nepostojeću datoteku ili mapu.');
  fs.require('docs','wx');
  const source=new Map(incoming.nodes.map(n=>[n.id,n]));let number=1,name;
  do{name='Oporavak-'+number++;}while(fs.children('docs').some(n=>n.name.toLocaleLowerCase('hr')===name.toLocaleLowerCase('hr')));
  const destination={id:uid(),parent:'docs',name,type:'dir',owner:fs.user.id,group:fs.user.groups[0],mode:'755'},newNodes=[destination],mapped=new Map([['root',destination.id]]);
  function parentFor(sourceId){
    if(mapped.has(sourceId))return mapped.get(sourceId);
    const n=source.get(sourceId),parent=parentFor(n.parent),id=uid();
    newNodes.push({id,parent,name:n.name,type:'dir',owner:fs.user.id,group:fs.user.groups[0],mode:'755'});mapped.set(sourceId,id);return id;
  }
  for(const f of files)newNodes.push({id:uid(),parent:parentFor(f.parent),name:f.name,type:'file',content:f.content,owner:fs.user.id,group:fs.user.groups[0],mode:'644'});
  return fs.transact(()=>{fs.state.nodes.push(...newNodes);fs.event('oporavak',files.length+' datoteka iz kopije → /Dokumenti/'+name);fs.state.learning.evidence.backupRecovered=true;return {folderId:destination.id,path:'/Dokumenti/'+name,count:files.length};});
}
