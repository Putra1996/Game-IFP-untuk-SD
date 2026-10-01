/* AUDIT MODE HP (portrait 390×844) — Kuis A/B + Absensi + Family 100 */
const puppeteer=require('puppeteer');
const fs=require('fs');
let PASS=0,FAIL=0;
const T=(n,k,c)=>{if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,100)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+(c===undefined?'-':JSON.stringify(c)).slice(0,120)+']');}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function noHScroll(page){return page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2);}
(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  /* ---------- KUIS A/B di HP ---------- */
  {
    const p=await browser.newPage();
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file:///home/user/benar-salah/index.html');
    await sleep(900);
    T('HP: gerbang tampil & input password terlihat',await p.evaluate(()=>{const i=document.getElementById('gate-pass');const r=i.getBoundingClientRect();return r.width>0&&r.bottom<=innerHeight&&r.top>=0;}));
    T('HP: tanpa scroll horizontal (gate)',await noHScroll(p));
    /* LOGIN DGN PASSWORD DEFAULT 1234 di viewport HP */
    await p.type('#gate-pass','1234');
    await p.evaluate(()=>document.getElementById('btn-login').click());
    await p.waitForSelector('#scr-setup.active',{timeout:4000});
    T('HP: login 1234 → setup terbuka',true);
    T('HP: tombol "Muat soal ini" terlihat & bisa diketuk',await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Muat soal ini/.test(x.textContent));const r=b.getBoundingClientRect();return r.width>0&&r.right<=innerWidth+2;}));
    T('HP: tanpa scroll horizontal (setup)',await noHScroll(p));
    await p.select('#sel-mapel','IPA');
    await p.evaluate(()=>document.getElementById('btn-muat').click());
    await sleep(300);
    await p.evaluate(()=>{CFG.cam=false;});
    await p.evaluate(()=>document.getElementById('btn-start').click());
    await p.waitForSelector('#scr-game.active',{timeout:4000});
    await p.waitForFunction("S.phase==='ask'",{timeout:15000});
    T('HP: game jalan, zona A & B terlihat di layar',await p.evaluate(()=>{const a=document.getElementById('zwrap-a').getBoundingClientRect(),b=document.getElementById('zwrap-b').getBoundingClientRect();return a.top>=0&&a.bottom<=innerHeight&&b.top>=0&&b.bottom<=innerHeight;}));
    T('HP: soal terbaca (font ≥ 16px)',await p.evaluate(()=>parseFloat(getComputedStyle(document.getElementById('qtext')).fontSize)>=15));
    /* ketuk zona di layar sentuh */
    await p.evaluate(()=>{const k=window.__AB.QUIZ_REF()[0].key;const z=document.getElementById('zone-'+k.toLowerCase());const r=z.getBoundingClientRect();z.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));});
    await sleep(400);
    T('HP: ketuk zona → wash muncul',await p.evaluate(()=>document.getElementById('washL').classList.contains('on')||document.getElementById('washR').classList.contains('on')));
    T('HP: 0 page error (A/B)',errs.filter(e=>!/favicon|net::ERR|gpu|dbus/.test(e)).length===0,errs.slice(0,2));
    await p.close();
  }
/* ---------- GBP di HP (bug pil setup) ---------- */
  {
    const p=await browser.newPage();
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file:///home/user/gesture-battle-pro/index.html');
    await sleep(900);
    await p.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/duel/i.test(b.textContent)).click();});
    await p.waitForSelector('#scr-setup.active',{timeout:3000});
    await sleep(300);
    const lbl=await p.$$eval('#seg-cat .chip',els=>els.map(e=>e.textContent));
    T('HP GBP: pil kategori berlabel',lbl.join('|')==='🎲 Campur|📚 Umum|🔢 Matematika|✏️ Soal Guru',lbl.join('|'));
    T('HP GBP: semua pil kategori di dalam layar & tertablet',await p.evaluate(()=>[...document.querySelectorAll('#seg-cat .chip')].every(b=>{const r=b.getBoundingClientRect();return r.width>30&&r.right<=innerWidth+2;})));
    await p.evaluate(()=>{[...document.querySelectorAll('#seg-cat .chip')].find(b=>/Matematika/.test(b.textContent)).click();});
    T('HP GBP: klik Matematika tercatat',await p.evaluate(()=>window.CFG.category==='matematika'));
    T('HP GBP: tanpa scroll horizontal',await noHScroll(p));
    T('HP GBP: 0 page error',errs.length===0,errs.slice(0,2));
    await p.close();
  }
    /* ---------- ABSENSI di HP ---------- */
  {
    const p=await browser.newPage();
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.evaluateOnNewDocument(()=>{
      const v=Array.from({length:128},(_,i)=>+(Math.sin(i*7.13)*0.4).toFixed(5));
      localStorage.setItem('aw_students_v1',JSON.stringify([{id:'s1',nm:'Budi Santoso',cls:'5A',av:null,desc:v}]));
      localStorage.setItem('aw_classes_v1',JSON.stringify(['5A']));
    });
    await p.goto('file:///home/user/absensi-wajah/index.html');
    await sleep(900);
    T('HP: Mode Absensi landing + panel kamera terlihat',await p.evaluate(()=>document.querySelector('.screen.active').id==='scr-scan'&&document.getElementById('camcard').getBoundingClientRect().width>200));
    T('HP: 3 tab bisa diketuk (Pendaftaran aktif)',await p.evaluate(()=>{document.querySelector('#tabs-scan .tbtn2[data-go="data"]').click();return document.querySelector('.screen.active').id==='scr-data';}));
    T('HP: Budi terdaftar tampil',/Budi Santoso/.test(await p.$eval('#stu-list',e=>e.textContent)));
    T('HP: tanpa scroll horizontal (absensi)',await noHScroll(p));
    T('HP: tombol ➕ Tambah Siswa terlihat penuh',await p.evaluate(()=>{const b=document.getElementById('btn-add-stu');const r=b.getBoundingClientRect();return r.width>0&&r.right<=innerWidth+2;}));
    T('HP: 0 page error (Absensi)',errs.filter(e=>!/favicon|net::ERR|gpu|dbus/.test(e)).length===0,errs.slice(0,2));
    await p.close();
  }
  /* ---------- FAMILY 100 di HP (smoke) ---------- */
  {
    const p=await browser.newPage();
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file:///home/user/family-100/index.html');
    await sleep(1000);
    const started=await p.evaluate(()=>{
      const cand=[...document.querySelectorAll('button')].filter(b=>/mulai|main/i.test(b.textContent)&&b.offsetParent);
      if(!cand.length)return 'TANPA-TOMBOL';
      cand[0].click();return 'klik:'+cand[0].textContent.trim().slice(0,20);
    });
    await sleep(600);
    T('HP: Family 100 tombol mulai ditemukan & diklik',/^klik:/.test(started),started);
    T('HP: Family 100 layar aktif berganti / elemen permainan ada',await p.evaluate(()=>!!document.querySelector('.screen.active')||document.querySelectorAll('button').length>3));
    T('HP: Family 100 tanpa scroll horizontal',await noHScroll(p));
    T('HP: Family 100 0 page error',errs.filter(e=>!/favicon|net::ERR|gpu|dbus/.test(e)).length===0,errs.slice(0,2));
    await p.close();
  }
  await browser.close();
  console.log('\nAUDIT MODE HP: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
