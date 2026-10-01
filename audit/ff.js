/* AUDIT JSDOM — KUIS FAMILY 100 (v1.1: fix papan tak tampil)
   A. Regresi papan: tile tertutup TERLIHAT (bukan display:none), ketuk → terbuka
   B. Gameplay: strike×3 → steal, missSteal, reveal steal, papan habis, undo, hasil
   C. Setup & bank guru: seg, format ff_guru, start ditolak saat kosong */
const {JSDOM}=require('jsdom');
const fs=require('fs');
let PASS=0,FAIL=0;
const T=(n,k,c)=>{if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,100)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+(c===undefined?'-':JSON.stringify(c)).slice(0,110)+']');}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const w=new JSDOM(fs.readFileSync('/home/user/family-100/index.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/'}).window;
  w.addEventListener('error',e=>console.log('WINERR:',e.message));
  const d=w.document,A=w.__FF,PE=w.PointerEvent||w.MouseEvent;
  const MB=()=>[...d.querySelectorAll('#modal-root.open .modal button')];
  await sleep(600);

  console.log('A. PAPAN JAWABAN (bug dilaporkan)');
  [...d.querySelectorAll('button')].find(b=>/MULAI BERMAIN/.test(b.textContent)).click();
  d.getElementById('btn-start').click();
  await sleep(200);
  MB().find(b=>/🟡/.test(b.textContent)).click();
  await sleep(300);
  T('Layar game aktif + soal tampil',d.querySelector('.screen.active').id==='scr-game'&&d.getElementById('qbanner').textContent.length>4,d.getElementById('qbanner').textContent.slice(0,30));
  const tiles0=[...d.querySelectorAll('#board .tile')];
  T('Petak jawaban dirender sesuai bank (≥2)',tiles0.length===w.S.q.a.length&&tiles0.length>=2,tiles0.length);
  T('Petak tertutup TERLIHAT, bukan display:none (bug v1.0)',tiles0.every(t=>t.classList.contains('down')&&w.getComputedStyle(t).display!=='none'),'kelas='+tiles0[0].className);
  T('CSS tanda ? ? ? utk petak tertutup ada di stylesheet',d.head.textContent.includes("tile.down .ttext::after{content:'? ? ?'"));
  {
    const t0=tiles0[0];const r=t0.getBoundingClientRect();
    t0.dispatchEvent(new PE('pointerdown',{bubbles:true,clientX:r.left+5,clientY:r.top+5}));
    await sleep(150);
    T('Ketuk petak → terbuka + POT bertambah',t0.classList.contains('revealed')&&w.S.pot>0,w.S.pot);
    const p=w.S.pot;
    t0.dispatchEvent(new PE('pointerdown',{bubbles:true,clientX:r.left+5,clientY:r.top+5}));
    await sleep(50);
    T('Petak terbuka tak bisa dibuka ulang',w.S.pot===p,w.S.pot);
    T('Tombol Batalkan muncul setelah reveal',d.getElementById('btn-undo').classList.contains('show'));
  }

  console.log('B. GAMEPLAY');
  A.doStrike();await sleep(50);
  T('STRIKE → X ke-1 menyala',d.querySelectorAll('#strikes .sx.on').length===1);
  A.undo();await sleep(50);
  T('Undo strike → X kembali 0',d.querySelectorAll('#strikes .sx.on').length===0);
  A.doStrike();A.doStrike();A.doStrike();await sleep(100);
  T('3 STRIKE → fase STEAL + banner',w.S.phase==='steal'&&!!d.getElementById('stealbar'),w.S.phase);
  T('Reveal oleh tim giliran DITOLAK saat steal',(()=>{const hid=w.S.q.a.findIndex(x=>!x.r);const p=w.S.pot;A.doReveal(hid,false);return w.S.pot===p&&w.S.phase==='steal';})());
  A.missSteal();await sleep(150);
  T('Steal meleset → pot ke tim pertama (modal ronde)',w.S.phase==='roundend'&&/POIN/.test(d.querySelector('.modal').textContent),w.S.phase);
  MB().find(b=>/Ronde Berikutnya/.test(b.textContent)).click();
  await sleep(200);
  T('Ronde 2 mulai + giliran bergantian',w.S.round===2&&w.S.playing===1&&w.S.phase==='play','r'+w.S.round+' pemain'+w.S.playing);
  T('Papan baru tertutup semua & terlihat',[...d.querySelectorAll('#board .tile')].every(t=>t.classList.contains('down')&&w.getComputedStyle(t).display!=='none'));
  { /* steal berhasil: 3 strike lalu reveal oleh tim pencuri */
    while(w.S.phase==='play')A.doStrike();
    const hid=w.S.q.a.findIndex(x=>!x.r);
    A.doReveal(hid,true);await sleep(150);
    T('Tim pencuri kena papan → langsung curi pot (modal)',w.S.phase==='roundend',w.S.phase);
    const mb=MB();mb[mb.length-1].click();
    await sleep(200);
  }
  for(let i=0;i<40&&w.S.phase!=='over';i++){ /* habiskan sisa ronde */
    if(w.S.phase==='play'){const hid=w.S.q.a.findIndex(x=>!x.r);if(hid>=0)A.doReveal(hid,false);}
    if(w.S.phase==='steal')A.missSteal();
    await sleep(100);
    const mb=MB();
    if(mb.length)mb[mb.length-1].click();
    await sleep(100);
  }
  T('Semua ronde selesai → layar hasil',w.S.phase==='over'&&d.querySelector('.screen.active').id==='scr-result',w.S.phase);
  T('Papan juara tercatat ke #board-res (bukan #board game)',/PAPAN JUARA/.test(d.getElementById('board-res').textContent)&&d.querySelectorAll('#board .tile').length>0);
  T('Nama tim tampil di hasil',/Tim 1/.test(d.getElementById('res-big').textContent));

  console.log('C. SETUP & BANK GURU');
  [...d.querySelectorAll('#scr-result button')].find(b=>/Menu Utama/.test(b.textContent)).click();
  await sleep(100);
  d.getElementById('btn-play').click();await sleep(100);
  T('Setup terbuka: 3 baris pil terisi label',(()=>{const s=[...d.querySelectorAll('.seg')];return s.length===3&&s.every(x=>x.querySelectorAll('button').length>=2&&x.textContent.trim().length>5);})(),[...d.querySelectorAll('.seg')].map(x=>x.children.length).join(','));
  d.getElementById('seg-rounds').querySelectorAll('button')[2].click();await sleep(50);
  T('Pil 5 Ronde terpilih → cfg.rounds=5',w.CFG.rounds===5,w.CFG.rounds);
  w.localStorage.setItem('ff_guru',JSON.stringify('Bu Siti suka makan? | Rendang:40 | Bakso:30 | Mie ayam:30'));
  w.eval('loadGuruFam()');
  T('Bank guru terparse (format Jawaban:Poin)',w.eval('GURU_FAM.length')===1&&w.eval('GURU_FAM[0].a.length')===3&&w.eval('GURU_FAM[0].a[0].p')===40,w.eval('JSON.stringify(GURU_FAM[0]&&GURU_FAM[0].a[0])'));
  w.localStorage.setItem('ff_guru',JSON.stringify(''));
  w.eval('loadGuruFam()');
  w.eval("CFG.source='guru'");
  A.startGame();
  await sleep(100);
  T('Soal guru kosong → MULAI ditolak + toast',d.querySelector('.screen.active').id!=='scr-game'&&/kosong/.test(d.getElementById('toast').textContent),d.getElementById('toast').textContent.slice(0,40));

  console.log('\nAUDIT FAMILY 100: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
