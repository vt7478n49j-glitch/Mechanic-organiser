/* ISO dates remain canonical in storage; every user-visible calendar date uses DD-MM-YYYY. */
(()=>{
 const iso=value=>{const s=String(value||'').trim();if(!s)return '';let m=s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);const v=m?`${m[3]}-${m[2]}-${m[1]}`:s;const d=new Date(v+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:null;};
 const format=value=>{const s=String(value||'');const v=iso(s);return v?v.slice(8,10)+'-'+v.slice(5,7)+'-'+v.slice(0,4):s;};
 const today=()=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date()).split('/').reverse().join('-');
 const stamp=value=>{const legacy=typeof value==='string'&&value.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);if(legacy)return legacy[1]+'-'+legacy[2]+'-'+legacy[3]+legacy[4].replace(/^,\s*/,' ');const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'2-digit',month:'2-digit',year:'numeric'}).format(d).replaceAll('/','-')+' '+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hour12:false}).format(d):String(value||'');};
 window.MMDate={iso,format,today,stamp};
})();
