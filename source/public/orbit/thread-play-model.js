export function newThreadPlay(initial=4,lock='none'){
  if(!Number.isInteger(initial)||initial<0||initial>99||!['none','write','whole'].includes(lock))throw Error('Neispravan početak pokusa dretvi.');
  return {initial,x:initial,lock,owner:null,threads:[{step:0,local:null},{step:0,local:null}],log:[],prediction:null};
}
export function canStepThread(s,index){return [0,1].includes(index)&&s.threads[index].step<3&&(s.lock!=='whole'||s.owner===null||s.owner===index);}
export function stepThread(s,index){
  if(!canStepThread(s,index))throw Error('Ta dretva je završila ili čeka zajednički lokot.');
  const next=structuredClone(s),t=next.threads[index],name='T'+(index+1);
  if(t.step===0){if(next.lock==='whole')next.owner=index;t.local=next.x;next.log.push(`${name} čita x=${next.x} u svoju lokalnu vrijednost.`);}
  else if(t.step===1){t.local++;next.log.push(`${name} računa lokalno +1 = ${t.local}; zajednički x ostaje ${next.x}.`);}
  else{next.x=t.local;next.log.push(`${name} zapisuje ${t.local} u zajednički x.${next.lock==='whole'?' Otpušta lokot.':''}`);if(next.lock==='whole')next.owner=null;}
  t.step++;return next;
}
export const threadsDone=s=>s.threads.every(t=>t.step===3);
