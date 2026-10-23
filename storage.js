/* Only disposable, app-generated rolling snapshots are reclaimed on a quota error. */
(()=>{
 const isQuota=e=>!!e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014||/quota/i.test(String(e.message||'')));
 const info={reclaimedBackups:0};
 function write(key,value){
   try{localStorage.setItem(key,value);return;}catch(first){
     if(!isQuota(first))throw first;
     const keys=[];for(let n=0;n<localStorage.length;n++){const k=localStorage.key(n);if(/^mechanic-mate-backup-\d+$/.test(k||''))keys.push(k);}
     // Web Storage replaces a value atomically: a rejected write leaves the current data intact.
     for(const k of keys.sort()){localStorage.removeItem(k);info.reclaimedBackups++;try{localStorage.setItem(key,value);return;}catch(e){if(!isQuota(e))throw e;}}
     const error=new Error('This device has no space to save the merged copy. Your existing app data has been kept. Export a backup and free device storage; do not clear Mechanic Mate website data. Then tap Retry sync.');error.name='QuotaExceededError';error.cause=first;throw error;
   }
 }
 function optional(key,value){try{localStorage.setItem(key,value);return true;}catch(e){return false;}}
 window.MMSafeStorage={write,optional,isQuota,info};
})();
