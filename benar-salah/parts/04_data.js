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
 ['Tanda baca di akhir kalimat tanya adalah…', '?', '!', 'A', 'Kalimat tanya diakhiri tanda tanya', 1],
 ['Sinonim kata \'pandai\' adalah…', 'cerdas', 'bodoh', 'A', 'Sinonim = persamaan makna', 1],
 ['Antonim kata \'terang\' adalah…', 'gelap', 'cerah', 'A', 'Antonim = lawan kata', 1],
 ['Kata ganti orang ketiga pada \'Dia pergi ke pasar\' adalah…', 'dia', 'pergi', 'A', 'Dia = orang ketiga', 2],
 ['Kalimat berita diprayogakan dgn tanda…', 'titik (.)', 'tanya (?)', 'A', 'Kalimat berita diakhiri titik', 2],
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
 ['\'Cat\' artinya…', 'kucing', 'anjing', 'A', 'Cat = kucing; dog = anjing', 1],
 ['\'Book\' artinya…', 'buku', 'meja', 'A', 'Book = buku; table = meja', 1],
 ['Sapaan pagi hari adalah…', 'Good morning', 'Good night', 'A', 'Pagi → good morning', 1],
 ['Lawan kata \'big\' adalah…', 'small', 'bird', 'A', 'big ↔ small', 2],
 ['Past tense dari \'go\' adalah…', 'went', 'goed', 'A', 'Kata kerja tak beraturan: go → went', 3],
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
 ['Lambang negara Indonesia adalah…', 'Garuda Pancasila', 'Bendera Merah Putih', 'A', 'Burung Garuda memegang pita 5 sila', 1],
 ['Proklamasi Kemerdekaan Indonesia dibacakan pada tanggal…', '17 Agustus 1945', '20 Mei 1945', 'A', 'Dibacakan Ir. Soekarno didampingi Drs. Hatta', 2],
 ['Jumlah sila dalam Pancasila adalah…', '5', '7', 'A', 'Panca = lima', 1],
 ['Dasar hukum tertinggi Indonesia adalah…', 'UUD 1945', 'IPDN', 'A', 'Konstitusi negara', 2],
 ['Semboyan bangsa Indonesia adalah…', 'Bhinneka Tunggal Ika', 'Tut Wuri Handayani', 'A', 'Tertera pada lambang negara', 1],
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
 ['Jumlah rakaat salat Subuh adalah…', '2', '4', 'A', 'Subuh = 2 rakaat', 1],
 ['Kitab suci umat Islam adalah…', 'Al-Qur\'an', 'Taurat', 'A', 'Diturunkan kepada Nabi Muhammad Saw.', 1],
 ['Jumlah surah dalam Al-Qur\'an adalah…', '114', '110', 'A', '', 2],
 ['Kiblat salat umat Islam adalah…', 'Ka\'bah', 'Masjid Nabawi', 'A', 'Masjidil Haram, Makkah', 1],
 ['Puasa wajib dilakukan pada bulan…', 'Ramadhan', 'Sya\'ban', 'A', 'Ramadhan = bulan puasa wajib', 1],
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
 ['Hari raya Natal diperingati tanggal…', '25 Desember', '31 Desember', 'A', 'Kelahiran Yesus Kristus', 1],
 ['Kitab suci agama Hindu adalah…', 'Veda', 'Injil', 'A', 'Veda = kitab suci Hindu', 3],
 ['Hari suci umat Buddha adalah…', 'Waisak', 'Natal', 'A', 'Peringatan Trisuci', 1],
 ['Tempat ibadah umat Hindu disebut…', 'pura', 'gereja', 'A', 'Pura di Bali', 2],
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
 ['Jaringan komputer yang menghubungkan seluruh dunia disebut…', 'Internet', 'LAN', 'A', 'Internet = jaringan global', 1],
 ['Kepanjangan dari CPU adalah…', 'Central Processing Unit', 'Computer Power Unit', 'A', 'CPU = otak komputer', 2],
 ['Perangkat untuk mencetak dokumen adalah…', 'printer', 'scanner', 'A', 'Printer = keluaran', 1],
 ['HTML digunakan untuk…', 'membuat halaman web', 'mengedit foto', 'A', 'HyperText Markup Language', 2],
 ['Kegiatan menyusun langkah-langkah untuk menyelesaikan masalah disebut…', 'algoritma', 'debugging', 'A', 'Algoritma = urutan langkah', 1],
 ['Kepanjangan dari LAN adalah…', 'Local Area Network', 'Long Area Network', 'A', 'Jaringan area lokal', 3],
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
 ['Angklung berasal dari…', 'Jawa Barat', 'Aceh', 'A', 'Alat musik bambu Sunda', 1],
 ['Tari Saman berasal dari…', 'Aceh', 'Bali', 'A', 'Tari khas Gayo', 1],
 ['Merah + kuning menghasilkan warna…', 'jingga', 'hijau', 'A', 'Campuran warna sekunder', 2],
 ['Batik yang dibuat dengan canting tulis disebut…', 'batik tulis', 'batik cap', 'A', '', 1],
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
 ['Recycle berarti…', 'mendaur ulang', 'membuang sampah', 'A', '', 1],
 ['Kerajinan tangan layak dijual karena bernilai…', 'ekonomi', 'hiburan', 'A', 'Nilai ekonomi produk', 2],
 ['Fungsi utama kemasan produk adalah…', 'melindungi isi', 'memperberat barang', 'A', '', 1],
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
 ['Samudra terluas di dunia adalah…', 'Samudra Pasifik', 'Samudra Hindia', 'A', '±165 juta km persegi', 2],
 ['Planet yang dijuluki planet merah adalah…', 'Mars', 'Venus', 'A', 'Debu besi oksida di permukaannya', 1],
 ['Bagian tumbuhan yang menyerap air adalah…', 'akar', 'daun', 'A', '', 1],
 ['Air mendidih pada suhu…', '100 derajat Celsius', '50 derajat Celsius', 'A', 'Pada tekanan normal', 1],
 ['Jumlah tulang manusia dewasa adalah…', '206', '300', 'A', 'Bayi ±300 lalu menyatu', 3],
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
 ['Ibu kota Provinsi Jawa Barat adalah…', 'Bandung', 'Semarang', 'A', 'Semarang = ibu kota Jawa Tengah', 1],
 ['Semakin tinggi suatu tempat, suhu udaranya semakin…', 'dingin', 'panas', 'A', '', 2],
 ['Selat yang memisahkan Jawa dan Sumatra adalah…', 'Selat Sunda', 'Selat Malaka', 'A', '', 2],
 ['Indonesia disebut negara…', 'kepulauan', 'kontinental', 'A', 'Ribuan pulau', 1],
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
 ['Lembaga sosial terkecil dalam masyarakat adalah…', 'keluarga', 'sekolah', 'A', 'Unit dasar masyarakat', 1],
 ['Perpindahan status sosial seseorang disebut…', 'mobilitas sosial', 'revolusi', 'A', 'Vertikal & horizontal', 2],
 ['Konflik dalam masyarakat selalu bersifat merusak', 'BENAR', 'SALAH', 'B', 'Konflik bisa fungsional bagi perubahan sosial', 3],
 ['Keluarga adalah bentuk lembaga sosial terkecil',1,'Unit masyarakat dasar',1],
 ['Interaksi sosial butuh kontak sosial & komunikasi',1,'Dua syarat interaksi',2],
 ['Konflik selalu merusak masyarakat',0,'Konflik bisa fungsional (perubahan sosial)',3],
 ['Norma mengatur perilaku anggota masyarakat',1,'Fungsi norma',1],
 ['Status asal lahir disebut status ascriptive',1,'Status acquired = usaha sendiri',3],
 ['Solidaritas sosial memperkuat persatuan',1,'Nilai kebersamaan',2],
 ['Mobilitas sosial adalah perpindahan status',1,'Vertikal & horizontal',2]
],
'Koding':[
 ['Kegiatan menyusun langkah-langkah penyelesaian masalah disebut…', 'algoritma', 'debugging', 'A', '', 1],
 ['Blok \'ulangi\' pada Scratch berfungsi untuk…', 'mengulang perintah', 'menghapus perintah', 'A', 'Konsep loop', 2],
 ['Mencari dan memperbaiki kesalahan program disebut…', 'debugging', 'downloading', 'A', 'Debug = perbaiki bug', 2],
 ['Tempat menyimpan nilai dalam program disebut…', 'variabel', 'printer', 'A', '', 2],
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
 ['Tujuan pemanasan sebelum olahraga adalah…', 'mencegah cedera', 'menambah berat badan', 'A', '', 1],
 ['Lari cepat termasuk cabang olahraga…', 'atletik', 'renang', 'A', '', 1],
 ['Push-up terutama melatih otot…', 'lengan dan dada', 'leher dan mata', 'A', 'Latihan beban tubuh', 2],
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
 ['Benua terluas di dunia adalah…', 'Asia', 'Eropa', 'A', 'Asia ±44 juta km persegi', 1],
 ['Candi Borobudur terletak di…', 'Jawa Tengah', 'Jawa Timur', 'A', 'Magelang, Jawa Tengah', 1],
 ['Unsur gas terbanyak di atmosfer adalah…', 'nitrogen', 'oksigen', 'A', 'Nitrogen ±78%', 3],
 ['Piramida Giza terletak di…', 'Mesir', 'Brasil', 'A', '', 2],
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
function genMathQ(level,kelas){
  const kelasN=parseInt(kelas,10)||1;
  const easy=kelasN<=3;
  const op=pick(easy?['+','\u2212']:['+','\u2212','\u00d7']);
  let a,b,ans;
  if(op==='+'){a=ri(easy?2:25,easy?20:199);b=ri(easy?1:15,easy?20:99);ans=a+b;}
  else if(op==='\u2212'){a=ri(easy?5:60,easy?20:199);b=easy?ri(1,a):ri(10,a-5);ans=a-b;}
  else{a=ri(2,12);b=ri(2,12);ans=a*b;}
  let wrong=ans+pick([-10,-3,-2,-1,1,2,3,10]);
  if(wrong<0)wrong=ans+Math.abs(wrong)+1;
  if(wrong===ans)wrong=ans+1;
  const key=Math.random()<.5?'A':'B';
  const tA=key==='A'?ans:wrong,tB=key==='A'?wrong:ans;
  return {text:a+' '+op+' '+b+' = ?',tA:String(tA),tB:String(tB),key:key,ok:key==='A',
    fact:'Hitung: '+a+' '+op+' '+b+' = '+ans,level:clamp(parseInt(level,10)||2,1,3)};
}
/* konversi baris bank mentah → soal runtime {text,tA,tB,key,fact,level} */
function toItem(r){
  if(Array.isArray(r)&&r.length>=5){ /* pilihan ganda: [soal,A,B,kunci,fakta,level] */
    const key=/^b/i.test(String(r[3]))?'B':'A';
    return {text:String(r[0]),tA:String(r[1]),tB:String(r[2]),key:key,ok:key==='A',fact:r[4]||'',level:clamp(parseInt(r[5],10)||2,1,3)};
  }
  const key=+r[1]?'A':'B'; /* pernyataan benar/salah lama */
  return {text:String(r[0]),tA:'BENAR',tB:'SALAH',key:key,ok:key==='A',fact:r[2]||'',level:clamp(parseInt(r[3],10)||2,1,3)};
}
function parseBank(mapel){return (BANK[mapel]||[]).map(toItem);}
function bankToLines(bank){
  return bank.map(e=>{
    if(e.tA==='BENAR'&&e.tB==='SALAH')return e.text+' | '+(e.key==='A'?'B':'S')+' | '+(e.fact||'')+' | '+(e.level||2);
    return [e.text,e.tA,e.tB,e.key,e.fact||'',e.level||2].join(' | ');
  }).join('\n');
}
function parseLines(t){
  const out=[];
  String(t||'').split(/\r?\n/).forEach(line=>{
    const p=line.split('|').map(x=>x.trim());
    if(p.length<2||!p[0])return;
    const stmt=p.length<=4&&/^(b|s|benar|salah|1|0|true|false)$/i.test(p[1]);
    if(stmt){
      const v=/^(b|benar|1|true)$/i.test(p[1]);
      out.push({text:p[0],tA:'BENAR',tB:'SALAH',key:v?'A':'B',ok:v,fact:p[2]||'',level:clamp(parseInt(p[3],10)||2,1,3)});
    }else if(p.length>=4){
      const key=/^b/i.test(p[3])?'B':'A';
      out.push({text:p[0],tA:p[1],tB:p[2],key:key,ok:key==='A',fact:p[4]||'',level:clamp(parseInt(p[5],10)||2,1,3)});
    }else{ /* 3 kolom: soal | A | B */
      out.push({text:p[0],tA:p[1],tB:p[2],key:'A',ok:true,fact:'',level:2});
    }
  });
  return out.filter(e=>e.text.length>3&&e.tA&&e.tB);
}
/* susun soal sesuai filter (tingkat fleksibel bila bank kurang) */
function composeQuiz(mapel,level,kelas,count){
  count=count||25;
  const custom=LS.get('bs_bank_'+mapel,null);
  let list=custom?parseLines(custom):parseBank(mapel);
  if(!list.length){list=[];for(let i=0;i<40;i++)list.push(genMathQ(level,kelas));}
  const want=+level,flex=[want,want===1?2:want-1,want===3?2:want+1];
  let pool=list.filter(e=>e.level===flex[0]).concat(list.filter(e=>e.level===flex[1]),list.filter(e=>e.level===flex[2]));
  if(!pool.length)pool=list.slice();
  const uniq=pool.slice(),out=[];
  let guard=0;
  while(out.length<count&&guard++<400){
    if(!uniq.length)break;
    out.push(uniq.splice(ri(0,uniq.length-1),1)[0]);
  }
  while(out.length<count&&out.length)out.push(Object.assign({},pool[ri(0,pool.length-1)]));
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
