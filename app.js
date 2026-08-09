
async function resizeImageFile(file,maxSize=800,quality=0.82){
 return new Promise((resolve,reject)=>{
  const img=new Image();
  const fr=new FileReader();
  fr.onload=e=>{img.onload=()=>{
    let w=img.width,h=img.height;
    const scale=Math.min(1,maxSize/Math.max(w,h));
    w=Math.round(w*scale);h=Math.round(h*scale);
    const c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    resolve(c.toDataURL('image/jpeg',quality));
  }; img.src=e.target.result;};
  fr.onerror=reject; fr.readAsDataURL(file);
 });
}

const KEY='mycarplus_v6',THEME_KEY='mycarplus_theme';
const $=id=>document.getElementById(id);
let state={vehicles:[]},editingId=null,selectedType='Αυτοκίνητο',photoData='',formDocs=[],deferredPrompt=null;
const ids=['brand','model','year','plate','currentKm','notes','insuranceDate','kteoDate','lastServiceKm','serviceEveryKm','owner1Name','owner1Phone','owner2Name','owner2Phone','fuelCost','serviceCost','engineCc','horsepower','fuelType','transmission','drivetrain','officialConsumption','bodyType','seats'];
const emoji=t=>({Αυτοκίνητο:'🚗',Μηχανή:'🏍️',Scooter:'🛵',Van:'🚐',Φορτηγό:'🚚',Άλλο:'➕'}[t]||'🚘');
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const money=v=>Number(v||0).toFixed(2);
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function load(){
  try{const v6=JSON.parse(localStorage.getItem(KEY));if(v6?.vehicles){state=v6;return}}catch{}
  for(const k of ['mycarplus_web_v5_4','mycarplus_web_v5_3','mycarplus_web_v3','mycarplus_web_v2','mycarplus_web_v1']){
    try{const old=JSON.parse(localStorage.getItem(k));if(old?.vehicles){state={vehicles:old.vehicles};save();return}}catch{}
  }
}
function daysUntil(date){if(!date)return null;const a=new Date();a.setHours(0,0,0,0);const b=new Date(date+'T00:00:00');return Math.ceil((b-a)/86400000)}
function dateStatus(label,date){const d=daysUntil(date);if(d===null)return{text:`${label}: δεν ορίστηκε`,cls:'good'};if(d<0)return{text:`${label}: έληξε`,cls:'bad',expired:true};if(d<=7)return{text:`${label}: σε ${d} ημέρες`,cls:'warn',soon:true};return{text:`${label}: ${formatDate(date)}`,cls:'good'}}
function serviceStatus(v){const c=+v.currentKm||0,l=+v.lastServiceKm||0,e=+v.serviceEveryKm||0;if(!c||!l||!e)return{text:'Service: δεν ορίστηκε',cls:'good'};const left=l+e-c;if(left<=0)return{text:'Service: τώρα',cls:'bad',expired:true};if(left<=500)return{text:`Service: σε ${left} km`,cls:'warn',soon:true};return{text:`Service: σε ${left} km`,cls:'good'}}
function formatDate(d){return d?new Date(d+'T00:00:00').toLocaleDateString('el-GR'):'—'}
function displayName(v){return [v.brand,v.model].filter(Boolean).join(' ')||v.type||'Όχημα'}
function formValue(id){return $(id).value.trim()}
function vehicleFromForm(id){return{id,type:selectedType,photo:photoData,documents:formDocs,brand:formValue('brand'),model:formValue('model'),year:formValue('year'),plate:formValue('plate').toUpperCase(),currentKm:formValue('currentKm'),notes:formValue('notes'),insuranceDate:$('insuranceDate').value,kteoDate:$('kteoDate').value,lastServiceKm:formValue('lastServiceKm'),serviceEveryKm:formValue('serviceEveryKm'),owners:[{name:formValue('owner1Name'),phone:formValue('owner1Phone')},{name:formValue('owner2Name'),phone:formValue('owner2Phone')}].filter(x=>x.name||x.phone),fuelCost:formValue('fuelCost'),serviceCost:formValue('serviceCost'),engineCc:formValue('engineCc'),horsepower:formValue('horsepower'),fuelType:formValue('fuelType'),transmission:formValue('transmission'),drivetrain:formValue('drivetrain'),officialConsumption:formValue('officialConsumption'),bodyType:formValue('bodyType'),seats:formValue('seats'),fuelHistory:editingId?(state.vehicles.find(x=>x.id===editingId)?.fuelHistory||[]):[],serviceHistory:editingId?(state.vehicles.find(x=>x.id===editingId)?.serviceHistory||[]):[]}}
function clearForm(){editingId=null;selectedType='Αυτοκίνητο';photoData='';formDocs=[];ids.forEach(id=>$(id).value='');$('vehiclePhoto').value='';$('documentFile').value='';$('photoPreview').innerHTML='📷';$('formTitle').textContent='Νέο όχημα';$('saveVehicleBtn').textContent='Αποθήκευση οχήματος';$('cancelEditBtn').classList.add('hidden');document.querySelectorAll('.type-option').forEach(b=>b.classList.toggle('active',b.dataset.type==='Αυτοκίνητο'));renderFormDocs()}
function openForm(){clearForm();$('vehicleForm').classList.remove('hidden');$('vehicleForm').scrollIntoView({behavior:'smooth'})}
function closeForm(){$('vehicleForm').classList.add('hidden');clearForm()}
function saveVehicle(){const v=vehicleFromForm(editingId||Date.now().toString());if(editingId){const i=state.vehicles.findIndex(x=>x.id===editingId);if(i>=0)state.vehicles[i]=v}else state.vehicles.unshift(v);try{save()}catch{alert('Δεν χωράει άλλη μεγάλη φωτογραφία ή αρχείο. Δοκίμασε μικρότερο αρχείο.');return}render();closeForm();toast('Το όχημα αποθηκεύτηκε')}
function editVehicle(id){const v=state.vehicles.find(x=>x.id===id);if(!v)return;editingId=id;selectedType=v.type||'Αυτοκίνητο';photoData=v.photo||'';formDocs=[...(v.documents||[])];ids.forEach(k=>$(k).value=v[k]||'');$('insuranceDate').value=v.insuranceDate||'';$('kteoDate').value=v.kteoDate||'';const owners=v.owners||[];$('owner1Name').value=owners[0]?.name||'';$('owner1Phone').value=owners[0]?.phone||'';$('owner2Name').value=owners[1]?.name||'';$('owner2Phone').value=owners[1]?.phone||'';$('photoPreview').innerHTML=photoData?`<img src="${photoData}">`:'📷';document.querySelectorAll('.type-option').forEach(b=>b.classList.toggle('active',b.dataset.type===selectedType));$('formTitle').textContent='Επεξεργασία οχήματος';$('saveVehicleBtn').textContent='Αποθήκευση αλλαγών';$('cancelEditBtn').classList.remove('hidden');renderFormDocs();$('vehicleForm').classList.remove('hidden');$('vehicleForm').scrollIntoView({behavior:'smooth'})}
function deleteVehicle(id){const v=state.vehicles.find(x=>x.id===id);if(!confirm(`Να διαγραφεί το ${displayName(v)};`))return;state.vehicles=state.vehicles.filter(x=>x.id!==id);save();render();closeModal()}
function renderFormDocs(){$('formDocuments').innerHTML=formDocs.length?formDocs.map(d=>`<div class="doc-row"><div><b>${esc(d.type)}</b><br><small>${esc(d.name)}</small></div><button onclick="removeFormDoc('${d.id}')">Διαγραφή</button></div>`).join(''):'<div class="empty">Δεν υπάρχουν έγγραφα.</div>'}
function removeFormDoc(id){formDocs=formDocs.filter(x=>x.id!==id);renderFormDocs()}
function addDocument(){const file=$('documentFile').files[0];if(!file)return alert('Διάλεξε αρχείο.');if(file.size>900000)return alert('Το αρχείο είναι μεγάλο. Προτίμησε μικρότερο.');const r=new FileReader();r.onload=()=>{formDocs.push({id:Date.now().toString(),type:$('documentType').value,name:file.name,data:r.result});$('documentFile').value='';renderFormDocs()};r.readAsDataURL(file)}
function render(){renderSummary();renderAlerts();const q=$('searchInput').value.toLowerCase().trim(),type=$('typeFilter').value;const list=state.vehicles.filter(v=>(type==='all'||v.type===type)&&`${v.type} ${v.brand} ${v.model} ${v.plate}`.toLowerCase().includes(q));$('vehicleCount').textContent=list.length;$('vehiclesList').innerHTML=list.length?list.map(vehicleCard).join(''):'<div class="empty">Δεν υπάρχουν οχήματα.</div>'}
function renderSummary(){let soon=0,exp=0,cost=0;state.vehicles.forEach(v=>{const a=dateStatus('Ασφάλεια',v.insuranceDate),k=dateStatus('ΚΤΕΟ',v.kteoDate),s=serviceStatus(v);if(a.soon||k.soon||s.soon)soon++;if(a.expired||k.expired||s.expired)exp++;cost+=(+v.fuelCost||0)+(+v.serviceCost||0)+(v.fuelHistory||[]).reduce((t,x)=>t+(+x.cost||0),0)+(v.serviceHistory||[]).reduce((t,x)=>t+(+x.cost||0),0)});$('sumVehicles').textContent=state.vehicles.length;$('sumSoon').textContent=soon;$('sumExpired').textContent=exp;$('sumCosts').textContent='€'+money(cost)}
function renderAlerts(){const items=[];state.vehicles.forEach(v=>{const n=displayName(v),a=dateStatus('Ασφάλεια',v.insuranceDate),k=dateStatus('ΚΤΕΟ',v.kteoDate),s=serviceStatus(v);if(a.expired)items.push({cls:'bad',text:`⛔ Η ασφάλεια του ${n} έχει λήξει.`});else if(a.soon)items.push({cls:'warn',text:`⚠️ Η ασφάλεια του ${n} λήγει σύντομα.`});if(k.expired)items.push({cls:'bad',text:`⛔ Το ΚΤΕΟ του ${n} έχει λήξει.`});else if(k.soon)items.push({cls:'warn',text:`⚠️ Το ΚΤΕΟ του ${n} λήγει σύντομα.`});if(s.expired)items.push({cls:'bad',text:`🔧 Το ${n} χρειάζεται service.`});else if(s.soon)items.push({cls:'warn',text:`🔧 Το ${n} πλησιάζει στο service.`})});$('alertsList').innerHTML=items.length?items.map(x=>`<div class="alert ${x.cls}">${esc(x.text)}</div>`).join(''):'<div class="alert good">✅ Δεν υπάρχουν επείγουσες υπενθυμίσεις.</div>'}
function vehicleCard(v){const a=dateStatus('Ασφάλεια',v.insuranceDate),k=dateStatus('ΚΤΕΟ',v.kteoDate),s=serviceStatus(v);return`<article class="vehicle-card vehicle-card-clickable" onclick="viewVehicle('${v.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();viewVehicle('${v.id}')}"><div class="vehicle-photo vehicle-photo-open" title="Άνοιγμα ${esc(displayName(v))}">${v.photo?`<img src="${v.photo}" alt="${esc(displayName(v))}">`:emoji(v.type)}</div><div class="vehicle-card-body"><div class="vehicle-title-row"><h3>${esc(displayName(v))}</h3><span class="open-arrow">›</span></div><div class="vehicle-meta">${emoji(v.type)} ${esc(v.type)}${v.plate?' • '+esc(v.plate):''}</div><div class="chips"><span class="chip ${a.cls}">${a.text}</span><span class="chip ${k.cls}">${k.text}</span><span class="chip ${s.cls}">${s.text}</span></div><div class="vehicle-actions"><button class="edit" onclick="event.stopPropagation();editVehicle('${v.id}')">Επεξεργασία</button><button class="pdf" onclick="event.stopPropagation();exportVehiclePdf('${v.id}')">PDF</button><button class="delete" onclick="event.stopPropagation();deleteVehicle('${v.id}')">Διαγραφή</button></div></div></article>`}
function detailsHtml(v){const owners=(v.owners||[]).map((o,i)=>`<div class="detail"><small>Ιδιοκτήτης ${i+1}</small><b>${esc(o.name||'—')}</b><div>${esc(o.phone||'')}</div></div>`).join('');const docs=(v.documents||[]).map(d=>`<div class="doc-row"><div><b>${esc(d.type)}</b><br><small>${esc(d.name)}</small></div><a href="${d.data}" target="_blank">Άνοιγμα</a></div>`).join('')||'<div class="empty">Δεν υπάρχουν έγγραφα.</div>';return`<div class="modal-head"><div class="modal-photo">${v.photo?`<img src="${v.photo}">`:emoji(v.type)}</div><div><span class="eyebrow">${esc(v.type)}</span><h2>${esc(displayName(v))}</h2><p>${esc(v.year||'')}${v.plate?' • '+esc(v.plate):''}</p></div></div><div class="detail-grid"><div class="detail"><small>Ασφάλεια</small><b>${formatDate(v.insuranceDate)}</b></div><div class="detail"><small>ΚΤΕΟ</small><b>${formatDate(v.kteoDate)}</b></div><div class="detail"><small>Χιλιόμετρα</small><b>${esc(v.currentKm||'—')}</b></div><div class="detail"><small>Επόμενο service</small><b>${esc(serviceStatus(v).text)}</b></div>${owners}</div>
${[v.engineCc,v.horsepower,v.fuelType,v.transmission,v.drivetrain,v.officialConsumption,v.bodyType,v.seats].some(Boolean)?`
<h3>Χαρακτηριστικά</h3>
<div class="detail-grid">
  ${v.engineCc?`<div class="detail"><small>Κυβισμός</small><b>${esc(v.engineCc)} cc</b></div>`:''}
  ${v.horsepower?`<div class="detail"><small>Ιπποδύναμη</small><b>${esc(v.horsepower)} hp</b></div>`:''}
  ${v.fuelType?`<div class="detail"><small>Καύσιμο</small><b>${esc(v.fuelType)}</b></div>`:''}
  ${v.transmission?`<div class="detail"><small>Κιβώτιο</small><b>${esc(v.transmission)}</b></div>`:''}
  ${v.drivetrain?`<div class="detail"><small>Κίνηση</small><b>${esc(v.drivetrain)}</b></div>`:''}
  ${v.officialConsumption?`<div class="detail"><small>Κατανάλωση</small><b>${esc(v.officialConsumption)} L/100km</b></div>`:''}
  ${v.bodyType?`<div class="detail"><small>Αμάξωμα</small><b>${esc(v.bodyType)}</b></div>`:''}
  ${v.seats?`<div class="detail"><small>Θέσεις</small><b>${esc(v.seats)}</b></div>`:''}
</div>`:''}${v.notes?`<h3>Σημειώσεις</h3><p>${esc(v.notes)}</p>`:''}<h3>Έγγραφα</h3>${docs}<div class="modal-actions"><button class="primary" onclick="exportVehiclePdf('${v.id}')">Δημιουργία / Κοινοποίηση PDF</button><button class="secondary" onclick="editVehicle('${v.id}');closeModal()">Επεξεργασία</button></div>`}
function viewVehicle(id){const v=state.vehicles.find(x=>x.id===id);if(!v)return;$('vehicleModalContent').innerHTML=detailsHtml(v);$('vehicleModal').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeModal(){$('vehicleModal').classList.add('hidden');document.body.style.overflow=''}
function exportVehiclePdf(id){const v=state.vehicles.find(x=>x.id===id);if(!v)return;const fields=[['Τύπος',v.type],['Μάρκα / όνομα',v.brand],['Μοντέλο',v.model],['Έτος',v.year],['Πινακίδα',v.plate],['Τωρινά χιλιόμετρα',v.currentKm],['Λήξη ασφάλειας',formatDate(v.insuranceDate)],['Λήξη ΚΤΕΟ',formatDate(v.kteoDate)],['Service',serviceStatus(v).text],['Κυβισμός',v.engineCc?`${v.engineCc} cc`:'' ],['Ιπποδύναμη',v.horsepower?`${v.horsepower} hp`:'' ],['Καύσιμο',v.fuelType],['Κιβώτιο',v.transmission],['Κίνηση',v.drivetrain],['Κατανάλωση εργοστασίου',v.officialConsumption?`${v.officialConsumption} L/100km`:'' ],['Αμάξωμα',v.bodyType],['Θέσεις',v.seats],['Καύσιμα','€'+money(v.fuelCost)],['Service / άλλα','€'+money(v.serviceCost)]].filter(x=>x[1]&&x[1]!=='—');const owners=(v.owners||[]).map((o,i)=>`<div class="pdf-field"><small>Ιδιοκτήτης ${i+1}</small><b>${esc(o.name||'—')}</b><div>${esc(o.phone||'')}</div></div>`).join('');$('pdfPrintArea').innerHTML=`<h1>MyCar+ — ${esc(displayName(v))}</h1>${v.photo?`<img class="pdf-photo" src="${v.photo}">`:''}<div class="pdf-section pdf-grid">${fields.map(x=>`<div class="pdf-field"><small>${esc(x[0])}</small><b>${esc(x[1])}</b></div>`).join('')}${owners}</div>${v.notes?`<div class="pdf-section"><h3>Σημειώσεις</h3><p>${esc(v.notes)}</p></div>`:''}<div class="pdf-section"><small>Δημιουργήθηκε από το MyCar+ στις ${new Date().toLocaleDateString('el-GR')}</small></div>`;toast('Στο παράθυρο εκτύπωσης επίλεξε «Αποθήκευση ως PDF» ή Κοινοποίηση.');setTimeout(()=>window.print(),300)}
function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');clearTimeout(window._tt);window._tt=setTimeout(()=>$('toast').classList.add('hidden'),3500)}
function applyTheme(t){document.documentElement.classList.toggle('dark',t==='dark');$('themeBtn').textContent=t==='dark'?'☀️':'🌙';localStorage.setItem(THEME_KEY,t)}
function exportBackup(){const b=new Blob([JSON.stringify({version:'6',data:state},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`mycarplus-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(u)}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result),d=p.data||p;if(!Array.isArray(d.vehicles))throw 0;if(confirm('Να αντικατασταθούν τα υπάρχοντα δεδομένα;')){state={vehicles:d.vehicles};save();render();toast('Το backup επαναφέρθηκε')}}catch{alert('Μη έγκυρο backup')}e.target.value=''};r.readAsText(f)}

document.querySelectorAll('.type-option').forEach(b=>b.onclick=()=>{selectedType=b.dataset.type;document.querySelectorAll('.type-option').forEach(x=>x.classList.toggle('active',x===b))});

if($('newVehicleBtn'))$('newVehicleBtn').onclick=openForm;$('garageNewVehicleBtn').onclick=openForm;$('closeFormBtn').onclick=closeForm;$('saveVehicleBtn').onclick=saveVehicle;$('cancelEditBtn').onclick=closeForm;$('addDocumentBtn').onclick=addDocument;$('searchInput').oninput=render;$('typeFilter').onchange=render;$('themeBtn').onclick=()=>applyTheme(document.documentElement.classList.contains('dark')?'light':'dark');$('backupBtn').onclick=()=>{$('backupPanel').classList.remove('hidden');$('backupPanel').scrollIntoView({behavior:'smooth'})};$('closeBackupBtn').onclick=()=>$('backupPanel').classList.add('hidden');$('exportBackupBtn').onclick=exportBackup;$('importBackupInput').onchange=importBackup;document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=closeModal);document.onkeydown=e=>{if(e.key==='Escape')closeModal()};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(!deferredPrompt)return alert('Στο iPhone: Safari → Κοινοποίηση → Προσθήκη στην οθόνη αφετηρίας.');deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').classList.add('hidden')};
load();applyTheme(localStorage.getItem(THEME_KEY)||'light');render();renderFormDocs();


function searchVehicleSpecs(){
  const brand=$('brand').value.trim(),model=$('model').value.trim(),year=$('year').value.trim();
  if(!brand&&!model){alert('Γράψε πρώτα τουλάχιστον μάρκα ή μοντέλο.');return}
  const q=[brand,model,year,'specifications horsepower engine fuel consumption'].filter(Boolean).join(' ');
  window.open('https://www.google.com/search?q='+encodeURIComponent(q),'_blank','noopener');
}

$('searchSpecsBtn').onclick=searchVehicleSpecs;


$('vehiclePhoto').addEventListener('change', async (e)=>{
  const file=e.target.files?.[0];
  if(!file)return;

  try{
    photoData=await prepareVehiclePhoto(file);
    $('photoPreview').innerHTML=`<img src="${photoData}" alt="Φωτογραφία οχήματος">`;
  }catch(err){
    console.error(err);
    alert('Δεν μπόρεσα να επεξεργαστώ τη φωτογραφία. Δοκίμασε άλλη εικόνα.');
    e.target.value='';
  }
});


async function prepareVehiclePhoto(file){
  const dataUrl=await readFileAsDataURL(file);
  const img=await loadImage(dataUrl);

  const size=Math.min(img.naturalWidth||img.width, img.naturalHeight||img.height);
  const sx=Math.max(0, ((img.naturalWidth||img.width)-size)/2);
  const sy=Math.max(0, ((img.naturalHeight||img.height)-size)/2);

  const canvas=document.createElement('canvas');
  const target=600;
  canvas.width=target;
  canvas.height=target;

  const ctx=canvas.getContext('2d', {alpha:false});
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,target,target);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,sx,sy,size,size,0,0,target,target);

  // JPEG keeps storage small and works everywhere.
  return canvas.toDataURL('image/jpeg',0.82);
}

function readFileAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=reject;
    img.src=src;
  });
}

const quickAddVehicleBtn=document.getElementById('quickAddVehicleBtn');
if(quickAddVehicleBtn){
  quickAddVehicleBtn.addEventListener('click',()=>{
    const form=document.getElementById('vehicleFormCard') || document.querySelector('form');
    if(form) form.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
