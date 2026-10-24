import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../public/orbit/sw-template.js',import.meta.url),'utf8');
const scope='https://school.example/orbit/';
function worker({build='new',failInstall=false,stores=new Map()}={}){
  const handlers={},network=[],deleted=[];let claims=0;
  const caches={
    async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {
      async addAll(requests){if(failInstall)throw Error('download failed');for(const request of requests)data.set(request.url,{body:'cached '+request.url});},
      async match(url){return data.get(typeof url==='string'?url:url.url);}
    };},async keys(){return [...stores.keys()];},async delete(name){deleted.push(name);return stores.delete(name);}
  };
  vm.runInNewContext(source.replace('__ORBIT_BUILD__',build),{URL,Request,caches,fetch:async request=>{network.push(request.url);return {body:'network'};},self:{registration:{scope},clients:{claim:async()=>{claims++;}},addEventListener:(type,fn)=>handlers[type]=fn}});
  async function dispatch(type,extra={}){let work,result;handlers[type]({...extra,waitUntil:promise=>work=promise,respondWith:promise=>result=promise});await work;return result===undefined?undefined:await result;}
  async function status(){let answer;await dispatch('message',{data:{type:'ORBIT_OFFLINE_STATUS'},ports:[{postMessage:value=>answer=value}]});return answer;}
  return {dispatch,status,stores,network,deleted,claims:()=>claims};
}
test('mobile offline readiness requires every application asset',async()=>{
  const w=worker();assert.equal((await w.status()).ready,false);
  await w.dispatch('install');assert.equal((await w.status()).ready,true);
  const cache=w.stores.get('orbit-mobile:'+scope+':new');cache.delete(scope+'icon-192.png');
  assert.equal((await w.status()).ready,false);
});
test('failed offline update removes incomplete cache and preserves previous version',async()=>{
  const old='orbit-mobile:'+scope+':old',stores=new Map([[old,new Map([['saved',{body:'old'}]])]]);
  const w=worker({stores,failInstall:true});await assert.rejects(w.dispatch('install'),/download failed/);
  assert.equal(stores.has(old),true);assert.equal(stores.has('orbit-mobile:'+scope+':new'),false);
});
test('activation removes only previous versions for the same scope',async()=>{
  const old='orbit-mobile:'+scope+':old',other='orbit-mobile:https://school.example/other/:old';
  const stores=new Map([[old,new Map()],[other,new Map()],['unrelated',new Map()]]),w=worker({stores});
  await w.dispatch('install');await w.dispatch('activate');
  assert.deepEqual(w.deleted,[old]);assert.equal(stores.has(other),true);assert.equal(stores.has('unrelated'),true);assert.equal(w.claims(),1);
});
test('cached home and install start URL work without a network request',async()=>{
  const w=worker();await w.dispatch('install');
  for(const url of [scope,scope+'index.html',scope+'index.html?from=home']){
    const result=await w.dispatch('fetch',{request:{url,method:'GET',mode:'navigate'}});
    assert.equal(result.body,'cached '+scope+'index.html');
  }
  assert.equal(w.network.length,0);
});
test('offline worker ignores outside URLs, writes and user file downloads',async()=>{
  const w=worker();await w.dispatch('install');
  for(const request of [
    {url:'https://other.example/orbit/index.html',method:'GET',mode:'navigate'},
    {url:'https://school.example/orbit-other/index.html',method:'GET',mode:'navigate'},
    {url:scope+'index.html',method:'POST',mode:'navigate'},
    {url:scope+'work.json',method:'GET',mode:'same-origin'},
    {url:scope+'missing.html',method:'GET',mode:'navigate'}
  ])assert.equal(await w.dispatch('fetch',{request}),undefined);
  assert.equal(w.network.length,0);
});
test('missing cached asset falls back to its original request',async()=>{
  const w=worker();const result=await w.dispatch('fetch',{request:{url:scope+'icon-512.png',method:'GET',mode:'same-origin'}});
  assert.equal(result.body,'network');assert.deepEqual(w.network,[scope+'icon-512.png']);
});
test('an installed update does not activate itself or erase a running version',async()=>{
  const old='orbit-mobile:'+scope+':old',stores=new Map([[old,new Map()]]),w=worker({stores});
  await w.dispatch('install');assert.equal(stores.has(old),true);assert.equal(w.claims(),0);
  assert.ok(!/\.skipWaiting\s*\(/.test(source));
});
