/* AUDIT ABSENSI WAJAH v3.0 (jsdom): UI ala video + TTS + Excel bulanan */
const {JSDOM}=require('jsdom');
const fs=require('fs');
const html=fs.readFileSync('/home/user/absensi-wajah/index.html','utf8');
let PASS=0,FAIL=0;
function T(n,k,c){if(k){PASS++;console.log('  ✓ '+n+(c!==undefined?'  ['+String(c).slice(0,100)+']':''));}else{FAIL++;console.log('  ✗ GAGAL: '+n+' ['+String(c).slice(0,100)+']');}}
function mk(){return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/'});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function vec(seed){const a=[];let x=seed;for(let i=0;i<128;i++){x=(x*9301+49297)%233280;a.push(x/233280-0.5);}return a;}
function near(v){return v.map(x=>x+(Math.random()*2-1)*0.005);}
(async()=>{
{
  const w=mk().window,d=w.document;await sleep(300);
  T('Langsung ke Mode Absensi (tanpa menu home)',d.querySelector('.screen.active').id==='scr-scan');
  T('Header "Absensi Wajah Cerdas" + sub',/Absensi Wajah Cerdas/.test(d.getElementById('apphead').textContent)&&/presensi otomatis/.test(d.getElementById('apphead').textContent));
  const tabs=[...d.querySelectorAll('#tabs-scan .tbtn2')].map(b=>b.textContent);
  T('Tab: Pendaftaran Siswa / Mode Absensi / Log Kehadiran',/Pendaftaran Siswa/.test(tabs[0])&&/Mode Absensi/.test(tabs[1])&&/Log Kehadiran/.test(tabs[2]));
  T('Split 2 panel: Kamera + Absensi Hari Ini',!!d.getElementById('camcard')&&/Absensi Hari Ini/.test(d.querySelector('#scr-scan .split .panel:last-child .phead').textContent));
  T('Kartu kamera: video+boxlayer+scanband',!!d.querySelector('#camcard #cam')&&!!d.querySelector('#camcard #boxlayer')&&!!d.getElementById('scanband'));
  T('Strip terdeteksi & hostbar TTS ada',d.getElementById('scan-strip')!==null&&d.getElementById('btn-tts')!==null);
  T('TTS default aktif',w.__AW.CFG.tts===true);
  w.close();
}
{
  const w=mk().window,d=w.document;await sleep(300);
  const A=w.__AW;
  A.addStudent('Budi Santoso','5A',vec(11));
  A.addStudent('Citra Lestari','5A');
  A.renderScanPanel();
  w.eval('CFG.cls="5A";CFG.mode="manual";');
  d.getElementById('btn-start').click();
  await sleep(200);
  T('Sesi jalan: 2 baris dgn token status & jam',d.querySelectorAll('#scan-list .row').length===2&&d.querySelectorAll('#scan-list .stok').length===2);
  A.onFaces([{x:.3,y:.2,w:.2,h:.3,d:near(vec(11))}]);
  const strip=d.getElementById('scan-strip');
  T('Strip: "Terdeteksi: BUDI SANTOSO (5A) — HADIR!"',/Terdeteksi: BUDI SANTOSO \(5A\) — HADIR!/.test(strip.textContent),strip.textContent);
  T('Welcome: "Selamat Datang, Budi Santoso!"',/Selamat Datang, Budi Santoso!/.test(d.getElementById('welcome').textContent));
  const row=d.querySelector('#scan-list .row');
  T('Baris: token H hijau + jam terisi',row.querySelector('.stok').className.includes('sH')&&row.querySelector('.stok').textContent==='H'&&/\d\d:\d\d/.test(row.querySelector('.tm').textContent));
  d.getElementById('btn-done').click();
  [...d.querySelectorAll('#modal-root .mrow button')].find(b=>/Finalisasi/.test(b.textContent)).click();
  await sleep(250);
  const c=[...d.querySelectorAll('#rc-sum .cnt b')].map(b=>b.textContent);
  T('Finalisasi: H=1, A=1, Log Kehadiran terbuka',c[0]==='1'&&c[3]==='1'&&d.querySelector('.screen.active').id==='scr-recap',c.join('|'));
  T('Legend 4 chip',d.querySelectorAll('#rc-legend .lg').length===4);
  d.querySelector('#tabs-recap .tbtn2[data-go="absen"]').click();
  await sleep(150);
  T('Kembali ke Mode Absensi: MULAI aktif lagi',d.getElementById('btn-start').disabled===false&&/MULAI SESI/.test(d.getElementById('btn-start').textContent));
  w.close();
}
{
  const w=mk().window,d=w.document;await sleep(300);
  const A=w.__AW;
  A.addStudent('Budi','5A',vec(11));
  A.addStudent('Ana','6B');
  A.renderScanPanel();
  w.eval('CFG.cls="5A";CFG.mode="manual";');
  d.getElementById('btn-start').click();
  A.onFaces([{x:.3,y:.2,w:.2,h:.3,d:near(vec(11))}]);
  const xml=A.buildXLS('2026-09');
  T('XML: Workbook + 2 worksheet (5A & 6B)',xml.includes('<Workbook')&&(xml.match(/<Worksheet/g)||[]).length===2&&xml.includes('ss:Name="5A"')&&xml.includes('ss:Name="6B"'));
  T('Judul "DAFTAR HADIR SISWA KELAS 5A"',xml.includes('DAFTAR HADIR SISWA KELAS 5A'));
  T('BULAN: SEPTEMBER 2026',xml.includes('BULAN: SEPTEMBER 2026'));
  T('Baris Budi dgn ✓ (hadir) di bulan berjalan',/Budi/.test(A.buildXLS(''))&&/\u2713/.test(A.buildXLS('')));
  T('JML H/S/I/A + BULAN EFEKTIF + pemisah minggu merah',xml.includes('JML H')&&xml.includes('BULAN EFEKTIF')&&xml.includes('#FF0000'));
  T('30 hari September',xml.includes('<Data ss:Type="Number">30</Data>')&&!xml.includes('<Data ss:Type="Number">31</Data>'));
  let thr=false;try{A.downloadXLS('2026-09');}catch(e){thr=true;}
  T('downloadXLS no-throw (fallback data-URI)',!thr);
  T('buildXLS tanpa argumen → bulan berjalan',/BULAN: (SEPTEMBER|OKTOBER) 2026/.test(A.buildXLS('')));
  w.close();
}
{
  const w=mk().window,d=w.document;await sleep(300);
  d.getElementById('btn-tts').click();
  T('Toggle TTS → mati',w.__AW.CFG.tts===false);
  d.getElementById('btn-tts').click();
  T('Toggle TTS → nyala',w.__AW.CFG.tts===true);
  w.__AW.syncTabOn('data');
  T('syncTabOn menandai tab aktif di semua layar',[...d.querySelectorAll('.tabs')].every(t=>t.querySelector('.tbtn2.on')&&t.querySelector('.tbtn2.on').dataset.go==='data'));
  w.close();
}
console.log('AUDIT ABSENSI v3: '+PASS+' LULUS, '+FAIL+' GAGAL');
process.exit(FAIL?1:0);
})().catch(e=>{console.error('FATAL:',e);process.exit(1);});
