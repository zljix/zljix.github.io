import {seed,validateState} from './core.js';

export const STORAGE_KEY='orbit-os.offline.workspace.v1';

// Keep the most recent work in memory if browser storage is unavailable or full.
// A read/compare/write detects ordinary stale tabs; it is not a cross-tab lock.
export function createLocalStore(storage){
  let initial=seed(),lastRaw=null,revision=0,pending=null,kind='memory';
  let message='Lokalna pohrana nije dostupna. Prije zatvaranja izvezi rad u JSON.';
  let corrupt=false;
  const listeners=new Set();
  function notify(){for(const listener of listeners)listener();}
  function read(raw){
    const envelope=JSON.parse(raw);
    if(envelope?.format!=='orbit-local'||envelope.version!==1||!Number.isSafeInteger(envelope.revision)||envelope.revision<1)throw new Error('Nepoznat format lokalne pohrane.');
    return {state:validateState(envelope.state),revision:envelope.revision};
  }
  try{
    if(storage){lastRaw=storage.getItem(STORAGE_KEY);if(lastRaw!==null){
      try{const loaded=read(lastRaw);initial=loaded.state;revision=loaded.revision;kind='saved';message='';}
      catch{corrupt=true;kind='corrupt';message='Spremljeni rad nije moguće učitati. Izvorni zapis nije prepisan. Ovaj privremeni rad izvezi u JSON.';}
    }}
  }catch{/* A file URL, private mode or browser policy can deny storage. */}
  pending=kind==='saved'?null:validateState(initial);
  function checkForChanges(){
    if(!storage||corrupt)return false;
    try{
      if(storage.getItem(STORAGE_KEY)!==lastRaw){kind='conflict';message='Lokalni zapis promijenjen je u drugom prozoru. Izvezi ovaj rad, zatim otvori spremljeni rad. Orbit koristi u jednoj kartici.';notify();return true;}
    }catch{/* persist reports storage failure while retaining the current work. */}
    return false;
  }
  function persist(state){
    const validated=validateState(state);
    if(checkForChanges())throw new Error(message);
    pending=validated;
    if(corrupt){notify();return false;}
    try{
      if(!storage)throw new Error('Storage unavailable');
      const next=JSON.stringify({format:'orbit-local',version:1,revision:revision+1,updatedAt:new Date().toISOString(),state:validated});
      storage.setItem(STORAGE_KEY,next);
      lastRaw=next;revision++;pending=null;kind='saved';message='';notify();return true;
    }catch{kind='memory';message='Rad je trenutačno samo u otvorenom prozoru: lokalna pohrana nije dostupna ili je puna. Prije zatvaranja izvezi JSON.';notify();return false;}
  }
  return {
    initial,
    persist,
    flush(){if(!pending)return kind==='saved';try{return persist(pending);}catch{return false;}},
    checkForChanges,
    label:()=>kind==='saved'?'Spremljeno lokalno':kind==='conflict'?'Promjena u drugoj kartici':'Privremeni rad · izvezi JSON',
    status:()=>({kind,message,pending:pending!==null,corrupt}),
    hasPending:()=>pending!==null||kind==='conflict',
    original:()=>corrupt?lastRaw:null,
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
  };
}
