/* Run classic app scripts in their original order only after durable data is available. */
(()=>{
 const run=async()=>{
   const app=document.getElementById('app');app.textContent='Opening saved Mechanic Mate data…';
   try{
     await MMSafeStorage.ready;
     let scriptError=null;const capture=e=>{scriptError=e.error||Error(e.message);};window.addEventListener('error',capture);
     try{
       for(const source of document.querySelectorAll('script[type="text/mm-app"]')){
         const script=document.createElement('script'),src=source.getAttribute('data-src');
         if(src){await new Promise((resolve,reject)=>{script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('Could not load '+src+'. Reload after the complete update has deployed.'));document.body.appendChild(script);});}
         else{script.textContent=source.textContent;document.body.appendChild(script);}
         if(scriptError)throw scriptError;
       }
       await MMSafeStorage.flush();
     }finally{window.removeEventListener('error',capture);}
     if(!window.mmSync)throw Error('The application did not finish loading');window.mmAppReady=true;
   }catch(error){
     const box=document.createElement('div');box.className='card';const title=document.createElement('h2');title.textContent='Saved data could not be opened';box.appendChild(title);const message=document.createElement('p');message.textContent=error.message+' No existing app data was reset. Do not clear website data.';box.appendChild(message);
     if(MMSafeStorage.recoveryRaw||MMSafeStorage.durableRaw){const backup=document.createElement('button');backup.textContent='Download existing backup';backup.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([MMSafeStorage.recoveryRaw||MMSafeStorage.durableRaw],{type:'application/json'}));a.download='mechanic-mate-recovery.json';a.click();};box.appendChild(backup);}
     const retry=document.createElement('button');retry.textContent='Retry opening';retry.onclick=()=>location.reload();box.appendChild(retry);app.replaceChildren(box);
   }
 };
 window.mmBootPromise=run();
})();
