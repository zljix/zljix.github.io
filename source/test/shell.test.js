import test from 'node:test';
import assert from 'node:assert/strict';
import {SHELL_LESSONS,SHELL_MAX_XP} from '../public/orbit/shell-data.js';
import {shellSeed,executeShell,shellNode,shellPath} from '../public/orbit/shell-engine.js';
import {defaultShell,replayShell,shellCommand,shellHint,resetShellLevel,shellProgress,shellStats,shellUnlocked,validateShell,openShellLevel,shellReportText} from '../public/orbit/shell-model.js';
import {FileSystem,seed,validateState} from '../public/orbit/core.js';
import {gameStats,MAX_XP,badges,scoreReport} from '../public/orbit/game-model.js';
import {serializeBackup,parseBackup} from '../public/orbit/recovery-model.js';
const fixture=[{path:'dokumenti/tekst.txt',content:'OK Prvo\nERROR Mreza\nERROR Disk\n'},{path:'tajna.txt',content:'sacuvaj\n',mode:'400'}];
function session(dialect){let state=shellSeed(dialect,fixture);return {run(line){const r=executeShell(state,line);state=r.state;return r;},get state(){return state;}};}
function solve(shell,lesson,mode='hard',start=0,end=5){for(const step of lesson.steps.slice(start,end))for(const line of step.solution)shellCommand(shell,lesson.id,line,mode);}

test('Both dialects accept valid paths and quotes, but preserve their different case rules',()=>{
 const cmd=session('cmd');assert.equal(cmd.run('CD DOKUMENTI').ok,true);assert.equal(cmd.run('TYPE TEKST.TXT').output,fixture[0].content);assert.equal(shellPath(cmd.state),'C:\\ucenik\\dokumenti');
 assert.equal(cmd.run('cd ..').ok,true);assert.equal(cmd.run('mkdir "Moj rad"').ok,true);assert.equal(cmd.run('echo radi>"Moj rad\\Plan.txt"').ok,true);assert.equal(cmd.run('type "c:\\UCENIK\\moj RAD\\plan.TXT"').output,'radi\n');
 const sh=session('linux');assert.equal(sh.run('CD dokumenti').ok,false);assert.equal(sh.run('cd Dokumenti').ok,false);assert.equal(sh.run('cat ~/dokumenti/tekst.txt').output,fixture[0].content);assert.equal(sh.run("mkdir 'Moj rad'").ok,true);assert.equal(sh.run('echo radi>"Moj rad/Plan.txt"').ok,true);assert.equal(sh.run('cat "Moj rad/plan.txt"').ok,false);
 assert.equal(sh.run('cd dokumenti').ok,true);assert.equal(sh.run('cat ../tajna.txt').output,'sacuvaj\n');assert.equal(sh.run('cd').ok,true);assert.equal(sh.state.cwd,'/home/ucenik');
});
test('Output replacement, append, pipes, case-insensitive search and no matches have distinct behavior',()=>{
 for(const dialect of ['cmd','linux']){const s=session(dialect),read=dialect==='cmd'?'type':'cat',filter=dialect==='cmd'?'find "ERROR"':'grep -F "ERROR"';
 assert.equal(s.run('echo Prvo>plan.txt').ok,true);s.run('echo Drugo>>plan.txt');assert.equal(s.run(read+' plan.txt').output,'Prvo\nDrugo\n');s.run('echo Zamjena>plan.txt');assert.equal(s.run(read+' plan.txt').output,'Zamjena\n');
 const path=dialect==='cmd'?'dokumenti\\tekst.txt':'dokumenti/tekst.txt';s.run(read+' '+path+' | '+filter+' > rezultat.txt');assert.equal(s.run(read+' rezultat.txt').output,'ERROR Mreza\nERROR Disk\n');
 assert.equal(s.run(read+' '+path+' | '+filter+' | '+(dialect==='cmd'?'find "Disk"':'grep -F "Disk"')).output,'ERROR Disk\n');
 assert.equal(s.run((dialect==='cmd'?'find /i "error" ':'grep -Fi "error" ')+path).output.includes('ERROR Disk'),true);
 const none=s.run((dialect==='cmd'?'find "nema" ':'grep -F "nema" ')+path);assert.equal(none.code,1);assert.equal(none.ok,true);
 s.run(read+' rezultat.txt > rezultat.txt');assert.equal(s.run(read+' rezultat.txt').output,'');
 }
});
test('CMD echo preserves quoted text, Linux removes quotes, and quoted operators stay literal',()=>{
 assert.equal(session('cmd').run('echo "A | B"').output,'"A | B"\n');assert.equal(session('linux').run('echo "A | B"').output,'A | B\n');
});
test('Copy, rename and move preserve contents and delete only the specified source',()=>{
 for(const dialect of ['cmd','linux']){const s=session(dialect),cp=dialect==='cmd'?'copy':'cp',mv=dialect==='cmd'?'move':'mv',ren=dialect==='cmd'?'ren':'mv';
 s.run(cp+' tajna.txt kopija.txt');assert.equal(shellNode(s.state,'tajna.txt').content,'sacuvaj\n');assert.equal(shellNode(s.state,'kopija.txt').content,'sacuvaj\n');
 s.run(ren+' kopija.txt gotovo.txt');assert.equal(shellNode(s.state,'kopija.txt'),undefined);s.run(mv+' gotovo.txt dokumenti');assert.equal(shellNode(s.state,'gotovo.txt'),undefined);assert.equal(shellNode(s.state,'dokumenti/gotovo.txt').content,'sacuvaj\n');
 assert.equal(s.run(cp+' tajna.txt tajna.txt').ok,false);assert.equal(s.run(cp+' dokumenti kopija').ok,false);
 }
});
test('Permissions separate read from write; directory removal requires emptiness',()=>{
 const s=session('linux'),before=structuredClone(s.state);assert.equal(s.run('echo izgubljeno>tajna.txt').ok,false);assert.deepEqual(s.state,before);assert.equal(s.run('cat tajna.txt').output,'sacuvaj\n');
 assert.equal(s.run('chmod u+w tajna.txt').ok,true);assert.equal(shellNode(s.state,'tajna.txt').mode,'600');assert.equal(s.run('echo novo>tajna.txt').ok,true);
 s.run('chmod 200 tajna.txt');assert.equal(s.run('cat tajna.txt').ok,false);assert.match(s.run('ls -l tajna.txt').output,/-\-w-------/);
 assert.equal(s.run('rmdir dokumenti').ok,false);s.run('rm dokumenti/tekst.txt');assert.equal(s.run('rmdir dokumenti').ok,true);assert.equal(s.run('rmdir /home').ok,false);
});
test('Malformed, host-like and unsupported commands are bounded and never partially mutate the model',()=>{
 const s=session('linux');for(const line of ['mkdir "ne','echo $(whoami)','echo a && rm tajna.txt','echo a; rm tajna.txt','rm -rf /','sudo chmod 777 tajna.txt','cat tajna.txt |','echo a >>','echo a > x > y','cat tajna.txt\nrm tajna.txt']){const before=structuredClone(s.state);assert.equal(s.run(line).ok,false,line);assert.deepEqual(s.state,before,line);}
 assert.equal(s.run("echo '<script>window.hacked=1</script>'").output,'<script>window.hacked=1</script>\n');
});
test('All 90 curricular objectives can be completed, including expected denial of writing',()=>{
 const shell=defaultShell();assert.equal(SHELL_LESSONS.length,18);assert.equal(SHELL_MAX_XP,1800);
 for(const lesson of SHELL_LESSONS){assert.equal(shellUnlocked(shell,lesson.id),true,lesson.id);for(let i=0;i<5;i++){solve(shell,lesson,'hard',i,i+1);const r=shellProgress(shell,lesson.id);assert.equal(r.cursor,i+1,lesson.id+' step '+(i+1)+' '+JSON.stringify(r.last));assert.equal(r.xp,(i+1)*20);} }
 assert.equal(shellStats(shell).total,1800);assert.equal(shellStats(shell).completed,18);assert.equal(validateShell(shell).records['linux-6'].events.length>0,true);
});
test('Difficulty upgrades, repetition and reload do not duplicate or erase XP',()=>{
 const s=defaultShell(),l=SHELL_LESSONS[0];assert.equal(shellUnlocked(s,'cmd-2'),false);assert.throws(()=>openShellLevel(s,'cmd-2'),/prethodnu/);
 solve(s,l,'easy',0,3);assert.equal(shellProgress(s,l.id).xp,60);assert.equal(shellUnlocked(s,'cmd-2'),true);assert.throws(()=>shellCommand(s,l.id,'dir','easy'),/dovršena/);
 solve(s,l,'moderate',3,4);solve(s,l,'hard',4,5);assert.equal(shellProgress(s,l.id).xp,100);resetShellLevel(s,l.id);assert.equal(shellProgress(s,l.id).cursor,0);assert.equal(shellProgress(s,l.id).xp,100);solve(s,l,'easy',0,3);assert.equal(shellProgress(s,l.id).xp,100);
 assert.deepEqual(shellStats(validateShell(JSON.parse(JSON.stringify(s)))),shellStats(s));
});
test('The checker accepts valid alternate routes and does not award points for merely echoing a command',()=>{
 const s=defaultShell();shellCommand(s,'cmd-1','echo dir','easy');assert.equal(shellProgress(s,'cmd-1').xp,0);
 for(const line of ['DIR C:\\ucenik /b','CD c:\\UCENIK\\DOKUMENTI','TYPE C:\\ucenik\\dokumenti\\UPUTE.TXT'])shellCommand(s,'cmd-1',line,'easy');assert.equal(shellProgress(s,'cmd-1').xp,60);
});
test('Hard hints require an attempt; hint history and command evidence survive import',()=>{
 const s=defaultShell();assert.throws(()=>shellHint(s,'linux-1','hard'),/Pomoć/);shellCommand(s,'linux-1','PWD','hard');shellHint(s,'linux-1','hard');shellCommand(s,'linux-1','pwd','hard');
 const r=shellProgress(validateShell(s),'linux-1');assert.equal(r.help[0],true);assert.equal(r.attempts[0],2);assert.equal(r.firstMode[0],'hard');assert.equal(r.xp,20);
 assert.throws(()=>validateShell({...s,records:{bogus:{events:[]}}}),/Nepoznata/);
 assert.throws(()=>replayShell('cmd-1',{events:[{type:'command',line:'dir',mode:'cheat'}]}),/težina/);
});
test('Old workspaces migrate additively and backups preserve the new track and original files',()=>{
 const old=seed();delete old.learning.shell;const fs=new FileSystem(old);assert.equal(shellStats(fs.state.learning.shell).total,0);const original=structuredClone(fs.state.nodes);
 fs.transact(()=>solve(fs.state.learning.shell,SHELL_LESSONS[0],'easy',0,3));assert.equal(gameStats(fs.state).total,60);assert.equal(gameStats(fs.state).shell,60);assert.equal(gameStats(fs.state).max,MAX_XP);assert.equal(MAX_XP,3520);assert.deepEqual(fs.state.nodes,original);
 const imported=parseBackup(serializeBackup(fs.state)).state;assert.deepEqual(imported.learning.shell,fs.state.learning.shell);assert.equal(gameStats(validateState(imported)).shell,60);
 const forged=structuredClone(imported);forged.learning.shell.xp=99999;forged.learning.shell.records['cmd-1'].earned=[true,true,true,true,true];assert.equal(gameStats(validateState(forged)).shell,60);
 assert.match(shellReportText(fs.state.learning.shell),/60\/1800/);assert.match(scoreReport(fs.state,String),/DOS\/CMD, Linux Shell i PowerShell/);
});
test('All three terminal achievement badges require the full corresponding track',()=>{
 const fs=new FileSystem(seed());fs.transact(()=>{for(const l of SHELL_LESSONS)solve(fs.state.learning.shell,l);});assert.equal(gameStats(fs.state).shell,1800);assert.equal(badges(fs.state).find(b=>b.id==='cmd').earned,true);assert.equal(badges(fs.state).find(b=>b.id==='linux').earned,true);assert.equal(badges(fs.state).find(b=>b.id==='powershell').earned,true);
});
