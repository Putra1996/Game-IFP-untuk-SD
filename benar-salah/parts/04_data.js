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
/* ================= BANK PERNYATAAN =================
   Format entri: [teks, benar?(1/0), fakta, level(1-3)] */
const BANK={
'Bahasa Indonesia':[
 ['Huruf vokal dalam abjad berjumlah 5',1,'A, I, U, E, O adalah huruf vokal',1],
 ['Kata "buku" memiliki huruf awal B',1,'Baku: buku ditulis dengan huruf awal B',1],
 ['"S" pada kata "siswa" dibaca "es"',1,'Nama huruf S adalah "es"',1],
 ['Sinonim kata "pandai" adalah "bodoh"',0,'Sinonim "pandai" adalah "cerdas"',1],
 ['Kalimat tanya diakhiri tanda seru (!)',0,'Kalimat tanya diakhiri tanda tanya (?)',1],
 ['"Meja, buku, dan pensil" adalah contoh benda',1,'Semuanya termasuk nomina (kata benda)',2],
 ['Awalan "me-" pada "menulis" bermakna melakukan',1,'me+nulis = melakukan aksi menulis',2],
 ['Puisi wajib memiliki rima akhir a-a-a',0,'Rima puisi bebas, tidak wajib a-a-a',2],
 ['Antonim "terang" adalah "gelap"',1,'Antonim = lawan kata',2],
 ['Kalimat efektif membuat tulisan bertele-tele',0,'Kalimat efektif justru ringkas & jelas',3],
 ['"Dia pergi ke pasar" menggunakan kata ganti orang ketiga',1,'"Dia" = kata ganti orang ketiga',2],
 ['Huruf kapital dipakai setiap kata dalam kalimat',0,'Huruf kapital di awal kalimat & nama diri',3]
],
'Bahasa Inggris':[
 ['"Cat" means "anjing"',0,'Cat = kucing; anjing = dog',1],
 ['"Good morning" is said before noon',1,'Dipakai pagi hingga siang',1],
 ['"Apple" is a fruit',1,'Apple = apel, termasuk buah',1],
 ['"One, two, three" is counting',1,'Itu angka 1, 2, 3',1],
 ['"Book" means "meja"',0,'Book = buku; meja = table',1],
 ['The sky is usually "blue"',1,'Langit biasanya biru',2],
 ['"She" is used for a boy',0,'She untuk perempuan; he untuk laki-laki',2],
 ['"Water" freezes into ice',1,'Air membeku menjadi es',2],
 ['Past tense of "go" is "goed"',0,'Past tense "go" adalah "went"',3],
 ['"Library" is a place to borrow books',1,'Library = perpustakaan',2],
 ['There are 7 days in a week: "seven days"',1,'Seminggu = seven days',1],
 ['"Eat" means "minum"',0,'Eat = makan; minum = drink',2]
],
'PKn':[
 ['Merah putih adalah bendera Indonesia',1,'Sang Saka Merah Putih',1],
 ['Indonesia memiliki 27 lambang negara',0,'Lambang negara: Garuda Pancasila (satu)',2],
 ['Pancasila terdiri atas 5 sila',1,'Panca = lima',1],
 ['Presiden dipilih langsung oleh rakyat',1,'Melalui pemilu lima tahunan',2],
 ['UUD 1945 adalah dasar hukum tertinggi',1,'Konstitusi negara Indonesia',2],
 ['Raudhatul Jannah adalah nama lambang negara',0,'Lambang negara: Garuda Pancasila',3],
 ['Tanggal 17 Agustus adalah hari kemerdekaan RI',1,'Proklamasi 17-08-1945',1],
 ['BPUPK membentuk garuda emas',0,'Perancang garuda: Sultan Hamid II, disahkan RIS 1950',3],
 ['Gotong royong adalah budaya Indonesia',1,'Nilai luhur gotong royong',1],
 ['Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu',1,'Semboyan di lambang negara',2]
],
'Pendidikan Agama Islam':[
 ['Muslim wajib salat 5 waktu',1,'Subuh, Zuhur, Asar, Magrib, Isak',1],
 ['Al-Qur\'an terdiri atas 114 surah',1,'Jumlah surah Al-Qur\'an',2],
 ['Puasa Ramadan dilakukan sebulan penuh',1,'Sya\'ban? Bukan — Ramadhan',1],
 ['Zakat fitrah dibayar setelah Idulfitri',0,'Dibayar sebelum salat Idulfitri',3],
 ['Nabi terakhir adalah Muhammad Saw.',1,'Khatamun nabiyyin',1],
 ['Kiblat salat umat Islam adalah Ka\'bah',1,'Di Masjidil Haram, Makkah',1],
 ['Salat Subuh memiliki 4 rakaat',0,'Subuh = 2 rakaat',2],
 ['Kitab Taurat diturunkan kepada Nabi Musa',1,'Taurat ~ Nabi Musa as',2],
 ['Malaikat Jibril bertugas menyampaikan wahyu',1,'Jibril = penyampai wahyu',2],
 ['Iduladha jatuh setelah haji wukuf di Arafah',1,'10 Zulhijah',3]
],
'Pendidikan Agama Lainnya':[
 ['Hari raya Natal diperingati 25 Desember',1,'Kelahiran YesusKristus',1],
 ['Kitab Injil dikenal dalam agama Kristen',1,'Injil ~ agama Kristen',2],
 ['Umat Buddha merayakan Waisak',1,'Waisak = hari suci Trisuci',1],
 ['Veda adalah kitab suci agama Konghucu',0,'Veda = kitab suci Hindu',3],
 ['Umat Hindu menuju pura untuk beribadah',1,'Pura = tempat ibadah Hindu',2],
 ['Tri Hitu Karana adalah ajaran agama Katolik',0,'Itu ajaran Hindu',3],
 ['Agama Khonghucu menghormati Nabi Kong Zi',1,'Pendiri ajaran Khonghucu',2],
 ['Sabbath adalah hari ibadat umat Yahudi',1,'Sabtu = hari Sabbat',3]
],
'Matematika':[],
'Informatika':[
 ['Keyboard digunakan untuk mengetik',1,'Perangkat input mengetik',1],
 ['Monitor adalah perangkat keluaran',1,'Monitor menampilkan keluaran',1],
 ['RAM menyimpan data permanen selamanya',0,'RAM bersifat sementara (volatile)',2],
 ['HTML digunakan untuk membuat halaman web',1,'HyperText Markup Language',2],
 ['CPU adalah singkatan dari Central Processing Unit',1,'Otak komputer',2],
 ['Rumus data acak sementara di komputer disebut cache',1,'Cache = penyimpanan sementara',3],
 ['Mouse berfungsi mencetak dokumen',0,'Mouse = penunjuk (pointer); cetak = printer',1],
 ['Internet membutuhkan koneksi jaringan',1,'Terhubung lewat jaringan',1],
 ['Folder digunakan untuk menyimpan berkas',1,'File disimpan dalam folder',1],
 ['Wi-Fi adalah koneksi tanpa kabel',1,'Wireless Fidelity',1],
 ['Perangkat lunak disebut juga hardware',0,'Perangkat lunak = software',2],
 ['Algoritma adalah langkah-langkah menyelesaikan masalah',1,'Definisi algoritma',2]
],
'Seni Budaya':[
 ['Angklung berasal dari Jawa Barat',1,'Alat musik bambu Sunda',1],
 ['Warna sekunder hasil campuran merah dan kuning adalah biru',0,'Merah+kuning = jingga (oranye)',2],
 ['Gambar tiga dimensi memiliki panjang, lebar, dan tinggi',1,'Definisi 3D',2],
 ['Tari Saman berasal dari Aceh',1,'Tari khas Gayo, Aceh',1],
 ['Nada do-mi-so membentuk akor mayor',1,'Tonic mayor',3],
 ['Cat air (watercolor) larut dalam minyak',0,'Cat air larut dalam air',2],
 ['Batik jahit tulis disebut batik tulis',1,'Dibuat dengan canting tulis',1],
 ['Sketsa adalah gambar kasar awal',1,'Draf pertama gambar',1]
],
'Prakarya':[
 ['Menjahit menghasilkan produk tekstil',1,'Jahit → pakaian',1],
 ['Kerajinan tangan tidak bisa dijual',0,'Kerajinan tangan bernilai ekonomi',1],
 ['Makanan titik jualnya rasa dan kebersihan',1,'Daya saing produk makanan',2],
 ['Recycle berarti membuang sampah',0,'Recycle = mendaur ulang',1],
 ['Bisnis online memakai media digital',1,'Jual beli via internet',2],
 ['Kemasan produk melindungi isi barang',1,'Fungsi kemasan',1],
 ['Sabun dibuat dari minyak jelantah tidak mungkin',0,'Sabun yejus bisa dari minyak jelantah',3],
 ['Limbah organik dapat dikomposkan',1,'Kompos dari sisa organik',2]
],
'IPA':[
 ['Matahari adalah sumber cahaya alami',1,'Cahaya alami utama bumi',1],
 ['Hewan pemakan tumbuhan disebut karnivora',0,'Pemakan tumbuhan = herbivora',2],
 ['Air mendidih pada 100 derajat Celsius',1,'Pada tekanan normal',1],
 ['Tumbuhan menghasilkan oksigen saat fotosintesis',1,'Hasil samping fotosintesis',2],
 ['Gaya gravitasi bumi menarik benda ke bawah',1,'Gaya berat',1],
 ['Tulang manusia dewasa berjumlah 300',0,'Dewasa 206; bayi ±300',3],
 ['Gempa bumi terjadi karena pergerakan lempeng',1,'Tektonik',2],
 ['Bagian tumbuhan yang menyerap air adalah daun',0,'Yang menyerap air = akar',1],
 ['Rangka manusia tersusun dari tulau rawan dan tulang',1,'Sistem rangka',2],
 ['Listrik statis sering terjadi saat musim hujan',0,'Lebih sering musim kemarau',3]
],
'IPS':[
 ['Indonesia adalah negara kepulauan',1,'Ribuan pulau',1],
 ['Peta adalah gambar permukaan bumi',1,'Diproyeksikan pada bidang datar',1],
 ['Ibu kota Provinsi Jawa Barat adalah Bandung',1,'Bandung',1],
 ['Semakin tinggi tempat, suhu udaranya makin panas',0,'Makin tinggi makin dingin',2],
 ['Pasar adalah tempat jual beli',1,'Definisi pasar',1],
 ['Silvi heterogen penduduk Indonesia serba sama',0,'Indonesia majemuk (beragam)',3],
 ['Mata pencaharian petani menghasilkan pangan',1,'Sektor pertanian',1],
 ['Selat memisahkan dua daratan',1,'Contoh: Selat Sunda',2]
],
'Sosiologi':[
 ['Keluarga adalah bentuk lembaga sosial terkecil',1,'Unit masyarakat dasar',1],
 ['Interaksi sosial butuh kontak sosial & komunikasi',1,'Dua syarat interaksi',2],
 ['Konflik selalu merusak masyarakat',0,'Konflik bisa fungsional (perubahan sosial)',3],
 ['Norma mengatur perilaku anggota masyarakat',1,'Fungsi norma',1],
 ['Status asal lahir disebut status ascriptive',1,'Status acquired = usaha sendiri',3],
 ['Solidaritas sosial memperkuat persatuan',1,'Nilai kebersamaan',2],
 ['Mobilitas sosial adalah perpindahan status',1,'Vertikal & horizontal',2]
],
'Koding':[
 ['Robot bisa mengikuti perintah langkah demi langkah',1,'Program = rangkaian instruksi',1],
 ['Algoritma adalah urutan langkah penyelesaian masalah',1,'Definisi algoritma',1],
 ['Blok "ulangi" membuat perintah berjalan sekali saja',0,'Ulangi = berjalan berulang (loop)',2],
 ['Scratch menggunakan blok warna untuk coding',1,'Visual programming',1],
 ['Debugging berarti mencari & memperbaiki kesalahan',1,'Definisi debug',2],
 ['Komputer bisa berpikir tanpa perintah manusia',0,'Komputer menjalankan instruksi',2],
 ['Loop berguna untuk pengulangan perintah',1,'Konsep perulangan',1],
 ['Variabel digunakan untuk menyimpan nilai',1,'Konsep variabel',2]
],
'Penjas':[
 ['Pemanasan sebelum olahraga mencegah cedera',1,'Fungsi pemanasan',1],
 ['Lari cepat termasuk atletik',1,'Cabang atletik',1],
 ['Minum air putih tidak perlu saat olahraga',0,'Hidrasi penting',1],
 ['Push-up melatih otot lengan & dada',1,'Latihan beban tubuh',2],
 ['Denyut jantung naik saat berolahraga',1,'Respons tubuh normal',1],
 ['Istirahat tidak berpengaruh pada kebugaran',0,'Istirahat = komponen kebugaran',2],
 ['Jumping jack melatih kelenturan & daya tahan',1,'Senam lantai/rhythm',2],
 ['Postur tubuh baik saat duduk tegak',1,'Ergonomi duduk',1]
],
'Pengetahuan Umum':[
 ['Benua terluas di dunia adalah Asia',1,'Asia ±44 juta km persegi',1],
 ['Samudra terluas adalah Samudra Hindia',0,'Terluas: Samudra Pasifik',2],
 ['Indonesia beriklim tropis',1,'Dua musim: hujan & kemarau',1],
 ['Planet merah adalah Mars',1,'Warna kemerahan dari besi oksida',1],
 ['Piramida besar terletak di Brasil',0,'Piramida Giza ada di Mesir',2],
 ['Ade unsurt terbanyak di atmosfer adalah nitrogen',1,'Nitrogen ±78%',3],
 ['Objek Wisata Candi Borobudur ada di Jawa Tengah',1,'Magelang, Jawa Tengah',1],
 ['Lambang zodiak Aquarius adalah sang kancil',0,'Aquarius = wadah air (sang pembawa air)',3]
]
};
const MAPEL_LIST=Object.keys(BANK);
/* Matematika: generator pernyataan benar/salah */
function genMathStmt(level,kelas){
  const kelasN=parseInt(kelas,10);
  let a,b,ans,claim,ok,q;
  const easy=!isNaN(kelasN)&&kelasN<=3;
  const op=pick(easy?['+','−']:['+','−','×']);
  if(op==='+'){a=ri(easy?2:25,easy?20:199);b=ri(easy?1:15,easy?20:99);ans=a+b;q=a+' + '+b+' = ';}
  else if(op==='−'){a=ri(easy?5:60,easy?20:199);b=easy?ri(1,a):ri(10,a-5);ans=a-b;q=a+' − '+b+' = ';}
  else{a=ri(2,12);b=ri(2,12);ans=a*b;q=a+' × '+b+' = ';}
  const truth=Math.random()<.5;
  let shown=truth?ans:ans+pick([-3,-2,-1,1,2,3,10]);
  if(shown<0)shown=ans+Math.abs(shown)+1;
  if(shown===ans)shown=ans+1;
  return [q+shown,truth?'Benar!':('Salah — hasilnya '+ans),('Hitung: '+q+ans),level];
}
/* parse bank & level */
function parseBank(mapel){
  return (BANK[mapel]||[]).map(r=>({text:r[0],ok:!!r[1],fact:r[2],level:r[3]||2}));
}
function bankToLines(bank){
  return bank.map(e=>e.text+' | '+(e.ok?'B':'S')+' | '+e.fact+' | '+e.level).join('\n');
}
function parseLines(t){
  const out=[];
  String(t||'').split(/\r?\n/).forEach(line=>{
    const p=line.split('|').map(x=>x.trim());
    if(p.length<2)return;
    const v=/^(b|benar|1|true)$/i.test(p[1]);
    out.push({text:p[0],ok:v,fact:p[2]||'',level:clamp(parseInt(p[3],10)||2,1,3)});
  });
  return out.filter(e=>e.text.length>3);
}
/* susun 25 soal sesuai filter */
function composeQuiz(mapel,level,kelas,count){
  count=count||25;
  let pool;
  if(mapel==='Matematika'){
    const custom=LS.get('bs_bank_Matematika',null);
    let cl=custom?parseLines(custom):[];
    if(cl.length){pool=cl;}
    else{
      pool=[];
      for(let i=0;i<40;i++)pool.push(genMathStmt(level,kelas));
      pool=pool.map(r=>({text:r[0],ok:/^Benar/.test(r[1]),fact:r[2],level:r[3]}));
    }
  }else{
    const custom=LS.get('bs_bank_'+mapel,null);
    let list=custom?parseLines(custom):parseBank(mapel);
    /* fallback: bank kosong → matematika */
    if(!list.length){pool=[];for(let i=0;i<40;i++){const r=genMathStmt(level,kelas);pool.push({text:r[0],ok:/^Benar/.test(r[1]),fact:r[2],level:r[3]});}list=pool;}
    const want=+level,flex=[want,want===1?2:want-1,want===3?2:want+1];
    pool=list.filter(e=>e.level===flex[0]).concat(list.filter(e=>e.level===flex[1]),list.filter(e=>e.level===flex[2]));
  }
  const uniq=pool.slice(0);
  const out=[];
  let guard=0;
  while(out.length<count&&guard++<400){
    if(!uniq.length)break;
    const i=ri(0,uniq.length-1);
    out.push(uniq.splice(i,1)[0]);
  }
  /* bila kurang dari count (bank kecil), daur ulang acak */
  while(out.length<count&&out.length)out.push(pool[ri(0,pool.length-1)]);
  return out.slice(0,count);
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
  correct(){this.tone(660,0,.09,'sine',.2);this.tone(880,.09,.14,'sine',.2);},
  wrong(){this.tone(200,0,.2,'sawtooth',.16);},
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
    const cols=['#ffc832','#3ec1ff','#2ecc71','#ff5347','#c084fc'];
    for(let i=0;i<(n||30);i++){
      const a=Math.random()*Math.PI*2,sp=2+Math.random()*7;
      this.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,g:.22,r:2+Math.random()*4,c:pick(cols),l:40+Math.random()*30});
    }
  },
  step(){
    if(!this.cx)return;
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
