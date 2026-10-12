(async()=>{
const app=document.getElementById('app');
app.innerHTML='<main class="frame content"><h1>Personal mock practice</h1><p>Question papers are encrypted. Enter your unlock password to open this study copy.</p><form id="unlock"><label for="password">Unlock password</label><p><input id="password" type="password" autocomplete="current-password" required></p><button class="primary">Unlock papers</button><p id="message" role="status"></p></form><p>The password and decrypted question papers are kept in memory only. Your answers and written response are saved on this browser, not uploaded.</p></main>';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
document.getElementById('unlock').onsubmit=async e=>{
e.preventDefault();const input=document.getElementById('password'),message=document.getElementById('message'),button=e.target.querySelector('button');button.disabled=true;message.textContent='Opening encrypted papers...';
try{const response=await fetch('18-papers.enc.json',{cache:'no-store'});if(!response.ok)throw Error('Asset unavailable');const bundle=await response.json();if(bundle.version!==1||bundle.kdf!=='PBKDF2-SHA256'||bundle.iterations<600000)throw Error('Unknown envelope');
const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input.value),'PBKDF2',false,['deriveKey']);input.value='';
const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(bundle.salt),iterations:bundle.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(bundle.iv)},key,b64(bundle.ciphertext));window.MockData=JSON.parse(new TextDecoder().decode(plaintext));
const script=document.createElement('script');script.src='app.js?v=8.2';document.body.append(script);
}catch(err){input.value='';message.textContent='Unable to unlock. Check your password and try again. If the paper file is missing, reload later.';button.disabled=false;input.focus();}
};
})();
