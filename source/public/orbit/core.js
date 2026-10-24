import {defaultLearning,validateLearning} from './models.js';
import {syncGameEvidence} from './game-model.js';
let idCounter=0;
export const uid=()=>globalThis.crypto?.randomUUID?.()||`n-${Date.now().toString(36)}-${(++idCounter).toString(36)}-${Math.random().toString(36).slice(2,12)}`;
export const clone=x=>JSON.parse(JSON.stringify(x));
export const validName=name=>typeof name==='string'&&name.trim()===name&&name.length>0&&name.length<=100&&!/[\\/\u0000-\u001f]/.test(name)&&!['.','..'].includes(name);
export const PROTECTED=['root','docs','labs'];
export const defaultUsers=()=>[
  {id:'ucenik',name:'Učenik',groups:['razred'],admin:false},
  {id:'kolega',name:'Kolega',groups:['razred'],admin:false},
  {id:'gost',name:'Gost',groups:['gosti'],admin:false},
  {id:'nastavnik',name:'Nastavnik',groups:['nastavnici'],admin:true}
];
export const modeString=mode=>mode.split('').map(n=>(Number(n)&4?'r':'-')+(Number(n)&2?'w':'-')+(Number(n)&1?'x':'-')).join('');
function normalizeNodes(nodes,users,rootId='root',legacy=false){
  if(!Array.isArray(nodes)||nodes.length>1000)throw new Error('Neispravan popis datoteka.');
  const result=nodes.map(n=>{
    if(!n||typeof n.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(n.id)||!validName(n.name)||!['dir','file'].includes(n.type)||(n.parent!==null&&typeof n.parent!=='string')||(n.type==='file'&&(typeof n.content!=='string'||n.content.length>250000)))throw new Error('Sigurnosna kopija sadrži neispravnu datoteku.');
    const owner=n.owner??(n.id==='root'?'nastavnik':'ucenik'),group=n.group??'razred',mode=n.mode??(n.type==='dir'?'755':'644');
    if(!users.some(u=>u.id===owner)||!['razred','gosti','nastavnici'].includes(group)||!/^\d{3}$/.test(mode)||!/[0-7]{3}/.test(mode))throw new Error('Neispravan vlasnik ili dozvole datoteke.');
    return {id:n.id,parent:n.parent,name:n.name,type:n.type,owner,group,mode,...(n.type==='file'?{content:n.content}:{})};
  });
  const map=new Map(result.map(n=>[n.id,n]));if(map.size!==result.length||!map.has(rootId)||map.get(rootId).parent!==null)throw new Error('Neispravan korijen ili ponovljeni identifikator.');
  const names=new Set();for(const n of result){if(n.id===rootId)continue;if(map.get(n.parent)?.type!=='dir')throw new Error('Datoteka ima nepostojeću mapu.');const key=n.parent+'\0'+n.name.toLocaleLowerCase('hr');if(names.has(key))throw new Error('U mapi postoje jednaki nazivi.');names.add(key);let current=n;const seen=new Set();while(current.id!==rootId){if(seen.has(current.id))throw new Error('Kružni raspored mapa.');seen.add(current.id);current=map.get(current.parent);if(!current)throw new Error('Nepovezana mapa.');}}
  return result;
}
function normalizeVersions(raw,users){
  if(raw===undefined)return [];
  if(!Array.isArray(raw)||raw.length>30)throw new Error('Spremljeno može biti najviše 30 verzija.');
  const ids=new Set();let characters=0;
  return raw.map(v=>{
    if(!v||typeof v.id!=='string'||!/^[\w-]{1,100}$/.test(v.id)||ids.has(v.id)||typeof v.nodeId!=='string'||!/^[\w-]{1,100}$/.test(v.nodeId)||!validName(v.name)||typeof v.path!=='string'||!v.path.startsWith('/')||v.path.length>10000||typeof v.content!=='string'||v.content.length>250000||typeof v.label!=='string'||v.label.length>60||!users.some(u=>u.id===v.by)||typeof v.at!=='string'||!Number.isFinite(Date.parse(v.at)))throw new Error('Neispravan zapis spremljene verzije.');
    ids.add(v.id);characters+=v.content.length;
    if(characters>750000)throw new Error('Verzije zajedno mogu sadržavati najviše 750 000 znakova. Ukloni nepotrebnu verziju nakon izvoza kopije.');
    return {id:v.id,nodeId:v.nodeId,name:v.name,path:v.path,content:v.content,label:v.label,by:v.by,at:v.at};
  });
}
export function validateState(data){
  if(!data||![1,2].includes(data.version)||JSON.stringify(data).length>2500000)throw new Error('Ovo nije podržana sigurnosna kopija Orbita ili je prevelika.');
  const users=data.version===1?defaultUsers():clone(data.users||defaultUsers());
  if(!Array.isArray(users)||users.length<4||users.length>20)throw new Error('Neispravan popis simuliranih korisnika.');
  const userIds=new Set();for(const u of users){if(!u||!/^[a-z][a-z0-9_]{2,23}$/.test(u.id)||userIds.has(u.id)||typeof u.name!=='string'||u.name.length<1||u.name.length>50||!Array.isArray(u.groups)||u.groups.length<1||u.groups.some(g=>!['razred','gosti','nastavnici'].includes(g))||typeof u.admin!=='boolean')throw new Error('Neispravan simulirani korisnik.');userIds.add(u.id);}
  for(const u of defaultUsers())if(!userIds.has(u.id))throw new Error('Nedostaje osnovni korisnički profil.');if(!users.find(u=>u.id==='nastavnik').admin)throw new Error('Nedostaje administrator modela.');
  const nodes=normalizeNodes(data.nodes,users);const map=new Map(nodes.map(n=>[n.id,n]));
  if(map.get('root').type!=='dir')throw new Error('Korijen mora biti mapa.');for(const[id,name]of [['docs','Dokumenti'],['labs','Vjezbe']])if(map.get(id)?.type!=='dir'||map.get(id)?.parent!=='root'||map.get(id)?.name!==name)throw new Error('Nedostaju osnovne mape Dokumenti i Vjezbe.');
  if(!Array.isArray(data.archive||[])||(data.archive||[]).length>100)throw new Error('Neispravan koš.');const allIds=new Set(nodes.map(n=>n.id)),archive=[];const archiveKeys=new Set();
  for(const entry of data.archive||[]){if(!entry||typeof entry.key!=='string'||!/^[\w-]{1,100}$/.test(entry.key)||archiveKeys.has(entry.key)||typeof entry.from!=='string'||!userIds.has(entry.by)||typeof entry.at!=='string')throw new Error('Neispravan zapis koša.');archiveKeys.add(entry.key);const parts=normalizeNodes(entry.nodes,users,entry.rootId);for(const n of parts){if(allIds.has(n.id)||PROTECTED.includes(n.id))throw new Error('Ponovljena datoteka u košu.');allIds.add(n.id);}archive.push({key:entry.key,from:entry.from,by:entry.by,at:entry.at,rootId:entry.rootId,nodes:parts});}
  if(allIds.size>1000)throw new Error('Prostor podržava najviše 1 000 stavki, zajedno s košem.');
  const events=(Array.isArray(data.events)?data.events:[]).slice(-80).filter(e=>e&&typeof e.text==='string'&&e.text.length<=300&&typeof e.kind==='string'&&typeof e.at==='string'&&typeof e.user==='string').map(e=>({at:e.at,kind:e.kind.slice(0,30),user:e.user.slice(0,24),text:e.text}));
  return {version:2,nodes,users,activeUser:userIds.has(data.activeUser)?data.activeUser:'ucenik',archive,versions:normalizeVersions(data.versions,users),events,learning:validateLearning(data.learning),theme:['dusk','sea','dawn'].includes(data.theme)?data.theme:'dusk',large:!!data.large,lesson:{minimized:!!data.lesson?.minimized,ended:!!data.lesson?.ended}};
}
export class FileSystem{
  constructor(state,persist=()=>{}){this.state=validateState(state);syncGameEvidence(this.state);this.persist=persist;}
  get user(){return this.state.users.find(u=>u.id===this.state.activeUser);}
  get(id){return this.state.nodes.find(n=>n.id===id);}
  children(id){return this.state.nodes.filter(n=>n.parent===id).sort((a,b)=>a.type!==b.type?(a.type==='dir'?-1:1):a.name.localeCompare(b.name,'hr'));}
  transact(fn){const previous=clone(this.state);try{const result=fn();this.state=validateState(this.state);syncGameEvidence(this.state);this.persist(this.state);return result;}catch(e){this.state=previous;throw e;}}
  event(kind,text){this.state.events.push({at:new Date().toISOString(),user:this.user.id,kind,text:String(text).slice(0,300)});this.state.events=this.state.events.slice(-80);}
  record(kind,text){this.transact(()=>this.event(kind,text));}
  evidence(key){this.transact(()=>{this.state.learning.evidence[key]=true;});}
  ownBits(n,user=this.user){if(user.admin)return 7;return Number(n.mode[n.owner===user.id?0:user.groups.includes(n.group)?1:2]);}
  can(id,flags,userId=this.user.id){const n=this.get(id),u=this.state.users.find(u=>u.id===userId);if(!n||!u)return false;if(u.admin)return true;let parent=this.get(n.parent);while(parent){if(!(this.ownBits(parent,u)&1))return false;parent=this.get(parent.parent);}const mask=[...flags].reduce((m,f)=>m|({r:4,w:2,x:1}[f]||0),0);return (this.ownBits(n,u)&mask)===mask;}
  require(id,flags){if(this.can(id,flags))return;const error=new Error(`Pristup odbijen: ${this.user.name} nema dozvolu ${flags} za ${this.path(id)}.`);try{this.transact(()=>{this.event('odbijeno',error.message);this.state.learning.evidence.permissionDenied=true;});}catch{}throw error;}
  list(id){this.require(id,'rx');return this.children(id);}
  read(id){const n=this.get(id);if(n?.type!=='file')throw new Error('Datoteka ne postoji.');this.require(id,'r');if(!this.user.admin&&n.owner!==this.user.id&&this.user.groups.includes(n.group)&&!this.state.learning.evidence.permissionGroup)this.evidence('permissionGroup');return n.content;}
  switchUser(id){if(!this.state.users.some(u=>u.id===id))throw new Error('Korisnik ne postoji.');this.transact(()=>{this.state.activeUser=id;this.event('korisnik','Aktivan simulirani profil: '+id);});}
  addUser(id,name,group){if(!this.user.admin)throw new Error('Korisnike modela dodaje profil Nastavnik.');if(!/^[a-z][a-z0-9_]{2,23}$/.test(id)||this.state.users.some(u=>u.id===id)||!name.trim()||name.length>50||!['razred','gosti'].includes(group))throw new Error('Provjeri oznaku, ime i grupu. Oznaka: 3–24 mala slova, brojevi ili _.');this.transact(()=>{this.state.users.push({id,name:name.trim(),groups:[group],admin:false});this.event('korisnik','Dodan profil '+id);});}
  create(parent,name,type='file',content=''){name=name.trim();if(!validName(name))throw new Error('Unesi naziv do 100 znakova, bez / i \\.');if(this.get(parent)?.type!=='dir')throw new Error('Mapa ne postoji.');this.require(parent,'wx');if(this.children(parent).some(n=>n.name.toLocaleLowerCase('hr')===name.toLocaleLowerCase('hr')))throw new Error('Taj naziv već postoji u ovoj mapi.');const n={id:uid(),parent,name,type,owner:this.user.id,group:this.user.groups[0],mode:type==='dir'?'755':'644',...(type==='file'?{content}:{})};return this.transact(()=>{this.state.nodes.push(n);this.event('izrada',this.path(n.id));return n;});}
  write(id,content){if(this.get(id)?.type!=='file')throw new Error('Datoteka ne postoji.');this.require(id,'w');if(typeof content!=='string'||content.length>250000)throw new Error('Tekst smije imati najviše 250 000 znakova.');this.transact(()=>{this.get(id).content=content;});}
  canReadVersion(v){return !!v&&(this.user.admin||(v.by===this.user.id&&(!this.get(v.nodeId)||this.can(v.nodeId,'r'))));}
  savedVersions(){return this.state.versions.filter(v=>this.canReadVersion(v));}
  saveVersion(id,label=''){
    const n=this.get(id);if(n?.type!=='file')throw new Error('Odaberi tekstualnu datoteku.');this.require(id,'r');
    if(typeof label!=='string'||label.trim().length>60)throw new Error('Oznaka verzije smije imati do 60 znakova.');
    const v={id:uid(),nodeId:id,name:n.name,path:this.path(id),content:n.content,label:label.trim(),by:this.user.id,at:new Date().toISOString()};
    return this.transact(()=>{this.state.versions.push(v);this.event('verzija','Sačuvana verzija: '+v.path);this.state.learning.evidence.versionSaved=true;return v.id;});
  }
  readVersion(id){const v=this.state.versions.find(v=>v.id===id);if(!this.canReadVersion(v))throw new Error('Ovaj profil ne može čitati tu spremljenu verziju.');return clone(v);}
  recoverVersion(id){
    const v=this.readVersion(id),current=this.get(v.nodeId);this.require('docs','wx');
    const dot=v.name.lastIndexOf('.'),base=dot>0?v.name.slice(0,dot):v.name,ext=dot>0?v.name.slice(dot):'';
    let count=1,name;do{name=base.slice(0,60)+' - obnovljeno '+(count++)+ext.slice(0,20);}while(this.children('docs').some(n=>n.name.toLocaleLowerCase('hr')===name.toLocaleLowerCase('hr')));
    const copy={id:uid(),parent:'docs',name,type:'file',owner:this.user.id,group:this.user.groups[0],mode:'644',content:v.content};
    return this.transact(()=>{this.state.nodes.push(copy);this.event('oporavak','Verzija vraćena u '+this.path(copy.id));if(!current||current.content!==v.content)this.state.learning.evidence.versionRecovered=true;return copy.id;});
  }
  deleteVersion(id){const v=this.state.versions.find(v=>v.id===id);if(!v||(!this.user.admin&&v.by!==this.user.id))throw new Error('Verziju uklanja njezin autor ili Nastavnik.');this.transact(()=>{this.state.versions=this.state.versions.filter(v=>v.id!==id);this.event('verzija','Uklonjena spremljena verzija: '+v.path);});}
  chmod(id,mode){const n=this.get(id);if(!n)throw new Error('Stavka ne postoji.');this.require(n.parent||id,'x');if(!/^[0-7]{3}$/.test(mode))throw new Error('Dozvole moraju biti tri znamenke 0–7, npr. 640.');if(!this.user.admin&&n.owner!==this.user.id)throw new Error('Dozvole mijenja vlasnik ili administrator modela.');if(PROTECTED.includes(id)&&!this.user.admin)throw new Error('Dozvole osnovnih mapa mijenja Nastavnik.');this.transact(()=>{n.mode=mode;this.event('dozvole',this.path(id)+' → '+mode);this.state.learning.evidence.permissionChanged=true;});}
  chown(id,owner,group){if(!this.user.admin)throw new Error('Vlasnika mijenja administrator modela.');const n=this.get(id);if(!n||!this.state.users.some(u=>u.id===owner)||!['razred','gosti','nastavnici'].includes(group))throw new Error('Neispravan vlasnik ili grupa.');this.transact(()=>{n.owner=owner;n.group=group;this.event('vlasnik',this.path(id)+' → '+owner+':'+group);});}
  rename(id,name){const n=this.get(id);if(PROTECTED.includes(id))throw new Error('Naziv osnovne mape je stalan.');if(!n)throw new Error('Stavka ne postoji.');this.require(n.parent,'wx');name=name.trim();if(!validName(name))throw new Error('Neispravan naziv.');if(this.children(n.parent).some(s=>s.id!==id&&s.name.toLocaleLowerCase('hr')===name.toLocaleLowerCase('hr')))throw new Error('Taj naziv već postoji.');this.transact(()=>{n.name=name;this.event('naziv',this.path(id));});}
  subtree(id){const ids=new Set([id]);let count;do{count=ids.size;for(const n of this.state.nodes)if(ids.has(n.parent))ids.add(n.id);}while(ids.size!==count);return this.state.nodes.filter(n=>ids.has(n.id));}
  remove(id,recursive=false){const n=this.get(id);if(PROTECTED.includes(id))throw new Error('Osnovne mape ne mogu se obrisati.');if(!n)throw new Error('Stavka ne postoji.');this.require(n.parent,'wx');if(!recursive&&this.children(id).length)throw new Error('Mapa nije prazna. Koristi Koš u Datotekama.');const nodes=this.subtree(id);for(const p of nodes.filter(p=>p.type==='dir'&&this.children(p.id).length))this.require(p.id,'rwx');const ids=new Set(nodes.map(n=>n.id));this.transact(()=>{this.event('brisanje',this.path(id));this.state.nodes=this.state.nodes.filter(n=>!ids.has(n.id));});return ids;}
  trash(id){const n=this.get(id);if(!n||PROTECTED.includes(id))throw new Error('Ova stavka ne može u Koš.');this.require(n.parent,'wx');const nodes=clone(this.subtree(id));const ids=new Set(nodes.map(n=>n.id));const entry={key:uid(),rootId:id,from:n.parent,by:this.user.id,at:new Date().toISOString(),nodes};nodes.find(n=>n.id===id).parent=null;this.transact(()=>{this.event('koš',this.path(id));this.state.archive.push(entry);this.state.nodes=this.state.nodes.filter(n=>!ids.has(n.id));});return entry.key;}
  restore(key){const entry=this.state.archive.find(e=>e.key===key);if(!entry)throw new Error('Stavka nije u Košu.');if(!this.user.admin&&entry.by!==this.user.id)throw new Error('Stavku vraća korisnik koji ju je obrisao ili Nastavnik.');const parent=this.get(entry.from)?.type==='dir'?entry.from:'docs';this.require(parent,'wx');const nodes=clone(entry.nodes),root=nodes.find(n=>n.id===entry.rootId);if(this.children(parent).some(n=>n.name.toLocaleLowerCase('hr')===root.name.toLocaleLowerCase('hr')))throw new Error('Naziv već postoji na izvornom mjestu. Preimenuj tu aktivnu stavku pa pokušaj ponovno.');root.parent=parent;this.transact(()=>{this.state.nodes.push(...nodes);this.state.archive=this.state.archive.filter(e=>e.key!==key);this.event('obnova',this.path(root.id));this.state.learning.evidence.restored=true;});return root.id;}
  copyTo(id,parent,name){const original=this.get(id);if(!original||this.get(parent)?.type!=='dir')throw new Error('Stavka ili odredište ne postoji.');this.require(parent,'wx');name=(name||original.name).trim();if(!validName(name)||this.children(parent).some(n=>n.name.toLowerCase()===name.toLowerCase()))throw new Error('Naziv nije valjan ili već postoji.');const source=this.subtree(id);for(const n of source)this.require(n.id,n.type==='dir'?'rx':'r');const ids=new Map(source.map(n=>[n.id,uid()]));const nodes=source.map(n=>({...clone(n),id:ids.get(n.id),parent:n.id===id?parent:ids.get(n.parent),name:n.id===id?name:n.name,owner:this.user.id,group:this.user.groups[0],mode:n.type==='dir'?'755':'644'}));this.transact(()=>{this.state.nodes.push(...nodes);this.event('kopiranje',this.path(id)+' → '+this.path(parent));this.state.learning.evidence.copied=true;});return ids.get(id);}
  moveTo(id,parent){const n=this.get(id);if(!n||this.get(parent)?.type!=='dir'||PROTECTED.includes(id))throw new Error('Ovu stavku nije moguće premjestiti.');if(this.subtree(id).some(x=>x.id===parent))throw new Error('Mapa ne može biti unutar same sebe.');this.require(n.parent,'wx');this.require(parent,'wx');if(this.children(parent).some(x=>x.name.toLowerCase()===n.name.toLowerCase()))throw new Error('Naziv već postoji na odredištu.');this.transact(()=>{n.parent=parent;this.event('premještanje',this.path(id));});}
  path(id){const parts=[];let n=this.get(id);while(n&&n.id!=='root'){parts.unshift(n.name);n=this.get(n.parent);}return '/'+parts.join('/');}
  resolve(path='.',cwd='root'){let current=path.startsWith('/')?this.get('root'):this.get(cwd);for(const part of path.split('/').filter(Boolean)){if(current?.type!=='dir')return undefined;this.require(current.id,'x');if(part==='.')continue;if(part==='..')current=this.get(current.parent)||this.get('root');else current=this.children(current.id).find(n=>n.name===part);if(!current)return undefined;}return current;}
  target(path,cwd){if(!path||path.endsWith('/'))throw new Error('Navedi naziv datoteke ili mape.');const i=path.lastIndexOf('/'),name=path.slice(i+1),parent=this.resolve(i<0?'.':path.slice(0,i)||'/',cwd);if(parent?.type!=='dir')throw new Error('Odredišna mapa ne postoji.');return {parent:parent.id,name};}
}

export function seed() {
  return {version:2,users:defaultUsers(),activeUser:'ucenik',archive:[],events:[],learning:defaultLearning(),theme:'dusk',large:false,lesson:{minimized:false,ended:false},nodes:[
    {id:'root',parent:null,name:'Orbit',type:'dir'},
    {id:'docs',parent:'root',name:'Dokumenti',type:'dir'},
    {id:'labs',parent:'root',name:'Vjezbe',type:'dir'},
    {id:'welcome',parent:'docs',name:'Dobrodosli.txt',type:'file',content:'Dobro došli u Orbit OS!\n\nOvo je radna površina koja radi u pregledniku.\n\nRačunalno izdanje radi lokalno bez interneta. Mobilno izdanje treba prvo preuzeti preko HTTPS poveznice i pričekati oznaku Offline spreman; nakon toga ugrađeni pokusi rade bez interneta. Preglednik pokušava automatski sačuvati datoteke, bilješke i odgovore. Prije izlaska provjeri stanje spremanja kroz Moj rad. Kroz Moj rad izvezi JSON kopiju za nastavak ili predaju nastavniku. Sama HTML datoteka ne mijenja se tijekom rada.\n\nZa početak:\n1. Napravite mapu u aplikaciji Datoteke.\n2. Dodajte tekstualnu datoteku i napišite nekoliko rečenica.\n3. Otvorite Terminal i isprobajte naredbu ls.\n4. U Procesima pogledajte što se događa kada aplikaciju minimizirate ili zatvorite.\n\nTerminal i prikaz RAM-a nastavni su modeli. Ne upravljaju operacijskim sustavom vašeg računala.\n'},
    {id:'commands',parent:'labs',name:'Naredbe.txt',type:'file',content:'KRATKI PODSJETNIK\n\nhelp — prikaz podržanih naredbi\npwd — trenutačna putanja\nls — sadržaj mape\ncd Dokumenti — promjena mape\nmkdir Moja_vjezba — nova mapa\ntouch biljeska.txt — nova tekstualna datoteka\ncat biljeska.txt — prikaz sadržaja\necho "Pozdrav" > biljeska.txt — upis u datoteku\nps — otvorene aplikacije\nkill PID — zatvaranje aplikacije\nclear — čišćenje terminala\n\nNavodnici omogućuju razmake u nazivima.\nSve naredbe rade samo nad podacima u Orbitu.\n'}]};
}

export function tokenize(line) {
  const tokens=[];const redirects=[];let current='',quote=null,active=false;
  for(const c of line) {
    if(quote) {if(c===quote) quote=null;else current+=c;active=true;}
    else if(c==='"'||c==="'") {quote=c;active=true;}
    else if(/\s/.test(c)) {if(active) tokens.push(current);current='';active=false;}
    else if(c==='>') {if(active) tokens.push(current);redirects.push(tokens.length);tokens.push('>');current='';active=false;}
    else {current+=c;active=true;}
  }
  if(quote) throw new Error('Zatvorite navodnike.');
  if(active) tokens.push(current);Object.defineProperty(tokens,'redirects',{value:redirects});return tokens;
}
