import test from 'node:test';
import assert from 'node:assert/strict';
import {FileSystem,seed,validateState,tokenize} from '../public/orbit/core.js';

test('Filesystem supports nested paths, renaming and content persistence',()=>{
  let saved;const fs=new FileSystem(seed(),s=>{saved=JSON.stringify(s);});
  const folder=fs.create('docs','Moja_vjezba','dir');const n=fs.create(folder.id,'biljeska.txt','file','Prvi tekst.');
  assert.equal(fs.resolve('/Dokumenti/Moja_vjezba/biljeska.txt').id,n.id);
  assert.equal(fs.resolve('../..',folder.id).id,'root');
  fs.write(n.id,'Operacijski sustav upravlja resursima.');fs.rename(n.id,'novi naziv.txt');
  const restored=new FileSystem(JSON.parse(saved));assert.equal(restored.resolve('novi naziv.txt',folder.id).content,'Operacijski sustav upravlja resursima.');
  assert.equal(restored.path(n.id),'/Dokumenti/Moja_vjezba/novi naziv.txt');
});
test('Invalid names, duplicates and accidental nonempty removal are refused',()=>{
  const fs=new FileSystem(seed());assert.throws(()=>fs.create('docs','../van','file'));
  assert.throws(()=>fs.create('docs','dobrodosli.TXT','file'));
  const folder=fs.create('docs','test','dir');const file=fs.create(folder.id,'tekst','file');
  assert.throws(()=>fs.remove(folder.id));assert.ok(fs.get(file.id));
  fs.remove(folder.id,true);assert.equal(fs.get(file.id),undefined);
  assert.throws(()=>fs.remove('docs',true));assert.throws(()=>fs.rename('labs','drugo'));
});
test('Failed persistence rolls back changes without discarding earlier content',()=>{
  const fs=new FileSystem(seed(),()=>{throw new Error('quota');});const original=fs.get('welcome').content;
  assert.throws(()=>fs.write('welcome','novi tekst'),/quota/);assert.equal(fs.get('welcome').content,original);
  assert.throws(()=>fs.create('docs','test','dir'),/quota/);assert.equal(fs.children('docs').length,1);
});
test('Imported backups reject cycles, duplicate IDs, unsafe IDs and missing parents',()=>{
  for(const mutate of [
    s=>s.nodes.push({id:'a',parent:'b',name:'a',type:'dir'},{id:'b',parent:'a',name:'b',type:'dir'}),
    s=>s.nodes.push({...s.nodes[1]}),
    s=>s.nodes.push({id:'<unsafe>',parent:'root',name:'x',type:'dir'}),
    s=>s.nodes.push({id:'a',parent:'missing',name:'a',type:'file',content:''}),
    s=>s.nodes.find(n=>n.id==='docs').parent=null
  ]){const data=seed();mutate(data);assert.throws(()=>validateState(data));}
  assert.deepEqual(validateState(validateState(seed())),validateState(seed()));
});
test('Tokenizer handles quotes, spaces and actual redirection separately',()=>{
  assert.deepEqual(tokenize('mkdir "Moja mapa"'),['mkdir','Moja mapa']);
  const tokens=tokenize('echo "A > B" > "tekst 1.txt"');assert.deepEqual(tokens,['echo','A > B','>','tekst 1.txt']);assert.deepEqual(tokens.redirects,[2]);
  assert.deepEqual(tokenize('echo ">"').redirects,[]);assert.throws(()=>tokenize('echo "tekst'));
});
