import test from 'node:test';
import assert from 'node:assert/strict';
import {NET,NETWORK_CASES,defaultNetworkConfig,defaultNetwork,ipv4,sameSubnet,subnetInfo,probeNetwork,renewNetwork,startNetworkCase,recordNetworkProbe,networkCaseChecks,completeNetworkCase,validateNetwork} from '../public/orbit/network-model.js';
import {FileSystem,seed,validateState} from '../public/orbit/core.js';
import {defaultLearning} from '../public/orbit/models.js';
import {buildWorkReport,reportDocument} from '../public/orbit/reports.js';

test('IPv4 subnet calculations handle real boundaries and reject malformed input',()=>{
 assert.equal(ipv4('255.255.255.255'),4294967295);
 assert.deepEqual(subnetInfo('192.168.10.20',28),{network:'192.168.10.16',mask:'255.255.255.240',broadcast:'192.168.10.31',first:'192.168.10.17',last:'192.168.10.30'});
 assert.equal(sameSubnet('192.168.10.20','192.168.10.30',28),true);assert.equal(sameSubnet('192.168.10.20','192.168.10.53',28),false);
 for(const ip of ['1.2.3','1.2.3.256','192.168.010.20','-1.2.3.4','1e2.1.1.1'])assert.throws(()=>ipv4(ip));
 assert.throws(()=>subnetInfo('192.168.10.20',31));
});
test('Normal network separates local delivery, gateway routing, name lookup and HTTP',()=>{
 const c=defaultNetworkConfig();assert.equal(probeNetwork(c,'ping',NET.peer).code,'echo');
 const routed=probeNetwork(c,'ping',NET.web);assert.equal(routed.ok,true);assert.ok(routed.steps.some(s=>s.label==='Pristupnik'));
 assert.equal(probeNetwork(c,'nslookup',NET.host).code,'dns-answer');assert.equal(probeNetwork(c,'curl','http://'+NET.host).code,'http-ok');
 assert.equal(probeNetwork({...c,gateway:''},'ping',NET.peer).ok,true);assert.equal(probeNetwork({...c,gateway:''},'ping',NET.web).code,'gateway');
 assert.equal(probeNetwork(c,'nslookup','nepostoji.skola.test').code,'nxdomain');
});
test('Disconnected cable, incorrect addressing and wrong masks fail at the appropriate stage',()=>{
 const c=defaultNetworkConfig();assert.equal(probeNetwork({...c,connected:false},'ping','127.0.0.1').ok,true);assert.equal(probeNetwork({...c,connected:false},'ping',NET.peer).code,'link');
 for(const ip of ['192.168.10.0','192.168.10.255','224.0.0.1','127.0.0.3'])assert.equal(probeNetwork({...c,ip},'ping',NET.peer).code,'address');
 assert.equal(probeNetwork({...c,ip:NET.peer},'ping',NET.web).code,'duplicate');assert.equal(probeNetwork({...c,ip:'192.168.20.20'},'ping',NET.peer).code,'source-network');
 assert.equal(probeNetwork({...c,prefix:28},'ping',NET.peer).ok,true);assert.equal(probeNetwork({...c,prefix:28},'nslookup',NET.host).code,'gateway-subnet');
 assert.equal(probeNetwork({...c,prefix:1},'ping',NET.web).code,'neighbor','An over-broad mask must not route an apparently local target through the gateway');
});
test('DNS, ICMP, TCP filtering and stopped HTTP remain independent failures',()=>{
 const c=defaultNetworkConfig();assert.equal(probeNetwork({...c,dns:'192.168.10.99'},'ping',NET.web).ok,true);assert.equal(probeNetwork({...c,dns:'192.168.10.99'},'curl','http://'+NET.host).ok,false);
 assert.equal(probeNetwork({...c,blockIcmp:true},'ping',NET.web).code,'icmp');assert.equal(probeNetwork({...c,blockIcmp:true},'curl','http://'+NET.host).ok,true);
 assert.equal(probeNetwork({...c,blockHttp:true},'ping',NET.web).ok,true);assert.equal(probeNetwork({...c,blockHttp:true},'curl','http://'+NET.host).code,'http-filter');
 assert.equal(probeNetwork({...c,webRunning:false},'ping',NET.web).ok,true);assert.equal(probeNetwork({...c,webRunning:false},'curl','http://'+NET.host).code,'http-stopped');
 assert.throws(()=>probeNetwork(c,'curl','https://portal.skola.test'));assert.throws(()=>probeNetwork(c,'curl','http://portal.skola.test/evil?q=x'));assert.throws(()=>probeNetwork(c,'nslookup','192.168.10.30'));
});
test('DHCP renewal changes configuration but preserves unrelated server and firewall state',()=>{
 const s=startNetworkCase(defaultNetwork(),'dns');s.config.blockIcmp=true;s.config.webRunning=false;renewNetwork(s);assert.equal(s.config.dns,NET.dns);assert.equal(s.config.mode,'dhcp');assert.equal(s.config.blockIcmp,true);assert.equal(s.config.webRunning,false);assert.equal(s.revision,1);
 s.config.connected=false;const before=structuredClone(s);assert.throws(()=>renewNetwork(s));assert.deepEqual(s,before);
});
test('All seven challenges require before/after evidence and preserve completed reflections',()=>{
 let state=defaultNetwork();
 for(const t of NETWORK_CASES){
  state=startNetworkCase(state,t.id);assert.throws(()=>completeNetworkCase(state));
  if(t.id==='cable')recordNetworkProbe(state,'ping',NET.peer);
  else if(t.id==='icmp')recordNetworkProbe(state,'ping',NET.web);
  else recordNetworkProbe(state,'curl','http://'+NET.host);
  assert.equal(networkCaseChecks(state)[0],true,t.id+' baseline must detect failure');
  if(t.id!=='icmp'){state.config=defaultNetworkConfig();state.revision++;}
  recordNetworkProbe(state,'ping',NET.peer);recordNetworkProbe(state,'ping',NET.web);recordNetworkProbe(state,'nslookup',NET.host);recordNetworkProbe(state,'curl','http://'+NET.host);
  state.notes='Početni simptom provjeren je, a završne provjere potvrđuju rezultat.';
  assert.deepEqual(networkCaseChecks(state),[true,true,true],t.id);completeNetworkCase(state);state=validateNetwork(state);
 }
 assert.equal(state.completed.length,7);assert.equal(state.records.length,7);assert.equal(state.records[0].id,'cable');
});
test('History snapshots survive edits and stale successful probes do not finish a challenge',()=>{
 const state=startNetworkCase(defaultNetwork(),'dns');recordNetworkProbe(state,'nslookup',NET.host);state.config.dns=NET.dns;state.revision++;recordNetworkProbe(state,'nslookup',NET.host);recordNetworkProbe(state,'curl','http://'+NET.host);
 assert.equal(probeNetwork(state.history[0].config,state.history[0].kind,state.history[0].target).ok,false);
 state.notes='DNS adresa je ispravljena i provjerena.';assert.deepEqual(networkCaseChecks(state),[true,true,true]);state.revision++;assert.equal(networkCaseChecks(state)[1],false);
});
test('Older workspaces migrate additively and invalid network imports roll back',()=>{
 const old=seed();delete old.learning.network;old.learning.answers.basics='Stari osvrt';old.learning.evidence.cpu_fcfs=true;
 const migrated=validateState(old);assert.equal(migrated.learning.answers.basics,'Stari osvrt');assert.equal(migrated.learning.evidence.cpu_fcfs,true);assert.equal(migrated.learning.network.config.dns,NET.dns);
 const fs=new FileSystem(migrated),before=structuredClone(fs.state);assert.throws(()=>fs.transact(()=>{fs.state.learning.network.config.ip='999.1.1.1';}));assert.deepEqual(fs.state,before);
 const bad=defaultNetwork();bad.history=[{kind:'fetch',target:'example.com'}];assert.throws(()=>validateNetwork(bad));
 bad.history=[];bad.completed=['arbitrary'];assert.throws(()=>validateNetwork(bad));
});
test('Printable reports escape student text and present partial experiments honestly',()=>{
 const learning=defaultLearning();learning.label='<img src=x onerror=alert(1)>';learning.answers.example='<script>alert(1)</script>';
 const body=buildWorkReport({lessons:[{id:'example',title:'Primjer',checks:['Radnja'],question:'Zašto?'}],checks:[[false]],learning,date:'22.10.2026.'}),html=reportDocument(body);
 assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
 assert.ok(html.includes('Nije potvrđeno'));assert.ok(html.includes('Pokus nije dovršen'));assert.ok(html.includes('0/11 pristupa'));assert.ok(html.includes('lang="hr"'));
});
