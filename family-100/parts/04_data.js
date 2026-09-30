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

/* ================= SUARA ================= */
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
  /* buzz strike ala acara TV */
  buzz(){ if(!this.on)return; this.ensure(); if(!this.ctx)return;
    try{
      const t=this.ctx.currentTime;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type='sawtooth';
      o.frequency.setValueAtTime(130,t);
      o.frequency.exponentialRampToValueAtTime(70,t+.7);
      g.gain.setValueAtTime(.3,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.75);
      o.connect(g);g.connect(this.ctx.destination);
      o.start(t);o.stop(t+.8);
    }catch(e){}
  },
  reveal(){[659,880].forEach((f,i)=>this.tone(f,.12,'triangle',.15,i*.07));this.tone(1320,.16,'sine',.12,.14)},
  steal(){[440,554,659,880].forEach((f,i)=>this.tone(f,.16,'square',.12,i*.11))},
  roundwin(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.18,'triangle',.16,i*.11))},
  go(){this.tone(660,.12,'square',.15);this.tone(880,.22,'square',.15,.13)},
  fanfare(){[523,659,784,1047,784,1047,1319,1568].forEach((f,i)=>this.tone(f,.2,'triangle',.17,i*.14))},
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
  cols:['#ffd043','#ffffff','#f4697a','#3ec1ff','#34d17b','#e0a010'],
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

/* ================= BANK SURVEI (tiap jawaban:poin, total 100) ================= */
const FAM100=[
 {q:'Tempat liburan favorit keluarga?',a:[['Pantai',35],['Rumah nenek',25],['Taman hiburan',20],['Gunung',12],['Kolam renang',8]]},
 {q:'Makanan andalan saat belajar begadang?',a:[['Mie instan',40],['Kopi',25],['Roti',15],['Cilok',12],['Keripik',8]]},
 {q:'Kendaraan yang punya keleng?',a:[['Angkot',45],['Bus',25],['Delman',15],['Kereta',10],['Mobil pribadi',5]]},
 {q:'Hadiah yang paling sering diminta anak?',a:[['HP',40],['Sepeda',25],['Mainan',15],['Buku',12],['Uang jajan',8]]},
 {q:'Hal yang dilakukan sebelum berangkat sekolah?',a:[['Mandi',35],['Sarapan',25],['Merapikan kasur',15],['Salat Subuh',15],['Memakai seragam',10]]},
 {q:'Buah yang berwarna hijau?',a:[['Semangka',30],['Apel',28],['Pir',17],['Anggur',15],['Alpukat',10]]},
 {q:'Hewan peliharaan favorit?',a:[['Kucing',45],['Anjing',25],['Ikan',15],['Burung',10],['Hamster',5]]},
 {q:'Profesi yang paling diidamkan anak?',a:[['Dokter',35],['Polisi',22],['Guru',18],['Pilot',15],['Astronaut',10]]},
 {q:'Minuman hangat favorit saat hujan?',a:[['Teh hangat',35],['Kopi',30],['Susu hangat',20],['Wedang jahe',10],['Bajigur',5]]},
 {q:'Wisata andalan Banyumas?',a:[['Baturraden',45],['Pancuran Rayo',15],['Alun-alun Purwokerto',15],['Curug Ceheng',15],['Telaga Sunyi',10]]},
 {q:'Alat tulis yang paling sering hilang di kelas?',a:[['Pulpen',35],['Pensil',30],['Penghapus',18],['Penggaris',10],['Tip-X',7]]},
 {q:'Alasan paling umum siswa terlambat sekolah?',a:[['Bangun kesiangan',45],['Macet',20],['Lupa PR',15],['Hujan',12],['Sepeda bocor',8]]},
 {q:'Olahraga favorit di sekolah?',a:[['Sepak bola',40],['Bulu tangkis',20],['Voli',15],['Basket',15],['Lari',10]]},
 {q:'Isi bekal yang paling sering dibawa?',a:[['Nasi goreng',30],['Tempe goreng',22],['Mie goreng',20],['Roti',15],['Telur dadar',13]]},
 {q:'Jenis tontonan favorit anak?',a:[['Kartun',40],['Sinema',20],['Game',15],['Vlog',15],['Berita',10]]},
 {q:'Cara paling seru merayakan ulang tahun?',a:[['Kue & lilin',35],['Balon-balonan',20],['Bagi hadiah',18],['Menginap bersama',15],['Pesta kejutan',12]]},
 {q:'Hal yang paling ditakutkan anak di malam hari?',a:[['Hantu',40],['Gelap',30],['Kecoak',15],['Mimpi buruk',10],['Badai',5]]},
 {q:'Pakaian adat dari Jawa Tengah?',a:[['Batik',40],['Kebaya',30],['Beskap',15],['Blangkon',10],['Jarik',5]]},
 {q:'Tempat menyimpan uang paling aman menurut anak?',a:[['Celengan',35],['Bank',30],['Dompet',20],['Bawah kasur',10],['Kotak pensil',5]]},
 {q:'Seragam apa saja yang dipakai siswa SD?',a:[['Merah putih',50],['Pramuka',25],['Batik',15],['Olahraga',10]]},
 {q:'Jajanan kantin favorit?',a:[['Cilok',30],['Keripik',25],['Permen',20],['Es lilin',15],['Wafer',10]]},
 {q:'Apa yang dibawa saat hujan?',a:[['Payung',45],['Jas hujan',25],['Gamis',15],['Topi',10],['Kardus',5]]},
 {q:'Kegiatan favorit di akhir pekan?',a:[['Main HP',35],['Nonton',25],['Main dengan teman',20],['Membaca',12],['Bersepeda',8]]},
 {q:'Kejadian yang bikin satu kelas ribut?',a:[['Guru keluar kelas',30],['PR dikumpulkan',20],['Ada yang ketiduran',20],['Kucing masuk kelas',15],['Listrik mati',15]]}
];

/* ================= SOAL GURU ================= */
/* Format per baris: Pertanyaan | Jawaban:30 | Jawaban:20 | ...
   Poin boleh dikosongkan -> dibagi rata sisa dari 100. Maks 8 jawaban. */
function parseFamTxt(t){
  const out=[];
  String(t||'').split(/\r?\n/).forEach(line=>{
    const parts=line.split(/[|;]/).map(x=>x.trim()).filter(Boolean);
    if(parts.length<3)return;
    const q=parts[0];
    const ans=[];
    const noPts=[];
    for(let i=1;i<parts.length&&ans.length<8;i++){
      const m=parts[i].match(/^(.*?)[\s:=-]+(\d{1,3})$/);
      if(m&&m[1].trim()){ans.push({t:m[1].trim(),p:clamp(parseInt(m[2],10),1,100)});}
      else{ans.push({t:parts[i],p:0});noPts.push(ans.length-1);}
    }
    if(ans.length<2)return;
    if(noPts.length){
      const used=ans.reduce((s,x)=>s+x.p,0);
      const each=Math.floor(Math.max(0,100-used)/noPts.length);
      noPts.forEach(i=>{ans[i].p=Math.max(1,each);});
    }
    out.push({q:q,a:ans});
  });
  return out;
}
let GURU_FAM=[];
function loadGuruFam(){
  GURU_FAM=parseFamTxt(LS.get('ff_guru',''));
}

/* ================= PEMILIH SOAL ================= */
const usedQ=new Set();
function pickSurvey(source){
  const bankGuru=GURU_FAM.length?GURU_FAM:null;
  let pool;
  if(source==='guru')pool=bankGuru||FAM100;
  else if(source==='bawaan')pool=FAM100;
  else pool=(bankGuru&&Math.random()<.5)?bankGuru:FAM100;
  let avail=pool.map((_,i)=>i).filter(i=>!usedQ.has(pool[i].q));
  if(!avail.length){usedQ.clear();avail=pool.map((_,i)=>i);}
  const idx=pick(avail);
  const q=pool[idx];
  usedQ.add(q.q);
  /* salin + acak urutan jawaban; dukung dua format bank: ['teks',poin] atau {t,p} */
  return {q:q.q,a:shuffle(q.a).map(x=>{
    const t=Array.isArray(x)?x[0]:x.t;
    const p=Array.isArray(x)?x[1]:x.p;
    return {t:t,p:p,r:false};
  })};
}

/* ================= PAPAN JUARA ================= */
function getFFBoard(){ return LS.get('ff_board',[]); }
function addFFBoard(a,b,sa,sb){
  const list=getFFBoard();
  list.push({w:(sa>=sb?a:b),l:(sa>=sb?b:a),p:Math.max(sa,sb),t:Date.now()});
  list.sort((x,y)=>y.p-x.p);
  const out=list.slice(0,5);
  LS.set('ff_board',out);
  return out;
}
