import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudent,studentKey,studentName,requireSameStudent,studentFilename} from '../public/orbit/identity.js';
import {seed,FileSystem,validateState} from '../public/orbit/core.js';
import {createLocalStore,studentStorageKey} from '../public/orbit/local-store.js';
import {serializeBackup,parseBackup,recoverSelected,compareBackup} from '../public/orbit/recovery-model.js';
import {buildWorkReport,reportDocument} from '../public/orbit/reports.js';
import {shellCommand} from '../public/orbit/shell-model.js';
import {gameStats} from '../public/orbit/game-model.js';
const ana=createStudent('Ana','Horvat'),ivo=createStudent('Ivo','Ivić');
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
function score(fs){fs.transact(()=>shellCommand(fs.state.learning.shell,'powershell-1','Get-Location','easy'));}
test('both name parts are mandatory and Unicode, hyphenated and multipart names are supported',()=>{
 for(const [a,b] of [['','Horvat'],['Ana',''],['123','Horvat'],['<img>','X'],['Ana','X'.repeat(51)]])assert.throws(()=>createStudent(a,b));
 assert.equal(studentName(createStudent('  Ana   Marija  ','Živković-Horvat')),'Ana Marija Živković-Horvat');
 assert.equal(studentKey(createStudent(' IVA ','Ivić')),studentKey(createStudent('Iva','Ivić')));
 assert.equal(studentKey(createStudent('Željko','Ivić')),studentKey(createStudent('Z\u030celjko','Ivić')));
 assert.notEqual(studentKey(createStudent('Ana','B C')),studentKey(createStudent('Ana B','C')));
 assert.notEqual(studentKey(createStudent('Iva','Ivić')),studentKey(createStudent('Iva','Ivic')));
});
test('two students in one browser have separate scores and both resume their own work',()=>{
 const storage=memory(),a=createLocalStore(storage,ana);a.flush();const afs=new FileSystem(a.initial,a.persist);score(afs);
 const b=createLocalStore(storage,ivo);b.flush();const bfs=new FileSystem(b.initial,b.persist);assert.equal(gameStats(bfs.state).total,0);
 bfs.write('welcome','Ivin tekst');assert.equal(a.checkForChanges(),false);
 assert.equal(gameStats(createLocalStore(storage,ana).initial).total,20);assert.equal(gameStats(createLocalStore(storage,ivo).initial).total,0);
 assert.notEqual(createLocalStore(storage,ana).initial.nodes.find(n=>n.id==='welcome').content,'Ivin tekst');
});
test('same-student portable backup keeps identity, shell commands and points',()=>{
 const fs=new FileSystem(seed(ana));score(fs);const raw=serializeBackup(fs.state),copy=parseBackup(raw,createStudent('ana','HORVAT'));
 assert.deepEqual(copy.state.student,ana);assert.equal(gameStats(copy.state).total,20);assert.match(raw,/"firstName": "Ana"/);
 assert.match(studentFilename(ana,'rezultati','html'),/zljixOS-Ana-Horvat-rezultati.html/);
});
test('foreign and anonymous imports are rejected, including legacy raw workspaces',()=>{
 const foreign=new FileSystem(seed(ivo));score(foreign);
 for(const raw of [serializeBackup(foreign.state),JSON.stringify(foreign.state)])assert.throws(()=>parseBackup(raw,ana),/Ivo Ivić.*Ana Horvat.*Tuđi/);
 for(const raw of [serializeBackup(seed()),JSON.stringify(seed()),JSON.stringify({format:'orbit-backup',formatVersion:1,exportedAt:new Date().toISOString(),workspace:seed()})])assert.throws(()=>parseBackup(raw,ana),/nema ime/);
});
test('a conflicting owner in the JSON header is rejected',()=>{
 const raw=JSON.parse(serializeBackup(seed(ivo)));raw.student=ana;assert.throws(()=>parseBackup(JSON.stringify(raw),ana),/Tuđi/);
 delete raw.workspace.student;assert.throws(()=>parseBackup(JSON.stringify(raw),ana),/nema ime/);
});
test('the store rejects identity changes atomically, even if the editable work label matches',()=>{
 const storage=memory(),store=createLocalStore(storage,ana);store.flush();const fs=new FileSystem(store.initial,store.persist);score(fs);const saved=storage.getItem(store.key);
 const foreign=seed(ivo);foreign.learning.label='Ana Horvat';assert.throws(()=>fs.transact(()=>{fs.state=foreign;}),/Tuđi/);
 assert.equal(gameStats(fs.state).total,20);assert.equal(storage.getItem(store.key),saved);assert.deepEqual(fs.state.student,ana);
 assert.throws(()=>store.persist(seed()),/nema ime/);
});
test('a foreign record placed under a student storage key is not displayed or overwritten',()=>{
 const storage=memory(),raw=JSON.stringify({format:'orbit-local',version:1,revision:1,state:seed(ivo)});storage.setItem(studentStorageKey(ana),raw);
 const store=createLocalStore(storage,ana);assert.equal(store.status().kind,'corrupt');assert.deepEqual(store.initial.student,ana);assert.equal(store.flush(),false);assert.equal(storage.getItem(store.key),raw);
});
test('recovery comparison and selected-file restore also reject foreign work',()=>{
 const fs=new FileSystem(seed(ana)),foreign=validateState(seed(ivo));assert.throws(()=>compareBackup(fs,foreign),/Tuđi/);assert.throws(()=>recoverSelected(fs,foreign,['welcome']),/Tuđi/);
 assert.equal(fs.state.nodes.length,seed(ana).nodes.length);
});
test('starting a fresh attempt preserves the owner and does not touch another student',()=>{
 const storage=memory(),store=createLocalStore(storage,ana);store.flush();const fs=new FileSystem(store.initial,store.persist);score(fs);
 const other=createLocalStore(storage,ivo);other.flush();const raw=storage.getItem(other.key);
 fs.transact(()=>{fs.state=seed(fs.state.student);});assert.equal(gameStats(fs.state).total,0);assert.deepEqual(fs.state.student,ana);assert.equal(storage.getItem(other.key),raw);
});
test('HTML/print report identifies the owner independently of the editable label',()=>{
 const state=seed(ana);state.learning.label='Ivo Ivić';const html=buildWorkReport({lessons:[],checks:[],learning:state.learning,student:state.student});
 assert.match(html,/<strong data-report-owner>Ana Horvat<\/strong>/);assert.match(html,/<strong data-report-label>Ivo Ivić<\/strong>/);
 assert.match(reportDocument(html),/zljixOS/);assert.throws(()=>requireSameStudent(ana,null),/nema ime/);
});
