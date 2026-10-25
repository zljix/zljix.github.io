// A local name separates workspaces. It is not server-verified authentication.
export function createStudent(firstName,lastName){
  const clean=value=>typeof value==='string'?value.normalize('NFC').trim().replace(/\s+/gu,' '):'';
  const first=clean(firstName),last=clean(lastName);
  const valid=value=>value.length>=1&&value.length<=50&&/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(value);
  if(!valid(first)||!valid(last))throw Error('Unesi ime i prezime u oba polja (do 50 znakova po polju). Dopuštena su slova, razmaci, crtica i apostrof.');
  return {version:1,firstName:first,lastName:last};
}
export function validateStudent(raw){
  if(raw==null)return null;
  if(typeof raw!=='object'||Array.isArray(raw)||raw.version!==1)throw Error('Neispravan identitet učenika u kopiji.');
  return createStudent(raw.firstName,raw.lastName);
}
export const studentName=student=>student?student.firstName+' '+student.lastName:'Bez imena i prezimena';
export function studentKey(student){const s=validateStudent(student);if(!s)throw Error('Najprije unesi ime i prezime.');return [s.firstName,s.lastName].map(v=>encodeURIComponent(v.toLocaleLowerCase('hr'))).join(':');}
export function requireSameStudent(expected,actual){
  if(!actual)throw Error('Ova kopija nema ime i prezime. Rezultati bez vlasnika ne mogu se učitati u imenovani rad. Izvorna kopija ostaje sačuvana.');
  if(!expected||studentKey(expected)!==studentKey(actual))throw Error('Kopija pripada: '+studentName(validateStudent(actual))+'. Aktivni učenik / učenica: '+studentName(expected)+'. Tuđi rezultati nisu učitani.');
}
export function studentFilename(student,suffix,extension='json'){
  const name=studentName(validateStudent(student)).replace(/[^\p{L}\p{N}_-]+/gu,'-');
  return 'zljixOS-'+name+'-'+suffix+'.'+extension;
}
export function requestStudent(){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.id='student-dialog';dialog.setAttribute('aria-labelledby','student-title');
    dialog.innerHTML=`<form id="student-form" autocomplete="off"><span class="label">zljixOS · TVOJ PROSTOR ZA UČENJE</span><h1 id="student-title">Prije početka<br>upoznajmo se.</h1><p>Unesi svoje ime i prezime. Uz njih se spremaju tvoji bodovi, vježbe i izvještaji.</p><label>Ime<input id="student-first" name="firstName" required maxlength="50" autocomplete="off" autocapitalize="words"></label><label>Prezime<input id="student-last" name="lastName" required maxlength="50" autocomplete="off" autocapitalize="words"></label><p id="student-error" class="error" role="alert"></p><button class="button primary" type="submit">Otvori moj rad →</button><p class="student-note">Na zajedničkom računalu svaki put upiši svoje ime. Postojeći rad pod tim imenom nastavlja se, a novo ime otvara prazan napredak. Ime ostaje u ovom pregledniku i u kopijama koje samostalno spremiš.</p></form>`;
    dialog.oncancel=e=>e.preventDefault();document.body.append(dialog);dialog.showModal();
    dialog.querySelector('form').onsubmit=e=>{e.preventDefault();try{const student=createStudent(dialog.querySelector('#student-first').value,dialog.querySelector('#student-last').value);dialog.close();dialog.remove();resolve(student);}catch(error){dialog.querySelector('#student-error').textContent=error.message;}};
    dialog.querySelector('input').focus();
  });
}
