const KEY="mycarplus_web_v3";
const $=id=>document.getElementById(id);
const f={ownerName:$("ownerName"),vehicleType:$("vehicleType"),brand:$("brand"),model:$("model"),year:$("year"),plate:$("plate"),insuranceDate:$("insuranceDate"),kteoDate:$("kteoDate"),currentKm:$("currentKm"),lastServiceKm:$("lastServiceKm"),serviceEveryKm:$("serviceEveryKm"),fuelCost:$("fuelCost"),serviceCost:$("serviceCost"),vehiclePhoto:$("vehiclePhoto"),documentType:$("documentType"),documentFile:$("documentFile")};
let state={ownerName:"",vehicles:[]},editing=null,photo="",docs=[];
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function load(){try{state=JSON.parse(localStorage.getItem(KEY))||state}catch(e){}}
function esc(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function money(v){return Number(v||0).toFixed(2)}
function emoji(t){return {Αυτοκίνητο:"🚗",Μηχανή:"🏍️",Scooter:"🛵",Van:"🚐",Φορτηγό:"🚚",ATV:"🏎️"}[t]||"🚘"}
function days(d){if(!d)return null;let a=new Date(),b=new Date(d+"T00:00:00");a.setHours(0,0,0,0);return Math.ceil((b-a)/86400000)}
function dateText(label,d){let x=days(d);if(x===null)return{text:`${label}: δεν ορίστηκε`,cls:"warning",soon:false,expired:false};if(x<0)return{text:`${label}: έληξε`,cls:"danger",soon:false,expired:true};if(x===0)return{text:`${label}: σήμερα`,cls:"danger",soon:true,expired:false};if(x<=7)return{text:`${label}: σε ${x} ημέρες`,cls:"warning",soon:true,expired:false};return{text:`${label}: σε ${x} ημέρες`,cls:"good",soon:false,expired:false}}
function service(v){let c=+v.currentKm||0,l=+v.lastServiceKm||0,e=+v.serviceEveryKm||0;if(!c||!l||!e)return{text:"Service: δεν ορίστηκε",cls:"warning",soon:false,expired:false};let n=l+e,left=n-c;if(left<=0)return{text:`Service: τώρα (${n} km)`,cls:"danger",soon:false,expired:true};if(left<=500)return{text:`Service: σε ${left} km`,cls:"warning",soon:true,expired:false};return{text:`Service: σε ${left} km`,cls:"good",soon:false,expired:false}}
function clearForm(){editing=null;photo="";docs=[];["brand","model","year","plate","insuranceDate","kteoDate","currentKm","lastServiceKm","serviceEveryKm","fuelCost","serviceCost"].forEach(k=>f[k].value="");f.vehicleType.value="Αυτοκίνητο";f.vehiclePhoto.value="";f.documentFile.value="";f.documentType.value="Άδεια";$("photoPreview").innerHTML="📷";$("formTitle").textContent="Προσθήκη οχήματος";$("formSubtitle").textContent="Συμπλήρωσε τα στοιχεία."; $("saveVehicleBtn").textContent="Προσθήκη οχήματος";$("cancelEditBtn").classList.add("hidden");renderDocs()}
function renderDash(){let soon=0,exp=0,cost=0;state.vehicles.forEach(v=>{let a=dateText("Ασφάλεια",v.insuranceDate),k=dateText("ΚΤΕΟ",v.kteoDate),s=service(v);if(a.soon||k.soon||s.soon)soon++;if(a.expired||k.expired||s.expired)exp++;cost+=(+v.fuelCost||0)+(+v.serviceCost||0)});$("dashVehicles").textContent=state.vehicles.length;$("dashSoon").textContent=soon;$("dashExpired").textContent=exp;$("dashCosts").textContent="€"+money(cost)}
function renderDocs(){$("documentsPreview").innerHTML=docs.length?docs.map(d=>`<div class="doc"><div><b>${esc(d.type)}</b><br><small>${esc(d.name)}</small></div><div class="doc-actions"><a href="${d.data}" target="_blank">Άνοιγμα</a><button onclick="removeTempDoc('${d.id}')">Διαγραφή</button></div></div>`).join(""):`<div class="empty">Δεν έχουν προστεθεί έγγραφα.</div>`}
function docsHtml(v){let ds=v.documents||[];return `<div class="vdocs"><b>Έγγραφα (${ds.length})</b>${ds.length?ds.map(d=>`<div class="doc"><div><b>${esc(d.type)}</b><br><small>${esc(d.name)}</small></div><div class="doc-actions"><a href="${d.data}" target="_blank">Άνοιγμα</a></div></div>`).join(""):"<br><small>Δεν υπάρχουν έγγραφα.</small>"}</div>`}
function card(v){
  let a=dateText("Ασφάλεια",v.insuranceDate),k=dateText("ΚΤΕΟ",v.kteoDate),s=service(v);
  let tot=(+v.fuelCost||0)+(+v.serviceCost||0);
  let ph=v.photo?`<img src="${v.photo}" alt="Φωτογραφία οχήματος">`:emoji(v.type);
  return `<article class="vehicle">
    <div class="vtop">
      <div class="vphoto">${ph}</div>
      <div>
        <div class="vtitle">${esc(v.brand)} ${esc(v.model)}</div>
        <div class="vmeta">${emoji(v.type)} ${esc(v.type)} • ${esc(v.year)} • ${esc(v.plate)}</div>
        <div class="chips">
          <span class="chip ${a.cls}">${a.text}</span>
          <span class="chip ${k.cls}">${k.text}</span>
          <span class="chip ${s.cls}">${s.text}</span>
        </div>
        <div class="costs">Σύνολο εξόδων: <b>€${money(tot)}</b> • Έγγραφα: <b>${(v.documents||[]).length}</b></div>
        <div class="actions">
          <button class="view-btn" onclick="viewVehicle('${v.id}')">Προβολή</button>
          <button class="edit" onclick="editVehicle('${v.id}')">Επεξεργασία</button>
          <button class="delete" onclick="deleteVehicle('${v.id}')">Διαγραφή</button>
        </div>
      </div>
    </div>
  </article>`
}
const _oldRender=render;
render=function(){_oldRender();renderNotifications();}


function notificationsForVehicle(v){
  const out=[];
  const a=dateText("Ασφάλεια",v.insuranceDate);
  const k=dateText("ΚΤΕΟ",v.kteoDate);
  const s=service(v);
  if(a.expired) out.push({cls:"danger",icon:"⛔",text:`Η ασφάλεια του ${v.brand} ${v.model} έχει λήξει.`});
  else if(a.soon) out.push({cls:"warning",icon:"⚠️",text:`Η ασφάλεια του ${v.brand} ${v.model} ${a.text.toLowerCase()}.`});
  if(k.expired) out.push({cls:"danger",icon:"⛔",text:`Το ΚΤΕΟ του ${v.brand} ${v.model} έχει λήξει.`});
  else if(k.soon) out.push({cls:"warning",icon:"⚠️",text:`Το ΚΤΕΟ του ${v.brand} ${v.model} ${k.text.toLowerCase()}.`});
  if(s.expired) out.push({cls:"danger",icon:"🔧",text:`Το ${v.brand} ${v.model} χρειάζεται service τώρα.`});
  else if(s.soon) out.push({cls:"warning",icon:"🔧",text:`Το ${v.brand} ${v.model} χρειάζεται ${s.text.toLowerCase()}.`});
  return out;
}
function renderNotifications(){
  const items=state.vehicles.flatMap(notificationsForVehicle);
  const box=$("notificationsList");
  if(!items.length){
    box.innerHTML=`<div class="notification-item good"><span>✅</span><div><b>Όλα είναι εντάξει</b><br><small>Δεν υπάρχουν λήξεις ή service που χρειάζονται άμεση προσοχή.</small></div></div>`;
    return;
  }
  box.innerHTML=items.map(x=>`<div class="notification-item ${x.cls}"><span>${x.icon}</span><div>${esc(x.text)}</div></div>`).join("");
}
function viewVehicle(id){
  const v=state.vehicles.find(x=>x.id===id); if(!v)return;
  const a=dateText("Ασφάλεια",v.insuranceDate),k=dateText("ΚΤΕΟ",v.kteoDate),s=service(v);
  const total=(+v.fuelCost||0)+(+v.serviceCost||0);
  const photoHtml=v.photo?`<img src="${v.photo}" alt="Φωτογραφία οχήματος">`:emoji(v.type);
  const docs=(v.documents||[]).length
    ? (v.documents||[]).map(d=>`<div class="doc"><div><b>${esc(d.type)}</b><br><small>${esc(d.name)}</small></div><a href="${d.data}" target="_blank">Άνοιγμα</a></div>`).join("")
    : `<div class="empty">Δεν υπάρχουν έγγραφα.</div>`;
  currentModalVehicleId=id;
  $("vehicleModalContent").innerHTML=`
    <div class="modal-hero">
      <div class="modal-photo">${photoHtml}</div>
      <div>
        <span class="eyebrow">${esc(v.type)}</span>
        <h2 style="font-size:30px;margin-top:7px">${esc(v.brand)} ${esc(v.model)}</h2>
        <p>${esc(v.year)} • ${esc(v.plate)}</p>
        <div class="chips">
          <span class="chip ${a.cls}">${a.text}</span>
          <span class="chip ${k.cls}">${k.text}</span>
          <span class="chip ${s.cls}">${s.text}</span>
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail"><span>Τωρινά χιλιόμετρα</span><b>${esc(v.currentKm||"Δεν ορίστηκαν")} km</b></div>
      <div class="detail"><span>Τελευταίο service</span><b>${esc(v.lastServiceKm||"Δεν ορίστηκε")} km</b></div>
      <div class="detail"><span>Καύσιμα</span><b>€${money(v.fuelCost)}</b></div>
      <div class="detail"><span>Service / άλλα</span><b>€${money(v.serviceCost)}</b></div>
      <div class="detail"><span>Συνολικά έξοδα</span><b>€${money(total)}</b></div>
      <div class="detail"><span>Έγγραφα</span><b>${(v.documents||[]).length}</b></div>
    </div>
    <h3>Έγγραφα οχήματος</h3>
    <div class="docs-list">${docs}</div>`;
  $("historyManager").classList.remove("hidden");
  renderHistoryPanels();
  $("vehicleModal").classList.remove("hidden");
  $("vehicleModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function closeVehicleModal(){
  $("vehicleModal").classList.add("hidden");
  $("vehicleModal").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  currentModalVehicleId=null;
}

$("scrollToAddBtn").addEventListener("click",()=>{$("vehicleFormCard").scrollIntoView({behavior:"smooth",block:"start"})});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeVehicleModal()});


let currentModalVehicleId=null;

function currentModalVehicle(){
  return state.vehicles.find(v=>v.id===currentModalVehicleId);
}

function formatDateGreek(value){
  if(!value)return "Χωρίς ημερομηνία";
  const d=new Date(value+"T00:00:00");
  return d.toLocaleDateString("el-GR");
}

function historyTotals(v){
  const fuel=(v.fuelHistory||[]).reduce((s,x)=>s+(+x.cost||0),0);
  const serviceCost=(v.serviceHistory||[]).reduce((s,x)=>s+(+x.cost||0),0);
  const liters=(v.fuelHistory||[]).reduce((s,x)=>s+(+x.liters||0),0);
  return {fuel,serviceCost,liters,total:fuel+serviceCost};
}

function renderHistoryPanels(){
  const v=currentModalVehicle();
  if(!v)return;

  const fuel=v.fuelHistory||[];
  const services=v.serviceHistory||[];
  const totals=historyTotals(v);

  $("fuelHistoryList").innerHTML=`
    <div class="history-summary">
      <div class="detail"><span>Σύνολο λίτρων</span><b>${totals.liters.toFixed(2)} L</b></div>
      <div class="detail"><span>Έξοδα καυσίμων</span><b>€${money(totals.fuel)}</b></div>
      <div class="detail"><span>Καταχωρήσεις</span><b>${fuel.length}</b></div>
    </div>
    ${fuel.length?fuel.slice().reverse().map(x=>`
      <div class="history-entry">
        <div class="history-entry-main">
          <div class="history-entry-title">⛽ ${(+x.liters||0).toFixed(2)} L • €${money(x.cost)}</div>
          <div class="history-entry-meta">${formatDateGreek(x.date)} • ${esc(x.km||"—")} km</div>
        </div>
        <button class="history-delete" onclick="deleteFuelHistory('${x.id}')">Διαγραφή</button>
      </div>`).join(""):`<div class="empty">Δεν υπάρχουν καταχωρήσεις καυσίμων.</div>`}`;

  $("serviceHistoryList").innerHTML=`
    <div class="history-summary">
      <div class="detail"><span>Έξοδα service</span><b>€${money(totals.serviceCost)}</b></div>
      <div class="detail"><span>Καταχωρήσεις</span><b>${services.length}</b></div>
      <div class="detail"><span>Σύνολο ιστορικού</span><b>€${money(totals.total)}</b></div>
    </div>
    ${services.length?services.slice().reverse().map(x=>`
      <div class="history-entry">
        <div class="history-entry-main">
          <div class="history-entry-title">🔧 ${esc(x.work||"Service")} • €${money(x.cost)}</div>
          <div class="history-entry-meta">${formatDateGreek(x.date)} • ${esc(x.garage||"Χωρίς συνεργείο")} • ${esc(x.km||"—")} km</div>
        </div>
        <button class="history-delete" onclick="deleteServiceHistory('${x.id}')">Διαγραφή</button>
      </div>`).join(""):`<div class="empty">Δεν υπάρχουν καταχωρήσεις service.</div>`}`;
}

function addFuelHistory(){
  const v=currentModalVehicle(); if(!v)return;
  const date=$("fuelHistoryDate").value;
  const liters=$("fuelHistoryLiters").value;
  const cost=$("fuelHistoryCost").value;
  const km=$("fuelHistoryKm").value;
  if(!date||!liters||!cost){alert("Συμπλήρωσε ημερομηνία, λίτρα και κόστος.");return}
  v.fuelHistory=v.fuelHistory||[];
  v.fuelHistory.push({id:Date.now().toString(),date,liters,cost,km});
  $("fuelHistoryDate").value="";
  $("fuelHistoryLiters").value="";
  $("fuelHistoryCost").value="";
  $("fuelHistoryKm").value="";
  save();render();
renderStats();renderHistoryPanels();
}

function addServiceHistory(){
  const v=currentModalVehicle(); if(!v)return;
  const date=$("serviceHistoryDate").value;
  const garage=$("serviceHistoryGarage").value.trim();
  const work=$("serviceHistoryWork").value.trim();
  const cost=$("serviceHistoryCost").value;
  const km=$("serviceHistoryKm").value;
  if(!date||!work||!cost){alert("Συμπλήρωσε ημερομηνία, εργασία και κόστος.");return}
  v.serviceHistory=v.serviceHistory||[];
  v.serviceHistory.push({id:Date.now().toString(),date,garage,work,cost,km});
  $("serviceHistoryDate").value="";
  $("serviceHistoryGarage").value="";
  $("serviceHistoryWork").value="";
  $("serviceHistoryCost").value="";
  $("serviceHistoryKm").value="";
  save();render();renderHistoryPanels();
}

function deleteFuelHistory(id){
  const v=currentModalVehicle(); if(!v)return;
  v.fuelHistory=(v.fuelHistory||[]).filter(x=>x.id!==id);
  save();render();renderHistoryPanels();
}

function deleteServiceHistory(id){
  const v=currentModalVehicle(); if(!v)return;
  v.serviceHistory=(v.serviceHistory||[]).filter(x=>x.id!==id);
  save();render();renderHistoryPanels();
}

function switchHistoryTab(tab){
  const fuel=tab==="fuel";
  $("fuelTabBtn").classList.toggle("active",fuel);
  $("serviceTabBtn").classList.toggle("active",!fuel);
  $("fuelPanel").classList.toggle("hidden",!fuel);
  $("servicePanel").classList.toggle("hidden",fuel);
}

$("addFuelHistoryBtn").addEventListener("click",addFuelHistory);
$("addServiceHistoryBtn").addEventListener("click",addServiceHistory);
$("fuelTabBtn").addEventListener("click",()=>switchHistoryTab("fuel"));
$("serviceTabBtn").addEventListener("click",()=>switchHistoryTab("service"));

function renderStats(){
 let fuel=0,serv=0;
 state.vehicles.forEach(v=>{
   fuel+=(+v.fuelCost||0)+((v.fuelHistory||[]).reduce((s,x)=>s+(+x.cost||0),0));
   serv+=(+v.serviceCost||0)+((v.serviceHistory||[]).reduce((s,x)=>s+(+x.cost||0),0));
 });
 document.getElementById('statFuel').textContent='€'+money(fuel);
 document.getElementById('statService').textContent='€'+money(serv);
 document.getElementById('statAvg').textContent='€'+money(state.vehicles.length?((fuel+serv)/state.vehicles.length):0);
 const c=document.getElementById('expenseChart');
 if(!c)return;
 const ctx=c.getContext('2d');
 c.width=c.clientWidth;
 c.height=160;
 ctx.clearRect(0,0,c.width,c.height);
 const max=Math.max(fuel,serv,1);
 const vals=[fuel,serv];
 const labels=['Καύσιμα','Service'];
 vals.forEach((v,i)=>{
   const h=(v/max)*100;
   const x=80+i*140;
   ctx.fillStyle=i==0?'#1565c0':'#12b76a';
   ctx.fillRect(x,130-h,60,h);
   ctx.fillStyle='#172033';
   ctx.fillText(labels[i],x,148);
   ctx.fillText('€'+v.toFixed(0),x,120-h);
 });
}


const THEME_KEY="mycarplus_theme";

function applyTheme(theme){
  document.documentElement.classList.toggle("dark",theme==="dark");
  $("themeToggleBtn").textContent=theme==="dark"?"☀️":"🌙";
  localStorage.setItem(THEME_KEY,theme);
}

function toggleTheme(){
  const dark=document.documentElement.classList.contains("dark");
  applyTheme(dark?"light":"dark");
}

function allDocuments(){
  const result=[];
  state.vehicles.forEach(v=>{
    (v.documents||[]).forEach(d=>{
      result.push({...d,vehicleId:v.id,vehicleName:`${v.brand} ${v.model}`,plate:v.plate});
    });
  });
  return result;
}

function renderDocumentLibrary(){
  const filter=$("documentFilter")?.value||"all";
  const query=($("documentSearch")?.value||"").trim().toLowerCase();
  const docs=allDocuments().filter(d=>{
    const filterOk=filter==="all"||d.type===filter;
    const queryOk=`${d.name} ${d.type} ${d.vehicleName} ${d.plate}`.toLowerCase().includes(query);
    return filterOk&&queryOk;
  });

  if($("documentsCount"))$("documentsCount").textContent=docs.length;
  if(!$("allDocumentsList"))return;

  $("allDocumentsList").innerHTML=docs.length?docs.map(d=>`
    <article class="document-library-card">
      <div>
        <div class="document-library-title">${esc(d.type)} • ${esc(d.name)}</div>
        <div class="document-library-meta">${esc(d.vehicleName)} • ${esc(d.plate)}</div>
      </div>
      <div class="document-library-actions">
        <button class="document-open" onclick="openDocumentPreview('${d.vehicleId}','${d.id}')">Προβολή</button>
      </div>
    </article>
  `).join(""):`<div class="empty">Δεν βρέθηκαν έγγραφα.</div>`;
}

function openDocumentPreview(vehicleId,documentId){
  const vehicle=state.vehicles.find(v=>v.id===vehicleId);
  const doc=(vehicle?.documents||[]).find(d=>d.id===documentId);
  if(!doc)return;

  const isPdf=(doc.data||"").startsWith("data:application/pdf")||String(doc.name).toLowerCase().endsWith(".pdf");
  const preview=isPdf
    ? `<iframe class="document-preview-frame" src="${doc.data}" title="${esc(doc.name)}"></iframe>`
    : `<img class="document-preview-image" src="${doc.data}" alt="${esc(doc.name)}">`;

  $("documentModalContent").innerHTML=`
    <span class="eyebrow">${esc(doc.type)}</span>
    <h2 style="margin-top:8px">${esc(doc.name)}</h2>
    <p>${esc(vehicle.brand)} ${esc(vehicle.model)} • ${esc(vehicle.plate)}</p>
    <div style="margin-top:18px">${preview}</div>
  `;
  $("documentModal").classList.remove("hidden");
  $("documentModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}

function closeDocumentModal(){
  $("documentModal").classList.add("hidden");
  $("documentModal").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  $("documentModalContent").innerHTML="";
}

function vehicleCostTotals(v){
  const fuel=(+v.fuelCost||0)+(v.fuelHistory||[]).reduce((s,x)=>s+(+x.cost||0),0);
  const service=(+v.serviceCost||0)+(v.serviceHistory||[]).reduce((s,x)=>s+(+x.cost||0),0);
  return {fuel,service,total:fuel+service};
}

function renderVehicleStats(){
  if(!$("vehicleStatsList"))return;
  const totals=state.vehicles.map(v=>({...vehicleCostTotals(v),vehicle:v}));
  const max=Math.max(...totals.map(x=>Math.max(x.fuel,x.service)),1);

  $("vehicleStatsList").innerHTML=totals.length?totals.map(x=>`
    <article class="vehicle-stat">
      <div class="vehicle-stat-head">
        <div><b>${esc(x.vehicle.brand)} ${esc(x.vehicle.model)}</b><div class="vehicle-meta">${esc(x.vehicle.plate)}</div></div>
        <b>€${money(x.total)}</b>
      </div>
      <div class="vehicle-stat-bars">
        <div class="stat-row">
          <span>Καύσιμα</span>
          <div class="stat-track"><div class="stat-fill fuel" style="width:${Math.max((x.fuel/max)*100,2)}%"></div></div>
          <b>€${money(x.fuel)}</b>
        </div>
        <div class="stat-row">
          <span>Service</span>
          <div class="stat-track"><div class="stat-fill service" style="width:${Math.max((x.service/max)*100,2)}%"></div></div>
          <b>€${money(x.service)}</b>
        </div>
      </div>
    </article>
  `).join(""):`<div class="empty">Δεν υπάρχουν οχήματα για στατιστικά.</div>`;
}

$("themeToggleBtn").addEventListener("click",toggleTheme);
$("documentFilter").addEventListener("change",renderDocumentLibrary);
$("documentSearch").addEventListener("input",renderDocumentLibrary);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDocumentModal()});
applyTheme(localStorage.getItem(THEME_KEY)||"light");
renderDocumentLibrary();
renderVehicleStats();


let deferredInstallPrompt=null;

window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  $("installAppBtn").classList.remove("hidden");
});

window.addEventListener("appinstalled",()=>{
  deferredInstallPrompt=null;
  $("installAppBtn").classList.add("hidden");
  showConnectionMessage("Το MyCar+ εγκαταστάθηκε επιτυχώς.","online");
});

async function installApp(){
  if(!deferredInstallPrompt){
    alert("Στο iPhone: Safari → Κοινοποίηση → Προσθήκη στην οθόνη αφετηρίας.");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  $("installAppBtn").classList.add("hidden");
}

function toggleBackupPanel(){
  $("backupPanel").classList.toggle("hidden");
  if(!$("backupPanel").classList.contains("hidden")){
    $("backupPanel").scrollIntoView({behavior:"smooth",block:"center"});
  }
}

function exportBackup(){
  const payload={
    app:"MyCar+",
    version:"5.4",
    exportedAt:new Date().toISOString(),
    data:state,
    theme:localStorage.getItem(THEME_KEY)||"light"
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  const date=new Date().toISOString().slice(0,10);
  a.href=url;
  a.download=`mycarplus-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importBackup(event){
  const file=event.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const payload=JSON.parse(reader.result);
      const incoming=payload.data||payload;
      if(!incoming||!Array.isArray(incoming.vehicles)){
        throw new Error("invalid");
      }
      if(!confirm("Να αντικατασταθούν τα τωρινά δεδομένα με το backup;"))return;
      state={
        ownerName:incoming.ownerName||"",
        vehicles:incoming.vehicles||[]
      };
      save();
      if(payload.theme)applyTheme(payload.theme);
      clearVehicleForm();
      render();
      showConnectionMessage("Το backup επαναφέρθηκε επιτυχώς.","online");
      $("backupPanel").classList.add("hidden");
    }catch(e){
      alert("Το αρχείο backup δεν είναι έγκυρο.");
    }finally{
      event.target.value="";
    }
  };
  reader.readAsText(file);
}

function showConnectionMessage(message,type){
  const box=$("connectionStatus");
  box.textContent=message;
  box.className=`connection-status ${type}`;
  box.classList.remove("hidden");
  clearTimeout(window.__connectionTimer);
  window.__connectionTimer=setTimeout(()=>box.classList.add("hidden"),3200);
}

function updateConnectionStatus(){
  if(navigator.onLine){
    showConnectionMessage("Συνδέθηκε ξανά στο διαδίκτυο.","online");
  }else{
    showConnectionMessage("Offline λειτουργία: τα τοπικά δεδομένα παραμένουν διαθέσιμα.","offline");
  }
}

$("installAppBtn").addEventListener("click",installApp);
$("backupMenuBtn").addEventListener("click",toggleBackupPanel);
$("closeBackupBtn").addEventListener("click",()=>$("backupPanel").classList.add("hidden"));
$("exportDataBtn").addEventListener("click",exportBackup);
$("importDataInput").addEventListener("change",importBackup);
window.addEventListener("online",updateConnectionStatus);
window.addEventListener("offline",updateConnectionStatus);
if(!navigator.onLine){
  setTimeout(()=>showConnectionMessage("Offline λειτουργία ενεργή.","offline"),500);
}
