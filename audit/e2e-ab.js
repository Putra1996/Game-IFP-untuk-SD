/* E2E KUIS A/B — Chrome headless, fake cam: gerbang, gameplay, dwell, jawaban turun */
const puppeteer=require('puppeteer');
const fs=require('fs');
let PASS=0,FAIL=0;
const T=(n,k,c)=>{if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,110)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+(c===undefined?'-':JSON.stringify(c)).slice(0,120)+']');}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tapZone=(page,k)=>page.evaluate(z=>{const r=document.getElementById('zone-'+z).getBoundingClientRect();document.getElementById('zone-'+z).dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));},k);
(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--window-size=960,620']});
  fs.mkdirSync('/tmp/shots-ab',{recursive:true});
  /* PART KAMERA: fake cam + AI CDN */
  {
    const cam=await browser.newPage();
    await cam.setViewport({width:960,height:620});
    const camErrs=[];cam.on('pageerror',e=>camErrs.push(e.message));
    await cam.goto('file:///home/user/benar-salah/index.html');
    await sleep(800);
    await cam.evaluate(()=>{document.getElementById('gate-pass').value='1234';document.getElementById('btn-login').click();});
    await cam.select('#sel-mapel','Informatika');
    await cam.evaluate(()=>document.getElementById('btn-muat').click());
    await sleep(200);
    await cam.evaluate(()=>document.getElementById('btn-start').click());
    await cam.waitForSelector('#scr-game.active',{timeout:4000});
    let camOk=false,tag='';
    for(let i=0;i<24;i++){tag=await cam.$eval('#camtag',e=>e.textContent);if(/Kamera aktif/.test(tag)){camOk=true;break;}await sleep(500);}
    T('Kamera fake aktif + AI CDN termuat',camOk,tag);
    T('body.cam (kelas di belakang AR)',await cam.evaluate(()=>document.body.classList.contains('cam')));
    T('Kursor tangan & cincin ter-render (canvas aktif)',await cam.evaluate(()=>{const cv=document.getElementById('camov');return cv.width===innerWidth&&cv.height===innerHeight;}));
    T('0 page error (halaman kamera)',camErrs.filter(e=>!/favicon|net::ERR|gpu|dbus/.test(e)).length===0,camErrs.slice(0,2));
    await cam.close();
  }
  /* PART GAMEPLAY (sentuh, deterministik) */
  const page=await browser.newPage();
  await page.setViewport({width:960,height:620});
  const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
  await page.goto('file:///home/user/benar-salah/index.html');
  await sleep(900);
  await page.screenshot({path:'/tmp/shots-ab/01-gate.png'});
  await page.evaluate(()=>{document.getElementById('gate-pass').value='salah';document.getElementById('btn-login').click();});
  await sleep(300);
  T('Password salah ditolak',await page.evaluate(()=>document.querySelector('.screen.active').id==='scr-gate'));
  await page.evaluate(()=>{document.getElementById('gate-pass').value='1234';document.getElementById('btn-login').click();});
  await page.waitForSelector('#scr-setup.active',{timeout:4000});
  await page.screenshot({path:'/tmp/shots-ab/02-setup.png'});
  await page.select('#sel-jenjang','SMP');
  await page.evaluate(()=>document.getElementById('sel-jenjang').dispatchEvent(new Event('change')));
  T('SMP → Kelas 7 otomatis',await page.evaluate(()=>document.getElementById('sel-kelas').value==='7'));
  await page.select('#sel-mapel','IPA');
  await page.evaluate(()=>document.getElementById('btn-muat').click());
  await sleep(300);
  T('25 soal dimuat',/25 soal IPA/.test(await page.$eval('#load-note',e=>e.textContent)));
  await page.evaluate(()=>{CFG.cam=false;});
  await page.evaluate(()=>document.getElementById('btn-start').click());
  await page.waitForSelector('#scr-game.active',{timeout:4000});
  await page.waitForFunction("S.phase==='ask'",{timeout:15000});
  const trOk=await page.waitForFunction("document.getElementById('zwrap-a').style.transition.includes('2400ms')&&document.getElementById('zwrap-a').style.transform==='translateY(0px)'",{timeout:3000}).then(()=>true).catch(()=>false);
  T('Jawaban turun: transisi 2400ms → translateY(0)',trOk);
  const fpsUi=await page.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();(function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else res(Math.round(n/2));})();}));
  T('FPS UI ≥ 50',fpsUi>=50,fpsUi+' FPS');
  const k1=await page.evaluate(()=>window.__AB.QUIZ_REF()[0].key);
  await tapZone(page,k1.toLowerCase());
  const okw=await page.evaluate(k=>{const wl=document.getElementById('washL').className,wr=document.getElementById('washR').className;return k==='A'?(wl==='wash on'&&wr==='wash'):(wr==='wash on'&&wl==='wash');},k1);
  T('Ketuk kunci → wash hijau',okw);
  await page.screenshot({path:'/tmp/shots-ab/03-hijau.png'});
  await page.waitForFunction("S.phase==='ask'",{timeout:10000});
  const k2=await page.evaluate(()=>window.__AB.QUIZ_REF()[1].key);
  await tapZone(page,k2==='A'?'b':'a');
  const badw=await page.evaluate(k=>{const wl=document.getElementById('washL').className,wr=document.getElementById('washR').className;return k==='A'?(wl==='wash on'&&wr==='wash on r'):(wr==='wash on'&&wl==='wash on r');},k2);
  T('Ketuk salah → hijau+merah',badw);
  await page.screenshot({path:'/tmp/shots-ab/04-merah.png'});
  await page.waitForFunction("S.phase==='ask'",{timeout:10000});
  /* dwell disintesis (pegang _dwStart tiap frame — tahan 0,9 dtk) */
  await page.evaluate(()=>{CFG.time=90;S.timeLeft=90;CAM.on=true;});
  const dwell=await page.evaluate(()=>new Promise(res=>{
    const K=window.__AB.QUIZ_REF()[2].key;
    const r=window.__AB.zoneRect(K);
    const v=document.getElementById('cam');
    const vw=(v&&v.videoWidth)||1280,vh=(v&&v.videoHeight)||720;
    const sc=Math.max(innerWidth/vw,innerHeight/vh);
    const ox=(innerWidth-vw*sc)/2,oy=(innerHeight-vh*sc)/2;
    const nP={x:1-(((r.left+r.right)/2-ox)/(vw*sc)),y:(((r.top+r.bottom)/2-oy)/(vh*sc))};
    const hd=Array.from({length:21},()=>({x:nP.x,y:nP.y}));
    let ringSeen=false;
    const mo=new MutationObserver(list=>{for(const m of list)if([...m.addedNodes].some(x=>x&&x.classList&&x.classList.contains('hitring')))ringSeen=true;});
    mo.observe(document.body,{childList:true});
    const ok0=window.__AB.getStats().ok;
    let n=0;
    (function step(){
      window.__AB.onHands({multiHandLandmarks:[hd]});n++;
      const h=window.__AB.handsLive[0];
      if(h&&n>=2)h._dwStart=performance.now()-900;
      if(window.__AB.getStats().ok>ok0||n>60){mo.disconnect();res({ring:!!document.querySelector('.hitring')||ringSeen,ok:window.__AB.getStats().ok});}
      else requestAnimationFrame(step);
    })();
  }));
  T('Dwell tangan 0,8 dtk → ring + terjawab',dwell.ring&&dwell.ok>=1,dwell);
  await page.screenshot({path:'/tmp/shots-ab/05-dwell.png'});
  await page.waitForFunction("S.phase==='ask'",{timeout:10000});
  await page.evaluate(()=>{CFG.time=1;S.timeLeft=1;});
  await page.waitForFunction("S.phase!=='ask'",{timeout:8000});
  T('Waktu habis → jawaban otomatis (pill)',await page.evaluate(()=>document.getElementById('ans-pill').classList.contains('show')));
  await page.screenshot({path:'/tmp/shots-ab/06-timeout.png'});
  await page.evaluate(()=>{CFG.time=2;});
  const fin=await page.evaluate(()=>new Promise(res=>{
    const iv=setInterval(()=>{
      if(document.querySelector('.screen.active').id==='res'){clearInterval(iv);res('done');return;}
      if(S.phase==='ask')answer('A');
    },2400);
    setTimeout(()=>{clearInterval(iv);res('timeout');},140000);
  }));
  T('25 soal → layar hasil',fin==='done',fin);
  await page.screenshot({path:'/tmp/shots-ab/07-hasil.png'});
  await page.evaluate(()=>document.getElementById('btn-again').click());
  await page.waitForSelector('#scr-game.active',{timeout:6000});
  T('Main Lagi jalan',true);
  T('0 page error (gameplay)',errs.filter(e=>!/favicon|net::ERR|gpu|dbus|MediaPipe|WASM/.test(e)).length===0,errs.slice(0,2));
  await browser.close();
  console.log('\nE2E KUIS A/B: '+PASS+' LULUS, '+FAIL+' GAGAL');
  process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
