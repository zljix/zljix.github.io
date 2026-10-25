// This application-local MAC detects edits to exported files. The key ships with
// the offline application, so it is NOT a server signature or proof of authorship.
// Keep this key stable across releases so exported work remains portable.
const KEY_HEX='fbf41343272126f6bfcd8f4f4b5137c284f39942860d8f0434eb8720fbaa2ae1';
const DOMAIN='zljixOS/backup/v3\n';
const encoder=new TextEncoder();
const invalid=()=>Error('Provjera potpisa nije uspjela. Ime, prezime ili sadržaj kopije promijenjeni su nakon izvoza, ili je kopija oštećena. Rad nije učitan.');

// Object order and JSON indentation are immaterial; every field value and array
// position is covered. Verify the raw payload BEFORE state migration/normalizing.
function canonical(value,depth=0){
  if(depth>64)throw Error('JSON kopija ima preduboko ugniježđene podatke.');
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(v=>canonical(v,depth+1)).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k],depth+1)).join(',')+'}';
  throw Error('Kopija sadrži nepodržanu vrijednost.');
}
function cryptoAPI(){
  const subtle=globalThis.crypto?.subtle;
  if(!subtle)throw Error('Preglednik ne podržava provjeru potpisa. Otvori zljixOS preko HTTPS adrese ili preuzeti HTML u novijem pregledniku.');
  return subtle;
}
const bytes=hex=>Uint8Array.from(hex.match(/../g),pair=>parseInt(pair,16));
const key=api=>api.importKey('raw',bytes(KEY_HEX),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const data=payload=>encoder.encode(DOMAIN+canonical(payload));
export async function signBackup(payload){
  const message=data(payload),api=cryptoAPI();
  const value=await api.sign('HMAC',await key(api),message);
  return {algorithm:'HMAC-SHA-256',keyId:'local-v1',value:Array.from(new Uint8Array(value),b=>b.toString(16).padStart(2,'0')).join('')};
}
export async function verifyBackup(payload,integrity){
  if(!integrity||typeof integrity!=='object'||Array.isArray(integrity)||Object.keys(integrity).sort().join(',')!=='algorithm,keyId,value'||integrity.algorithm!=='HMAC-SHA-256'||integrity.keyId!=='local-v1'||typeof integrity.value!=='string'||!/^[0-9a-f]{64}$/.test(integrity.value))throw invalid();
  const message=data(payload),api=cryptoAPI();
  if(!await api.verify('HMAC',await key(api),bytes(integrity.value),message))throw invalid();
}
