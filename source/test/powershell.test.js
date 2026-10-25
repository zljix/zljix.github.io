import test from 'node:test';
import assert from 'node:assert/strict';
import {shellSeed,executeShell,shellNode,shellPrompt} from '../public/orbit/shell-engine.js';
import {POWERSHELL_LESSONS} from '../public/orbit/powershell-data.js';
import {defaultShell,shellCommand,shellProgress,resetShellLevel,validateShell,shellHint,shellUnlocked} from '../public/orbit/shell-model.js';
const session=(entries=[])=>{let state=shellSeed('powershell',entries);return {get state(){return state;},run(line){const r=executeShell(state,line);state=r.state;return r;}};};
test('PowerShell cmdlets, parameters, properties and Windows paths are case-insensitive',()=>{
 const s=session([{path:'Rad/plan.txt',content:'Pozdrav\n'}]);assert.equal(shellPrompt(s.state),'PS C:\\ucenik>');
 assert.equal(s.run('GET-CONTENT -PATH c:\\UCENIK\\rad\\PLAN.TXT').output,'Pozdrav\n');assert.equal(s.run('cd .\\Rad').ok,true);assert.equal(s.run('pwd').items[0].Path,'C:\\ucenik\\Rad');
 assert.equal(s.run('Get-ChildItem | Select-Object -ExpandProperty name').output,'plan.txt\n');
});
test('named parameters can be reordered and quoted operators remain literal text',()=>{
 const s=session();assert.equal(s.run('New-Item -Path "moj rad" -ItemType Directory').ok,true);
 assert.equal(s.run('Set-Content -Value "a | b > c" -Path "moj rad\\a.txt"').ok,true);
 assert.equal(s.run("Add-Content 'moj rad\\a.txt' 'Ne diraj $x'").ok,true);
 assert.equal(shellNode(s.state,'moj rad/a.txt').content,'a | b > c\nNe diraj $x\n');
 assert.equal(s.run("Set-Content -Path 'moj rad\\a.txt' -Value 'O''Brien'").ok,true);assert.equal(shellNode(s.state,'moj rad/a.txt').content,"O'Brien\n");
});
test('MatchInfo objects retain properties until Line is explicitly expanded',()=>{
 const s=session([{path:'log.txt',content:'OK\nERROR Disk\nerror Mreza\n'}]);
 const a=s.run('Select-String -Path log.txt -Pattern "ERROR" -SimpleMatch');assert.equal(a.items.length,2);assert.equal(a.items[0].LineNumber,2);assert.match(a.output,/log.txt:2:ERROR Disk/);
 const b=s.run('Select-String -Path log.txt -Pattern "ERROR" -SimpleMatch -CaseSensitive');assert.equal(b.items.length,1);
 assert.equal(s.run('Select-String -Path log.txt -Pattern "ERROR" -SimpleMatch | Set-Content -Path bad.txt').ok,false);assert.equal(shellNode(s.state,'bad.txt'),undefined);
 assert.equal(s.run('Get-Content log.txt | Select-String -Pattern "ERROR" -SimpleMatch | Select-Object -ExpandProperty Line | Set-Content -Path good.txt').ok,true);
 assert.equal(shellNode(s.state,'good.txt').content,'ERROR Disk\nerror Mreza\n');
 assert.equal(s.run('Select-String -Path log.txt -Pattern "missing" -SimpleMatch').items.length,0);
});
test('file objects support numeric sorting, filtering, projection and measurement',()=>{
 const s=session(POWERSHELL_LESSONS[4].entries);
 const r=s.run('Get-ChildItem -File | Where-Object -Property extension -EQ -Value ".TXT" | Sort-Object Length -Descending | Select-Object -Property Name,Length');
 assert.equal(r.ok,true,r.output);assert.deepEqual(r.items,[{Name:'veliko.txt',Length:12},{Name:'malo.txt',Length:4}]);
 assert.deepEqual(s.run('Get-ChildItem -File | Measure-Object -Property Length -Sum').items,[{Count:3,Sum:21}]);
 assert.equal(s.run('Get-ChildItem -File | Select-Object -ExpandProperty Unknown').ok,false);
});
test('WhatIf retains the file; Remove-Item refuses nonempty and active directories',()=>{
 const s=session([{path:'tmp.txt',content:'x'},{path:'folder/keep.txt',content:'k'}]);const before=structuredClone(s.state);
 assert.equal(s.run('Remove-Item -Path tmp.txt -WhatIf').ok,true);assert.deepEqual(s.state,before);
 for(const line of ['Remove-Item folder','Remove-Item C:\\ucenik','Remove-Item -Path tmp.txt -Recurse'])assert.equal(s.run(line).ok,false,line);
 assert.equal(s.run('Remove-Item tmp.txt').ok,true);assert.equal(shellNode(s.state,'tmp.txt'),undefined);
});
test('unsupported script syntax, missing parameters and malformed quotes do not mutate files',()=>{
 const s=session([{path:'keep.txt',content:'safe'}]);
 for(const line of ['Remove-Item keep.txt; Get-Location','Invoke-Expression "x"','Set-Content keep.txt "$env:USER"','Set-Content -Path','Get-ChildItem |','New-Item -Path x -ItemType Directory -Oops y','Set-Content -Path x -Value "unfinished','Get-Content keep.txt | Select-Object -ExpandProperty Name']){const before=structuredClone(s.state);assert.equal(s.run(line).ok,false,line);assert.deepEqual(s.state,before,line);}
});
test('PowerShell Easy to Moderate to Hard preserves XP, hints and replay on every level',()=>{
 const s=defaultShell();assert.equal(shellUnlocked(s,'powershell-1'),true);
 for(const l of POWERSHELL_LESSONS){
  assert.equal(shellUnlocked(s,l.id),true);for(const [mode,start,end] of [['easy',0,3],['moderate',3,4],['hard',4,5]]){
   for(const step of l.steps.slice(start,end))for(const line of step.solution)shellCommand(s,l.id,line,mode);
   assert.equal(shellProgress(s,l.id).xp,end*20);
  }
  resetShellLevel(s,l.id);shellCommand(s,l.id,'Unsupported-Cmdlet','hard');shellHint(s,l.id,'hard');
  for(const step of l.steps.slice(0,3))for(const line of step.solution)shellCommand(s,l.id,line,'easy');
  assert.equal(shellProgress(s,l.id).xp,100);assert.equal(shellProgress(s,l.id).help[0],true);
 }
 assert.deepEqual(validateShell(s),s);
});
