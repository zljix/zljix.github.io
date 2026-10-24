// A closed, deterministic IPv4 teaching network. No requests leave the browser.
export const NET = Object.freeze({gateway:'192.168.10.1',dns:'192.168.10.53',peer:'192.168.10.30',web:'203.0.113.10',host:'portal.skola.test'});
export const NETWORK_CASES = [
  {id:'cable',title:'Sve je nedostupno',symptom:'Ne možeš dosegnuti ni susjedno računalo. Provjeri i lokalnu povratnu adresu 127.0.0.1.',patch:{connected:false},hint:'Uspješan odgovor s 127.0.0.1 provjerava lokalni mrežni slog. Pogledaj stanje mrežnog priključka.'},
  {id:'dns',title:'IP radi, naziv ne radi',symptom:'Portal je dostupan preko IP adrese. Provjeri što se događa kada upotrijebiš njegov naziv.',patch:{mode:'manual',dns:'192.168.10.99'},hint:'Usporedi ping 203.0.113.10 i nslookup portal.skola.test. DNS ovog laboratorija ima adresu 192.168.10.53.'},
  {id:'gateway',title:'Lokalno radi, portal ne',symptom:'Drugo računalo u učionici odgovara. Portal u drugoj mreži nije dostupan.',patch:{mode:'manual',gateway:'192.168.10.254'},hint:'Usporedi lokalni i udaljeni cilj. Udaljenoj mreži pristupa se preko usmjerivača 192.168.10.1.'},
  {id:'service',title:'Ping radi, stranica ne',symptom:'Poslužitelj odgovara na ping, ali HTTP zahtjev završava odbijanjem veze.',patch:{webRunning:false},hint:'ICMP odgovor ne provjerava web-aplikaciju. Provjeri je li HTTP usluga na poslužitelju pokrenuta.'},
  {id:'firewall',title:'Zahtjev prema webu zapinje',symptom:'Naziv se razrješava i ping prolazi, ali HTTP veza ne dobiva odgovor.',patch:{blockHttp:true},hint:'Provjeri posebno pravilo za TCP priključak 80. Pravila za ICMP i HTTP ovdje su neovisna.'},
  {id:'mask',title:'Adresa je dobra, mreža nije',symptom:'Susjed 192.168.10.30 odgovara, a DNS i udaljeni portal nisu dostupni. Početna maska je /28.',patch:{mode:'manual',prefix:28},hint:'/28 razvrstava 192.168.10.20 i .30 u istu podmrežu, a .1 i .53 izvan nje. Učionica koristi /24.'},
  {id:'icmp',title:'Nema pinga, ali portal radi',symptom:'Dokaži da HTTP usluga radi iako poslužitelj ne odgovara na ICMP. Zadrži uključeno blokiranje ICMP-a.',patch:{blockIcmp:true},hint:'Pokreni ping pa HTTP zahtjev. Blokiran ICMP sam po sebi ne znači nedostupnost web-usluge.'}
];
export function defaultNetworkConfig(){return {connected:true,mode:'dhcp',ip:'192.168.10.20',prefix:24,gateway:NET.gateway,dns:NET.dns,blockIcmp:false,blockHttp:false,webRunning:true};}
export function defaultNetwork(){return {config:defaultNetworkConfig(),revision:0,scenario:'',history:[],notes:'',hint:false,completed:[],records:[]};}
export function ipv4(value){
  if(typeof value!=='string'||! /^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(value))throw new Error('IP adresu upiši kao četiri broja 0–255, npr. 192.168.10.20.');
  const octets=value.split('.').map(Number);if(octets.some(n=>n>255))throw new Error('Svaki dio IP adrese mora biti između 0 i 255.');return octets.reduce((n,b)=>n*256+b,0)>>>0;
}
export function maskFor(prefix){if(!Number.isInteger(prefix)||prefix<1||prefix>30)throw new Error('Prefiks u ovom modelu mora biti 1–30.');return (0xffffffff<<(32-prefix))>>>0;}
export const formatIP=n=>[24,16,8,0].map(shift=>(n>>>shift)&255).join('.');
export const sameSubnet=(a,b,prefix)=>((ipv4(a)&maskFor(prefix))>>>0)===((ipv4(b)&maskFor(prefix))>>>0);
export function subnetInfo(ip,prefix){const n=ipv4(ip),mask=maskFor(prefix),network=(n&mask)>>>0,broadcast=(network|(~mask))>>>0;return {network:formatIP(network),mask:formatIP(mask),broadcast:formatIP(broadcast),first:formatIP(network+1),last:formatIP(broadcast-1)};}
export function validateNetworkConfig(raw){
  if(!raw||!['dhcp','manual'].includes(raw.mode))throw new Error('Neispravan način mrežne konfiguracije.');
  for(const key of ['connected','blockIcmp','blockHttp','webRunning'])if(typeof raw[key]!=='boolean')throw new Error('Neispravno stanje mrežne simulacije.');
  ipv4(raw.ip);maskFor(raw.prefix);for(const key of ['gateway','dns'])if(raw[key]!=='')ipv4(raw[key]);
  return Object.fromEntries(Object.keys(defaultNetworkConfig()).map(key=>[key,raw[key]]));
}
export function normalizeTarget(kind,target){
  if(!['ping','nslookup','curl'].includes(kind)||typeof target!=='string')throw new Error('Odaberi ping, nslookup ili curl.');
  let t=target.trim().toLowerCase();
  if(kind==='curl'){
    if(!/^http:\/\/[a-z0-9.-]+(?::80)?\/?$/.test(t))throw new Error('Model podržava HTTP na priključku 80, npr. curl http://portal.skola.test.');
    t=t.slice(7).replace(/\/$/,'').replace(/:80$/,'');
  }
  if(t.endsWith('.'))t=t.slice(0,-1);
  if(t.length>80||!t||! /^[a-z0-9.-]+$/.test(t))throw new Error('Unesi IP adresu ili naziv iz prikazane pokusne mreže.');
  if(/^[\d.]+$/.test(t))ipv4(t);
  if(kind==='nslookup'&&/^[\d.]+$/.test(t))throw new Error('Ovdje nslookup traži A zapis za naziv, npr. portal.skola.test.');
  return t;
}
const nameRecords=Object.freeze({[NET.host]:NET.web,'dns.skola.test':NET.dns,'racunalo.skola.test':NET.peer});

export function probeNetwork(raw,kind,target){
  const c=validateNetworkConfig(raw),name=normalizeTarget(kind,target),steps=[];
  const add=(label,detail,ok=true)=>steps.push({label,detail,ok});
  const fail=(code,message,label='Zaustavljeno')=>{add(label,message,false);return {ok:false,code,message,steps};};
  const success=(code,message)=>({ok:true,code,message,steps});
  function route(ip){
    if(!c.connected)return fail('link','Mrežni priključak je odspojen.','Veza');
    add('Veza','Priključak je povezan s učioničkom mrežom.');
    const info=subnetInfo(c.ip,c.prefix),first=Number(c.ip.split('.')[0]);
    if(first===0||first===127||first>=224||c.ip===info.network||c.ip===info.broadcast||c.ip==='192.168.10.0'||c.ip==='192.168.10.255')return fail('address','Adresa računala nije valjana unicast adresa domaćina za odabranu masku.','IP konfiguracija');
    if([NET.gateway,NET.dns,NET.peer].includes(c.ip))return fail('duplicate','Adresa računala već pripada drugom uređaju u modelu.','Sukob adresa');
    if(!sameSubnet(c.ip,NET.gateway,24))return fail('source-network','U ovom modelu računalo mora pripadati učioničkoj mreži 192.168.10.0/24. Nema dodatnih povratnih ruta.','Povratni put');
    add('IP konfiguracija',`${c.ip}/${c.prefix} · mreža ${info.network}`);
    const direct=sameSubnet(c.ip,ip,c.prefix);
    if(direct){
      add('Izbor puta',`${ip} je prema maski izravno na lokalnoj mreži.`);
      if(![NET.gateway,NET.dns,NET.peer,c.ip].includes(ip))return fail('neighbor','Na lokalnoj vezi nema uređaja s tom adresom.','Traženje susjeda');
      add('Lokalna isporuka',`Uređaj ${ip} dostupan je na ovoj vezi.`);return null;
    }
    add('Izbor puta',`${ip} je izvan lokalne mreže; potreban je zadani pristupnik.`);
    if(!c.gateway)return fail('gateway','Zadani pristupnik nije postavljen.','Usmjeravanje');
    if(!sameSubnet(c.ip,c.gateway,c.prefix))return fail('gateway-subnet','Zadani pristupnik nije u podmreži koju određuje odabrana maska.','Usmjeravanje');
    if(c.gateway!==NET.gateway)return fail('gateway','Na zadanoj adresi pristupnika nema usmjerivača ovog modela.','Usmjeravanje');
    add('Pristupnik',`${NET.gateway} prosljeđuje paket.`);
    if(ip!==NET.web)return fail('outside','Za taj cilj u ovoj pojednostavljenoj mreži nije definirana ruta.','Odredište');
    add('Udaljena mreža',`Paket stiže na pokusni poslužitelj ${NET.web}.`);return null;
  }
  if(kind==='ping'&&name==='127.0.0.1'){add('Lokalni mrežni slog','Povratna adresa obrađuje se unutar računala, bez izlaska na vezu.');return success('echo','Odgovor s 127.0.0.1. To ne potvrđuje ispravnost kabela, DNS-a ni udaljene usluge.');}
  let ip=name;
  if(!/^[\d.]+$/.test(name)){
    add('Naziv',`Za ${name} treba pronaći IPv4 adresu (A zapis).`);
    if(!c.dns)return fail('dns','DNS poslužitelj nije postavljen.','DNS');
    const routed=route(c.dns);if(routed)return routed;
    if(c.dns!==NET.dns)return fail('dns','Na zadanoj adresi nema DNS poslužitelja ovog modela.','DNS');
    if(!Object.hasOwn(nameRecords,name))return fail('nxdomain','DNS nema A zapis za taj naziv u ovom modelu.','DNS');
    ip=nameRecords[name];add('DNS odgovor',`${name} → ${ip}`);
    if(kind==='nslookup')return success('dns-answer',`Poslužitelj: ${NET.dns}\nNaziv: ${name}\nAdresa: ${ip}\nDobiven DNS odgovor još ne potvrđuje dostupnost web-usluge.`);
  }
  const routed=route(ip);if(routed)return routed;
  if(kind==='ping'){
    if(ip===NET.web&&c.blockIcmp)return fail('icmp','Nema ICMP Echo odgovora. U ovom pokusu pravilo blokira ICMP prema poslužitelju; provjeri HTTP zasebno.','ICMP');
    add('ICMP Echo',`Primljen je odgovor s ${ip}.`);return success('echo',`Odgovor s ${ip}.\nICMP je dostupan; stanje HTTP usluge ovime nije provjereno.`);
  }
  if(ip!==NET.web)return fail('no-service','Na tom uređaju nije definirana HTTP usluga u ovom modelu.','TCP 80');
  if(c.blockHttp)return fail('http-filter','TCP veza prema priključku 80 ne dobiva odgovor.','TCP 80');
  add('Pravilo za TCP 80','Pravilo dopušta vezu prema web-poslužitelju.');
  if(!c.webRunning)return fail('http-stopped','Veza je odbijena: HTTP usluga nije pokrenuta.','HTTP usluga');
  add('HTTP odgovor','200 OK · Portal učionice');return success('http-ok','HTTP/1.1 200 OK\nPortal učionice — uspješno dohvaćena pokusna stranica.');
}

export function startNetworkCase(state,id){
  const task=NETWORK_CASES.find(s=>s.id===id);if(!task)throw new Error('Nepoznat mrežni izazov.');
  return {...defaultNetwork(),config:{...defaultNetworkConfig(),...task.patch},scenario:id,completed:[...state.completed],records:[...(state.records||[])]};
}
export function recordNetworkProbe(state,kind,target,origin='ui'){
  const normalized=normalizeTarget(kind,target),clean=kind==='curl'?'http://'+normalized:normalized,result=probeNetwork(state.config,kind,clean);
  state.history.push({kind,target:clean,config:{...state.config},revision:state.revision,at:new Date().toISOString(),origin});state.history=state.history.slice(-24);return result;
}
export function renewNetwork(state){if(!state.config.connected)throw new Error('DHCP obnova nije uspjela: mrežni priključak je odspojen.');const d=defaultNetworkConfig();for(const k of ['mode','ip','prefix','gateway','dns'])state.config[k]=d[k];state.revision++;}
export function networkCaseChecks(state){
  const id=state.scenario,logs=state.history.map(h=>({...h,result:probeNetwork(h.config,h.kind,h.target)}));
  const before=logs.filter(h=>h.revision===0),current=logs.filter(h=>h.revision===state.revision);
  const beforeCode={cable:['link'],dns:['dns','neighbor'],gateway:['gateway'],service:['http-stopped'],firewall:['http-filter'],mask:['gateway-subnet'],icmp:['icmp']};
  const observed=before.some(h=>(beforeCode[id]||[]).includes(h.result.code));
  const http=current.some(h=>h.kind==='curl'&&normalizeTarget(h.kind,h.target)===NET.host&&h.result.ok);
  const extra=id==='dns'||id==='mask'?current.some(h=>h.kind==='nslookup'&&normalizeTarget(h.kind,h.target)===NET.host&&h.result.ok):id==='cable'||id==='gateway'?current.some(h=>h.kind==='ping'&&h.target===NET.peer&&h.result.ok):id==='icmp'?state.config.blockIcmp&&current.some(h=>h.result.code==='icmp'):current.some(h=>h.kind==='ping'&&h.target===NET.web&&h.result.ok);
  return [observed,http&&extra,state.notes.trim().length>=20];
}
export function completeNetworkCase(state){if(!state.scenario||!networkCaseChecks(state).every(Boolean))throw new Error('Najprije zabilježi početni kvar, provedenu provjeru i osvrt od barem 20 znakova.');if(!state.completed.includes(state.scenario))state.completed.push(state.scenario);state.records=(state.records||[]).filter(r=>r.id!==state.scenario);state.records.push({id:state.scenario,notes:state.notes,hint:state.hint,at:new Date().toISOString()});}
export function validateNetwork(raw){
  if(raw===undefined)return defaultNetwork();
  if(!raw||!Number.isInteger(raw.revision)||raw.revision<0||raw.revision>100000||typeof raw.notes!=='string'||raw.notes.length>3000||typeof raw.hint!=='boolean'||!Array.isArray(raw.history)||raw.history.length>24||!Array.isArray(raw.completed)||raw.completed.length>NETWORK_CASES.length||!['',...NETWORK_CASES.map(s=>s.id)].includes(raw.scenario))throw new Error('Neispravan zapis mrežnog laboratorija.');
  const config=validateNetworkConfig(raw.config);
  const history=raw.history.map(h=>{if(!h||!Number.isInteger(h.revision)||h.revision<0||h.revision>raw.revision||!['ui','terminal'].includes(h.origin)||typeof h.at!=='string'||Number.isNaN(Date.parse(h.at)))throw new Error('Neispravna povijest mrežnih pokusa.');normalizeTarget(h.kind,h.target);return {kind:h.kind,target:h.target,config:validateNetworkConfig(h.config),revision:h.revision,at:h.at,origin:h.origin};});
  const completed=[...new Set(raw.completed)];if(completed.some(id=>!NETWORK_CASES.some(s=>s.id===id)))throw new Error('Nepoznata mrežna vježba.');
  const records=raw.records||[];if(!Array.isArray(records)||records.length>NETWORK_CASES.length||new Set(records.map(r=>r?.id)).size!==records.length||records.some(r=>!r||!completed.includes(r.id)||typeof r.notes!=='string'||r.notes.length>3000||typeof r.hint!=='boolean'||typeof r.at!=='string'||Number.isNaN(Date.parse(r.at))))throw new Error('Neispravan spremljeni osvrt mrežnog izazova.');
  return {config,history,revision:raw.revision,scenario:raw.scenario,notes:raw.notes,hint:raw.hint,completed,records:records.map(r=>({id:r.id,notes:r.notes,hint:r.hint,at:r.at}))};
}
