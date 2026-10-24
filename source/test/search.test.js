import test from 'node:test';
import assert from 'node:assert/strict';
import {FileSystem,seed,clone} from '../public/orbit/core.js';
import {searchWorkspace} from '../public/orbit/search.js';
test('Search finds case-insensitive literal names and contents without mutating the workspace',()=>{
 const fs=new FileSystem(seed()),n=fs.create('docs','Bilješka.txt','file','Moj zaključak: DNS i DHCP su različite usluge.');const before=clone(fs.state);
 assert.equal(searchWorkspace(fs,{query:'BILJEŠKA'})[0].id,n.id);
 assert.equal(searchWorkspace(fs,{query:'dns i dhcp'})[0].match,'content');
 assert.equal(searchWorkspace(fs,{query:'dns i dhcp',content:false}).length,0);
 assert.equal(searchWorkspace(fs,{query:'.*'}).length,0);assert.equal(searchWorkspace(fs,{query:'  '}).length,0);
 assert.deepEqual(fs.state,before);
});
test('Scope and type filters separate folders, active files and stored versions',()=>{
 const fs=new FileSystem(seed()),d=fs.create('docs','Projekt','dir'),f=fs.create(d.id,'Projekt.txt','file','Test'),l=fs.create('labs','Projekt.txt','file','Drugi');fs.saveVersion(f.id);
 assert.equal(searchWorkspace(fs,{query:'projekt',scope:'docs'}).length,2);
 assert.deepEqual(searchWorkspace(fs,{query:'projekt',scope:'labs'}).map(r=>r.id),[l.id]);
 assert.deepEqual(searchWorkspace(fs,{query:'projekt',kind:'dir'}).map(r=>r.id),[d.id]);
 fs.trash(d.id);assert.deepEqual(searchWorkspace(fs,{query:'projekt'}).map(r=>r.id),[l.id]);
});
test('Search excludes unreadable files and does not traverse folders without list permission',()=>{
 const fs=new FileSystem(seed()),d=fs.create('docs','Privatno','dir'),f=fs.create(d.id,'tajna.txt','file','Posebna rečenica');fs.chmod(f.id,'640');fs.switchUser('gost');
 assert.equal(searchWorkspace(fs,{query:'tajna'}).length,0);assert.equal(searchWorkspace(fs,{query:'Posebna'}).length,0);
 fs.switchUser('kolega');assert.equal(searchWorkspace(fs,{query:'Posebna'}).length,1);
 fs.switchUser('ucenik');fs.chmod(d.id,'711');fs.switchUser('kolega');assert.equal(searchWorkspace(fs,{query:'Posebna'}).length,0);
 fs.switchUser('nastavnik');assert.equal(searchWorkspace(fs,{query:'Posebna'}).length,1);
});
test('Snippets are bounded plain data and name matches sort before content matches',()=>{
 const fs=new FileSystem(seed()),a=fs.create('docs','a.txt','file','x'.repeat(500)+'needle <script>'),b=fs.create('docs','needle.txt','file','<img onerror=alert(1)>');
 const rows=searchWorkspace(fs,{query:'needle'});assert.equal(rows[0].id,b.id);assert.equal(rows[1].id,a.id);assert.ok(rows[1].snippet.length<=182);assert.ok(rows[1].snippet.includes('needle'));
 assert.throws(()=>searchWorkspace(fs,{query:'x'.repeat(101)}));assert.throws(()=>searchWorkspace(fs,{query:'a',scope:'unknown'}));
});
