// Small PowerShell teaching subset: typed pipeline objects, never host execution.
const aliases={pwd:'get-location',gl:'get-location',cd:'set-location',sl:'set-location',dir:'get-childitem',ls:'get-childitem',gci:'get-childitem',cat:'get-content',type:'get-content',gc:'get-content',copy:'copy-item',cp:'copy-item',cpi:'copy-item',move:'move-item',mv:'move-item',mi:'move-item',ren:'rename-item',rni:'rename-item',del:'remove-item',rm:'remove-item',ri:'remove-item',select:'select-object',sort:'sort-object',measure:'measure-object',sls:'select-string',echo:'write-output',cls:'clear-host',clear:'clear-host',help:'get-help'};
export function psProperty(item,name){
  if(item===null||typeof item!=='object')throw Error('Očekuje se objekt sa svojstvom '+name+'.');
  const key=Object.keys(item).find(k=>k.toLowerCase()===name.toLowerCase());
  if(!key)throw Error('Objekt nema svojstvo '+name+'. Provjeri Name, Length, Extension ili Line.');
  return item[key];
}
export function formatPowerShell(items){
  if(!items.length)return '';
  if(items.every(x=>typeof x!=='object'))return items.join('\n')+'\n';
  if(items.every(x=>Object.hasOwn(x,'Line')&&Object.hasOwn(x,'LineNumber')))return items.map(x=>(x.Path?x.Path+':'+x.LineNumber+':':'')+x.Line).join('\n')+'\n';
  const keys=[...new Set(items.flatMap(x=>Object.keys(x)))];
  return keys.join('  ')+'\n'+items.map(x=>keys.map(k=>x[k]??'').join('  ')).join('\n')+'\n';
}
export const POWERSHELL_HELP='Get-Location · Get-ChildItem [-Path mapa] [-File] · Set-Location -Path mapa\nGet-Content -Path datoteka · New-Item -ItemType Directory -Path mapa\nNew-Item -ItemType File -Path datoteka · Set-Content -Path datoteka -Value "tekst"\nAdd-Content -Path datoteka -Value "tekst" · Copy-Item -Path izvor -Destination odrediste\nRename-Item -Path datoteka -NewName novi.txt · Move-Item -Path izvor -Destination mapa\nRemove-Item -Path datoteka_ili_prazna_mapa [-WhatIf]\nSelect-String -Path datoteka -Pattern "tekst" -SimpleMatch [-CaseSensitive]\nGet-ChildItem | Where-Object -Property Extension -EQ ".txt"\n… | Select-Object -Property Name,Length · … | Select-Object -ExpandProperty Line\n… | Sort-Object -Property Length [-Descending] · … | Measure-Object [-Property Length -Sum]\n… | Set-Content -Path izvjestaj.txt · Clear-Host · Get-Help\nOvo je Windows model odabranih cmdleta. | prenosi objekte; puni PowerShell podržava mnogo više.';
function parameters(tokens,schema,positional=[]){
  const result={},free=[];
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i],v=t.value;
    if(!t.quoted&&/^-[a-z]/i.test(v)){
      const key=v.slice(1).toLowerCase();if(!Object.hasOwn(schema,key))throw Error('Nepodržan parametar '+v+'. Pogledaj primjer ili Get-Help.');
      if(Object.hasOwn(result,key))throw Error('Parametar '+v+' naveden je dvaput.');
      if(schema[key]==='switch')result[key]=true;
      else {const next=tokens[++i];if(!next||!next.quoted&&/^-[a-z]/i.test(next.value))throw Error('Nedostaje vrijednost parametra '+v+'.');result[key]=next.value;}
    }else free.push(v);
  }
  for(const value of free){const key=positional.find(k=>!Object.hasOwn(result,k));if(!key)throw Error('Previše argumenata. Tekst s razmacima stavi u navodnike.');result[key]=value;}
  return result;
}
export function powerShellCommand(state,tokens,input,piped,api){
  const {requireNode,write,destination,resolveShellPath,shellPath,shellHome,shellNode,key,parentPath,basename}=api;
  const name=tokens[0].value.toLowerCase(),cmd=aliases[name]||name,rest=tokens.slice(1),events=[];
  const event=(action,path,extra={})=>events.push({action,path,...extra});
  const done=(items=[])=>({items,output:formatPowerShell(items),events,code:0});
  const need=(p,k)=>{if(p[k]===undefined)throw Error('Nedostaje -'+k+'. Pogledaj obrazac naredbe.');return p[k];};
  const params=(schema={},position=[])=>parameters(rest,schema,position);
  const source=()=>{if(!piped)throw Error('Ova naredba u vježbi prima objekte kroz cjevovod |.');return input;};
  const fileObject=n=>({Name:basename(n.path),...(n.type==='file'?{Length:new TextEncoder().encode(n.content).length}:{}),Extension:n.type==='file'&&basename(n.path).includes('.')?'.'+basename(n.path).split('.').at(-1):'',PSIsContainer:n.type==='dir'});
  if(cmd==='get-help'){const p=params({name:'value'},['name']);return done([POWERSHELL_HELP]);}
  if(cmd==='clear-host'){params();return {...done(),clear:true};}
  if(cmd==='get-location'){params();event('pwd',state.cwd);return done([{Path:shellPath(state)}]);}
  if(cmd==='set-location'){const p=params({path:'value'},['path']),n=requireNode(state,p.path??shellHome(state.dialect),'dir');state.cwd=n.path;event('cd',n.path);return done();}
  if(cmd==='get-childitem'){
    const p=params({path:'value',file:'switch',directory:'switch'},['path']);if(p.file&&p.directory)throw Error('Odaberi -File ili -Directory.');
    const n=requireNode(state,p.path??'.'),nodes=n.type==='dir'?state.nodes.filter(x=>x.path!=='/'&&key(state,parentPath(x.path))===key(state,n.path)):[n];
    const items=nodes.filter(x=>(!p.file||x.type==='file')&&(!p.directory||x.type==='dir')).sort((a,b)=>a.path.localeCompare(b.path)).map(fileObject);
    event('list',n.path,{files:!!p.file});return done(items);
  }
  if(cmd==='get-content'){const p=params({path:'value'},['path']),n=requireNode(state,need(p,'path'),'file');event('read',n.path);return done(n.content.replace(/\r\n/g,'\n').split('\n').filter((x,i,a)=>i<a.length-1||x!==''));}
  if(cmd==='new-item'||cmd==='mkdir'){
    const p=params({path:'value',itemtype:'value',value:'value'},['path']);const type=(cmd==='mkdir'?'directory':need(p,'itemtype')).toLowerCase(),path=destination(state,need(p,'path'));
    if(!['directory','file'].includes(type))throw Error('-ItemType je Directory ili File.');
    if(shellNode(state,path))throw Error('Taj naziv već postoji.');
    if(type==='directory'){state.nodes.push({path,type:'dir',mode:'755'});event('mkdir',path);}
    else {write(state,path,p.value??'');event('write',path);}
    return done([fileObject(shellNode(state,path))]);
  }
  if(cmd==='write-output'){
    if(rest.some(t=>!t.quoted&&t.value.startsWith('-')))throw Error('Za Write-Output upiši tekst u navodnicima.');
    return done(rest.map(t=>t.value));
  }
  if(cmd==='set-content'||cmd==='add-content'){
    const p=params({path:'value',value:'value'},['path','value']);need(p,'path');
    const values=p.value!==undefined?[p.value]:source();
    if(values.some(v=>v!==null&&typeof v==='object'))throw Error('Za tekstualni zapis najprije izdvoji svojstvo, npr. Select-Object -ExpandProperty Line. Automatska pretvorba objekata u tekst nije dio ovog modela.');
    const text=values.length?values.join('\n')+'\n':'',n=write(state,p.path,text,cmd==='add-content');event(cmd==='add-content'?'append':'write',n.path);return done();
  }
  if(['copy-item','move-item','rename-item'].includes(cmd)){
    const rename=cmd==='rename-item',p=params({path:'value',...(rename?{newname:'value'}:{destination:'value'})},['path',rename?'newname':'destination']),n=requireNode(state,need(p,'path'),'file');
    const dest=need(p,rename?'newname':'destination');if(rename&&/[\\/:]/.test(dest))throw Error('-NewName mijenja samo naziv; za novu mapu koristi Move-Item.');
    let path=rename?parentPath(n.path)+'/'+dest:resolveShellPath(state,dest);
    if(!rename&&shellNode(state,path)?.type==='dir')path=shellNode(state,path).path+'/'+basename(n.path);
    if(key(state,path)===key(state,n.path))throw Error('Izvor i odredište su ista datoteka.');
    if(cmd!=='copy-item'&&shellNode(state,path))throw Error('Odredište već postoji. Odaberi slobodan naziv.');
    const old=n.path,result=write(state,path,n.content);if(cmd!=='copy-item')state.nodes=state.nodes.filter(x=>x!==n);
    event(cmd==='copy-item'?'copy':'move',result.path,{source:old});return done();
  }
  if(cmd==='remove-item'){
    const p=params({path:'value',whatif:'switch'},['path']),n=requireNode(state,need(p,'path'));
    if(n.path==='/'||state.cwd===n.path||state.cwd.startsWith(n.path+'/')||shellHome(state.dialect).startsWith(n.path))throw Error('Osnovna ili trenutačna mapa vježbe ne može se ukloniti.');
    if(p.whatif){event('whatif',n.path);return done(['What if: Remove Item '+shellPath(state,n.path)]);}
    if(n.type==='dir'&&state.nodes.some(x=>x.path.startsWith(n.path+'/')))throw Error('Mapa nije prazna. Ovdje najprije ukloni pojedine tražene datoteke. -Recurse nije podržan.');
    state.nodes=state.nodes.filter(x=>x!==n);event(n.type==='dir'?'rmdir':'remove',n.path);return done();
  }
  if(cmd==='select-string'){
    const p=params({path:'value',pattern:'value',simplematch:'switch',casesensitive:'switch'},['pattern','path']),pattern=need(p,'pattern');
    if(!p.simplematch)throw Error('U vježbi dodaj -SimpleMatch za doslovno pretraživanje. Regularni izrazi nisu podržani.');
    let values,node=null;if(p.path){node=requireNode(state,p.path,'file');values=node.content.split('\n');if(values.at(-1)==='')values.pop();}else values=source();
    if(values.some(v=>typeof v!=='string'))throw Error('Select-String ovdje prima tekst. Najprije upotrijebi Get-Content ili izdvoji Line.');
    const norm=x=>p.casesensitive?x:x.toLowerCase();
    const items=values.map((Line,i)=>({Line,LineNumber:i+1,Path:node?shellPath(state,node.path):''})).filter(x=>norm(x.Line).includes(norm(pattern)));
    event('filter',node?.path??null,{pattern,piped,insensitive:!p.casesensitive});return done(items);
  }
  if(cmd==='select-object'){
    const p=params({property:'value',expandproperty:'value'},['property']);if(!!p.property===!!p.expandproperty)throw Error('Upotrijebi -Property ili -ExpandProperty.');
    const items=source();if(p.expandproperty){event('expand',null,{property:p.expandproperty});return done(items.map(x=>psProperty(x,p.expandproperty)));}
    const props=p.property.split(',').map(x=>x.trim());event('select',null,{properties:props});return done(items.map(x=>Object.fromEntries(props.map(k=>[k,psProperty(x,k)]))));
  }
  if(cmd==='where-object'){
    const p=params({property:'value',value:'value',eq:'switch'},['property','value']),property=need(p,'property'),expected=need(p,'value');
    const items=source().filter(x=>String(psProperty(x,property)).toLowerCase()===expected.toLowerCase());event('where',null,{property,value:expected});return done(items);
  }
  if(cmd==='sort-object'){
    const p=params({property:'value',descending:'switch'},['property']),property=need(p,'property');
    const items=[...source()];items.forEach(x=>psProperty(x,property));items.sort((a,b)=>{const av=psProperty(a,property),bv=psProperty(b,property);return (typeof av==='number'&&typeof bv==='number'?av-bv:String(av).toLowerCase().localeCompare(String(bv).toLowerCase()))*(p.descending?-1:1);});
    event('sort',null,{property,descending:!!p.descending});return done(items);
  }
  if(cmd==='measure-object'){
    const p=params({property:'value',sum:'switch'},['property']),items=source();let result={Count:items.length};
    if(p.sum){const values=items.map(x=>p.property?Number(psProperty(x,p.property)):Number(x));if(values.some(x=>!Number.isFinite(x)))throw Error('Za -Sum odaberi brojčano svojstvo, npr. Length.');result.Sum=values.reduce((a,b)=>a+b,0);}
    event('measure',null,{property:p.property??null,sum:!!p.sum});return done([result]);
  }
  throw Error('Nepoznat ili nepodržan cmdlet „'+tokens[0].value+'”. Upiši Get-Help. Ovo je PowerShell, a ne CMD.');
}
