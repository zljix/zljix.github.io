import {powerShellCommand,POWERSHELL_HELP} from './powershell-engine.js';
// Deliberately bounded teaching interpreter. Never runs host commands or eval.
const copy = value => JSON.parse(JSON.stringify(value));
export const shellHome = dialect => dialect !== 'linux' ? '/ucenik' : '/home/ucenik';
export function shellPath(state, path = state.cwd) { return state.dialect !== 'linux' ? 'C:' + path.replaceAll('/', '\\') : path; }
export function shellPrompt(state) { return state.dialect==='powershell'?'PS '+shellPath(state)+'>':state.dialect === 'cmd' ? shellPath(state) + '>' : 'ucenik@zljixOS:' + shellPath(state) + '$'; }
export function shellSeed(dialect, entries = []) {
  const home = shellHome(dialect), state = {dialect, cwd:home, nodes:[{path:'/',type:'dir',mode:'755'}]};
  const addDir = path => { if (!state.nodes.some(n => n.path === path)) state.nodes.push({path,type:'dir',mode:'755'}); };
  let part = ''; for (const name of home.split('/').filter(Boolean)) { part += '/' + name; addDir(part); }
  for (const entry of entries) {
    const path = home + '/' + entry.path;
    let parent = ''; for (const name of path.split('/').slice(1,-1)) { parent += '/' + name; addDir(parent); }
    if (entry.type === 'dir') addDir(path);
    else state.nodes.push({path,type:'file',content:entry.content || '',mode:entry.mode || '644'});
  }
  return state;
}
export function resolveShellPath(state, input = '.') {
  if (typeof input !== 'string' || input.length > 180) throw Error('Putanja je preduga.');
  let path = input;
  if (state.dialect !== 'linux') {
    if (/^[a-z]:/i.test(path)) { if (!/^c:\\/i.test(path)) throw Error('U ovoj vježbi koristi apsolutnu putanju C:\\…; postoji samo disk C:.'); path = path.slice(2); }
    path = path.replaceAll('\\','/');
  } else if (path === '~' || path.startsWith('~/')) path = shellHome('linux') + path.slice(1);
  if (!path.startsWith('/')) path = state.cwd + '/' + path;
  const parts = [];
  for (const p of path.split('/')) {
    if (!p || p === '.') continue;
    if (p === '..') { parts.pop(); continue; }
    if (/[\u0000-\u001f:*?<>|]/.test(p) || p.length > 80 || (state.dialect !== 'linux' && /[. ]$/.test(p))) throw Error('Za ove vježbe koristi običan naziv bez zamjenskih znakova.');
    parts.push(p);
  }
  return '/' + parts.join('/');
}
const key = (state, path) => state.dialect !== 'linux' ? path.toLowerCase() : path;
export const shellNode = (state, input) => { const path = resolveShellPath(state,input); return state.nodes.find(n => key(state,n.path) === key(state,path)); };
const parentPath = path => path.slice(0,path.lastIndexOf('/')) || '/';
const basename = path => path.slice(path.lastIndexOf('/')+1);
function requireNode(state, input, type) {
  const node = shellNode(state,input);
  if (!node) throw Error('Putanja ne postoji: ' + input + '. Provjeri naziv, trenutačnu mapu i velika/mala slova.');
  if (type && node.type !== type) throw Error(type === 'dir' ? 'To je datoteka, a cd/rmdir traže mapu.' : 'To je mapa. Navedi naziv tekstualne datoteke.');
  return node;
}
function permit(state, node, bit) {
  if (state.dialect === 'linux' && !(Number(node.mode[0]) & bit)) throw Error('Pristup odbijen: vlasnik nema dozvolu ' + (bit === 4 ? 'čitanja (r).' : 'pisanja (w).') + ' Provjeri ls -l i chmod.');
}
function destination(state, input) {
  const path = resolveShellPath(state,input), parent = requireNode(state,parentPath(path),'dir');
  return parent.path === '/' ? '/' + basename(path) : parent.path + '/' + basename(path);
}
function write(state, input, content, append = false) {
  let node = shellNode(state,input);
  if (node) { if (node.type !== 'file') throw Error('Izlaz se zapisuje u datoteku, ne u mapu.'); permit(state,node,2); }
  else { node = {path:destination(state,input),type:'file',mode:'644',content:''}; state.nodes.push(node); }
  node.content = (append ? node.content : '') + content;
  if (node.content.length > 8000) throw Error('Nastavna datoteka može imati najviše 8 000 znakova.');
  return node;
}
export function shellTokens(line, dialect) {
  const tokens = []; let value = '', raw = '', quote = null, started = false, quoted = false;
  const push = () => { if (started) tokens.push({value,raw,quoted}); value='';raw='';started=false;quoted=false; };
  for (let i=0; i<line.length; i++) {
    const c=line[i];
    if (quote) {
      raw+=c;
      if (c===quote) {if(dialect==='powershell'&&line[i+1]===quote){value+=quote;raw+=line[++i];}else quote=null;}
      else if (dialect==='linux' && c==='\\' && quote==='"' && ['"','\\','$','`'].includes(line[i+1])) { value+=line[++i];raw+=line[i]; }
      else { if(dialect==='powershell'&&quote==='"'&&/[$`]/.test(c))throw Error('Interpolacija i escape sekvence nisu dio ovih vježbi; koristi doslovni tekst.'); if (dialect==='linux' && quote==='"' && /[$`]/.test(c)) throw Error('Varijable i zamjene naredbi nisu dio ovih vježbi.'); value+=c; }
    } else if (c==='"' || dialect!=='cmd' && c==="'") { quote=c;raw+=c;started=true;quoted=true; }
    else if (dialect==='linux' && c==='\\') { if (i===line.length-1) throw Error('Dovrši znak iza obrnute kose crte.');raw+=c+line[i+1];value+=line[++i];started=true; }
    else if (/\s/.test(c)) push();
    else if (c==='|' || c==='>') { push();const op=c==='>'&&line[i+1]==='>'?(i++,'>>'):c;tokens.push({op,value:op}); }
    else if (/[&<]/.test(c) || dialect==='linux' && /[;$`*?\[\]]/.test(c) || dialect==='cmd' && /[%^!]/.test(c) || dialect==='powershell' && /[;$`{}()]/.test(c)) throw Error('Taj operator nije podržan u nastavnom terminalu. Upiši jednu naredbu, cjevovod | ili izlaz > / >>.');
    else { value+=c;raw+=c;started=true; }
  }
  if (quote) throw Error('Nedostaje završni navodnik. Putanju s razmakom zatvori navodnicima.');
  push();return tokens;
}
const argumentCount = (args,min,max=min) => { if (args.length<min || args.length>max) throw Error('Provjeri broj argumenata. Pogledaj obrazac naredbe u podsjetniku.'); };
export function modeLetters(mode) { return [...mode].map(n => [4,2,1].map((b,i) => Number(n)&b ? 'rwx'[i] : '-').join('')).join(''); }
export function shellHelp(dialect) {
  return dialect==='powershell'?POWERSHELL_HELP:dialect==='cmd' ? 'dir [putanja] [/b] · cd [putanja] · type datoteka\nmkdir mapa (ili md) · echo tekst > datoteka · echo tekst >> datoteka\ncopy izvor odredište · move izvor odredište · ren datoteka novi_naziv\nfind [/i] "tekst" [datoteka] · del datoteka · rmdir prazna_mapa (ili rd)\ncls · help · naredba | find "tekst"\nNaredbe i putanje ne razlikuju velika/mala slova. Putanje s razmakom stavi u dvostruke navodnike.' : 'pwd · ls [-l] [-a] [putanja] · cd [putanja] · cat datoteka\nmkdir [-p] mapa · touch datoteka · echo tekst > datoteka · echo tekst >> datoteka\ncp izvor odredište · mv izvor odredište · rm datoteka · rmdir prazna_mapa\ngrep [-F] [-i] [-n] "tekst" [datoteka] · chmod 640 datoteka · chmod u+w datoteka\nclear · help · naredba | grep -F "tekst"\nVelika i mala slova se razlikuju. Ovo je ograničeni nastavni model, ne puni Bash.';
}
function command(state, tokens, stdin, piped) {
  let [name,...rest]=tokens;const original=name?.value || '';
  const cmd=state.dialect==='cmd'?original.toLowerCase():original, args=rest.map(t=>t.value), events=[];
  const event=(action,path,extra={})=>events.push({action,path,...extra});
  const done=(output='',code=0)=>({output,events,code});
  const windows=state.dialect==='cmd';
  if (!cmd) throw Error('Nedostaje naredba.');
  if (cmd==='help') { argumentCount(args,0);return done(shellHelp(state.dialect)+'\n'); }
  if (cmd===(windows?'cls':'clear')) { argumentCount(args,0);return {...done(),clear:true}; }
  if (cmd==='echo') { const text=windows?rest.map(t=>t.raw).join(' '):args.join(' ');event('echo',state.cwd);return done(text+'\n'); }
  if (cmd==='pwd'&&!windows || cmd==='cd'&&windows&&!args.length) { argumentCount(args,0);event('pwd',state.cwd);return done(shellPath(state)+'\n'); }
  if (cmd==='cd') { argumentCount(args,windows?1:0,1);const node=requireNode(state,args[0]||shellHome(state.dialect),'dir');state.cwd=node.path;event('cd',node.path);return done(); }
  if (cmd===(windows?'dir':'ls')) {
    const flags=[], paths=[];
    for (const a of args) {
      if (windows && a.startsWith('/')) { if (a.toLowerCase()!=='/b') throw Error('U ovom modelu dir podržava /b za ispis naziva.');flags.push('b'); }
      else if (!windows && a.startsWith('-')) { if (!/^-[la]+$/.test(a)) throw Error('Ovdje ls podržava -l i -a.');flags.push(...a.slice(1)); }
      else paths.push(a);
    }
    argumentCount(paths,0,1);const node=requireNode(state,paths[0]||'.');
    const list=node.type==='dir'?state.nodes.filter(n=>n.path!=='/'&&key(state,parentPath(n.path))===key(state,node.path)): [node];
    const visible=list.filter(n=>windows||flags.includes('a')||!basename(n.path).startsWith('.')).sort((a,b)=>a.path.localeCompare(b.path));
    event('list',node.path,{long:flags.includes('l')});
    return done(visible.map(n=>windows?(flags.includes('b')?'':n.type==='dir'?'<DIR>  ':'       ')+basename(n.path):flags.includes('l')?(n.type==='dir'?'d':'-')+modeLetters(n.mode)+' ucenik razred '+(n.type==='file'?n.content.length:0)+' '+basename(n.path):basename(n.path)).join('\n')+(visible.length?'\n':''));
  }
  if (cmd===(windows?'type':'cat')) {
    argumentCount(args,1);const node=requireNode(state,args[0],'file');permit(state,node,4);event('read',node.path);return done(node.content);
  }
  if (cmd==='mkdir'||windows&&cmd==='md') {
    const recursive=!windows&&args[0]==='-p';if(recursive)args.shift();argumentCount(args,1);
    const path=resolveShellPath(state,args[0]);
    if(shellNode(state,path)){if(recursive&&shellNode(state,path).type==='dir')return done();throw Error('Taj naziv već postoji.');}
    if(recursive){let current='';for(const p of path.split('/').filter(Boolean)){current+='/'+p;const existing=shellNode(state,current);if(existing?.type==='file')throw Error('Dio putanje je datoteka.');if(!existing)state.nodes.push({path:destination(state,current),type:'dir',mode:'755'});}}
    else state.nodes.push({path:destination(state,path),type:'dir',mode:'755'});
    event('mkdir',path);return done();
  }
  if (cmd==='touch'&&!windows) { argumentCount(args,1);const n=shellNode(state,args[0]);if(n){if(n.type!=='file')throw Error('U ovom modelu touch koristi tekstualnu datoteku.');permit(state,n,2);}else write(state,args[0],'');event('touch',resolveShellPath(state,args[0]));return done(); }
  if ([windows?'copy':'cp',windows?'move':'mv',...(windows?['ren','rename']:[])].includes(cmd)) {
    argumentCount(args,2);const src=requireNode(state,args[0],'file');permit(state,src,4);
    const rename=['ren','rename'].includes(cmd), copying=cmd===(windows?'copy':'cp');
    if(rename&&/[\\/:]/.test(args[1]))throw Error('ren mijenja naziv unutar iste mape. Za premještanje upotrijebi move.');
    let target=rename?parentPath(src.path)+'/'+args[1]:resolveShellPath(state,args[1]);
    if(!rename&&shellNode(state,target)?.type==='dir')target=shellNode(state,target).path+'/'+basename(src.path);
    if(key(state,target)===key(state,src.path))throw Error('Izvor i odredište su ista datoteka.');
    if(rename&&shellNode(state,target))throw Error('Novi naziv već postoji.');
    const old=src.path,n=write(state,target,src.content);if(!copying){n.mode=src.mode;state.nodes=state.nodes.filter(item=>item!==src);}
    event(copying?'copy':'move',n.path,{source:old});return done(windows?'        1 datoteka '+(copying?'kopirana.':'premještena.')+'\n':'');
  }
  if(cmd===(windows?'del':'rm')||windows&&cmd==='erase') {
    argumentCount(args,1);const n=requireNode(state,args[0],'file');state.nodes=state.nodes.filter(x=>x!==n);event('remove',n.path);return done();
  }
  if(cmd==='rmdir'||windows&&cmd==='rd') {
    argumentCount(args,1);const n=requireNode(state,args[0],'dir');
    if(n.path==='/'||state.cwd===n.path||state.cwd.startsWith(n.path+'/')||shellHome(state.dialect).startsWith(n.path))throw Error('Osnovna ili trenutačna mapa vježbe ne može se ukloniti.');
    if(state.nodes.some(x=>x.path.startsWith(n.path+'/')))throw Error('Mapa nije prazna. Prvo pregledaj i ukloni datoteke koje zadatak traži.');
    state.nodes=state.nodes.filter(x=>x!==n);event('rmdir',n.path);return done();
  }
  if(cmd===(windows?'find':'grep')) {
    const flags=[];while(args.length&&(windows?args[0].startsWith('/'):args[0].startsWith('-'))){const f=args.shift();if(windows){if(f.toLowerCase()!=='/i')throw Error('find u ovoj vježbi podržava /i.');flags.push('i');}else{if(!/^-[Fin]+$/.test(f))throw Error('grep u ovom modelu podržava -F, -i i -n.');flags.push(...f.slice(1));}}
    argumentCount(args,1,2);const [pattern,path]=args;
    if(windows&&!rest.find(t=>t.value===pattern)?.quoted)throw Error('CMD find traži tekst u dvostrukim navodnicima: find "ERROR" dnevnik.txt.');
    if(!windows&&!flags.includes('F')&&/[.\[\]*^$\\]/.test(pattern))throw Error('Za doslovne znakove koristi grep -F. Regularni izrazi nisu dio ovih vježbi.');
    let source=stdin,node=null;if(path){node=requireNode(state,path,'file');permit(state,node,4);source=node.content;}else if(!piped)throw Error('Navedi datoteku ili pošalji tekst kroz |.');
    const norm=s=>flags.includes('i')?s.toLowerCase():s;
    const lines=source.split('\n');if(lines.at(-1)==='')lines.pop();
    const matched=lines.map((line,i)=>({line,i})).filter(x=>norm(x.line).includes(norm(pattern)));
    event('filter',node?.path||null,{pattern,piped,insensitive:flags.includes('i')});
    const header=windows&&node?'\n---------- '+shellPath(state,node.path).toUpperCase()+'\n':'';
    return done(header+matched.map(x=>(flags.includes('n')?x.i+1+':':'')+x.line).join('\n')+(matched.length?'\n':''),matched.length?0:1);
  }
  if(cmd==='chmod'&&!windows) {
    argumentCount(args,2);const n=requireNode(state,args[1],'file');
    if(/^[0-7]{3}$/.test(args[0]))n.mode=args[0];
    else {const m=/^u([+=-])([rwx]+)$/.exec(args[0]);if(!m)throw Error('Koristi tri oktalne znamenke (npr. 640) ili u+r, u-w, u+rw.');const bits=[...m[2]].reduce((n,c)=>n|({r:4,w:2,x:1}[c]),0),old=Number(n.mode[0]);n.mode=String(m[1]==='+'?old|bits:m[1]==='-'?old&~bits:bits)+n.mode.slice(1);}
    event('chmod',n.path,{mode:n.mode});return done();
  }
  throw Error('Nepoznata ili nepodržana naredba „'+original+'” za '+(windows?'DOS/CMD':'Linux Shell')+'. Upiši help. '+(!windows&&original!==original.toLowerCase()?'Linux razlikuje velika i mala slova.':''));
}
export function executeShell(initial, line) {
  let state=copy(initial),events=[],output='',code=0,clear=false,items=[];
  try {
    if(typeof line!=='string'||!line.trim()||line.length>400||/[\r\n\u0000]/.test(line))throw Error('Upiši jednu naredbu do 400 znakova.');
    const tokens=shellTokens(line,state.dialect),segments=[[]];let redirect=null;
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];
      if(t.op==='|'){if(!segments.at(-1).length)throw Error('Nedostaje naredba uz |.');segments.push([]);}
      else if(t.op==='>'||t.op==='>>'){if(i!==tokens.length-2||tokens[i+1].op)throw Error('Stavi jedno preusmjeravanje na kraj: naredba > datoteka.');redirect={path:tokens[++i].value,append:t.op==='>>'};}
      else segments.at(-1).push(t);
    }
    if(segments.length>(state.dialect==='powershell'?5:3)||segments.some(s=>!s.length))throw Error('Provjeri cjevovod: do tri naredbe, ili pet za PowerShell.');
    if(state.dialect!=='powershell'&&segments.length>1&&segments.slice(1).some(s=>s[0].value!==(state.dialect==='cmd'?'find':'grep')&&!(state.dialect==='cmd'&&s[0].value.toLowerCase()==='find')))throw Error('Nakon | ove vježbe podržavaju samo find (CMD) ili grep (Linux).');
    // As in a shell, opening > truncates the output BEFORE the command reads.
    if(redirect)write(state,redirect.path,'',redirect.append);
    for(let i=0;i<segments.length;i++){const result=state.dialect==='powershell'?powerShellCommand(state,segments[i],items,i>0,{requireNode,write,destination,resolveShellPath,shellPath,shellHome,shellNode,key,parentPath,basename}):command(state,segments[i],output,i>0);items=result.items??[];output=result.output;events.push(...result.events);code=result.code;clear||=!!result.clear;}
    if(redirect){const n=write(state,redirect.path,output,true);events.push({action:redirect.append?'append':'write',path:n.path});output='';}
    if(state.nodes.length>80)throw Error('Nastavni prostor ima najviše 80 stavki.');
    return {state,output,events,code,ok:true,clear,items};
  } catch(error) {
    // Failed/unsupported commands never partially mutate this teaching model.
    return {state:copy(initial),output:error.message,events:[],code:2,ok:false,clear:false};
  }
}
