'use strict';
/* ================= UTIL ================= */
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const ri=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};

/* ================= SUARA (Web Audio) ================= */
const Snd={
  ctx:null,on:true,
  ensure(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(this.ctx&&this.ctx.state==='suspended'){ try{this.ctx.resume();}catch(e){} } },
  tone(f,dur,type,vol,delay){
    dur=dur||.12;type=type||'sine';vol=vol==null?.16:vol;delay=delay||0;
    if(!this.on)return; this.ensure(); if(!this.ctx)return;
    try{
      const t=this.ctx.currentTime+delay;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type=type;o.frequency.value=f;
      g.gain.setValueAtTime(vol,t);
      g.gain.exponentialRampToValueAtTime(.001,t+dur);
      o.connect(g);g.connect(this.ctx.destination);
      o.start(t);o.stop(t+dur+.02);
    }catch(e){}
  },
  click(){this.tone(600,.06,'triangle',.12)},
  lock(){this.tone(880,.09,'square',.11);this.tone(1320,.1,'square',.07,.06)},
  correct(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.14,'triangle',.16,i*.08))},
  wrong(){this.tone(196,.25,'sawtooth',.13);this.tone(147,.3,'sawtooth',.11,.09)},
  tick(){this.tone(1500,.05,'square',.07)},
  go(){this.tone(660,.12,'square',.15);this.tone(880,.22,'square',.15,.13)},
  fanfare(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>this.tone(f,.18,'triangle',.17,i*.13))},
  sad(){[420,360,300,240].forEach((f,i)=>this.tone(f,.2,'triangle',.13,i*.15))}
};
document.addEventListener('pointerdown',()=>Snd.ensure(),{once:true});

/* ================= CONFETTI ================= */
const FX={
  cv:null,cx:null,parts:[],rainUntil:0,
  init(){
    this.cv=$('#fx');
    if(this.cv){ this.cx=this.cv.getContext('2d'); const rs=()=>{if(this.cv){this.cv.width=innerWidth;this.cv.height=innerHeight;}}; rs(); addEventListener('resize',rs); }
  },
  cols:['#ffc800','#ff5e7d','#22c55e','#2f6bff','#9a6bff','#ff9f1c'],
  burst(x,y,n){
    n=n||70;
    if(!this.cx)return;
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2,sp=4+Math.random()*9;
      this.parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-4,g:.32,rot:Math.random()*6,vr:(Math.random()-.5)*.4,c:pick(this.cols),s:6+Math.random()*7,life:60+Math.random()*40});
    }
  },
  startRain(ms){this.rainUntil=performance.now()+ms;},
  step(){
    const cx=this.cx; if(!cx)return;
    cx.clearRect(0,0,this.cv.width,this.cv.height);
    if(this.rainUntil>performance.now()&&Math.random()<.4){
      this.parts.push({x:Math.random()*this.cv.width,y:-20,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,g:.05,rot:Math.random()*6,vr:(Math.random()-.5)*.3,c:pick(this.cols),s:6+Math.random()*7,life:220});
    }
    if(!this.parts.length)return;
    this.parts=this.parts.filter(p=>p.life-->0&&p.y<this.cv.height+50);
    for(let i=0;i<this.parts.length;i++){
      const p=this.parts[i];
      p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.rot+=p.vr;
      cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);
      cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.62);
      cx.restore();
    }
  }
};

/* ================= BANK SOAL PENGETAHUAN UMUM ================= */
/* Format: q=pertanyaan, o=[opsi], a=index jawaban benar (0 = yang pertama), l=tingkat */
const UMUM=[
 {q:'Warna bendera Indonesia?',o:['Merah Putih','Biru Putih','Hijau Kuning','Hitam Putih'],a:0,l:1},
 {q:'Matahari terbit dari arah?',o:['Timur','Barat','Utara','Selatan'],a:0,l:1},
 {q:'Satu minggu ada berapa hari?',o:['7 hari','5 hari','6 hari','8 hari'],a:0,l:1},
 {q:'Alat pernapasan ikan?',o:['Insang','Paru-paru','Trakea','Sisik'],a:0,l:1},
 {q:'Hewan yang berubah dari ulat adalah?',o:['Kupu-kupu','Kucing','Ayam','Sapi'],a:0,l:1},
 {q:'Campuran warna kuning dan biru menjadi?',o:['Hijau','Ungu','Merah','Oranye'],a:0,l:1},
 {q:'Kita harus makan sayur dan buah agar?',o:['Sehat','Ngantuk','Lapar','Sakit'],a:0,l:1},
 {q:'Benda cair di bawah ini adalah?',o:['Air','Batu','Kayu','Besi'],a:0,l:1},
 {q:'Tempat siswa belajar disebut?',o:['Sekolah','Pasar','Lapangan','Stadion'],a:0,l:1},
 {q:'Berapa jumlah kaki ayam?',o:['2','4','3','6'],a:0,l:1},
 {q:'Warna langit pada siang cerah?',o:['Biru','Merah','Hitam','Ungu'],a:0,l:1},
 {q:'Ibu kota Provinsi Jawa Tengah?',o:['Semarang','Surabaya','Bandung','Yogyakarta'],a:0,l:2},
 {q:'Ibu kota Provinsi Jawa Barat?',o:['Bandung','Semarang','Serang','Jakarta'],a:0,l:2},
 {q:'Ibu kota Provinsi Jawa Timur?',o:['Surabaya','Malang','Solo','Denpasar'],a:0,l:2},
 {q:'Hewan pemakan tumbuhan disebut?',o:['Herbivora','Karnivora','Omnivora','Insektivora'],a:0,l:2},
 {q:'Planet terdekat dari Matahari?',o:['Merkurius','Venus','Bumi','Mars'],a:0,l:2},
 {q:'Lambang negara Indonesia adalah?',o:['Burung Garuda','Harimau','Elang','Komodo'],a:0,l:2},
 {q:'Pancasila terdiri atas berapa sila?',o:['5 sila','4 sila','6 sila','7 sila'],a:0,l:2},
 {q:'Alat musik tradisional dari Jawa Barat?',o:['Angklung','Gamelan','Sasando','Gondang'],a:0,l:2},
 {q:'Tarian khas Bali adalah?',o:['Tari Kecak','Tari Saman','Tari Piring','Tari Jaipong'],a:0,l:2},
 {q:'Gunung yang terletak dekat Purwokerto?',o:['Gunung Slamet','Gunung Semeru','Gunung Rinjani','Gunung Agung'],a:0,l:2},
 {q:'Ibu kota Kabupaten Banyumas adalah?',o:['Purwokerto','Cilacap','Ajibarang','Bumiayu'],a:0,l:2},
 {q:'Gempa bumi terjadi karena?',o:['Pergerakan lempeng bumi','Hujan deras','Angin kencang','Pasang surut laut'],a:0,l:2},
 {q:'Sumber energi terbesar bagi bumi?',o:['Matahari','Bulan','Bintang jatuh','Petir'],a:0,l:2},
 {q:'Anggota tubuh untuk penciuman?',o:['Hidung','Mata','Telinga','Lidah'],a:0,l:2},
 {q:'Air yang mendidih akan berubah menjadi?',o:['Uap','Es','Salju','Batu'],a:0,l:2},
 {q:'Gunung tertinggi di Indonesia?',o:['Puncak Jaya','Gunung Semeru','Gunung Rinjani','Gunung Kerinci'],a:0,l:3},
 {q:'Siapa penemu bola lampu?',o:['Thomas Alva Edison','Isaac Newton','Alexander Graham Bell','Nikola Tesla'],a:0,l:3},
 {q:'Sila ketiga Pancasila berbunyi?',o:['Persatuan Indonesia','Ketuhanan Yang Maha Esa','Kemanusiaan yang adil dan beradab','Keadilan sosial bagi seluruh rakyat Indonesia'],a:0,l:3},
 {q:'Pahlawan nasional dari Bali?',o:['I Gusti Ngurah Rai','Pangeran Diponegoro','Pattimura','Sultan Hasanuddin'],a:0,l:3},
 {q:'Tokoh di balik buku "Habis Gelap Terbitlah Terang"?',o:['R.A. Kartini','Cut Nyak Dien','Christina Marta Tiahahu','Sultan Ageng Tirtayasa'],a:0,l:3},
 {q:'Lembaga yang mencetak uang di Indonesia?',o:['Bank Indonesia','Bank BRI','Bank Mandiri','Bank Danamon'],a:0,l:3},
 {q:'Proklamasi kemerdekaan Indonesia dibacakan pada?',o:['17 Agustus 1945','1 Juni 1945','28 Oktober 1928','17 Agustus 1946'],a:0,l:3},
 {q:'Lambang sila keempat Pancasila?',o:['Kepala banteng','Bintang','Pohon beringin','Rantai emas'],a:0,l:3},
 {q:'Satuan internasional untuk berat adalah?',o:['Kilogram','Liter','Meter','Detik'],a:0,l:3}
];

/* Format: s=pernyataan, t=true(BENAR)/false(SALAH) */
const BS_UMUM=[
 {s:'Matahari terbit dari arah barat',t:false},
 {s:'Air mendidih pada suhu 100 derajat Celsius',t:true},
 {s:'Semut memiliki 6 kaki',t:true},
 {s:'Indonesia merdeka pada tahun 1945',t:true},
 {s:'Kucing termasuk hewan mamalia',t:true},
 {s:'Satu minggu ada 10 hari',t:false},
 {s:'Pelangi biasanya muncul setelah hujan',t:true},
 {s:'Ikan bernapas menggunakan paru-paru',t:false},
 {s:'Pusat tata surya adalah Matahari',t:true},
 {s:'Campuran merah dan kuning menghasilkan warna oranye',t:true},
 {s:'Gunung Semeru terletak di Jawa Timur',t:true},
 {s:'Bumi mengelilingi Matahari',t:true},
 {s:'Matahari mengelilingi Bumi',t:false},
 {s:'Kupu-kupu berasal dari ulat',t:true},
 {s:'Cahaya bergerak lebih cepat daripada suara',t:true},
 {s:'Es batu mengapung di air',t:true},
 {s:'Pancasila terdiri dari 4 sila',t:false},
 {s:'Laba-laba memiliki 8 kaki',t:true},
 {s:'Sumpah Pemuda diperingati setiap 28 Oktober',t:true},
 {s:'Kaktus hidup di tempat bersalju',t:false},
 {s:'Jantung berfungsi memompa darah',t:true},
 {s:'Warna pelangi ada 5',t:false},
 {s:'Kambing suka makan rumput',t:true},
 {s:'Bentuk bumi datar seperti piring',t:false}
];

/* Soal buatan guru (dari localStorage) */
let GURU_KUIS=[],GURU_BS=[];

/* ================= GENERATOR SOAL ================= */
const usedMap=new Map();
function getUnused(pool,key){
  let used=usedMap.get(key);
  if(!used){used=new Set();usedMap.set(key,used);}
  if(used.size>=pool.length)used.clear();
  let i=0,guard=0;
  do{ i=Math.floor(Math.random()*pool.length); guard++; }while(used.has(i)&&used.size<pool.length&&guard<200);
  used.add(i);
  return pool[i];
}

function makeOpts(ans){
  const set=new Set([ans]);
  const cand=shuffle([ans+1,ans-1,ans+2,ans-2,ans+10,ans-10,ans+ri(3,9),ans-ri(3,9)]);
  for(let i=0;i<cand.length&&set.size<4;i++){const c=cand[i];if(c>=0&&!set.has(c))set.add(c);}
  let guard=0;
  while(set.size<4&&guard<100){const c=Math.max(0,ans+ri(-15,15));set.add(c);guard++;}
  const o=shuffle(Array.from(set));
  return {o:o,a:o.indexOf(ans)};
}

function genMath(lv){
  let a,b,c,ans,txt;
  const r=Math.random();
  if(lv===1){
    if(r<.55){a=ri(1,10);b=ri(1,10);ans=a+b;txt=a+' + '+b+' = ?';}
    else{a=ri(2,20);b=ri(1,a-1);ans=a-b;txt=a+' − '+b+' = ?';}
  }else if(lv===2){
    if(r<.3){a=ri(2,9);b=ri(2,9);ans=a*b;txt=a+' × '+b+' = ?';}
    else if(r<.55){b=ri(2,9);ans=ri(2,9);a=b*ans;txt=a+' ÷ '+b+' = ?';}
    else if(r<.8){a=ri(10,60);b=ri(10,60);ans=a+b;txt=a+' + '+b+' = ?';}
    else{a=ri(20,99);b=ri(10,a-1);ans=a-b;txt=a+' − '+b+' = ?';}
  }else{
    if(r<.3){a=ri(11,19);b=ri(3,9);ans=a*b;txt=a+' × '+b+' = ?';}
    else if(r<.55){a=ri(2,9);b=ri(2,9);c=ri(2,9);ans=a+b*c;txt=a+' + '+b+' × '+c+' = ?';}
    else if(r<.8){a=ri(100,499);b=ri(100,499);ans=a+b;txt=a+' + '+b+' = ?';}
    else{a=ri(200,999);b=ri(100,a-50);ans=a-b;txt=a+' − '+b+' = ?';}
  }
  const mo=makeOpts(ans);
  return {text:txt,opts:mo.o,correct:mo.a};
}

function genBSMath(lv){
  let a,b,ans,op;
  const r=Math.random();
  if(lv===1){
    if(r<.55){op='+';a=ri(1,10);b=ri(1,10);}else{op='−';a=ri(2,20);b=ri(1,a-1);}
    ans=(op==='+')?a+b:a-b;
  }else if(lv===2){
    if(r<.34){op='×';a=ri(2,9);b=ri(2,9);}
    else if(r<.67){op='+';a=ri(10,60);b=ri(10,60);}
    else{op='−';a=ri(20,99);b=ri(10,a-1);}
    ans=(op==='×')?a*b:(op==='+'?a+b:a-b);
  }else{
    if(r<.34){op='×';a=ri(11,19);b=ri(3,9);}
    else if(r<.67){op='+';a=ri(100,499);b=ri(100,499);}
    else{op='−';a=ri(200,999);b=ri(100,a-50);}
    ans=(op==='×')?a*b:(op==='+'?a+b:a-b);
  }
  const truth=Math.random()<.5;
  let shown=ans;
  if(!truth){
    shown=ans+pick([-3,-2,-1,1,2,3,10,-10]);
    if(shown<0||shown===ans)shown=ans+1;
    if(shown===ans)shown=ans+2;
  }
  return {text:a+' '+op+' '+b+' = '+shown,correct:truth?'BENAR':'SALAH'};
}

function pickKuis(){
  const cat=cfg.category;
  const doUmum=(pool,key)=>{
    let p=pool.filter(x=>x.l===cfg.level);
    if(!p.length)p=pool;
    const it=getUnused(p,key);
    const val=it.o[it.a];
    const o=shuffle(it.o);
    return {text:it.q,opts:o,correct:o.indexOf(val)};
  };
  const doGuru=()=>{
    if(!GURU_KUIS.length)return genMath(cfg.level);
    const it=getUnused(GURU_KUIS,'gk');
    const val=it.o[it.a];
    const o=shuffle(it.o);
    return {text:it.q,opts:o,correct:o.indexOf(val)};
  };
  if(cat==='matematika')return genMath(cfg.level);
  if(cat==='umum')return doUmum(UMUM,'u');
  if(cat==='guru')return doGuru();
  return Math.random()<.5?genMath(cfg.level):doUmum(UMUM,'u');
}

function pickBS(){
  const cat=cfg.category;
  const doBank=(pool,key)=>{const it=getUnused(pool,key);return {text:it.s,correct:it.t?'BENAR':'SALAH'};};
  if(cat==='matematika')return genBSMath(cfg.level);
  if(cat==='umum')return doBank(BS_UMUM,'bu');
  if(cat==='guru'){
    if(GURU_BS.length)return doBank(GURU_BS,'gb');
    return genBSMath(cfg.level);
  }
  return (Math.random()<.55)?genBSMath(cfg.level):doBank(BS_UMUM,'bu');
}

/* Parser soal guru */
function parseKuisTxt(t){
  const out=[];
  String(t||'').split(/\r?\n/).forEach(l=>{
    const s=l.split(/[|;]/).map(x=>x.trim()).filter(Boolean);
    if(s.length>=3)out.push({q:s[0],o:s.slice(1,5),a:0});
  });
  return out;
}
function parseBSTxt(t){
  const out=[];
  String(t||'').split(/\r?\n/).forEach(l=>{
    const s=l.split(/[|;]/).map(x=>x.trim()).filter(Boolean);
    if(s.length>=2){
      const v=s[1].toLowerCase();
      if(v==='benar'||v==='salah')out.push({s:s[0],t:v==='benar'});
    }
  });
  return out;
}
function loadGuruBanks(){
  GURU_KUIS=parseKuisTxt(LS.get('gb_guru_kuis',''));
  GURU_BS=parseBSTxt(LS.get('gb_guru_bs',''));
}
