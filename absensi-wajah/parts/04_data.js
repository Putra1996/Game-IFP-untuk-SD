'use strict';
/* ================= UTIL ================= */
function $(s){return document.querySelector(s);}
function $$(s){return Array.from(document.querySelectorAll(s));}
function esc(s){return String(s==null?'':s);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(arr){return arr[ri(0,arr.length-1)];}
function pad2(n){return String(n).padStart(2,'0');}
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};
const HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function todayISO(){
  const d=new Date();
  return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
}
function isoOf(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function fmtDate(iso){
  const d=new Date(iso+'T12:00:00');
  if(isNaN(d))return iso;
  return HARI[d.getDay()]+', '+d.getDate()+' '+BULAN[d.getMonth()]+' '+d.getFullYear();
}
function fmtClock(ms){
  if(!ms)return '-';
  const d=new Date(ms);
  return pad2(d.getHours())+':'+pad2(d.getMinutes());
}
/* ================= STATUS KEHADIRAN ================= */
const STATUS=[
  {k:'H',n:'Hadir'},
  {k:'I',n:'Izin'},
  {k:'S',n:'Sakit'},
  {k:'A',n:'Alpa'}
];
function stName(k){const s=STATUS.find(x=>x.k===k);return s?s.n:k;}
/* ================= PENYIMPANAN ================= */
const K_STU='aw_students_v1',K_REK='aw_rekap_v1',K_CFG='aw_cfg_v1',K_CLS='aw_classes_v1';
function getStudents(){const a=LS.get(K_STU,[]);return Array.isArray(a)?a:[];}
function saveStudents(a){LS.set(K_STU,a);}
function getRekap(){const r=LS.get(K_REK,{});return (r&&typeof r==='object'&&!Array.isArray(r))?r:{};}
function saveRekap(r){LS.set(K_REK,r);}
function getCfg(){const c=LS.get(K_CFG,{});return (c&&typeof c==='object')?c:{};}
function saveCfg(c){LS.set(K_CFG,c);}
function clsList(students){return Array.from(new Set(students.map(s=>s.cls))).sort();}
/* daftar kelas eksplisit + yang tersirat dari siswa (union, terurut) */
function getClasses(){
  const saved=LS.get(K_CLS,[]);
  const arr=Array.isArray(saved)?saved.slice():[];
  clsList(getStudents()).forEach(c=>{if(!arr.includes(c))arr.push(c);});
  return arr.sort((a,b)=>a.localeCompare(b,'id'));
}
function saveClasses(a){LS.set(K_CLS,Array.isArray(a)?a:[]);}
function registerClass(nm){
  const arr=getClasses();
  if(nm&&!arr.includes(nm)){arr.push(nm);saveClasses(arr);}
}
function stuOf(students,cls){return students.filter(s=>s.cls===cls).sort((a,b)=>a.nm.localeCompare(b.nm,'id'));}
/* persentase kehadiran siswa (dari seluruh tanggal tercatat di kelasnya) */
function pctOf(rekap,sid,cls){
  const days=(rekap&&rekap[cls])||{};
  let tot=0,h=0;
  Object.keys(days).forEach(iso=>{
    const m=days[iso][sid];
    if(m){tot++;if(m.s==='H')h++;}
  });
  return tot?Math.round(h/tot*100):null;
}
/* ================= PENCOCOK WAJAH ================= */
const DESC_TH=0.5;
function euclid(a,b){
  if(!a||!b||a.length!==b.length)return Infinity;
  let s=0;
  for(let i=0;i<a.length;i++){const d=a[i]-b[i];s+=d*d;}
  return Math.sqrt(s);
}
/* desc: array 128 angka → cari siswa terdekat. return {sid,nm,d} atau null */
function bestMatch(desc,cands){
  if(!desc||!cands||!cands.length)return null;
  let best=null,bd=Infinity;
  for(const c of cands){
    if(!c.desc||c.desc.length!==desc.length)continue;
    const d=euclid(desc,c.desc);
    if(d<bd){bd=d;best=c;}
  }
  return best?{sid:best.sid,nm:best.nm,d:bd}:null;
}
function roundDesc(desc){return Array.from(desc,x=>+Number(x).toFixed(5));}
/* ================= CSV ================= */
function buildCSV(students,rekap,cls,iso){
  const day=(rekap[cls]&&rekap[cls][iso])||{};
  const rows=stuOf(students,cls);
  const lines=[['No','Nama','Status','Waktu'].join(',')];
  rows.forEach((s,i)=>{
    const m=day[s.id];
    const st=m?stName(m.s):'Tidak Tercatat';
    const tm=m?fmtClock(m.t):'-';
    lines.push([i+1,'"'+String(s.nm).replace(/"/g,'""')+'"',st,tm].join(','));
  });
  return lines.join('\r\n');
}
/* ================= SUARA (WebAudio, tanpa aset) ================= */
const Snd={
  on:true,ctx:null,
  ac(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return this.ctx;},
  tone(f,t,dur,type,vol){
    if(!this.on)return;
    const c=this.ac();if(!c)return;
    if(c.state==='suspended'){try{c.resume();}catch(e){}}
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine';o.frequency.value=f;
    g.gain.setValueAtTime(vol||.18,c.currentTime+t);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+dur);
    o.connect(g);g.connect(c.destination);
    o.start(c.currentTime+t);o.stop(c.currentTime+t+dur+.05);
  },
  click(){this.tone(600,0,.06,'triangle',.12);},
  ok(){this.tone(660,0,.09,'sine',.16);this.tone(880,.09,.14,'sine',.16);},
  dup(){this.tone(440,0,.08,'sine',.1);},
  warn(){this.tone(300,0,.12,'square',.1);this.tone(240,.12,.16,'square',.1);},
  err(){this.tone(180,0,.2,'sawtooth',.14);},
  go(){[523,659,784].forEach((f,i)=>this.tone(f,i*.09,.12,'triangle',.16));},
  fanfare(){[523,659,784,1046].forEach((f,i)=>this.tone(f,i*.13,.22,'triangle',.2));this.tone(1318,.55,.4,'sine',.18);},
  sad(){[392,330,262].forEach((f,i)=>this.tone(f,i*.15,.2,'sine',.15));}
};
/* ================= EFEK PARTIKEL ================= */
const FX={
  cv:null,cx:null,parts:[],
  init(){this.cv=$('#fx');if(!this.cv)return;this.cx=this.cv.getContext('2d');this.size();addEventListener('resize',()=>this.size());},
  size(){if(!this.cv)return;this.cv.width=innerWidth;this.cv.height=innerHeight;},
  burst(x,y,n){
    if(!this.cx)return;
    const cols=['#ffc832','#3ec1ff','#3ddc84','#ff5e7d','#c084fc','#ffa94d'];
    for(let i=0;i<(n||30);i++){
      const a=Math.random()*Math.PI*2,sp=2+Math.random()*7;
      this.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,g:.22,r:2+Math.random()*4,c:pick(cols),l:40+Math.random()*30});
    }
  },
  rain(ms){
    if(!this.cx)return;
    const cols=['#ffc832','#3ec1ff','#3ddc84','#ff5e7d','#c084fc'];
    const until=Date.now()+(ms||3000);
    this._rain=until;
  },
  stepRain(){
    if(!this.cx||Date.now()>(this._rain||0))return;
    for(let i=0;i<4;i++){
      this.parts.push({x:Math.random()*innerWidth,y:-10,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,g:.05,r:2+Math.random()*4,c:pick(['#ffc832','#3ec1ff','#3ddc84','#ff5e7d','#c084fc']),l:120});
    }
  },
  step(){
    if(!this.cx)return;
    this.stepRain();
    const cx=this.cx;
    cx.clearRect(0,0,this.cv.width,this.cv.height);
    this.parts=this.parts.filter(p=>p.l>0);
    for(const p of this.parts){
      p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--;
      cx.globalAlpha=clamp(p.l/40,0,1);
      cx.fillStyle=p.c;
      cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);cx.fill();
    }
    cx.globalAlpha=1;
  }
};
