/* Three-way merging and conditional writes. No device-clock ordering is used to choose data. */
(function(root){
 'use strict';
 const copy=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
 function stable(x){if(x===undefined)return 'undefined';if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
 const equal=(a,b)=>stable(a)===stable(b);
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const keyed=x=>Array.isArray(x)&&x.every(v=>object(v)&&typeof v.id==='string'&&v.id)&&new Set(x.map(v=>v.id)).size===x.length;
 function merge(base,local,remote,resolutions={}){
   const conflicts=[];
   function visit(b,l,r,path){
     if(equal(l,r))return copy(l);
     if(equal(l,b))return copy(r);
     if(equal(r,b))return copy(l);
     if(object(l)&&object(r)&&(object(b)||b===undefined)){
       const out={};for(const key of new Set([...Object.keys(b||{}),...Object.keys(r),...Object.keys(l)])){const value=visit(b?.[key],l[key],r[key],path.concat(key));if(value!==undefined)out[key]=value;}return out;
     }
     if(keyed(l)&&keyed(r)&&(keyed(b)||b===undefined)){
       const bm=new Map((b||[]).map(x=>[x.id,x])),lm=new Map(l.map(x=>[x.id,x])),rm=new Map(r.map(x=>[x.id,x]));
       const ids=new Set([...r.map(x=>x.id),...l.map(x=>x.id),...(b||[]).map(x=>x.id)]);const out=[];
       for(const id of ids){const value=visit(bm.get(id),lm.get(id),rm.get(id),path.concat(id));if(value!==undefined)out.push(value);}return out;
     }
     const key=JSON.stringify(path),choice=resolutions[key];if(choice==='device')return copy(l);if(choice==='cloud')return copy(r);
     conflicts.push({key,path,base:copy(b),device:copy(l),cloud:copy(r),deviceDeleted:l===undefined,cloudDeleted:r===undefined});return copy(l);
   }
   return {data:visit(base,local,remote,[]),conflicts};
 }
 function useful(d){return ['jobs','customers','parts','invoices','quotes','inspections'].some(k=>d[k]?.length)||!!(d.settings&&(d.settings.companyName||d.settings.companyLogo||d.settings.companyPhone||d.settings.companyEmail));}
 class Engine{
   constructor(adapter){this.a=adapter;this.running=null;this.timer=null;this.retry=0;this.account='';this.base=null;this.conflicts=[];this.resolutionContext=null;this.lastVerified='';this.wantsRun=false;this.status='Saved on device';}
   state(status,detail=''){this.status=status;this.a.status(status,detail);}
   schedule(delay=700){clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;this.run();},delay);}
   changed(){this.retry=0;this.state(this.a.online()?'Saved on device':'Offline — saved on device');this.schedule();}
   async accountReady(){const uid=await this.a.account();if(uid!==this.account){this.account=uid||'';this.base=uid?await this.a.loadBase(uid):null;this.conflicts=[];this.resolutionContext=null;this.lastVerified='';}return this.account;}
   run(){if(this.running){this.wantsRun=true;return this.running;}this.running=this.cycle().catch(e=>{this.state('Sync failed — retrying',e.message||String(e));this.retry=Math.min(this.retry+1,6);this.schedule(Math.min(60000,1000*2**this.retry));return false;}).finally(()=>{this.running=null;if(this.wantsRun){this.wantsRun=false;this.schedule(400);}});return this.running;}
   async cycle(){
     if(!this.a.online()){this.state('Offline — saved on device');return false;}
     if(!await this.accountReady()){this.state('Saved on device — not signed in');return false;}
     const uid=this.account;
     for(let attempt=0;attempt<5;attempt++){
       this.state('Syncing…');const row=await this.a.read();if(!await this.stillAccount(uid))return false;
       const local=copy(this.a.get()),remote=row?.data;
       let base=this.base?.data;
       // A device without an ancestor must not guess that missing records were deleted.
       if(!base){
         base=!useful(local)&&remote?copy(local):undefined;
         if(!base&&remote){
           const defaults={hourlyRate:45,companyName:'',companyLogo:'',companyPhone:'',companyEmail:'',paymentTermsDays:14};
           const settings={};for(const key of new Set([...Object.keys(local.settings||{}),...Object.keys(remote.settings||{})])){
             const l=local.settings?.[key],r=remote.settings?.[key];if(l===undefined||l===''||equal(l,defaults[key]))settings[key]=l;else if(r===undefined||r===''||equal(r,defaults[key]))settings[key]=r;
           }
           base={settings};
         }
       }
       const joined=remote?merge(base,local,remote):{data:local,conflicts:[]};
       if(joined.conflicts.length){this.conflicts=joined.conflicts;this.resolutionContext={base:copy(base),local,remote:copy(remote),revision:row.updated_at};this.state('Review changes',joined.conflicts.length+' overlapping change(s). Both copies are kept.');this.a.conflicts?.(this.conflicts);return false;}
       this.conflicts=[];this.resolutionContext=null;
       if(this.a.editing()&&!equal(local,joined.data)){this.state('Saved on device — finish editing to sync');this.schedule(3000);return false;}
       if(remote&&equal(joined.data,remote)){
         // No write needed. Only install this exact merge if the local copy has not changed meanwhile.
         if(!equal(local,this.a.get()))continue;
         if(!equal(local,joined.data))await this.a.install(joined.data);
         await this.remember(uid,joined.data,row.updated_at);this.verified();return true;
       }
       const answer=await this.a.write(joined.data,row?.updated_at||null);if(!await this.stillAccount(uid))return false;
       if(!answer.ok)continue; // Another device won the conditional write; read and merge again.
       const verified=await this.a.read();if(!await this.stillAccount(uid))return false;
       if(!verified)throw Error('Cloud copy could not be read back.');
       // Account for edits made locally while the network write was in flight.
       const latest=copy(this.a.get());
       if(!equal(local,latest)){
         const after=merge(local,latest,joined.data);
         if(after.conflicts.length){await this.remember(uid,local,answer.revision);this.schedule(0);return false;}
         if(!equal(latest,after.data)){
           if(this.a.editing()){await this.remember(uid,local,answer.revision);this.state('Saved on device — finish editing to sync');this.schedule(3000);return false;}
           await this.a.install(after.data);
         }
         await this.remember(uid,joined.data,answer.revision);continue;
       }
       if(!equal(local,joined.data))await this.a.install(joined.data);
       await this.remember(uid,joined.data,answer.revision);
       if(!equal(verified.data,joined.data))continue; // Preserve a later write; never force our snapshot back over it.
       this.verified();return true;
     }
     this.state('Waiting to sync','Both devices are saving. Retrying automatically.');this.schedule(1800);return false;
   }
   async stillAccount(uid){return await this.a.account()===uid;}
   async remember(uid,data,revision){const value={data:copy(data),revision};await this.a.saveBase(uid,value);this.base=value;}
   verified(){this.retry=0;this.lastVerified=new Date().toISOString();this.state('Synced',this.lastVerified);}
   async resolve(choices){
     if(!this.resolutionContext)return this.run();
     const c=this.resolutionContext,latest=copy(this.a.get());
     if(!equal(latest,c.local)){this.state('Review changes','The device changed during review. Refreshing the comparison.');return this.run();}
     const joined=merge(c.base,latest,c.remote,choices);if(joined.conflicts.length)throw Error('Choose a version for every conflicting field.');
     // Save the selected result as a local edit against the reviewed cloud ancestor.
     await this.a.install(joined.data);await this.remember(this.account,c.remote,c.revision);this.conflicts=[];this.resolutionContext=null;this.changed();return this.run();
   }
   stop(){clearTimeout(this.timer);}
 }
 root.MMSyncCore={merge,equal,stable,Engine};
})(typeof window==='undefined'?globalThis:window);
