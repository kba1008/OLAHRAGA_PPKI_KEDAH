/* Dashboard slides: read-only BMI and medal outlook from existing Sheet data. */
function slMedalIcon(code){
  if(code!=='EMAS'&&code!=='PODIUM')return '—';
  return `<svg viewBox="0 0 80 100" role="img" aria-label="${code==='EMAS'?'Pingat emas':'Pingat podium'}"><path d="M18 4h18l14 36-17 8zM62 4H44L30 40l17 8z" class="sl-ribbon"/><circle cx="40" cy="64" r="29" class="sl-medal-disc"/><circle cx="40" cy="64" r="22" class="sl-medal-ring"/>${code==='EMAS'?'<text x="40" y="76" text-anchor="middle" class="sl-medal-number">1</text>':'<path d="m40 47 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" class="sl-medal-star"/>'}</svg>`;
}
function slDateKey(r){
  const raw=String(r.TARIKH||'').trim(),m=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  const v=Date.parse(m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:raw);
  return Number.isFinite(v)?v:0;
}
function slLatestBmi(id){
  const rows=(DB.bmi||[]).filter(b=>String(b['ATLET ID'])===String(id));
  return rows.sort((a,b)=>slDateKey(b)-slDateKey(a)||String(b['TARIKH & MASA']||'').localeCompare(String(a['TARIKH & MASA']||'')))[0]||null;
}
function slCategory(a,ac){
  const entry=penyertaan(ac).find(p=>String(p['ATLET ID'])===String(a.ID));
  return String(entry?.KATEGORI||a.KATEGORI||'Tiada kategori');
}
function slOutlook(a,ac,best,category){
  const info=acaraInfo(ac),rkE=kejohananPeringkat(ac,category,'MSSM'),rkP=kejohananPeringkat(ac,category,'NO.3 MSSM');
  const valid=r=>r&&Number.isFinite(slNum(r.NILAI))&&slNum(r.NILAI)>0?slNum(r.NILAI):null;
  const gold=valid(rkE),podium=valid(rkP),out={gold,podium,rkE,rkP,icon:'',label:'Belum mencapai sasaran',detail:'Terus tingkatkan rekod latihan.',code:'USAHA'};
  if(kategoriDigugur(ac,category))return {...out,label:'Kategori digugurkan',detail:'Tiada anggaran pingat untuk kategori ini.',code:'GUGUR'};
  if(!(best>0)&&best!==0)return {...out,label:'Tiada rekod latihan',detail:'Anggaran pingat belum dapat dinilai.',code:'TIADA_REKOD'};
  if(gold===null&&podium===null)return {...out,label:'Tiada rekod event lepas',detail:'Anggaran pingat belum dapat dinilai.',code:'TIADA_SASARAN'};
  if(gold!==null&&jurangPingat(best,gold,info.JENIS)<=0)return {...out,icon:'🥇',label:'Harapan emas',detail:`${jurangPingat(best,gold,info.JENIS)===0?'Menyamai':'Melepasi'} rekod MSSM · ${fmtJurang(jurangPingat(best,gold,info.JENIS),info)}`,code:'EMAS'};
  if(podium!==null&&jurangPingat(best,podium,info.JENIS)<=0)return {...out,icon:'🏅',label:'Harapan podium',detail:`${jurangPingat(best,podium,info.JENIS)===0?'Menyamai':'Melepasi'} rekod NO.3 MSSM · ${fmtJurang(jurangPingat(best,podium,info.JENIS),info)}`,code:'PODIUM'};
  const target=podium??gold,gap=jurangPingat(best,target,info.JENIS);
  return {...out,label:gap/target<=.10?'Hampir sasaran pingat':'Perlu tingkatkan prestasi',detail:`Perlu baiki ${fmtJurang(gap,info)} lagi ke ${podium!==null?'NO.3 MSSM':'MSSM'}.`};
}
function slScaleEnhanced(){
  const stage=document.getElementById('slStage'),card=stage?.querySelector('.sl-card');
  if(!stage||!card)return;
  card.style.transform=matchMedia('(max-width:700px)').matches?'none':`scale(${Math.min(stage.clientWidth/1920,stage.clientHeight/1080)})`;
}
function slRenderEnhanced(){
  const st=document.getElementById('slStage'),n=SL.list.length;if(!st)return;
  if(!n){st.innerHTML='<div class="sl-kosong">Tiada rekod prestasi untuk pilihan ini.</div>';document.getElementById('slKira').textContent='0 / 0';return;}
  SL.i=(SL.i+n)%n;const {a,ac}=SL.list[SL.i],info=acaraInfo(ac),masa=info.JENIS==='MASA',category=slCategory(a,ac);
  const rek=SL.list[SL.i].rek.filter(r=>!/^\s*\[EVENT:/i.test(String(r.CATATAN||''))&&Number.isFinite(slNum(r.NILAI))&&slNum(r.NILAI)>0).slice().sort((x,y)=>slDateKey(x)-slDateKey(y)||String(x.MASA||x['TARIKH & MASA']||'').localeCompare(String(y.MASA||y['TARIKH & MASA']||'')));
  const v=rek.map(r=>slNum(r.NILAI)),pb=v.length?(masa?Math.min(...v):Math.max(...v)):null,awal=v[0],akhir=v.at(-1);
  const change=v.length>1?(masa?awal-akhir:akhir-awal)/awal*100:null,medal=slOutlook(a,ac,pb,category),b=slLatestBmi(a.ID);
  const bmi=b?(slNum(b.BMI)>0?slNum(b.BMI):kiraBMI(b['BERAT (KG)'],b['TINGGI (CM)'])):0;
  const catKey=x=>String(x||'').trim().toUpperCase(),rakan={};
  rekodAcara(ac).forEach(r=>{if(/^\s*\[EVENT:/i.test(String(r.CATATAN||'')))return;idsRekod(r).forEach(id=>{const peer=slAtlet(id);if(!peer.ID||catKey(slCategory(peer,ac))!==catKey(category))return;const val=slNum(r.NILAI);if(!Number.isFinite(val)||!(val>0))return;if(rakan[id]==null||(masa?val<rakan[id]:val>rakan[id]))rakan[id]=val;});});
  const sorted=Object.entries(rakan).sort((x,y)=>masa?x[1]-y[1]:y[1]-x[1]),rank=pb!==null?1+sorted.filter(x=>masa?x[1]<pb:x[1]>pb).length:null;
  const targets=[{r:medal.rkE,label:'MSSM · sasaran emas'},{r:medal.rkP,label:'NO.3 MSSM · podium'}].filter(x=>x.r&&slNum(x.r.NILAI)>0).map(x=>({v:slNum(x.r.NILAI),lbl:x.label,kej:1}));
  const bars=(pb!==null?[{v:pb,lbl:'Terbaik latihan',saya:1}]:[]).concat(targets);
  const fmt=x=>x===null||x===undefined?'—':esc(slFmt(x,ac)),foto=String(a['GAMBAR (URL)']||'').trim();
  st.innerHTML=`<article class="sl-card"><aside class="sl-kiri"><div class="sl-brand">ATLETTRANING <span>${String(SL.i+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}</span></div><div class="sl-photo"><div class="sl-init" aria-hidden="true">${esc(String(a['NAMA PENUH']||'?').charAt(0))}</div>${foto?`<img class="sl-foto" src="${esc(avatar(a))}" alt="${esc(a['NAMA PENUH'])}" referrerpolicy="no-referrer" onerror="this.remove()">`:''}</div><div class="sl-nama">${esc(a['NAMA PENUH'])}</div><div class="sl-sub">${esc(category)} · ${esc(a.JANTINA||'')}<br>${esc(a.SEKOLAH||'')}</div><section class="sl-bmi"><div class="sl-profile-label">BMI terkini · kg/m²</div><div class="sl-bmi-top"><b>${bmi>0?bmi.toFixed(1):'—'}</b><span>${b?esc(fmtTarikh(b.TARIKH)):'Belum direkod'}</span></div><p>${b?`${esc(b['BERAT (KG)']||'—')} kg &nbsp; / &nbsp; ${esc(b['TINGGI (CM)']||'—')} cm`:'Tiada data berat dan tinggi.'}</p><p class="sl-bmi-note">Ukuran fizikal sahaja; BMI tidak menentukan peluang pingat.</p></section></aside><section class="sl-kanan"><header class="sl-title"><div><div class="sl-kick">LAPORAN PRESTASI ATLET</div><h2 class="sl-acara">${esc(ac)}</h2></div><div class="sl-direction">${masa?'Masa lebih rendah = lebih baik':'Nilai lebih tinggi = lebih baik'}</div></header><div class="sl-stat"><div><b>${fmt(pb)}</b><span>Terbaik latihan</span></div><div><b>${fmt(akhir)}</b><span>Latihan terkini</span></div><div><b class="${change!==null&&change<0?'sl-down':''}">${change===null?'—':`${change>0?'+':''}${change.toFixed(1)}%`}</b><span>Awal → terkini</span></div><div><b>${rank?'#'+rank+' / '+sorted.length:'—'}</b><span>Ranking latihan kategori</span></div></div><section class="sl-medal" data-outlook="${medal.code}"><div class="sl-medal-icon" aria-label="${medal.icon?esc(medal.label):'Tiada anggaran pingat'}">${slMedalIcon(medal.code)}</div><div><div class="sl-kick">ANGGARAN PELUANG PINGAT</div><h3>${esc(medal.label)}</h3><p>${esc(medal.detail)}</p><small>${medal.code==='PODIUM'?'Perak / gangsa belum dapat dibezakan. ':''}Anggaran berdasarkan rekod; bukan jaminan keputusan.</small></div><div class="sl-targets"><div><span>MSSM · emas</span><b>${fmt(medal.gold)}</b></div><div><span>NO.3 MSSM · podium</span><b>${fmt(medal.podium)}</b></div><small>${targets.length?targets.map(t=>esc(t.lbl.includes('NO.3')?`${medal.rkP.TAHUN||'Tahun tidak direkod'}`:`${medal.rkE.TAHUN||'Tahun tidak direkod'}`)).join(' / '):'Rekod kategori yang sama sahaja.'}</small></div></section><div class="sl-graf"><div class="sl-box"><h4>Trend latihan · ${rek.length} rekod</h4>${rek.length?slGarisan(rek,ac,targets):'<p class="sl-sub">Belum ada rekod latihan yang sah.</p>'}</div><div class="sl-box"><h4>Latihan vs event lepas</h4>${bars.length?slBar(bars,ac):'<p class="sl-sub">Tiada data perbandingan.</p>'}</div></div><footer class="sl-foot"><span>SUMBER · GOOGLE SHEET &nbsp; / &nbsp; ${esc(category)}</span><span>${rek.length?esc(fmtTarikh(rek[0].TARIKH))+' — '+esc(fmtTarikh(rek.at(-1).TARIKH)):'Tiada rekod latihan'}</span></footer></section></article>`;
  document.getElementById('slKira').textContent=(SL.i+1)+' / '+n;
  slScaleEnhanced();SL.mula=performance.now();
}
window.addEventListener('resize',slScaleEnhanced);
