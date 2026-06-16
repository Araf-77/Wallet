const SOURCES=[
  {id:'cash',label:'Cash',icon:'💵'},
  {id:'bkash',label:'bKash',icon:'📱'},
  {id:'nagad',label:'Nagad',icon:'🟠'},
  {id:'prime',label:'Prime Bank',icon:'🏦'},
  {id:'dbbl',label:'Dutch-Bangla',icon:'🔵'},
  {id:'other',label:'Other',icon:'💳'},
];
let selectedSource='cash';
const CATS={
  expense:[
    {id:'food',label:'Food',icon:'🍔',color:'#ff6b6b'},
    {id:'transport',label:'Transport',icon:'🚌',color:'#ffa94d'},
    {id:'shopping',label:'Shopping',icon:'🛍️',color:'#a855f7'},
    {id:'health',label:'Health',icon:'💊',color:'#63b3ed'},
    {id:'housing',label:'Housing',icon:'🏠',color:'#f59e0b'},
    {id:'bills',label:'Bills',icon:'📱',color:'#06b6d4'},
    {id:'edu',label:'Education',icon:'📚',color:'#10b981'},
    {id:'other',label:'Other',icon:'📦',color:'#6b7280'},
  ],
  income:[
    {id:'salary',label:'Salary',icon:'💰',color:'#00d4aa'},
    {id:'freelance',label:'Freelance',icon:'💻',color:'#6c63ff'},
    {id:'gift',label:'Gift',icon:'🎁',color:'#f59e0b'},
    {id:'invest',label:'Invest',icon:'📈',color:'#63b3ed'},
  ]
};

let state=loadState();
let currentType='expense',selectedCat='food';
let currentMonth=new Date().getMonth(),currentYear=new Date().getFullYear();
let spendChart,catChartInst,reportChartInst,trendChartInst;

function loadState(){
  try{const d=localStorage.getItem('vault2');if(d){const s=JSON.parse(d);if(!s.debts)s.debts=[];return s;}}catch(e){}
  return{transactions:[],budgets:[],debts:[],settings:{currency:'৳',compact:false,anim:true,name:'Araf'}};
}
function saveState(){try{localStorage.setItem('vault2',JSON.stringify(state));}catch(e){}}

function showView(id){
  document.querySelectorAll('.main').forEach(el=>el.classList.remove('active-view'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active-view');
  document.querySelectorAll('.nav-item').forEach(el=>{
    if(el.textContent.trim().toLowerCase().startsWith(id.slice(0,4))||
       (id==='settings'&&el.textContent.includes('Customize'))||
       (id==='transactions'&&el.textContent.includes('Transactions')))
      el.classList.add('active');
  });
  if(id==='dashboard')renderDashboard();
  if(id==='transactions')renderTransactions();
  if(id==='reports')renderReports();
}

const sym=()=>state.settings.currency;
function fmt(n){
  if(state.settings.compact&&Math.abs(n)>=1000)return sym()+(n/1000).toFixed(1)+'k';
  return sym()+Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
}
function monthTxs(){
  return state.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===currentMonth&&d.getFullYear()===currentYear;});
}
function getCat(type,id){return CATS[type].find(c=>c.id===id)||CATS.expense[CATS.expense.length-1];}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200);}

function changeMonth(d){
  currentMonth+=d;
  if(currentMonth>11){currentMonth=0;currentYear++;}
  if(currentMonth<0){currentMonth=11;currentYear--;}
  const names=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('month-label').textContent=names[currentMonth]+' '+currentYear;
  renderDashboard();
}

function renderDashboard(){
  const txs=monthTxs();
  const income=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const allInc=state.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const allExp=state.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const savings=income>0?Math.round(((income-expense)/income)*100):0;
  document.getElementById('stat-balance').textContent=fmt(allInc-allExp);
  document.getElementById('stat-income').textContent=fmt(income);
  document.getElementById('stat-expense').textContent=fmt(expense);
  renderRecentTx();renderWallets();renderSpendingChart(txs);renderDebts();
}

function txHTML(t){
  if(t.type==='transfer'){
    const from=SOURCES.find(s=>s.id===t.source)||SOURCES[0];
    const to=SOURCES.find(s=>s.id===t.transferTo)||SOURCES[1];
    const d=new Date(t.date);
    const dateStr=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    return `<div class="tx-item">
      <div class="tx-icon" style="background:rgba(108,99,255,0.15)">🔄</div>
      <div class="tx-info"><div class="tx-name">${t.desc||'Transfer'}</div><div class="tx-meta">${from.icon} ${from.label} → ${to.icon} ${to.label} · ${dateStr}</div></div>
      <div class="tx-amount" style="color:var(--accent)">${fmt(t.amount)}</div>
    </div>`;
  }
  const cat=getCat(t.type,t.cat);
  const sign=t.type==='income'?'+':'-';
  const col=t.type==='income'?'var(--income)':'var(--expense)';
  const d=new Date(t.date);
  const dateStr=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const src=SOURCES.find(s=>s.id===t.source)||SOURCES[0];
  return `<div class="tx-item">
    <div class="tx-icon" style="background:${cat.color}22">${cat.icon}</div>
    <div class="tx-info"><div class="tx-name">${t.desc||cat.label}</div><div class="tx-meta">${cat.label} · ${src.icon} ${src.label} · ${dateStr}</div></div>
    <div class="tx-amount" style="color:${col}">${sign}${fmt(t.amount)}</div>
  </div>`;
}

function renderRecentTx(){
  const list=document.getElementById('recent-tx-list');
  const recent=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  list.innerHTML=recent.length?recent.map(txHTML).join(''):'<div style="color:var(--muted);text-align:center;padding:24px">No transactions yet</div>';
}

function renderWallets(){
  const WALLET_META=[
    {id:'cash',   label:'Cash',        icon:'💵', color:'#00d4aa'},
    {id:'bkash',  label:'bKash',       icon:'📱', color:'#e2136e'},
    {id:'nagad',  label:'Nagad',       icon:'🟠', color:'#f7941d'},
    {id:'prime',  label:'Prime Bank',  icon:'🏦', color:'#6c63ff'},
    {id:'dbbl',   label:'Dutch-Bangla',icon:'🔵', color:'#63b3ed'},
    {id:'other',  label:'Others',      icon:'💳', color:'#a855f7'},
  ];
  // For each source: income adds, expense subtracts
  const balances={};
  WALLET_META.forEach(w=>balances[w.id]=0);
  state.transactions.forEach(t=>{
    const src=t.source||'cash';
    if(!balances.hasOwnProperty(src))balances[src]=0;
    if(t.type==='income') balances[src]+=t.amount;
    else if(t.type==='expense') balances[src]-=t.amount;
    else if(t.type==='transfer'){
      balances[src]-=t.amount;
      const dst=t.transferTo||'cash';
      if(!balances.hasOwnProperty(dst))balances[dst]=0;
      balances[dst]+=t.amount;
    }
  });
  document.getElementById('wallet-grid').innerHTML=WALLET_META.map(w=>{
    const bal=balances[w.id]||0;
    const col=bal<0?'var(--expense)':bal>0?'var(--income)':'var(--text)';
    return `<div class="wallet-card" style="--wcolor:${w.color}">
      <div class="wallet-icon">${w.icon}</div>
      <div class="wallet-name">${w.label}</div>
      <div class="wallet-amount" style="color:${col}">${fmt(bal)}</div>
    </div>`;
  }).join('');
}

// ===== LENT MONEY (debts) — fully separate from income/expense =====
let debtFilter='all',debtDir='owed',currentDebtId=null;

function debtNet(d){return d.entries.reduce((s,e)=>s+(e.dir==='owed'?e.amount:-e.amount),0);}

function setDebtFilter(f,btn){
  debtFilter=f;
  document.querySelectorAll('.debt-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  renderDebts();
}

function renderDebts(){
  const listEl=document.getElementById('debt-list');
  if(!listEl)return;
  let debts=[...state.debts];
  if(debtFilter==='lent')debts=debts.filter(d=>debtNet(d)>0);
  else if(debtFilter==='borrowed')debts=debts.filter(d=>debtNet(d)<0);
  debts.sort((a,b)=>Math.abs(debtNet(b))-Math.abs(debtNet(a)));
  listEl.innerHTML=debts.length?debts.map(d=>{
    const net=debtNet(d);const owed=net>=0;
    return `<div class="debt-card${owed?' owed':''}" onclick="openDebtDetail('${d.id}')">
      <div class="debt-info">
        <div class="debt-badge${owed?' owed':''}">${owed?'OWES YOU':'YOU OWE'}</div>
        <div class="debt-name">${d.name}</div>
        <div class="debt-meta">${d.entries.length} ${d.entries.length===1?'entry':'entries'}</div>
      </div>
      <div class="debt-amount">${fmt(Math.abs(net))}</div>
    </div>`;
  }).join(''):'<div style="color:var(--muted);text-align:center;padding:24px">No lent or borrowed money yet</div>';

  const totalNet=state.debts.reduce((s,d)=>s+debtNet(d),0);
  const statEl=document.getElementById('stat-lent');
  const subEl=document.getElementById('stat-lent-sub');
  if(statEl){statEl.textContent=fmt(Math.abs(totalNet));statEl.className='stat-value'+(totalNet>0?' pos':totalNet<0?' neg':'');}
  if(subEl)subEl.textContent=totalNet>0?'Net owed to you':totalNet<0?'Net you owe':'All settled up';
}

function populateDebtNameList(){
  document.getElementById('debt-name-list').innerHTML=state.debts.map(d=>`<option value="${d.name}">`).join('');
}

function openDebtModal(prefillName){
  populateDebtNameList();
  const nameInput=document.getElementById('debt-name');
  nameInput.value=prefillName||'';
  nameInput.disabled=!!prefillName;
  document.getElementById('debt-modal-title').textContent=prefillName?('Add Entry — '+prefillName):'Add Lent / Borrowed';
  document.getElementById('debt-amount').value='';
  document.getElementById('debt-desc').value='';
  document.getElementById('debt-date').value=new Date().toISOString().split('T')[0];
  setDebtDir('owed');
  document.getElementById('debt-overlay').classList.add('open');
}
function closeDebtModal(){document.getElementById('debt-overlay').classList.remove('open');document.getElementById('debt-name').disabled=false;}
function closeDebtModalOutside(e){if(e.target.id==='debt-overlay')closeDebtModal();}

function setDebtDir(dir){
  debtDir=dir;
  document.getElementById('dir-owed').className='debt-dir-btn'+(dir==='owed'?' sel-owed':'');
  document.getElementById('dir-owe').className='debt-dir-btn'+(dir==='owe'?' sel-owe':'');
}

function saveDebtEntry(){
  const name=document.getElementById('debt-name').value.trim();
  const amount=parseFloat(document.getElementById('debt-amount').value);
  const desc=document.getElementById('debt-desc').value.trim();
  const date=document.getElementById('debt-date').value;
  if(!name){toast('⚠️ Enter a name');return;}
  if(!amount||amount<=0){toast('⚠️ Enter a valid amount');return;}
  if(!date){toast('⚠️ Pick a date');return;}
  let debt=state.debts.find(d=>d.name.toLowerCase()===name.toLowerCase());
  if(!debt){debt={id:'d'+Date.now(),name,entries:[]};state.debts.push(debt);}
  debt.entries.push({id:'e'+Date.now(),amount,dir:debtDir,desc,date});
  saveState();closeDebtModal();toast('✅ Saved');renderDebts();updateLentStat();
}

function updateLentStat(){renderDebts();}

function openDebtDetail(id){
  currentDebtId=id;
  const debt=state.debts.find(d=>d.id===id);
  if(!debt)return;
  document.getElementById('debt-detail-name').textContent=debt.name;
  const net=debtNet(debt);const owed=net>=0;
  document.getElementById('debt-detail-summary').innerHTML=`<div class="debt-badge${owed?' owed':''}">${owed?'OWES YOU':'YOU OWE'}</div><div style="font-family:var(--font-display);font-size:26px;font-weight:700;margin-top:6px">${fmt(Math.abs(net))}</div>`;
  const entryList=document.getElementById('debt-detail-entries');
  const sorted=[...debt.entries].sort((a,b)=>new Date(b.date)-new Date(a.date));
  entryList.innerHTML=sorted.map(e=>{
    const d=new Date(e.date);const dateStr=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const sign=e.dir==='owed'?'+':'-';
    const col=e.dir==='owed'?'var(--income)':'var(--expense)';
    return `<div class="debt-entry">
      <div class="debt-entry-info"><div class="debt-entry-desc">${e.desc||(e.dir==='owed'?'They owe more':'You owe more')}</div><div class="debt-entry-meta">${dateStr}</div></div>
      <div class="debt-entry-amt" style="color:${col}">${sign}${fmt(e.amount)}</div>
      <button class="debt-del" onclick="deleteDebtEntry('${debt.id}','${e.id}')" title="Remove entry">✕</button>
    </div>`;
  }).join('');
  document.getElementById('debt-detail-overlay').classList.add('open');
}
function closeDebtDetailModal(){document.getElementById('debt-detail-overlay').classList.remove('open');currentDebtId=null;}
function closeDebtDetailOutside(e){if(e.target.id==='debt-detail-overlay')closeDebtDetailModal();}

function addEntryForCurrentDebt(){
  const debt=state.debts.find(d=>d.id===currentDebtId);
  if(!debt)return;
  closeDebtDetailModal();
  openDebtModal(debt.name);
}

function deleteDebtEntry(debtId,entryId){
  const debt=state.debts.find(d=>d.id===debtId);
  if(!debt)return;
  debt.entries=debt.entries.filter(e=>e.id!==entryId);
  if(!debt.entries.length){
    state.debts=state.debts.filter(d=>d.id!==debtId);
    closeDebtDetailModal();
  }else{
    openDebtDetail(debtId);
  }
  saveState();renderDebts();toast('🗑️ Entry removed');
}

function renderSpendingChart(txs){
  const ctx=document.getElementById('spendingChart').getContext('2d');
  if(spendChart)spendChart.destroy();
  const days=new Date(currentYear,currentMonth+1,0).getDate();
  const expByDay=Array(days).fill(0);
  txs.forEach(t=>{const day=new Date(t.date).getDate()-1;if(t.type==='expense')expByDay[day]+=t.amount;});
  spendChart=new Chart(ctx,{type:'bar',data:{labels:Array.from({length:days},(_,i)=>i+1),datasets:[{label:'Expense',data:expByDay,backgroundColor:'rgba(255,107,107,0.7)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#6b7280',font:{size:10}},grid:{color:'#252a3a'}},y:{ticks:{color:'#6b7280',font:{size:10}},grid:{color:'#252a3a'}}}}});
}


function renderTransactions(){
  const filter=document.getElementById('tx-filter').value;
  const list=document.getElementById('all-tx-list');
  let txs=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(filter!=='all')txs=txs.filter(t=>t.type===filter);
  list.innerHTML=txs.length?txs.map(txHTML).join(''):'<div style="color:var(--muted);text-align:center;padding:40px">No transactions found</div>';
}


function renderReports(){
  renderTopCats();renderTrendChart();
  switchReport('monthly',document.querySelector('.report-tab'));
}

function switchReport(type,btn){
  document.querySelectorAll('.report-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const ctx=document.getElementById('reportChart').getContext('2d');
  if(reportChartInst)reportChartInst.destroy();
  const txs=state.transactions;
  const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if(type==='monthly'){
    document.getElementById('report-title').textContent='Monthly Breakdown';
    const months=Array(12).fill(0).map((_,i)=>({inc:txs.filter(t=>new Date(t.date).getMonth()===i&&t.type==='income').reduce((s,t)=>s+t.amount,0),exp:txs.filter(t=>new Date(t.date).getMonth()===i&&t.type==='expense').reduce((s,t)=>s+t.amount,0)}));
    reportChartInst=new Chart(ctx,{type:'bar',data:{labels:names,datasets:[{label:'Income',data:months.map(m=>m.inc),backgroundColor:'rgba(0,212,170,0.7)',borderRadius:5},{label:'Expense',data:months.map(m=>m.exp),backgroundColor:'rgba(255,107,107,0.7)',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#6b7280'}}},scales:{x:{ticks:{color:'#6b7280'},grid:{color:'#252a3a'}},y:{ticks:{color:'#6b7280'},grid:{color:'#252a3a'}}}}});
  }else if(type==='category'){
    document.getElementById('report-title').textContent='Spending by Category';
    const bycat={};txs.filter(t=>t.type==='expense').forEach(t=>{bycat[t.cat]=(bycat[t.cat]||0)+t.amount;});
    const cats=Object.keys(bycat);
    reportChartInst=new Chart(ctx,{type:'pie',data:{labels:cats.map(c=>getCat('expense',c).label),datasets:[{data:cats.map(c=>bycat[c]),backgroundColor:cats.map(c=>getCat('expense',c).color),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#6b7280',font:{size:11}}}}}});
  }else{
    document.getElementById('report-title').textContent='Savings Trend';
    const months=Array(12).fill(0).map((_,i)=>{const inc=txs.filter(t=>new Date(t.date).getMonth()===i&&t.type==='income').reduce((s,t)=>s+t.amount,0);const exp=txs.filter(t=>new Date(t.date).getMonth()===i&&t.type==='expense').reduce((s,t)=>s+t.amount,0);return inc-exp;});
    reportChartInst=new Chart(ctx,{type:'line',data:{labels:names,datasets:[{label:'Net Savings',data:months,borderColor:'var(--accent)',backgroundColor:'rgba(108,99,255,0.1)',fill:true,tension:0.4,pointBackgroundColor:'var(--accent)'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#6b7280'}}},scales:{x:{ticks:{color:'#6b7280'},grid:{color:'#252a3a'}},y:{ticks:{color:'#6b7280'},grid:{color:'#252a3a'}}}}});
  }
}

function renderTopCats(){
  const bycat={};state.transactions.filter(t=>t.type==='expense').forEach(t=>{bycat[t.cat]=(bycat[t.cat]||0)+t.amount;});
  const sorted=Object.entries(bycat).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const el=document.getElementById('top-cats');
  if(!sorted.length){el.innerHTML='<div style="color:var(--muted);padding:20px">No expenses yet</div>';return;}
  const max=sorted[0][1];
  el.innerHTML=sorted.map(([catId,amt])=>{const cat=getCat('expense',catId);const pct=Math.round((amt/max)*100);return `<div class="budget-item"><div class="budget-row"><div class="budget-name">${cat.icon} ${cat.label}</div><div class="budget-nums">${fmt(amt)}</div></div><div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${cat.color}"></div></div></div>`;}).join('');
}

function renderTrendChart(){
  const ctx=document.getElementById('trendChart').getContext('2d');
  if(trendChartInst)trendChartInst.destroy();
  const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now=new Date();const labels=[],inc=[],exp=[];
  for(let i=5;i>=0;i--){let m=now.getMonth()-i;let y=now.getFullYear();if(m<0){m+=12;y--;}labels.push(names[m]);inc.push(state.transactions.filter(t=>new Date(t.date).getMonth()===m&&new Date(t.date).getFullYear()===y&&t.type==='income').reduce((s,t)=>s+t.amount,0));exp.push(state.transactions.filter(t=>new Date(t.date).getMonth()===m&&new Date(t.date).getFullYear()===y&&t.type==='expense').reduce((s,t)=>s+t.amount,0));}
  trendChartInst=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Income',data:inc,borderColor:'var(--income)',backgroundColor:'rgba(0,212,170,0.08)',fill:true,tension:0.4,pointBackgroundColor:'var(--income)'},{label:'Expense',data:exp,borderColor:'var(--expense)',backgroundColor:'rgba(255,107,107,0.08)',fill:true,tension:0.4,pointBackgroundColor:'var(--expense)'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#6b7280'}}},scales:{x:{ticks:{color:'#6b7280'},grid:{color:'#252a3a'}},y:{ticks:{color:'#6b7280'},grid:{color:'#252a3a'}}}}});
}

function openModal(){
  document.getElementById('tx-overlay').classList.add('open');
  document.getElementById('tx-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('tx-amount').value='';
  document.getElementById('tx-desc').value='';
  selectedCat='food';selectedSource='cash';setType('expense');
}
function closeModal(){document.getElementById('tx-overlay').classList.remove('open');}
function closeModalOutside(e){if(e.target.id==='tx-overlay')closeModal();}

function setType(type){
  currentType=type;
  document.getElementById('type-expense').className='type-btn'+(type==='expense'?' active-expense':'');
  document.getElementById('type-income').className='type-btn'+(type==='income'?' active-income':'');
  document.getElementById('type-transfer').className='type-btn'+(type==='transfer'?' active-transfer':'');
  const isTransfer=type==='transfer';
  document.getElementById('normal-section').style.display=isTransfer?'none':'block';
  document.getElementById('transfer-section').style.display=isTransfer?'block':'none';
  if(!isTransfer){
    selectedCat=CATS[type][0].id;
    document.getElementById('cat-section').style.display=type==='expense'?'block':'none';
    renderQuickGrid();
    renderSourceGrid();
  } else {
    renderTransferSelects();
  }
}

function renderSourceGrid(){
  document.getElementById('source-grid').innerHTML=SOURCES.map(s=>`<div class="source-btn${s.id===selectedSource?' selected':''}" onclick="selectSource('${s.id}')"><div class="source-icon">${s.icon}</div><div class="source-label">${s.label}</div></div>`).join('');
}
function selectSource(id){selectedSource=id;renderSourceGrid();}

function renderTransferSelects(){
  const opts=SOURCES.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');
  document.getElementById('transfer-from').innerHTML=opts;
  document.getElementById('transfer-to').innerHTML=opts;
  // Default: from cash → bkash
  document.getElementById('transfer-from').value='cash';
  document.getElementById('transfer-to').value='bkash';
}
function updateTransferSelects(changed){
  const from=document.getElementById('transfer-from').value;
  const to=document.getElementById('transfer-to').value;
  // Prevent same source selected on both sides
  if(from===to){
    const sources=SOURCES.map(s=>s.id);
    const other=sources.find(id=>id!==(changed==='from'?from:to));
    if(changed==='from')document.getElementById('transfer-to').value=other;
    else document.getElementById('transfer-from').value=other;
  }
}

function renderQuickGrid(){
  document.getElementById('quick-grid').innerHTML=CATS[currentType].map(c=>`<div class="quick-btn${c.id===selectedCat?' selected':''}" onclick="selectCat('${c.id}')"><div class="qicon">${c.icon}</div><div class="qlabel">${c.label}</div></div>`).join('');
}

function selectCat(id){selectedCat=id;renderQuickGrid();}

function saveTransaction(){
  const amount=parseFloat(document.getElementById('tx-amount').value);
  const desc=document.getElementById('tx-desc').value.trim();
  const date=document.getElementById('tx-date').value;
  if(!amount||amount<=0){toast('⚠️ Enter a valid amount');return;}
  if(!date){toast('⚠️ Pick a date');return;}
  if(currentType==='transfer'){
    const from=document.getElementById('transfer-from').value;
    const to=document.getElementById('transfer-to').value;
    if(from===to){toast('⚠️ Choose different accounts');return;}
    state.transactions.push({type:'transfer',amount,source:from,transferTo:to,desc,date});
  } else {
    state.transactions.push({type:currentType,amount,cat:selectedCat,source:selectedSource,desc,date});
  }
  saveState();closeModal();toast('✅ Transaction saved');renderDashboard();
}


function setAccent(color,el){
  document.documentElement.style.setProperty('--accent',color);
  document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');toast('🎨 Accent updated');
}

function setCurrency(val){state.settings.currency=val;saveState();renderDashboard();toast('💱 Currency updated');}

function toggleSetting(key,btn){
  const on=btn.classList.toggle('on');
  if(key==='compact'){state.settings.compact=on;saveState();toast(on?'🔢 Compact on':'🔢 Full numbers on');}
  if(key==='anim'){state.settings.anim=on;}
}

function saveName(){
  const name=document.getElementById('name-input').value.trim()||'User';
  state.settings.name=name;
  document.querySelector('.user-name').textContent=name;
  document.querySelector('.avatar').textContent=name[0].toUpperCase();
  saveState();toast('👤 Name saved');
}

function clearData(){
  if(!confirm('Clear ALL transactions? This cannot be undone.'))return;
  state.transactions=[];saveState();renderDashboard();toast('🗑️ Data cleared');
}

// Init
document.getElementById('currency-select').value=state.settings.currency;
if(!state.settings.compact)document.getElementById('toggle-compact').classList.remove('on');
if(!state.settings.anim)document.getElementById('toggle-anim').classList.remove('on');
document.querySelector('.user-name').textContent=state.settings.name;
document.querySelector('.avatar').textContent=state.settings.name[0].toUpperCase();
document.getElementById('name-input').value=state.settings.name;
renderDashboard();