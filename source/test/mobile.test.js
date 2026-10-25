import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../public/orbit/sw-template.js',import.meta.url),'utf8');
const scope='https://school.example/orbit/';
function worker({build='new',failInstall=false,offline=false,networkStatus=200,stores=new Map()}={}){
  const handlers={},network=[],deleted=[];let claims=0,activations=0;
  const caches={
    async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {
      async addAll(requests){if(failInstall)throw Error('download failed');for(const request of requests)data.set(request.url,{body:'cached '+request.url});},
      async match(url){return data.get(typeof url==='string'?url:url.url);}
    };},async keys(){return [...stores.keys()];},async delete(name){deleted.push(name);return stores.delete(name);}
  };
  vm.runInNewContext(source.replace('__ORBIT_BUILD__',build),{URL,Request,AbortController,setTimeout,clearTimeout,caches,fetch:async request=>{network.push(request.url);if(offline)throw Error('offline');return {body:'network',ok:networkStatus===200,headers:new Headers({'content-type':'text/html'})};},self:{registration:{scope},skipWaiting:async()=>{activations++;},clients:{claim:async()=>{claims++;}},addEventListener:(type,fn)=>handlers[type]=fn}});
  async function dispatch(type,extra={}){let work,result;handlers[type]({...extra,waitUntil:promise=>work=promise,respondWith:promise=>result=promise});await work;return result===undefined?undefined:await result;}
  async function status(){let answer;await dispatch('message',{data:{type:'ORBIT_OFFLINE_STATUS'},ports:[{postMessage:value=>answer=value}]});return answer;}
  return {dispatch,status,stores,network,deleted,claims:()=>claims,activations:()=>activations};
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
test('offline home, install URL and fresh entry all fall back to the installed edition',async()=>{
  const w=worker({offline:true});await w.dispatch('install');
  for(const url of [scope,scope+'index.html',scope+'index.html?from=home',scope+'igra.html']){
    const result=await w.dispatch('fetch',{request:{url,method:'GET',mode:'navigate'}});
    assert.equal(result.body,'cached '+scope+'index.html');
  }
  assert.equal(w.network.length,4);
});
test('a new online navigation gets fresh HTML without reloading a running lesson',async()=>{
 const w=worker();await w.dispatch('install');
 const result=await w.dispatch('fetch',{request:{url:scope,method:'GET',mode:'navigate'}});
 assert.equal(result.body,'network');assert.equal(w.activations(),0);
 assert.equal(w.stores.get('orbit-mobile:'+scope+':new').get(scope+'index.html').body,'cached '+scope+'index.html');
});
test('a server error during navigation preserves the complete offline edition',async()=>{
 const w=worker({networkStatus:503});await w.dispatch('install');
 const result=await w.dispatch('fetch',{request:{url:scope+'igra.html',method:'GET',mode:'navigate'}});
 assert.equal(result.body,'cached '+scope+'index.html');
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
  assert.equal(w.activations(),0);
  await w.dispatch('message',{data:{type:'ZLJIX_APPLY_UPDATE'}});
  assert.equal(w.activations(),1);
});

test('offline download is ready only when the standalone HTML is cached and is served without network',async()=>{
 const w=worker();await w.dispatch('install');assert.equal((await w.status()).downloadReady,true);const url=scope+'downloads/zljixOS.html';
 const result=await w.dispatch('fetch',{request:{url,method:'GET',mode:'navigate'}});assert.equal(result.body,'cached '+url);assert.equal(w.network.length,0);
 w.stores.get('orbit-mobile:'+scope+':new').delete(url);assert.equal((await w.status()).ready,false);assert.equal((await w.status()).downloadReady,false);
});

const {prepareOfflineDownload}=await import('../public/orbit/pwa.js');
test('prepared offline download uses an explicit fetch and returns actual HTML bytes',async()=>{
 let called=false;const blob=await prepareOfflineDownload(async(url,options)=>{called=true;assert.equal(url,'./downloads/zljixOS.html');assert.equal(options.signal.aborted,false);return new Response('<!doctype html><title>zljixOS</title>');});
 assert.equal(called,true);assert.equal(blob.type,'text/html;charset=utf-8');assert.equal(await blob.text(),'<!doctype html><title>zljixOS</title>');
});
test('an error, empty response or stalled file never becomes a ready download',async()=>{
 await assert.rejects(prepareOfflineDownload(async()=>new Response('Not found',{status:404})),/uspjelo/);
 await assert.rejects(prepareOfflineDownload(async()=>new Response('')),/Prazna/);
 await assert.rejects(prepareOfflineDownload(async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')))),5),/aborted/);
});
