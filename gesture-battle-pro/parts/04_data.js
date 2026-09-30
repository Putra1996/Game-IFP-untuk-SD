'use strict';
/* ================= UTIL ================= */
function $(s){return document.querySelector(s);}
function $$(s){return Array.from(document.querySelectorAll(s));}
function esc(s){return String(s==null?'':s);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(arr){return arr[ri(0,arr.length-1)];}
function shuffle(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=ri(0,i);[x[i],x[j]]=[x[j],x[i]];}return x;}
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};
/* ================= BANK SOAL UMUM (3 tingkat × 12) ================= */
const UMUM1=[
 {q:'Singkatan dari HTML?',a:'HyperText Markup Language',w:['Home Tool Markup Language','Hyper Tab Main Language','High Text Machine Language']},
 {q:'Ibu kota Provinsi Jawa Tengah?',a:'Semarang',w:['Surakarta','Yogyakarta','Magelang']},
 {q:'Hasil 7 × 8 ?',a:'56',w:['54','48','63']},
 {q:'Planet terdekat dari Matahari?',a:'Merkurius',w:['Venus','Bumi','Mars']},
 {q:'Alat pernapasan ikan?',a:'Insang',w:['Paru-paru','Trakea','Kulit']},
 {q:'Lambang negara Indonesia?',a:'Garuda Pancasila',w:['Komodo','Bunga Melati','Monas']},
 {q:'Berapa sisi pada segitiga?',a:'3',w:['2','4','5']},
 {q:'Warna bendera Indonesia?',a:'Merah Putih',w:['Biru Kuning','Merah Biru','Putih Hijau']},
 {q:'Satu minggu berapa hari?',a:'7',w:['5','6','8']},
 {q:'Alat tulis untuk menghapus?',a:'Penghapus',w:['Pensil','Penggaris','Crayon']},
 {q:'Huruf vokal berjumlah?',a:'5',w:['4','6','21']},
 {q:'Air yang mendidih menjadi?',a:'Uap',w:['Es','Embun','Salju']}
];
const UMUM2=[
 {q:'Proklimasi kemerdekaan RI dibacakan tanggal?',a:'17 Agustus 1945',w:['1 Juni 1945','10 November 1945','28 Oktober 1928']},
 {q:'Singkatan dari CPU?',a:'Central Processing Unit',w:['Computer Personal Unit','Central Program Utility','Core Processing Unifier']},
 {q:'Penemu lampu listrik?',a:'Thomas Alva Edison',w:['Newton','Einstein','Graham Bell']},
 {q:'Gunung tertinggi di Indonesia?',a:'Puncak Jaya',w:['Semeru','Rinjani','Merapi']},
 {q:'Hasil dari 15% dari 200?',a:'30',w:['25','35','15']},
 {q:'Gas yang diserap tumbuhan?',a:'Karbon dioksida',w:['Oksigen','Nitrogen','Hidrogen']},
 {q:'Ibu kota Jepang?',a:'Tokyo',w:['Osaka','Kyoto','Beijing']},
 {q:'Alat musik dari Jawa Barat?',a:'Angklung',w:['Gamelan','Sasando','Kolintang']},
 {q:'Rumus luas lingkaran?',a:'π × r × r',w:['2 × π × r','π × d','4 × s']},
 {q:'Software presentasi Microsoft?',a:'PowerPoint',w:['Excel','Word','Access']},
 {q:'Pahlawan dari Aceh?',a:'Cut Nyak Dien',w:['Ki Hajar Dewantara','Pattimura','Sultan Hasanuddin']},
 {q:'Konversi 1 kilometer ke meter?',a:'1.000 m',w:['100 m','10.000 m','10 m']}
];
const UMUM3=[
 {q:'Organisasi PBB didirikan tahun?',a:'1945',w:['1948','1950','1939']},
 {q:'Singkatan dari URL?',a:'Uniform Resource Locator',w:['Universal Router Line','United Resource Link','Uniform Route Logic']},
 {q:'Tokoh Sang Saketi dalam wayang?',a:'Bima',w:['Arjuna','Yudhistira','Gatotkaca']},
 {q:'Bunyi kecepatan di udara ± ?',a:'340 m/s',w:['150 m/s','1.240 m/s','3.000 m/s']},
 {q:'Teorema Pythagoras untuk segitiga?',a:'Siku-siku',w:['Sama sisi','Tumpul','Lancip']},
 {q:'Presiden pertama RI?',a:'Soekarno',w:['Soeharto','Megawati','Habibie']},
 {q:'Perhitungan 2¹⁰ = ?',a:'1.024',w:['512','2.048','100']},
 {q:'Bahasa pemrograman untuk web statis?',a:'HTML',w:['Python','C++','Java']},
 {q:'Laut terluas di dunia?',a:'Samudra Pasifik',w:['Samudra Atlantik','Samudra Hindia','Samudra Arktik']},
 {q:'Peristiwa Sumpah Pemuda tahun?',a:'1928',w:['1945','1908','1966']},
 {q:'Satuan daya listrik?',a:'Watt',w:['Volt','Ampere','Ohm']},
 {q:'Ibukota Kalimantan Timur?',a:'Samarinda',w:['Balikpapan','Banjarmasin','Tanjung Selor']}
];
const UMUM={1:UMUM1,2:UMUM2,3:UMUM3};
/* ================= GENERATOR MATEMATIKA ================= */
function makeOpts(ans){
  const set=new Set([ans]);
  while(set.size<4){
    let d=ans+pick([-10,-9,-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7,9,10]);
    if(d<0)d=Math.abs(d)+1;
    if(d!==ans)set.add(d);
  }
  return shuffle(Array.from(set));
}
function genMath(lv){
  let a,b,ans,op;
  const r=Math.random();
  if(lv<=1){op=r<.5?'+':'−';a=ri(2,20);b=ri(1,op==='+'?20:a-1||1);ans=op==='+'?a+b:a-b;}
  else if(lv===2){
    if(r<.34){op='×';a=ri(3,12);b=ri(3,12);}
    else if(r<.67){op='+';a=ri(20,99);b=ri(10,89);}
    else{op='−';a=ri(30,99);b=ri(10,a-1);}
    ans=op==='×'?a*b:(op==='+'?a+b:a-b);
  }else{
    if(r<.4){op='×';a=ri(11,25);b=ri(4,15);}
    else if(r<.7){op='+';a=ri(120,899);b=ri(110,799);}
    else{op='−';a=ri(200,999);b=ri(100,a-50);}
    ans=op==='×'?a*b:(op==='+'?a+b:a-b);
  }
  const opts=makeOpts(ans);
  return {text:a+' '+op+' '+b+' = ?',opts:opts,correct:opts.indexOf(ans),ans:ans};
}
/* ================= SOAL GURU (bank berbagi seri) ================= */
function parseKuisTxt(t){
  const out=[];
  String(t||'').split(/\r?\n/).forEach(line=>{
    const parts=line.split('|').map(x=>x.trim()).filter(Boolean);
    if(parts.length<3||parts.length>5)return;
    const opts=parts.slice(1);
    out.push({text:parts[0],opts:opts,correct:0}); /* opsi pertama = benar */
  });
  return out;
}
let GURU_KUIS=[];
function loadGuruBanks(){GURU_KUIS=parseKuisTxt(LS.get('gb_guru_kuis',''));}
/* tanpa pengulangan sampai bank habis */
const usedMap=new Map();
function getUnused(key,bank){
  const used=usedMap.get(key)||new Set();
  let avail=bank.map((x,i)=>i).filter(i=>!used.has(i));
  if(!avail.length){used.clear();avail=bank.map((x,i)=>i);}
  const i=pick(avail);
  used.add(i);usedMap.set(key,used);
  return bank[i];
}
/* soal bank umum: buat opsi dari a/w */
function bankToQ(e,lv){
  const opts=shuffle([e.a,...e.w].slice(0,4));
  return {text:e.q,opts:opts,correct:opts.indexOf(e.a)};
}
function pickQ(cat){
  if(cat==='guru'){
    if(GURU_KUIS.length){
      const e=getUnused('guru',GURU_KUIS);
      const order=shuffle([0,1,2,3].slice(0,e.opts.length));
      const opts=order.map(i=>e.opts[i]);
      return {text:e.text,opts:opts,correct:order.indexOf(0)};
    }
    return genMath(pick([1,2,3]));
  }
  if(cat==='matematika')return genMath(pick([1,2,2,3]));
  if(cat==='umum'){const lv=pick([1,2,3]);return bankToQ(getUnused('u'+lv,UMUM[lv]),lv);}
  /* campur */
  if(Math.random()<.45)return genMath(pick([1,2,2,3]));
  const lv=pick([1,2,3]);
  return bankToQ(getUnused('u'+lv,UMUM[lv]),lv);
}
/* ================= SUARA ================= */
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
  lock(){this.tone(320,0,.05,'triangle',.08);},
  pop(){this.tone(880,0,.05,'square',.12);this.tone(1320,.03,.06,'square',.1);},
  correct(){this.tone(660,0,.09,'sine',.18);this.tone(880,.09,.12,'sine',.18);},
  wrong(){this.tone(200,0,.18,'sawtooth',.14);},
  tick(){this.tone(1000,0,.04,'square',.07);},
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
    const cols=['#ffc832','#3ec1ff','#3ddc84','#ff5e7d','#c084fc'];
    for(let i=0;i<(n||30);i++){
      const a=Math.random()*Math.PI*2,sp=2+Math.random()*7;
      this.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,g:.22,r:2+Math.random()*4,c:pick(cols),l:40+Math.random()*30});
    }
  },
  rain(ms){this._rain=Date.now()+(ms||3000);},
  step(){
    if(!this.cx)return;
    if(Date.now()<(this._rain||0)){
      for(let i=0;i<4;i++)this.parts.push({x:Math.random()*innerWidth,y:-10,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,g:.05,r:2+Math.random()*4,c:pick(['#ffc832','#3ec1ff','#3ddc84','#ff5e7d']),l:120});
    }
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
