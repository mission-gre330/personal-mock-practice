(async()=>{
'use strict';
const app=document.getElementById('app');
const asset='2-learner-28-relock.enc.json';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function savedKey(action,value){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('talha-device-unlock',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('keys');
 request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{const db=request.result;const tx=db.transaction('keys',action==='get'?'readonly':'readwrite');const store=tx.objectStore('keys');let op;
 if(action==='get')op=store.get('current');else if(action==='put')op=store.put(value,'current');else op=store.delete('current');
 let result;op.onsuccess=()=>{result=op.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error)};
 };
});}
let bundle;
async function getBundle(){if(bundle)return bundle;const response=await fetch(asset,{cache:'no-store'});if(!response.ok)throw Error('File unavailable');const value=await response.json();if(value.version!==1||value.kdf!=='PBKDF2-SHA256'||value.iterations<600000)throw Error('Unknown envelope');bundle=value;return value;}
async function openWith(key,b){const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(b.iv)},key,b64(b.ciphertext));const data=JSON.parse(new TextDecoder().decode(plaintext));if(!Array.isArray(data.mocks))throw Error('Unknown papers');window.MockData=data;return data;}
function loadPlayer(){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='3-app.js?v=28.0.1';script.onload=resolve;script.onerror=reject;document.body.append(script);});}
function lock(note=''){
 app.innerHTML='<main class="frame content"><h1>Personal mock practice</h1><p>Unlock once on this browser. Your phone will remember it for next time.</p><form id="unlock"><label for="password">Unlock password</label><p><input id="password" type="password" autocomplete="current-password" required></p><button class="primary">Unlock papers</button><p id="message" role="status"></p></form><p>This browser saves a device unlock key, not your password or the question papers. Anyone using this browser can open your study copy. Other browsers still need the password. Clearing site data or changing the password requires another unlock. Answers stay saved on this browser, not uploaded.</p></main>';
 const input=document.getElementById('password'),message=document.getElementById('message');message.textContent=note;
 document.getElementById('unlock').onsubmit=async e=>{
 e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;message.textContent='Opening encrypted papers...';
 let b;try{b=await getBundle();}catch(err){input.value='';message.textContent='The paper file could not load. Check your connection and reload.';button.disabled=false;return;}
 try{
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input.value),'PBKDF2',false,['deriveKey']);input.value='';
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(b.salt),iterations:b.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
 await openWith(key,b);
 let remembered=true;try{await savedKey('put',{salt:b.salt,iterations:b.iterations,key});}catch(err){remembered=false;}
 await loadPlayer();if(!remembered){const notice=document.createElement('p');notice.className='notice';notice.textContent='This browser could not remember the unlock. Papers are open now, but another visit will need your password.';app.prepend(notice);}
 }catch(err){input.value='';delete window.MockData;message.textContent='Unable to unlock. Check your password and try again.';button.disabled=false;input.focus();}
 };
}
app.innerHTML='<main class="frame content"><h1>Personal mock practice</h1><p role="status">Opening your study copy...</p></main>';
let stored;try{stored=await savedKey('get');}catch(err){}
if(stored){
 let b;try{b=await getBundle();}catch(err){lock('The paper file could not load. Check your connection and reload.');return;}
 if(stored.salt===b.salt&&stored.iterations===b.iterations){try{await openWith(stored.key,b);await loadPlayer();return;}catch(err){delete window.MockData;}}
 try{await savedKey('delete');}catch(err){}
 lock('Unlock again after the password update.');return;
}
lock();
})();
