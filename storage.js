/* Durable primary data in IndexedDB. localStorage contains only a small migration marker. */
(()=>{
 'use strict';
 const KEY='mechanic-mate-v2',POINTER='MM-IDB-V3:active',DB_NAME='mechanic-mate-primary-v3';
 let store=null,working=null,durable=null,pendingValue=null,drain=null,serial=Promise.resolve(),sequence=0,lastError=null,prepared=false,activeCommits=0;
 const info={mode:'opening',primaryBytes:0,reclaimedBackups:0,legacyMarker:false};
 let recoveryRaw=null;
 const isQuota=e=>!!e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014||/quota/i.test(String(e.message||'')));
 function signal(state,error){if(typeof CustomEvent==='function'&&window.dispatchEvent)window.dispatchEvent(new CustomEvent('mm:storage-status',{detail:{state,errorName:error?.name||null}}));}
 function friendly(e){const error=new Error(isQuota(e)?'The browser database could not save this copy. The previous saved copy is kept. Keep this page open and export a backup; do not clear website data.':'Saved data could not be opened or written: '+(e?.message||e)+'. Do not clear website data.');error.name=e?.name||'StorageError';error.cause=e;return error;}
 function open(){return new Promise((resolve,reject)=>{if(!window.indexedDB){reject(Error('IndexedDB is unavailable in this browser'));return;}const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other Mechanic Mate tabs, then retry opening the database'));});}
 function get(){return new Promise((resolve,reject)=>{const tx=store.transaction('records','readonly'),r=tx.objectStore('records').get('main');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);tx.onabort=()=>reject(tx.error||Error('Reading saved data was interrupted'));});}
 function put(raw){return new Promise((resolve,reject)=>{const tx=store.transaction('records','readwrite');tx.objectStore('records').put({raw,savedAt:new Date().toISOString()},'main');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Saving data failed'));tx.onabort=()=>reject(tx.error||Error('Saving data was interrupted'));});}
 function mark(){try{localStorage.setItem(KEY,POINTER);info.legacyMarker=true;}catch(_){} }
 function size(raw){info.primaryBytes=typeof Blob==='function'?new Blob([raw]).size:raw.length*2;}
 function commit(raw){activeCommits++;const job=serial.then(async()=>{await put(raw);durable=raw;size(raw);mark();}).finally(()=>{activeCommits--;});serial=job.catch(()=>{});return job;}
 const ready=(async()=>{
   let legacyError=null;try{const raw=localStorage.getItem(KEY);if(raw&&raw!==POINTER){JSON.parse(raw);recoveryRaw=raw;}}catch(e){legacyError=e;}
   try{
     store=await open();const record=await get();
     if(record){if(typeof record.raw!=='string')throw Error('Saved database record has an unsupported format');JSON.parse(record.raw);working=durable=record.raw;}
     else if(recoveryRaw){await put(recoveryRaw);const verified=await get();if(verified?.raw!==recoveryRaw)throw Error('The saved-data migration did not verify');working=durable=recoveryRaw;}
     else{let marker=false;try{marker=localStorage.getItem(KEY)===POINTER;}catch(_){}if(marker)throw Error('A migrated-data marker exists but the database could not be found');if(legacyError)throw legacyError;working=durable='{}';await put(working);}
     prepared=true;info.mode='indexeddb';size(durable);mark();return true;
   }catch(e){lastError=friendly(e);info.mode='blocked';throw lastError;}
 })();
 ready.catch(()=>{});
 function optional(key,value){try{localStorage.setItem(key,value);return true;}catch(_){return false;}}
 function read(key){if(key!==KEY)return localStorage.getItem(key);if(!prepared)throw Error('Saved data is still opening');return working;}
 function pump(){
   if(drain)return;signal('saving');
   drain=Promise.resolve().then(async()=>{while(pendingValue){const item=pendingValue;pendingValue=null;try{await commit(item.raw);}catch(e){lastError=friendly(e);if(!pendingValue)pendingValue=item;signal('error',lastError);return;}}lastError=null;}).finally(()=>{drain=null;if(pendingValue&&!lastError)pump();else if(!lastError)signal('saved');});
 }
 function write(key,value){if(key!==KEY){localStorage.setItem(key,value);return;}if(!prepared)throw Error('Saved data is still opening');JSON.parse(value);working=value;sequence++;lastError=null;pendingValue={raw:value,sequence};pump();}
 async function flush(){await ready;for(;;){if(drain){await drain;continue;}await serial;if(lastError)throw lastError;if(pendingValue){pump();continue;}if(!activeCommits)return;}}
 async function replace(key,value){
   if(key!==KEY){write(key,value);return;}await flush();JSON.parse(value);const before=sequence;signal('saving');
   try{await commit(value);if(sequence===before)working=value;lastError=null;signal('saved');}catch(e){lastError=friendly(e);signal('error',lastError);throw lastError;}
 }
 async function retry(){await ready;lastError=null;if(pendingValue)pump();await flush();}
 window.MMSafeStorage={ready,read,write,replace,flush,retry,optional,isQuota,info,get pending(){return !!(pendingValue||drain||activeCommits);},get lastError(){return lastError;},get recoveryRaw(){return recoveryRaw;},get durableRaw(){return durable;}};
 window.addEventListener?.('beforeunload',e=>{if(pendingValue||drain||activeCommits||lastError){e.preventDefault();e.returnValue='';}});
})();
