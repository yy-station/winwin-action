/* ===== YY大脑发电站 - Core Logic ===== */

/* ===== Storage Layer (Supabase synced + localStorage fallback) ===== */
/* ★ 配置区：把下面两个值换成你的 Supabase 项目值即可开启云端同步 ★
   没配置（保持 YOUR_SUPABASE_URL）时，自动回退为本地模式，功能不受影响。 */
const SUPABASE_URL = 'https://gewxrwazfqgkaquiivou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vForc7if6gPFteZ1MkDE4w_fHneIoy1';
const SYNC_ENABLED = SUPABASE_URL.startsWith('http');

let sbClient = null;
if (SYNC_ENABLED) {
  try { sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){ console.warn('supabase init failed', e); }
}

const Store = {
  _d: {},
  _uid: null,
  load() {
    try { this._d = JSON.parse(localStorage.getItem('yy-station') || '{}'); } catch(e) { this._d = {}; }
    return this._d;
  },
  save() { localStorage.setItem('yy-station', JSON.stringify(this._d)); },
  get(k, def) {
    if (!(k in this._d)) {
      this._d[k] = (def instanceof Function) ? def() : JSON.parse(JSON.stringify(def));
      this.save();
    }
    return this._d[k];
  },
  set(k, v) {
    this._d[k] = v;
    this.save();
    if (SYNC_ENABLED && this._uid) this._syncSet(k, v);
  },
  async _syncSet(k, v) {
    try {
      await sbClient.from('app_data').upsert(
        { user_id: this._uid, key: k, value: v },
        { onConflict: 'user_id,key' }
      );
    } catch(e) { console.warn('sync failed', e); }
  },
  async loadRemote(uid) {
    this._uid = uid;
    if (!SYNC_ENABLED || !sbClient) return;
    try {
      const { data, error } = await sbClient.from('app_data').select('key,value').eq('user_id', uid);
      if (!error && data) {
        data.forEach(r => { this._d[r.key] = r.value; });
        this.save();
      }
    } catch(e) { console.warn('load remote failed', e); }
  },
  reset() {
    this._d = {}; this._uid = null;
    try { localStorage.removeItem('yy-station'); } catch(e){}
  }
};

/* ===== Daily Quotes (31) ===== */
const QUOTES = [
  {zh:'种一棵树最好的时间是十年前，其次是现在。',en:'The best time to plant a tree was 20 years ago. The second best time is now.'},
  {zh:'你不需要很厉害才能开始，但你需要开始才能很厉害。',en:"You don't have to be great to start, but you have to start to be great."},
  {zh:'今天的努力，是明天的底气。',en:"Today's effort is tomorrow's confidence."},
  {zh:'行动是治愈焦虑的良药。',en:'Action is the antidote to anxiety.'},
  {zh:'微小的坚持，终将汇聚成海。',en:'Small consistencies compound into oceans.'},
  {zh:'慢慢来，比较快。',en:'Slow and steady wins the race.'},
  {zh:'日拱一卒，功不唐捐。',en:'Daily progress, however small, never goes in vain.'},
  {zh:'认真生活的人，生活不会亏待他。',en:'Life rewards those who live earnestly.'},
  {zh:'向内生长，向外绽放。',en:'Grow inward, bloom outward.'},
  {zh:'每一个不曾起舞的日子，都是对生命的辜负。',en:'Every day without dance is a betrayal of life.'},
  {zh:'你只管努力，剩下的交给时间。',en:'Just do your best, and let time handle the rest.'},
  {zh:'读书破万卷，下笔如有神。',en:'Read ten thousand books, write as if inspired.'},
  {zh:'真正的勇敢，是知道生活的真相后依然热爱生活。',en:'True courage is loving life after knowing its truth.'},
  {zh:'愿你成为自己的太阳，无需凭借谁的光。',en:'May you become your own sun, needing no one else\'s light.'},
  {zh:'生活不在别处，当下即是全部。',en:'Life is not elsewhere; the present is everything.'},
  {zh:'知足且上进，温柔而坚定。',en:'Content yet ambitious, gentle yet firm.'},
  {zh:'把喜欢的事做到极致，它就会变成你的价值。',en:'Take what you love to the extreme, and it becomes your worth.'},
  {zh:'星光不问赶路人，时光不负有心人。',en:"The stars don't question the traveler; time doesn't fail the determined."},
  {zh:'既然选择了远方，便只顾风雨兼程。',en:'Having chosen the distant horizon, press on through wind and rain.'},
  {zh:'一切都会过去的，而过去了的，就会成为亲切的怀恋。',en:'All shall pass, and what passes becomes fond memory.'},
  {zh:'你的人生不会辜负你的每一份努力。',en:'Life never fails the effort you invest.'},
  {zh:'优秀不是一种行为，而是一种习惯。',en:'Excellence is not an act, but a habit.'},
  {zh:'所有的限制，都是自我设限。',en:'All limits are self-imposed.'},
  {zh:'保持热爱，奔赴山海。',en:'Keep your passion alive, and chase every horizon.'},
  {zh:'做难事必有所得。',en:'Tackling difficulties brings rewards.'},
  {zh:'不要等待机会，而要创造机会。',en:"Don't wait for opportunity. Create it."},
  {zh:'心若没有栖息的地方，到哪里都是流浪。',en:'A heart without a home wanders everywhere.'},
  {zh:'你所浪费的今天，是昨天死去的人奢望的明天。',en:'The today you waste is the tomorrow the dead longed for.'},
  {zh:'向下扎根，向上生长。',en:'Root downward, grow upward.'},
  {zh:'凡是过往，皆为序章。',en:'What is past is prologue.'},
  {zh:'人生没有白走的路，每一步都算数。',en:'No step in life is wasted; every one counts.'}
];

/* ===== Nav Config ===== */
const NAV = [
  { group:'总览', items:[
    {id:'dashboard', label:'首页仪表盘', icon:'🏠'},
    {id:'todayPlan', label:'今日计划', icon:'📋'},
  ]},
  { group:'工作', items:[
    {id:'career', label:'职业发展', icon:'🎯'},
    {id:'mediaPlan', label:'自媒体计划', icon:'📱'},
    {id:'aiSkills', label:'AI技能库', icon:'🤖'},
  ]},
  { group:'生活', items:[
    {id:'learning', label:'学习计划', icon:'📚'},
    {id:'exercise', label:'运动打卡', icon:'🏃'},
    {id:'hobbies', label:'兴趣爱好', icon:'🎨'},
    {id:'wellness', label:'养生护肤', icon:'🧖'},
    {id:'travel', label:'旅行计划', icon:'✈️'},
    {id:'insurance', label:'保险计划', icon:'🛡️'},
  ]},
  { group:'复盘', items:[
    {id:'review', label:'今日复盘', icon:'🌙'},
  ]},
];

/* ===== 日日是好日 模块定义 ===== */
const HHD_ITEMS=[
  {ico:'📖', name:'英语提升', page:'learning', themeName:'英语'},
  {ico:'📚', name:'阅读输入', page:'learning', themeName:'书影音'},
  {ico:'🏃', name:'运动塑形', page:'exercise'},
  {ico:'🍳', name:'饮食健康', page:'wellness'},
  {ico:'🧘', name:'情绪平稳', page:'wellness'},
  {ico:'😴', name:'睡眠记录', page:'review'},
  {ico:'🖌️', name:'练毛笔字', page:'learning', themeName:'练毛笔字'},
  {ico:'🧴', name:'养生护肤', page:'wellness'},
];
/* 今日已完成的固定打卡索引（WorkBuddy 根据用户汇报一次性预置，过期失效） */
const ENSURE_TODAY_CHECKIN_DATE='2026-08-06';
const ENSURE_TODAY_CHECKIN_DONE=[false,false,false,true,false,false,false,false]; // 早餐已吃→饮食健康✓
/* 今日计划已完成项自动勾选（按关键词模糊匹配，标记 done=true + doneAt；WorkBuddy 每日基于对话汇报更新）
   注意：① 早餐/护肤通过饮食+护肤父任务的子项标识，correctTodayItems 直接精确控制；② 饮水不在内（视用户当日实际完成情况手动勾选，避免误标） */
const ENSURE_TODAY_DONE_DATE='2026-08-06';
const ENSURE_TODAY_DONE_INJECTIONS=[];
function ensureTodayDoneOverride(){
  if(ENSURE_TODAY_DONE_DATE!==todayStr()) return; // 仅对标记日期生效
  const a=getTodos();
  let changed=false;
  // 天然幂等：已 done 的项不重复处理
  ENSURE_TODAY_DONE_INJECTIONS.forEach(ov=>{
    a.forEach(t=>{
      if(t.date===todayStr() && !t.done && t.title && t.title.indexOf(ov.kw)>=0){
        t.done=true;
        t.doneAt=nowStamp();
        if(t.subs&&t.subs.length){
          t.subs.forEach(s=>{ if(!s.done){ s.done=true; s.doneAt=nowStamp(); } });
        }
        changed=true;
      }
    });
  });
  if(changed) saveTodos(a);
}
const HHD_CATS={
  learning:{label:'学习', color:'#D6E4F8'},
  exercise:{label:'运动', color:'#D4EDE3'},
  wellness:{label:'生活', color:'#F5DEE3'},
  review:{label:'复盘', color:'#E6E2F0'},
};

/* ===== Utils ===== */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fmtDate(s){if(!s)return '';const [y,m,d]=s.split('-');return `${y}年${m}月${d}日`}
function dayOfYear(){const n=new Date();const s=new Date(n.getFullYear(),0,0);return Math.floor((n-s)/86400000)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function getQuote(){return QUOTES[dayOfYear()%QUOTES.length]}
function weekdayStr(){const w=['日','一','二','三','四','五','六'];return '星期'+w[new Date().getDay()]}
function timeStr(){const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function dateStr(){const d=new Date();return `${d.getMonth()+1}月${d.getDate()}日 ${weekdayStr()}`}
function dateOffsetStr(n){const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function weekCells(){
  const w=['一','二','三','四','五','六','日'];
  const today=new Date();
  const dow=(today.getDay()+6)%7; // 周一=0
  const monday=new Date(today); monday.setDate(today.getDate()-dow);
  const dc=Store.get('dailyCheckin',{});
  const cells=[];
  for(let i=0;i<7;i++){
    const d=new Date(monday); d.setDate(monday.getDate()+i);
    const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const rec=dc[ds];
    cells.push({lbl:w[i], num:d.getDate(), ds, today:(ds===todayStr()), dot:!!(rec&&rec.some(x=>x))});
  }
  return cells;
}
function getTodayQuote(){
  const picks=Store.get('quotePick',{});
  const t=todayStr();
  let idx;
  if(picks[t]!==undefined) idx=picks[t];
  else idx=dayOfYear()%QUOTES.length;
  return {zh:QUOTES[idx].zh, en:QUOTES[idx].en, idx};
}
function getDailyCheckin(){
  const dc=Store.get('dailyCheckin',{});
  const t=todayStr();
  return dc[t]||[false,false,false,false,false,false,false,false];
}
function hhdStreak(i){
  let n=0;
  for(let off=0; off<120; off++){
    const ds=dateOffsetStr(-off);
    const rec=Store.get('dailyCheckin',{})[ds];
    if(!rec) break;
    const derived=hhdDerived(i, ds);
    if(rec[i]||derived) n++; else break;
  }
  return n;
}
function hhdDerived(i, ds){
  if(ds===undefined) ds=todayStr();
  const wl=Store.get('wellnessLog',{})[ds]||[];
  const rv=Store.get('reviews',{})[ds];
  const cl=Store.get('contentLog',[]);
  if(i===3) return !!(wl[1]||wl[2]);
  if(i===4) return !!wl[0];
  if(i===5) return !!(rv&&rv.睡眠&&String(rv.睡眠).trim());
  if(i===1) return cl.some(x=>x.date===ds);
  return false;
}
function toggleDailyCheckin(i){
  const dc=Store.get('dailyCheckin',{});
  const t=todayStr();
  if(!dc[t]) dc[t]=[false,false,false,false,false,false,false,false];
  dc[t][i]=!dc[t][i];
  Store.set('dailyCheckin',dc);
  // 同步到养生页相关项
  if(i===4||i===3){
    const wl=Store.get('wellnessLog',{});
    if(!wl[t]) wl[t]=[false,false,false,false,false,false,false];
    if(i===4) wl[t][0]=dc[t][4];
    if(i===3){ wl[t][1]=dc[t][3]; wl[t][2]=dc[t][3]; }
    Store.set('wellnessLog',wl);
  }
  // 首页「英语提升」打卡同步到学习计划-英语的30天打卡
  if(i===0){
    const data=Store.get('learningData_英语',{checkin:Array(30).fill(false)});
    const dayIdx=new Date().getDate()-1;
    if(data.checkin[dayIdx]!==dc[t][0]){
      data.checkin[dayIdx]=dc[t][0];
      Store.set('learningData_英语',data);
    }
  }
  go('dashboard');
}
function reviewCheckedIn(){
  const rc=Store.get('reviewCheckin',{});
  return !!rc[todayStr()];
}
function reviewTotalDays(){
  const rc=Store.get('reviewCheckin',{});
  return Object.keys(rc).filter(d=>rc[d]).length;
}
function toggleReviewCheckin(){
  const rc=Store.get('reviewCheckin',{});
  const t=todayStr();
  if(rc[t]) delete rc[t];
  else rc[t]=true;
  Store.set('reviewCheckin',rc);
  go('dashboard');
}
function cycleQuote(){
  const picks=Store.get('quotePick',{});
  const t=todayStr();
  const cur=getTodayQuote().idx;
  const next=(cur+1)%QUOTES.length;
  picks[t]=next;
  // 防膨胀：保留最近 60 天
  const keys=Object.keys(picks).sort();
  while(keys.length>60){ delete picks[keys.shift()]; }
  Store.set('quotePick',picks);
  go('dashboard');
}
function randomQuote(){
  const picks=Store.get('quotePick',{});
  const t=todayStr();
  const cur=getTodayQuote().idx;
  let next;
  do{ next=Math.floor(Math.random()*QUOTES.length); }while(next===cur&&QUOTES.length>1);
  picks[t]=next;
  const keys=Object.keys(picks).sort();
  while(keys.length>60){ delete picks[keys.shift()]; }
  Store.set('quotePick',picks);
  go('dashboard');
}
function readQuote(){
  const q=getTodayQuote();
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(q.en);
    u.lang='en-US'; u.rate=0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }else{
    showToast('当前浏览器不支持语音朗读');
  }
}
function copyQuote(){
  const q=getTodayQuote();
  const text=q.en+'\n'+q.zh;
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=>showToast('已复制到剪贴板'));
  }else{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy'); showToast('已复制到剪贴板');}catch(e){}
    document.body.removeChild(ta);
  }
}
function goHhd(i){
  const it=HHD_ITEMS[i];
  if(it.themeName!==undefined){
    let themes=Store.get('learningThemes',['英语','书影音','中级经济师','考驾照']);
    let idx=themes.indexOf(it.themeName);
    if(idx<0){ themes=themes.concat([it.themeName]); Store.set('learningThemes',themes); idx=themes.length-1; }
    curTheme.learning=idx;
  }
  go(it.page);
}
function openHhdDetail(i){ go('hhd_'+i); }

/* 跳转到「学习计划 → 英语 → 我的英语词典 → 单词」 */
function goVocab(){
  let themes=Store.get('learningThemes',['英语','书影音','中级经济师','考驾照']);
  let idx=themes.indexOf('英语');
  if(idx<0){ themes=['英语'].concat(themes); Store.set('learningThemes',themes); idx=0; }
  curTheme.learning=idx;
  go('learning');
  setTimeout(()=>{
    const cards=Array.from(document.querySelectorAll('#page .card'));
    const dict=cards.find(c=>c.textContent.indexOf('我的英语词典')>=0);
    if(dict) dict.scrollIntoView({behavior:'smooth',block:'start'});
  },60);
}

/* 日日是好日模块 → 学习计划 → 英语 */
function goHhdEnglish(){
  let themes=Store.get('learningThemes',['英语','书影音','中级经济师','考驾照']);
  let idx=themes.indexOf('英语');
  if(idx<0){ themes=['英语'].concat(themes); Store.set('learningThemes',themes); idx=0; }
  curTheme.learning=idx;
  go('learning');
}

/* ===== Calendar ===== */
let calMonth=new Date().getMonth();
let calYear=new Date().getFullYear();
function openCalendar(){
  const now=new Date(); calMonth=now.getMonth(); calYear=now.getFullYear();
  renderCalendar();
  const m=document.getElementById('calModal'); m.classList.add('show');
}
function closeCalendar(){ document.getElementById('calModal').classList.remove('show'); }
function changeCalMonth(delta){
  calMonth+=delta;
  if(calMonth<0){calMonth=11;calYear--}else if(calMonth>11){calMonth=0;calYear++}
  renderCalendar();
}
function changeCalYear(y){
  calYear=parseInt(y,10); renderCalendar();
}
function jumpCalToday(){
  const now=new Date(); calMonth=now.getMonth(); calYear=now.getFullYear(); renderCalendar();
}
function renderCalendar(){
  const daysEl=document.getElementById('calDays'); if(!daysEl) return;
  const yearEl=document.getElementById('calYear');
  const monthLabel=document.getElementById('calMonthLabel');
  // year options
  const curYear=new Date().getFullYear();
  let opts='';
  for(let y=curYear-10;y<=curYear+5;y++){
    opts+=`<option value="${y}" ${y===calYear?'selected':''}>${y}年</option>`;
  }
  yearEl.innerHTML=opts;
  monthLabel.textContent=(calMonth+1)+'月';
  const first=new Date(calYear,calMonth,1);
  const startDay=first.getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const prevDays=new Date(calYear,calMonth,0).getDate();
  const dc=Store.get('dailyCheckin',{});
  let html='';
  // prev month padding
  for(let i=startDay-1;i>=0;i--){
    html+=`<div class="cal-day other">${prevDays-i}</div>`;
  }
  const today=todayStr();
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const rec=dc[ds]; const hasAny=!!(rec&&rec.some(x=>x));
    const isToday=(ds===today);
    html+=`<div class="cal-day ${isToday?'today':''}" onclick="selectCalDate('${ds}')">
      ${d}${hasAny?'<div class="dot"></div>':''}
    </div>`;
  }
  const totalCells=startDay+daysInMonth;
  const nextPad=(7-(totalCells%7))%7;
  for(let i=1;i<=nextPad;i++){
    html+=`<div class="cal-day other">${i}</div>`;
  }
  daysEl.innerHTML=html;
}
function selectCalDate(ds){
  // placeholder: could navigate to a day summary; for now close and maybe toast
  closeCalendar();
  showToast(ds+' 有 '+countCheckins(ds)+' 项打卡');
}
function countCheckins(ds){
  const rec=Store.get('dailyCheckin',{})[ds];
  if(!rec) return 0;
  return rec.filter(x=>x).length;
}

/* ===== State ===== */
let curPage='dashboard';
let curTheme={learning:0,exercise:0,hobbies:0};

/* ===== Auth Gate (Supabase login, localStorage fallback) ===== */
function initGate(){
  if (!SYNC_ENABLED || !sbClient) { initGateLocal(); return; }
  // 每次进入都需重新输入密码，不自动登录
  showLogin();
}
function showLogin(){
  const gate=document.getElementById('gate');
  gate.style.display='flex'; gate.classList.remove('hidden');
  const btn=document.getElementById('gateBtn');
  const hint=document.getElementById('gateHint');
  const sub=document.getElementById('gateSub');
  const email=document.getElementById('gateEmail');
  const pw=document.getElementById('gateInput');
  const sw=document.getElementById('gateSwitch');
  const saved=localStorage.getItem('yy_email');
  if(saved){
    email.style.display='none';
    sub.textContent='欢迎回来，输入密码进入';
    hint.textContent='数据已开启多设备同步';
    sw.style.display='block';
    sw.onclick=()=>{ localStorage.removeItem('yy_email'); showLogin(); };
    pw.focus();
  }else{
    email.style.display='block';
    sub.textContent='登录后数据在多设备实时同步';
    hint.textContent='首次输入邮箱+密码即自动注册账号';
    sw.style.display='none';
    email.focus();
  }
  btn.textContent='进入';
  btn.onclick=doAuth;
  pw.onkeydown=e=>{if(e.key==='Enter')btn.click()};
  email.onkeydown=e=>{if(e.key==='Enter')btn.click()};
}
async function doAuth(){
  const emailEl=document.getElementById('gateEmail');
  const pw=document.getElementById('gateInput').value;
  const hint=document.getElementById('gateHint');
  const btn=document.getElementById('gateBtn');
  const email=emailEl.value.trim() || localStorage.getItem('yy_email') || '';
  if(!email||pw.length<6){hint.textContent='请输入密码（首次需填邮箱）';hint.style.color='var(--rose)';return}
  btn.disabled=true; btn.textContent='处理中...';
  let { data, error } = await sbClient.auth.signInWithPassword({ email, password: pw });
  if (error) {
    const r = await sbClient.auth.signUp({ email, password: pw });
    if (r.error) {
      hint.textContent=/already registered/i.test(r.error.message) ? '邮箱或密码不正确' : r.error.message;
      hint.style.color='var(--rose)'; btn.disabled=false; btn.textContent='进入'; return;
    }
    localStorage.setItem('yy_email', email);
    if (r.data.session) { onLogin(r.data.session.user.id); return; }
    hint.textContent='注册成功！若开启了邮箱验证，请先查收确认邮件再登录'; hint.style.color='var(--blue)'; btn.disabled=false; btn.textContent='进入'; return;
  }
  localStorage.setItem('yy_email', email);
  onLogin(data.session.user.id);
}
async function onLogin(uid){
  await Store.loadRemote(uid);
  unlockApp();
}
function initGateLocal(){
  const pwd=Store.get('password','');
  const gate=document.getElementById('gate');
  gate.style.display='flex'; gate.classList.remove('hidden');
  document.getElementById('gateEmail').style.display='none';
  const input=document.getElementById('gateInput');
  const btn=document.getElementById('gateBtn');
  const hint=document.getElementById('gateHint');
  const sub=document.getElementById('gateSub');
  if(!pwd){
    sub.textContent='首次使用，请设置你的密码';
    hint.textContent='本地模式（未配置云端同步，可正常使用）';
    input.placeholder='设置密码（4位以上）';
    btn.textContent='设置密码';
    btn.onclick=()=>{
      const v=input.value;
      if(v.length<4){hint.textContent='密码至少4位';hint.style.color='var(--rose)';return}
      Store.set('password',v);
      unlockApp();
    };
  }else{
    btn.textContent='进入';
    btn.onclick=()=>{
      if(input.value===pwd){unlockApp()}
      else{hint.textContent='密码错误，请重试';hint.style.color='var(--rose)';input.value='';input.focus()}
    };
  }
  input.onkeydown=e=>{if(e.key==='Enter')btn.click()};
  input.focus();
}
function unlockApp(){
  const gate=document.getElementById('gate');
  gate.classList.add('hidden');
  setTimeout(()=>{gate.style.display='none'},400);
  document.getElementById('app').style.display='flex';
  buildSidebar();
  go('dashboard');
}

/* ===== Sidebar ===== */
function buildSidebar(){
  const sb=document.getElementById('sidebar');
  let h='<div class="sidebar-head"><span class="logo">💻</span><div class="name">winwin行动<small>✨ 你的私人成长引擎</small></div></div>';
  NAV.forEach(g=>{
    h+=`<div class="nav-group-label">${g.group}</div>`;
    g.items.forEach(it=>{
      h+=`<div class="nav-item" data-page="${it.id}" onclick="go('${it.id}')"><span class="ico">${it.icon}</span><span class="lbl">${it.label}</span></div>`;
    });
  });
  // 自定义模块
  const cm=getCustomModules();
  if(cm.length){
    h+='<div class="nav-group-label">我的</div>';
    cm.forEach(it=>{
      h+=`<div class="nav-item" data-page="${it.id}" onclick="go('${it.id}')"><span class="ico">${it.icon}</span><span class="lbl">${it.label}</span></div>`;
    });
  }
  h+='<div class="nav-spacer"></div>';
  h+='<div class="nav-item add-module" onclick="openModuleModal()"><span class="ico">➕</span><span class="lbl">加模块</span></div>';
  h+='<div class="nav-lock" onclick="lockApp()"><span>🔒</span><span>锁定</span></div>';
  sb.innerHTML=h;
  document.getElementById('menuBtn').onclick=toggleSidebar;
  document.getElementById('overlay').onclick=closeSidebar;
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show')}
function lockApp(){
  closeSidebar();
  if (SYNC_ENABLED && sbClient) { sbClient.auth.signOut(); }
  Store.reset();
  document.getElementById('app').style.display='none';
  showLogin();
}

/* ===== Custom Modules ===== */
function getCustomModules(){ return Store.get('customModules',[]); }
function saveCustomModules(arr){ Store.set('customModules',arr); }

function openModuleModal(){
  document.getElementById('moduleName').value='';
  document.getElementById('moduleIcon').value='';
  document.getElementById('moduleType').value='notes';
  document.getElementById('moduleModal').classList.add('show');
  setTimeout(()=>document.getElementById('moduleName').focus(),50);
}
function closeModuleModal(){ document.getElementById('moduleModal').classList.remove('show'); }
function confirmAddModule(){
  const name=document.getElementById('moduleName').value.trim();
  let icon=document.getElementById('moduleIcon').value.trim();
  const type=document.getElementById('moduleType').value;
  if(!name){alert('请输入模块名称');return}
  if(!icon) icon='📝';
  const arr=getCustomModules();
  const id='custom_'+uid();
  arr.push({id,label:name,icon,type});
  saveCustomModules(arr);
  closeModuleModal();
  buildSidebar();
  go(id);
}
function deleteCustomModule(id){
  if(!confirm('确定删除这个模块吗？'))return;
  const arr=getCustomModules().filter(x=>x.id!==id);
  saveCustomModules(arr);
  buildSidebar();
  go('dashboard');
}
function renameCustomModule(id){
  const arr=getCustomModules();
  const m=arr.find(x=>x.id===id);
  if(!m)return;
  const name=prompt('新名称：',m.label);
  if(!name||!name.trim())return;
  m.label=name.trim();
  saveCustomModules(arr);
  buildSidebar();
  go(id);
}

function renderCustomModulePage(page){
  const m=getCustomModules().find(x=>x.id===page);
  if(!m)return '<div class="sec"><div class="card"><div class="empty-hint">模块不存在</div></div></div>';
  const type=m.type||'notes';
  if(type==='notes') return renderNotesModule(m);
  if(type==='todo') return renderTodoModule(m);
  if(type==='checkin') return renderCheckinModule(m);
  return renderNotesModule(m);
}
function renderNotesModule(m){
  const content=Store.get('cmData_'+m.id,'');
  return `<div class="sec">
    <div class="card">
      <div class="cm-header">
        <div class="cm-title"><span>${m.icon}</span>${esc(m.label)}</div>
        <div class="cm-actions">
          <button onclick="renameCustomModule('${m.id}')">重命名</button>
          <button class="danger" onclick="deleteCustomModule('${m.id}')">删除</button>
        </div>
      </div>
      <textarea class="f-area" style="min-height:360px" placeholder="在这里记录你的想法、灵感、笔记..." onblur="saveNotesModule('${m.id}',this.value)">${esc(content)}</textarea>
    </div>
  </div>`;
}
function saveNotesModule(id,val){ Store.set('cmData_'+id,val); }

function renderTodoModule(m){
  const items=Store.get('cmData_'+m.id,[]);
  let html=`<div class="sec"><div class="card">
    <div class="cm-header">
      <div class="cm-title"><span>${m.icon}</span>${esc(m.label)}</div>
      <div class="cm-actions">
        <button onclick="renameCustomModule('${m.id}')">重命名</button>
        <button class="danger" onclick="deleteCustomModule('${m.id}')">删除</button>
      </div>
    </div>
    <div class="todo-add-row">
      <input type="text" id="cmTodo_${m.id}" placeholder="添加待办..." onkeydown="if(event.key==='Enter')addCmTodo('${m.id}')">
      <button class="todo-add-btn" onclick="addCmTodo('${m.id}')">+</button>
    </div>`;
  if(items.length===0) html+='<div class="empty-hint">还没有待办事项</div>';
  else items.forEach(t=>{
    html+=`<div class="todo-item">
      <div class="todo-check ${t.done?'done':''}" onclick="toggleCmTodo('${m.id}','${t.id}')"></div>
      <div class="todo-text ${t.done?'done':''}">${esc(t.text)}</div>
      <button class="todo-del" onclick="delCmTodo('${m.id}','${t.id}')">✕</button>
    </div>`;
  });
  html+='</div></div>';
  return html;
}
function addCmTodo(id){
  const input=document.getElementById('cmTodo_'+id);
  const text=input.value.trim(); if(!text)return;
  const items=Store.get('cmData_'+id,[]);
  items.push({id:uid(),text,done:false});
  Store.set('cmData_'+id,items);
  go(id);
}
function toggleCmTodo(id,tid){
  const items=Store.get('cmData_'+id,[]);
  const t=items.find(x=>x.id===tid); if(t)t.done=!t.done;
  Store.set('cmData_'+id,items);
  go(id);
}
function delCmTodo(id,tid){
  const items=Store.get('cmData_'+id,[]).filter(x=>x.id!==tid);
  Store.set('cmData_'+id,items);
  go(id);
}

function renderCheckinModule(m){
  const data=Store.get('cmData_'+m.id,{checkin:Array(7).fill(false)});
  const days=['一','二','三','四','五','六','日'];
  let html=`<div class="sec"><div class="card">
    <div class="cm-header">
      <div class="cm-title"><span>${m.icon}</span>${esc(m.label)}</div>
      <div class="cm-actions">
        <button onclick="renameCustomModule('${m.id}')">重命名</button>
        <button class="danger" onclick="deleteCustomModule('${m.id}')">删除</button>
      </div>
    </div>
    <div class="checkin-grid" style="grid-template-columns:repeat(7,1fr);gap:8px;margin:8px 0 16px">`;
  data.checkin.forEach((done,i)=>{
    html+=`<div class="checkin-block ${done?'active':''}" onclick="toggleCmCheckin('${m.id}',${i})"><span class="day-num">周${days[i]}</span></div>`;
  });
  html+=`</div><div class="checkin-progress">本周已打卡 <b>${data.checkin.filter(x=>x).length}</b> / 7 天</div>
    </div></div>`;
  return html;
}
function toggleCmCheckin(id,idx){
  const data=Store.get('cmData_'+id,{checkin:Array(7).fill(false)});
  data.checkin[idx]=!data.checkin[idx];
  Store.set('cmData_'+id,data);
  go(id);
}

/* ===== Router ===== */
function go(page){
  curPage=page;
  closeSidebar();
  // update active
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  const active=document.querySelector(`.nav-item[data-page="${page}"]`);
  if(active)active.classList.add('active');
  // update title
  let title='';
  if(page.startsWith('custom_')){
    const m=getCustomModules().find(x=>x.id===page);
    title=m?m.label:'自定义模块';
  }else{
    NAV.forEach(g=>g.items.forEach(it=>{if(it.id===page)title=it.label}));
  }
  document.getElementById('pageTitle').textContent=title;
  // render
  let html='';
  if(page.startsWith('custom_')) html=renderCustomModulePage(page);
  else if(page.startsWith('hhd_')) html=PAGES.hhdDetail(page.slice(4));
  else { const render=PAGES[page]||p404; html=render(); }
  document.getElementById('page').innerHTML=html;
  // scroll to top
  document.getElementById('page').scrollTop=0;
  // post-render hooks
  if(page==='dashboard')startClock();
  if(page==='todayPlan'){ attachTodoModals(); if(tpCalOpen) renderTodoCal(); }
}
function toggleHhdDate(i, ds){
  const dc=Store.get('dailyCheckin',{});
  if(!dc[ds]) dc[ds]=[false,false,false,false,false,false];
  dc[ds][i]=!dc[ds][i];
  Store.set('dailyCheckin',dc);
  // sync wellness if relevant
  if(i===4||i===3){
    const wl=Store.get('wellnessLog',{});
    if(!wl[ds]) wl[ds]=[false,false,false,false,false,false,false];
    if(i===4) wl[ds][0]=dc[ds][4];
    if(i===3){ wl[ds][1]=dc[ds][3]; wl[ds][2]=dc[ds][3]; }
    Store.set('wellnessLog',wl);
  }
  go('hhd_'+i);
}
const PAGES={};

/* ===== 1.1 Dashboard ===== */
function ensureTodayDailyCheckin(){
  if(ENSURE_TODAY_CHECKIN_DATE!==todayStr()) return; // 仅对标记日期生效
  const dc=Store.get('dailyCheckin',{});
  if(dc[ENSURE_TODAY_CHECKIN_DATE]) return; // 当天已记录，幂等
  dc[ENSURE_TODAY_CHECKIN_DATE]=ENSURE_TODAY_CHECKIN_DONE.slice();
  Store.set('dailyCheckin',dc);
}
PAGES.dashboard=function(){
  ensureTodayDailyCheckin(); // 当天固定打卡预置（幂等）
  ensureTodayDoneOverride(); // 今日已完成项自动勾选（首页打开也触发）
  maintainTodos();           // 归档过期已完成 + 清理重复 + 按需顺延（含今日内容一次性校正）
  syncSkincareCheckinFromTodo(); // 护肤项完成 → HHD「养生护肤」自动打卡（双向同步）
  const q=getTodayQuote();
  const now=new Date();
  // 复盘（今日打卡）
  const rv=Store.get('reviews',{});
  const today=todayStr();
  const reviewDone=reviewCheckedIn();
  const lastReview=Object.keys(rv).filter(d=>d!==today&&d!=='_curDate').sort().pop();
  // 日日是好日
  const dc=getDailyCheckin();
  const hhdDone=HHD_ITEMS.map((it,i)=>dc[i]||hhdDerived(i));
  const hhdCount=hhdDone.filter(Boolean).length;
  let hhdHtml='';
  const usedCats=new Set();
  HHD_ITEMS.forEach((it,i)=>{
    const done=hhdDone[i];
    const streak=hhdStreak(i);
    const cat=HHD_CATS[it.page]||{label:'其他',color:'#F0EEF5'};
    usedCats.add(cat.label);
    hhdHtml+=`<div class="hhd-item ${done?'done':''}" onclick="goHhd(${i})" style="position:relative;cursor:pointer;border-radius:16px;border:1.5px solid rgba(0,0,0,.06);text-align:left;background:${cat.color};padding:12px 40px 12px 12px;min-height:80px">
      <div class="hhd-check" onclick="event.stopPropagation();toggleDailyCheckin(${i})" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;border:2px solid #C4BED6;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;cursor:pointer;z-index:2"></div>
      <div class="hhd-ico-wrap" style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05);flex-shrink:0"><div class="hhd-ico" style="font-size:22px;line-height:1">${it.ico}</div></div>
      <div class="hhd-main" style="min-width:0;display:flex;flex-direction:column;gap:3px;overflow:hidden">
        <div class="hhd-name" style="font-size:12.5px;font-weight:700;color:#332E44;line-height:1.3">${it.name}</div>
        <div class="hhd-sub" style="font-size:10.5px;color:#8E87A4;font-weight:600;line-height:1.3">${done?(streak>0?('连续'+streak+'天'):'已完成'):'去打卡'}</div>
      </div>
    </div>`;
  });
  const legendHtml=Array.from(usedCats).map(label=>{
    const c=Object.values(HHD_CATS).find(x=>x.label===label);
    return `<span class="hhd-leg"><i style="background:${c?c.color:'#F0EEF5'}"></i>${label}</span>`;
  }).join('');
  // 复盘卡片：单一统一模块（不再切分多行，底部单块易单手触达）
  const revDays=reviewTotalDays();
  const reviewCard=`<div class="card review-card ${reviewDone?'done':''}" onclick="go('review')">
      <div class="hhd-check" onclick="event.stopPropagation();toggleReviewCheckin()"></div>
      <div class="rev-single">
        <span class="ico">🌙</span>
        <span class="rev-title">今日复盘</span>
        <span class="rev-status">${reviewDone?'已打卡 ✓':(lastReview?('上次 '+fmtDate(lastReview)):'待打卡')}</span>
        <span class="rev-total">累计 <b>${revDays}</b> 天</span>
      </div>
    </div>`;

  let html=`
  <div class="sec dash-sec">
    <div class="cal-bar" onclick="openCalendar()">
      <div class="cal-bar-left">
        <span class="cal-bar-date">${now.getMonth()+1}月${now.getDate()}日</span>
        <span class="cal-bar-week">${weekdayStr()}</span>
      </div>
      <div class="cal-bar-right">
        <span class="cal-bar-clock" id="clock">${timeStr()}</span>
        <span class="cal-bar-go">月历 ›</span>
      </div>
    </div>
    <div class="quote-card">
      <div class="quote-deco">“</div>
      <div class="quote-en">${esc(q.en)}</div>
      <div class="quote-zh">${esc(q.zh)}</div>
      <div class="quote-actions">
        <button onclick="readQuote()"><span>🔊</span>朗读</button>
        <button onclick="goVocab()"><span>📖</span>生词</button>
        <button onclick="randomQuote()"><span>🔄</span>换一句</button>
      </div>
    </div>
    <div class="card">
      <div class="hhd-head" onclick="goHhdEnglish()">
        <div class="card-title" style="margin:0;cursor:pointer"><span class="ico">🌿</span>日日是好日</div>
        <div class="hhd-count">今日固定打卡 <b>${hhdCount}</b>/8</div>
      </div>
      <div class="hhd-grid">${hhdHtml}</div>
      <div class="hhd-legend">${legendHtml}</div>
      <div class="progress-bar" style="margin-top:14px"><div class="progress-bar-fill" style="width:${Math.round(hhdCount/8*100)}%"></div></div>
    </div>
    ${reviewCard}
  </div>`;
  return html;
};
let clockTimer=null;
function startClock(){
  if(clockTimer)clearInterval(clockTimer);
  clockTimer=setInterval(()=>{
    const el=document.getElementById('clock'); if(!el)return;
    const t=timeStr();
    if(el.textContent!==t){
      el.textContent=t;
      if(t==='00:00'&&curPage==='dashboard') go('dashboard');
    }
  },1000);
}

/* ===== 1.1b HHD Detail ===== */
PAGES.hhdDetail=function(idxStr){
  const i=parseInt(idxStr,10);
  if(isNaN(i)||i<0||i>=HHD_ITEMS.length) return p404();
  const it=HHD_ITEMS[i];
  const now=new Date(); const y=now.getFullYear(); const m=now.getMonth();
  const first=new Date(y,m,1); const startDay=first.getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const prevDays=new Date(y,m,0).getDate();
  const dc=Store.get('dailyCheckin',{});
  const today=todayStr();
  let daysHtml='';
  for(let k=startDay-1;k>=0;k--){
    daysHtml+=`<div class="cal-day other">${prevDays-k}</div>`;
  }
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const rec=dc[ds]||[false,false,false,false,false,false];
    const done=rec[i]||hhdDerived(i,ds);
    const isToday=(ds===today);
    daysHtml+=`<div class="cal-day ${isToday?'today':''} ${done?'done':''}" onclick="toggleHhdDate(${i},'${ds}')">${d}</div>`;
  }
  const totalCells=startDay+daysInMonth;
  const nextPad=(7-(totalCells%7))%7;
  for(let k=1;k<=nextPad;k++){
    daysHtml+=`<div class="cal-day other">${k}</div>`;
  }
  const streak=hhdStreak(i);
  return `<div class="sec">
    <div class="hhd-detail-head">
      <div class="back" onclick="go('dashboard')">‹</div>
      <div class="ico">${it.ico}</div>
      <div class="txt">
        <div class="name">${it.name}</div>
        <div class="streak">${streak>0?'已连续打卡 '+streak+' 天':'本月打卡日历'}</div>
      </div>
    </div>
    <div class="card hhd-detail-cal">
      <div class="card-title" style="margin-bottom:10px"><span class="ico">📅</span>${y}年${m+1}月</div>
      <div class="cal-weekdays">
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>
      <div class="cal-days">${daysHtml}</div>
      <div style="margin-top:14px;font-size:12px;color:var(--t3);font-weight:600;display:flex;align-items:center;gap:6px">
        <span style="width:10px;height:10px;border-radius:3px;background:var(--sage);display:inline-block"></span> 已打卡
        <span style="width:10px;height:10px;border-radius:3px;background:var(--lav);display:inline-block;margin-left:8px"></span> 今天
      </div>
    </div>
    <button class="cal-today-btn" style="margin-top:12px" onclick="goHhd(${i})">去${it.name}页面记录</button>
  </div>`;
};

/* ===== 1.2 Daily Plan ===== */
/* ===== 今日计划 / Today Plan ===== */
const TP_CATS=[
  {key:'work',  label:'工作', color:'var(--gold)',  bg:'#FDF6D8', ico:'💼'},
  {key:'study', label:'学习', color:'var(--blue)',  bg:'#E7EEF8', ico:'📚'},
  {key:'exercise', label:'运动', color:'var(--sage)', bg:'#D4EDE3', ico:'🏃'},
  {key:'life',  label:'生活', color:'var(--rose)',  bg:'#F9E5EA', ico:'🏠'},
  {key:'fun',   label:'娱乐', color:'var(--lav)',   bg:'#EAE6F3', ico:'🎬'},
  {key:'other', label:'其他', color:'var(--taupe)', bg:'#EFEDF3', ico:'📌'},
  {key:'free',  label:'有空', color:'var(--mint)',  bg:'#E3F2E8', ico:'🍃'},
  {key:'buy',   label:'购买', color:'var(--coral)', bg:'#FCE9E1', ico:'🛒'},
];
/* 智能归类（基于关键词 + 主题 + 语境）：根据标题字符串推断 cat
   优先级：运动 > 娱乐 > 工作 > 学习 > 生活 > 购买 > 其他
   用户示例：拍八虚 → 运动；看小鱼讲解《宫》→ 娱乐；Codex 教程 → 工作（Codex 平台相关） */
function autoClassify(title){
  const t=(title||'');
  if(!t) return 'other';
  if(/拍八虚|运动|跑步|跑|散步|瑜伽|拉伸|健身|锻炼|hiit|体操|八段锦|拍打|跳绳|深蹲|俯卧撑|仰卧起坐|塑形|燃脂|有氧|打拳|拳击|摔|球|游泳|骑行|骑车|舞/.test(t)) return 'exercise';
  if(/看小鱼讲解|剧集|综艺|电影|看剧|追剧|刷剧|视频|抖音|短视频|讲解|解说|看.{0,3}集|看.{0,3}片/.test(t)) return 'fun';
  if(/Codex|求职|公司|小红书|文章|周报|日报|维护|巡检|LLM Wiki|Horizon|客户|项目|运营|咨询|实践|开发|编程|代码|副业|业务|发布|投稿|投简历|面试|纪要|会议|上线|部署|数据库|模型|训练|微调|调优|优化|流程|规范|提示|prompt/.test(t)) return 'work';
  if(/阅读|读书|教程|课程|英语|多邻国|雅思|字典|词典|学习|记单词|记笔记|课本|背单词|练口语|读完|看完书|学完|背课文|预习|复习|刷题|真题|考试|刷题|读《/.test(t)) return 'study';
  if(/Codex|求职|公司|小红书|文章|周报|日报|维护|巡检|LLM Wiki|Horizon|客户|项目|运营|咨询|实践|开发|编程|代码|副业|业务|发布|投稿|找工|投简历|面试|纪要|会议|上线|部署|数据库|模型|训练|微调|调优|优化|流程|规范|工具|技能|提示|prompt/.test(t)) return 'work';
  if(/饮食|早餐|午餐|晚餐|饮水|护肤|敷面膜|身体乳|开窗|通风|指甲|起床|睡觉|做饭|洗碗|打扫|卫生|洗衣|扫地|拖地|洗浴巾|洗床单|家务|洗脸|刷牙|洗澡|午休|吃水果|喝水|买菜|洗菜|切菜|炒菜|煮|蒸|熬|炖|泡|调料|煎/.test(t)) return 'life';
  if(/买|购|订|下单|京东|淘宝|拼多多|快递|取件|收件|订单|办卡|充值|缴费|取|付|收|寄|物流|到货|外卖|跑腿|扫码|支付|到店/.test(t)) return 'buy';
  return 'other';
}
let tpTab='today';
let tpCalOpen=false;
let tpCalSel=null;
let tpDraft={cat:'work',pri:'mid',rep:'none',editId:null};
let tpCalMonth=new Date().getMonth();
let tpCalYear=new Date().getFullYear();

/* ===== 每日清单模板（WorkBuddy 按对话汇报每天更新；TODAY_TEMPLATE_DATE 为适用日期）===== */
const TODAY_TEMPLATE_DATE='2026-08-06';
const TODAY_TEMPLATE=[
  {title:'饮食', cat:'life', subs:[
    {title:'早餐：一个玉米 + 2 个鸡蛋 + 燕麦奶 + 8 颗红枣'},
    {title:'午餐：茄辣西（一个茄子 + 一个圆椒 + 一个西红柿 + 2 个鸡蛋）+ 0.7kg 西瓜'},
    {title:'晚餐'}
  ]},
  {title:'落地运用 xuan 酱教学视频内容（Obsidian 应用）', cat:'study'},
  {title:'定制 LLM Wiki 知识库迭代系统（基于 Karpathy 理论）', cat:'study'},
  {title:'在 Codex 中维护 Horizon AI 采集系统（巡检）', cat:'work'},
  {title:'看完陈悠秀 Codex 完整教程', cat:'study', done:true},
  {title:'在 Codex 启动求职相关咨询实践', cat:'work'},
  {title:'一篇小红书文章定稿', cat:'work'},
  {title:'拍八虚', cat:'exercise', done:true},
  {title:'开窗通风', cat:'life', done:true},
  {title:'剪手指甲 + 指甲护理', cat:'life', done:true},
  {title:'看小鱼讲解《宫》23集', cat:'fun', done:true},
  {title:'饮水：目标 2L', cat:'life'},
  {title:'运动', cat:'exercise', subs:[
    {title:'舒缓运动 30 分钟（散步/拉伸）'},
    {title:'电脑间隙欧阳春晓瘦背操'}
  ]},
  {title:'护肤', cat:'life', subs:[
    {title:'敷面膜'},
    {title:'涂身体乳'}
  ]},
  {title:'多邻国英语打卡', cat:'study'},
  {title:'阅读打卡（≥30 分钟）', cat:'study'},
  {title:'阅读《沧浪之水》第45章', cat:'study', done:true}
];
/* 明日模板（今天打开今日计划时，明天 Tab 就能看到；date 强制为 tomorrow） */
const TOMORROW_TEMPLATE_DATE='2026-08-07';
const TOMORROW_TEMPLATE=[
  {title:'定制 LLM Wiki 知识库迭代系统（推进）', cat:'study'},
  {title:'在 Codex 中维护 Horizon AI 采集系统（巡检）', cat:'work'},
  {title:'一篇小红书文章定稿', cat:'work'},
  {title:'多邻国英语打卡', cat:'study'},
  {title:'阅读打卡（≥30 分钟）', cat:'study'},
  {title:'早餐（营养均衡）', cat:'life'},
  {title:'午餐（蛋白质优先）', cat:'life'},
  {title:'晚餐', cat:'life'},
  {title:'饮水：目标 2L', cat:'life'},
  {title:'运动', cat:'life', subs:[
    {title:'舒缓运动 30 分钟（散步/拉伸/瑜伽）'},
    {title:'电脑间隙欧阳春晓瘦背操'}
  ]},
  {title:'护肤：基础护肤', cat:'life'}
];
/* 周一固定家务（自动追加；只注入到今天=周一的清单；周二~周日不出现） */
const WEEKLY_HABITS_MONDAY=[
  {title:'家务：拖地', cat:'life'},
  {title:'家务：洗浴巾', cat:'life'},
  {title:'家务：洗床单', cat:'life'}
];
function nowStamp(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function buildTemplateItem(t){
  const o={id:uid(), title:t.title, date:todayStr(), time:'', cat:t.cat||'work', pri:t.pri||'mid', rep:t.rep||'none', done:!!t.done, doneAt:t.done?nowStamp():null, subs:[], tpl:TODAY_TEMPLATE_DATE, created:Date.now()};
  if(t.subs&&t.subs.length){ o.subs=t.subs.map(s=>({title:s.title, done:!!s.done, doneAt:s.done?nowStamp():null})); o.done=o.subs.every(s=>s.done); o.doneAt=o.done?nowStamp():null; }
  return o;
}
function ensureTodayTemplate(){
  if(TODAY_TEMPLATE_DATE!==todayStr()) return; // 模板只对标记的日期生效
  const a=getTodos();
  if(a.some(t=>t.tpl===TODAY_TEMPLATE_DATE)) return; // 当天已注入，幂等
  a.push(...TODAY_TEMPLATE.map(buildTemplateItem));
  saveTodos(a);
}
/* ===== 任务生命周期：归档 + 按需顺延 + 历史重复清理 ===== */
function getTodosArchive(){ return Store.get('todosArchive',[]); }
function saveTodosArchive(arr){ Store.set('todosArchive',arr); }
/* 1) 归档：已完成且非当天的事项 → 次日自动移出活动列表（数据保留在 todosArchive，不丢失、可查） */
function archiveDoneTodos(){
  const a=getTodos(), today=todayStr();
  const keep=[], arch=getTodosArchive();
  let changed=false;
  a.forEach(t=>{
    if(t.done && (!t.date || t.date<today)){ arch.push(t); changed=true; }
    else keep.push(t);
  });
  if(changed){ saveTodos(keep); saveTodosArchive(arch); }
}
/* 2) 按需顺延：仅 carryNext 标记的过期未完成项顺延到今天（直接改日期，不复制，杜绝重复） */
function ensureCarryOver(){
  const a=getTodos(), today=todayStr(); let changed=false;
  a.forEach(t=>{
    if(!t.carryNext || t.done || !t.date || t.date>=today) return;
    // 防重复：今天已存在同 title+cat 的同内容项则跳过（幂等）
    if(a.some(x=>x.date===today && x.cat===t.cat && x.title===t.title && x.id!==t.id && !x.carryNext)) return;
    t.date=today; t.carryNext=false; changed=true;
  });
  if(changed) saveTodos(a);
}
/* 3) 一次性清洗：删除旧机制 roll copy + 合并 (date+cat+title) 完全重复项（保留已完成状态，杜绝同项双显） */
function cleanupLegacyDuplicates(){
  const a=getTodos(); let changed=false; const out=[];
  const seen=new Map();
  a.forEach(t=>{
    // 旧 ensureRollover 产生的顺延副本（tpl 以 roll: 开头）直接清除
    if(t.tpl && String(t.tpl).indexOf('roll:')===0){ changed=true; return; }
    const key=(t.date||'')+'|'+(t.cat||'')+'|'+(t.title||'');
    const hit=seen.get(key);
    if(hit!==undefined){
      changed=true;
      const keep=out[hit];
      if(t.done && !keep.done){ keep.done=true; keep.doneAt=t.doneAt||keep.doneAt; }
      if(t.subs&&t.subs.length&&(!keep.subs||!keep.subs.length)) keep.subs=t.subs;
      return;
    }
    seen.set(key,out.length); out.push(t);
  });
  if(changed) saveTodos(out);
}
/* 统一数据维护入口：dashboard 与 todayPlan 打开时执行（幂等，安全） */
function maintainTodos(){
  correctTodayItems();      // 一次性校正：早餐标准化 + 护肤 cat 迁移与标题具体化 + 撤销饮水误标
  archiveDoneTodos();
  cleanupLegacyDuplicates();
  ensureCarryOver();
}
/* 一次性校正（针对 TODAY_TEMPLATE_DATE 当天）- 幂等：
   ① 早/午/晚独立项 → 迁移到「饮食」父任务的 subs（避免重复，让父任务承载三餐）
   ② 护肤相关独立项（含旧 cat='skincare'）→ 迁移到「护肤」父任务的 subs（敷面膜、涂身体乳）
   ③ 护肤迁移完成后，标记今天的「敷面膜」「涂身体乳」子项为已完成 + 早餐子项为已完成
   ④ 撤销"饮水"误标（今天未报告饮水完成） */
function correctTodayItems(){
  if(TODAY_TEMPLATE_DATE!==todayStr()) return;
  const a=getTodos(); const today=todayStr(); let changed=false;
  const stamp=nowStamp();

  // ===== ① 饮食父任务 =====
  let diet = a.find(t=>t.date===today && t.title==='饮食' && t.cat==='life');
  if(!diet){
    diet = {id:uid(), title:'饮食', date:today, time:'', cat:'life', pri:'mid', rep:'none', done:false, doneAt:null, subs:[], tpl:'diet:'+today, created:Date.now()};
    a.push(diet); changed=true;
  }
  const dietStandalone = a.filter(t => t.date===today && t.id!==diet.id && (
    t.title==='早餐：一个玉米 + 2 个鸡蛋 + 燕麦奶 + 8 颗红枣' ||
    /^早餐[：:]/.test(t.title||'') ||
    t.title==='午餐（蛋白质优先）' ||
    t.title==='晚餐'
  ));
  dietStandalone.forEach(t=>{
    let subTitle = t.title;
    if(subTitle.indexOf('早餐')===0) subTitle='早餐：一个玉米 + 2 个鸡蛋 + 燕麦奶 + 8 颗红枣';
    if(subTitle.indexOf('午餐')===0) subTitle='午餐（蛋白质优先）';
    if(subTitle.indexOf('晚餐')===0) subTitle='晚餐';
    if(!diet.subs.some(s=>s.title===subTitle)){
      diet.subs.push({title:subTitle, done:!!t.done, doneAt:t.done?(t.doneAt||stamp):null});
    }
    const idx = a.findIndex(x=>x.id===t.id);
    if(idx>=0) a.splice(idx,1);
    changed=true;
  });
  // 补全缺失子项（按前缀匹配，标题可能被 WorkBuddy 每日更新，不能按完整标题判断）
  if(!diet.subs.some(s=>s.title && s.title.indexOf('早餐')===0)){ diet.subs.push({title:'早餐：一个玉米 + 2 个鸡蛋 + 燕麦奶 + 8 颗红枣', done:false, doneAt:null}); changed=true; }
  if(!diet.subs.some(s=>s.title && s.title.indexOf('午餐')===0)){ diet.subs.push({title:'午餐（蛋白质优先）', done:false, doneAt:null}); changed=true; }
  if(!diet.subs.some(s=>s.title==='晚餐')){ diet.subs.push({title:'晚餐', done:false, doneAt:null}); changed=true; }
  // 早餐子项确保 done（今天已吃）
  const bf = diet.subs.find(s=>s.title && s.title.indexOf('早餐')===0);
  if(bf && !bf.done){ bf.done=true; bf.doneAt=bf.doneAt||stamp; changed=true; }
  // 午餐子项更新标题 + 确保 done（今天已吃：茄辣西 + 0.7kg 西瓜）
  const lunchStd='午餐：茄辣西（一个茄子 + 一个圆椒 + 一个西红柿 + 2 个鸡蛋）+ 0.7kg 西瓜';
  const lunch = diet.subs.find(s=>s.title && s.title.indexOf('午餐')===0);
  if(lunch){
    if(lunch.title!==lunchStd){ lunch.title=lunchStd; changed=true; }
    if(!lunch.done){ lunch.done=true; lunch.doneAt=lunch.doneAt||stamp; changed=true; }
  }

  // ===== ② ③ 护肤父任务 =====
  let skin = a.find(t=>t.date===today && t.title==='护肤' && t.cat==='life');
  if(!skin){
    skin = {id:uid(), title:'护肤', date:today, time:'', cat:'life', pri:'mid', rep:'none', done:false, doneAt:null, subs:[], tpl:'skin:'+today, created:Date.now()};
    a.push(skin); changed=true;
  }
  // 迁移"护肤：..."独立项 或 cat='skincare' 旧项
  const skinStandalone = a.filter(t => t.date===today && t.id!==skin.id && (
    (t.title && t.title.indexOf('护肤')===0) ||
    t.cat==='skincare'
  ));
  skinStandalone.forEach(t=>{
    if(!skin.subs.some(s=>s.title==='敷面膜')) skin.subs.push({title:'敷面膜', done:!!t.done, doneAt:t.done?(t.doneAt||stamp):null});
    if(!skin.subs.some(s=>s.title==='涂身体乳')) skin.subs.push({title:'涂身体乳', done:!!t.done, doneAt:t.done?(t.doneAt||stamp):null});
    const idx = a.findIndex(x=>x.id===t.id);
    if(idx>=0) a.splice(idx,1);
    changed=true;
  });
  // 补全子项
  ['敷面膜','涂身体乳'].forEach(title=>{
    if(!skin.subs.some(s=>s.title===title)){ skin.subs.push({title, done:false, doneAt:null}); changed=true; }
  });
  // 今天的护肤子项确保 done（已敷面膜、已涂身体乳）
  ['敷面膜','涂身体乳'].forEach(title=>{
    const sub = skin.subs.find(s=>s.title===title);
    if(sub && !sub.done){ sub.done=true; sub.doneAt=sub.doneAt||stamp; changed=true; }
  });

  // ===== ④ 撤销饮水误标 =====
  const w = a.find(t=>t.date===today && t.title && t.title.indexOf('饮水')===0 && t.done);
  if(w){ w.done=false; w.doneAt=null; changed=true; }

  // ===== ⑤ 今日新增完成项（按 autoClassify 智能归类）=====
  ['拍八虚','开窗通风','剪手指甲 + 指甲护理','看小鱼讲解《宫》23集','阅读《沧浪之水》第45章'].forEach(title=>{
    let it=a.find(t=>t.date===today && t.title===title);
    if(!it){
      const cat=autoClassify(title);
      a.push({id:uid(), title, date:today, time:'', cat, pri:'mid', rep:'none', done:true, doneAt:stamp, subs:[], tpl:'done:'+today, created:Date.now()});
      changed=true;
    }else if(!it.done){
      it.done=true; it.doneAt=it.doneAt||stamp; changed=true;
    }
  });
  const codex=a.find(t=>t.date===today && t.title && t.title.indexOf('Codex')>=0 && t.title.indexOf('教程')>=0 && !t.done);
  if(codex){ codex.done=true; codex.doneAt=codex.doneAt||stamp; changed=true; }

  // ===== ⑥ 重归类：按 autoClassify 校正已存在项的 cat（支持用户后续调整归类口径）=====
  ['拍八虚','看小鱼讲解《宫》23集','运动','阅读《沧浪之水》第45章','开窗通风','剪手指甲 + 指甲护理'].forEach(title=>{
    const it=a.find(t=>t.date===today && t.title===title);
    if(it){
      const cat=autoClassify(title);
      if(it.cat!==cat){ it.cat=cat; changed=true; }
    }
  });

  if(changed) saveTodos(a);
}
/* 双向同步：护肤 todos 完成 → 「日日是好日·养生护肤」自动打卡（dailyCheckin index 7）
   护肤由父任务（cat='life', title='护肤'）承载，子项 敷面膜+涂身体乳，全部完成即视为护肤完成 */
function syncSkincareCheckinFromTodo(){
  const today=todayStr();
  const t=getTodos().find(x=>x.date===today && x.title==='护肤' && x.cat==='life');
  if(!t) return;
  const dc=Store.get('dailyCheckin',{});
  if(!dc[today]) dc[today]=Array(8).fill(false);
  // 护肤完成判定：所有子项都 done（cat='skincare' 旧数据已被 correctTodayItems 迁移到父任务）
  const v = t.subs && t.subs.length>0 && t.subs.every(s=>s.done);
  if(dc[today][7]!==v){
    dc[today][7]=v;
    Store.set('dailyCheckin',dc);
  }
}
/* 「明天继续」标记切换：仅显式标记的过期未完成项次日才出现 */
function markCarry(id){
  const a=getTodos(); const t=a.find(x=>x.id===id); if(!t) return;
  t.carryNext=!t.carryNext; saveTodos(a);
  renderTodoList();
  renderOverdueRefresh();
  showToast(t.carryNext?'已标记：明日自动顺延':'已取消顺延');
}
/* 待处理区：过期未完成事项（不自动顺延，需手动点「明天继续」） */
function renderOverdue(){
  const today=todayStr();
  const over=getTodos().filter(t=>!t.done && t.date && t.date<today);
  if(!over.length) return '';
  const carryN=over.filter(t=>t.carryNext).length;
  let rows='';
  over.forEach(t=>{
    const c=TP_CATS.find(x=>x.key===t.cat)||TP_CATS[3];
    const marked=!!t.carryNext;
    rows+=`<div class="od-row ${marked?'marked':''}">
      <span class="od-dot" style="background:${c.color}"></span>
      <div class="od-title">${esc(t.title)}<span class="od-date">${fmtDate(t.date)}</span></div>
      <button class="od-carry ${marked?'on':''}" onclick="markCarry('${t.id}')">${marked?'✓ 明日顺延':'明天继续'}</button>
      <button class="od-del" title="删除" onclick="delTodoItem('${t.id}')">✕</button>
    </div>`;
  });
  return `<div class="card od-card">
    <div class="tp-list-head" style="margin:0 2px 6px">⏰ 待处理 · 过期未完成（不自动顺延）${carryN?` · 已标记 <b style="color:var(--lav2)">${carryN}</b> 项次日出现`:''}</div>
    <div id="overdueList">${rows}</div>
  </div>`;
}
function renderOverdueRefresh(){ const el=document.getElementById('overdueWrap'); if(el) el.innerHTML=renderOverdue(); }
/* 周一固定家务：周一注入；非周一按 tpl 或关键词双重匹配清除（覆盖手动添加的家务残留），周二~周日 today Tab 永远干净 */
function ensureWeeklyHabits(){
  const today=todayStr(), dow=new Date().getDay();
  const a=getTodos();
  if(dow!==1){
    let changed=false;
    for(let i=a.length-1; i>=0; i--){
      const t=a[i];
      const byTpl=t.tpl && t.tpl.indexOf('weekly-mon-')===0;
      // 关键词覆盖：家务、拖地、洗浴巾、洗床单、扫地、擦窗、整理等常见家务词
      const byKw=t.title && /家务|拖地|洗浴巾|洗床单|扫地|擦窗|整理房间|大扫除/.test(t.title);
      if(byTpl || byKw){
        a.splice(i,1); changed=true;
      }
    }
    if(changed) saveTodos(a);
    return;
  }
  const mark='weekly-mon-'+today;
  if(a.some(t=>t.tpl===mark)) return;
  WEEKLY_HABITS_MONDAY.forEach(t=>{
    a.push({id:uid(), title:t.title, date:today, time:'', cat:t.cat||'life', pri:'mid', rep:'none', done:false, doneAt:null, subs:[], tpl:mark, created:Date.now()});
  });
  saveTodos(a);
}
/* 明日模板：今天打开今日计划时同步注入到 tomorrow（让「明天」Tab 立即可预览；date=tomorrow，过期自动顺延规则不影响）。幂等。 */
function ensureTomorrowTemplate(){
  const tomorrow=dateAdd(todayStr(),1);
  if(TOMORROW_TEMPLATE_DATE!==tomorrow) return; // 模板日期≠明天，不注入
  const a=getTodos(), mark='tmpl-tmw-'+TOMORROW_TEMPLATE_DATE;
  if(a.some(t=>t.tpl===mark)) return;
  TOMORROW_TEMPLATE.forEach(t=>{
    const o={id:uid(), title:t.title, date:tomorrow, time:'', cat:t.cat||'work', pri:t.pri||'mid', rep:t.rep||'none', done:false, doneAt:null, subs:[], tpl:mark, created:Date.now()};
    if(t.subs&&t.subs.length){ o.subs=t.subs.map(s=>({title:s.title, done:false, doneAt:null})); o.done=false; o.doneAt=null; }
    a.push(o);
  });
  saveTodos(a);
}

function getTodos(){ return Store.get('todos',[]); }
function saveTodos(a){ Store.set('todos',a); }
function addTodoItem(o){ const a=getTodos(); a.push(o); saveTodos(a); }
function updateTodoItem(id,o){ const a=getTodos(); const i=a.findIndex(x=>x.id===id); if(i>=0)a[i]=Object.assign({},a[i],o); saveTodos(a); }
function toggleTodoItem(id, wrapEl){
  const a=getTodos(); const t=a.find(x=>x.id===id); if(!t)return;
  t.done=!t.done; t.doneAt=t.done?nowStamp():null; saveTodos(a);
  const box=wrapEl?wrapEl.querySelector('.tp-check'):null;
  const item=wrapEl?wrapEl.closest('.tp-item'):null;
  const cat=wrapEl?wrapEl.closest('.tp-cat'):null;
  // 即时 DOM 反馈：直接切换状态类，避免整列表重绘带来的延迟感
  if(box){ box.classList.toggle('done', t.done); box.textContent=t.done?'✓':''; }
  if(item) item.classList.toggle('done', t.done);
  if(cat) refreshCatCount(cat);
  if(!wrapEl) renderTodoList(); // 兜底：无 DOM 锚点时整列重绘
}
/* 子任务独立打卡：切换子项并同步父任务状态 */
function toggleSubItem(id, si, wrapEl){
  const a=getTodos(); const t=a.find(x=>x.id===id); if(!t||!t.subs||!t.subs[si])return;
  const s=t.subs[si]; s.done=!s.done; s.doneAt=s.done?nowStamp():null;
  t.done=t.subs.every(x=>x.done); t.doneAt=t.done?nowStamp():null;
  saveTodos(a);
  // 护肤父任务子项变化 → 同步 HHD「养生护肤」打卡
  if(t.title==='护肤' && t.cat==='life') syncSkincareCheckinFromTodo();
  renderTodoList(); // 子项结构简单，整列重绘保证一致
}
function refreshCatCount(catEl){
  const items=catEl.querySelectorAll('.tp-item');
  const done=catEl.querySelectorAll('.tp-item.done').length;
  const badge=catEl.querySelector('.tp-cat-count');
  if(badge) badge.textContent=done+'/'+items.length;
}
function delTodoItem(id){ saveTodos(getTodos().filter(x=>x.id!==id)); renderTodoList(); renderOverdueRefresh(); }
function dateAdd(ds,n){ const d=new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function todosByTab(tab){
  const all=getTodos();
  const today=todayStr(), tomorrow=dateAdd(today,1);
  if(tab==='today')   return all.filter(t=>t.date===today); // 仅匹配今天的日期项（非今日/周计划/无日期一律不放）
  if(tab==='tomorrow')return all.filter(t=>t.date===tomorrow);
  if(tab==='future')  return all.filter(t=>!t.date || (t.date && t.date>tomorrow)); // 无日期项 + 未来日期
  return all;
}
function tpPriTag(p){ if(!p||p==='low')return ''; return `<span class="tp-pri ${p}">${p==='high'?'高':'中'}</span>`; }
function tpRepTag(r){ if(!r||r==='none')return ''; return `<span class="tp-rep">🔁${r==='daily'?'每天':r==='weekly'?'每周':'每月'}</span>`; }
function getVisibleTodos(){
  if(tpCalOpen){
    const all=getTodos();
    if(tpCalSel) return all.filter(t=>t.date===tpCalSel);
    return all;
  }
  return todosByTab(tpTab);
}
function renderTodoItem(t){
  const timeTag=t.time?`<span class="tp-time">${esc(t.time)}</span>`:'';
  const doneAtTag=t.done&&t.doneAt?`<span class="tp-done-at">✓ ${t.doneAt.slice(11)}</span>`:'';
  const metaHtml=`<span class="tp-meta">${tpPriTag(t.pri)}${tpRepTag(t.rep)}${doneAtTag}</span>`;
  if(t.subs&&t.subs.length){
    const doneN=t.subs.filter(s=>s.done).length;
    const parentMeta=`<span class="tp-meta">${tpPriTag(t.pri)}${tpRepTag(t.rep)}${t.done&&t.doneAt?`<span class="tp-done-at">✓ ${t.doneAt.slice(11)}</span>`:''}</span>`;
    let html=`<div class="tp-item tp-parent ${t.done?'done':''}" onclick="editTodo('${t.id}')">
        <div class="tp-check-wrap" onclick="event.stopPropagation();toggleTodoItem('${t.id}', this)" title="全部完成/取消">
          <div class="tp-check ${t.done?'done':''}">${t.done?'✓':''}</div>
        </div>
        <div class="tp-main">
          <div class="tp-title-row">
            ${timeTag}<span class="tp-paren-badge">${doneN}/${t.subs.length}</span><div class="tp-title">${esc(t.title)}</div>${parentMeta}
          </div>
        </div>
        <button type="button" class="tp-del" title="删除" onclick="event.stopPropagation();delTodoItem('${t.id}')">✕</button>
      </div>`;
    t.subs.forEach((s,si)=>{
      const sTime=s.doneAt?`<span class="tp-done-at">✓ ${s.doneAt.slice(11)}</span>`:'';
      const sMeta=sTime?`<span class="tp-meta">${sTime}</span>`:'';
      html+=`<div class="tp-sub-item ${s.done?'done':''}" onclick="editTodo('${t.id}')">
        <div class="tp-check-wrap" onclick="event.stopPropagation();toggleSubItem('${t.id}',${si}, this)" title="点击完成/取消">
          <div class="tp-check ${s.done?'done':''}">${s.done?'✓':''}</div>
        </div>
        <div class="tp-main">
          <div class="tp-title-row">
            <div class="tp-title">${esc(s.title)}</div>${sMeta}
          </div>
        </div>
      </div>`;
    });
    return html;
  }
  return `<div class="tp-item ${t.done?'done':''}" onclick="editTodo('${t.id}')">
      <div class="tp-check-wrap" onclick="event.stopPropagation();toggleTodoItem('${t.id}', this)" title="点击完成/取消">
        <div class="tp-check ${t.done?'done':''}">${t.done?'✓':''}</div>
      </div>
      <div class="tp-main">
        <div class="tp-title-row">
          ${timeTag}<div class="tp-title">${esc(t.title)}</div>${metaHtml}
        </div>
      </div>
      <button type="button" class="tp-del" title="删除" onclick="event.stopPropagation();delTodoItem('${t.id}')">✕</button>
    </div>`;
}
function renderTodos(){
  const list=getVisibleTodos();
  if(list.length===0){
    let hint;
    if(tpCalOpen){
      hint = tpCalSel ? `${fmtDate(tpCalSel)} 没有安排` : '还没有任何事项';
    }else{
      hint = tpTab==='today'?'今天还没有安排':tpTab==='tomorrow'?'明天还没有安排':tpTab==='future'?'未来暂无安排':'还没有任何事项';
    }
    return `<div class="tp-empty">📭 ${hint}<br><span>点击右下角 ➕ 添加</span></div>`;
  }
  // 整体进度（叶子计数）
  const leafTotal=list.reduce((a,t)=>a+(t.subs&&t.subs.length?t.subs.length:1),0);
  const leafDone=list.reduce((a,t)=>a+(t.subs&&t.subs.length?t.subs.filter(s=>s.done).length:(t.done?1:0)),0);
  let html='';
  if(tpCalOpen && tpCalSel) html+=`<div class="tp-list-head">${fmtDate(tpCalSel)} · 当天事项</div>`;
  else if(tpCalOpen) html+=`<div class="tp-list-head">全部事项 · 按分类</div>`;
  html+=`<div class="tp-progress"><div class="tp-progress-bar"><div class="tp-progress-fill" style="width:${leafTotal?Math.round(leafDone/leafTotal*100):0}%"></div></div><span class="tp-progress-num">${leafDone}/${leafTotal} 完成</span></div>`;
  TP_CATS.forEach(c=>{
    const items=list.filter(t=>t.cat===c.key);
    if(items.length===0) return;
    // 已完成按完成时间先后排列，未完成保持原顺序在前
    const und=items.filter(t=>!t.done);
    const dn=items.filter(t=>t.done).sort((a,b)=>((a.doneAt||'')<(b.doneAt||'')?-1:1));
    const doneN=items.filter(t=>t.done).length;
    let rows='';
    und.concat(dn).forEach(t=>{ rows+=renderTodoItem(t); });
    html+=`<div class="tp-cat" style="background:${c.bg};border-left-color:${c.color}">
      <div class="tp-cat-head"><span class="tp-cat-dot" style="background:${c.color}"></span>${c.label}<span class="tp-cat-count">${doneN}/${items.length}</span></div>
      ${rows}
    </div>`;
  });
  return html;
}
function renderTodoList(){ const el=document.getElementById('tpList'); if(el)el.innerHTML=renderTodos(); }
function tpSetTab(tab){
  tpTab=tab; tpCalOpen=false;
  document.querySelectorAll('.tp-tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
  const calBtn=document.querySelector('.tp-cal-btn'); if(calBtn) calBtn.classList.remove('active');
  const cal=document.getElementById('tpCalInline'); if(cal) cal.classList.remove('open');
  renderTodoList();
}
function tpToggleCal(){
  tpCalOpen=!tpCalOpen;
  if(tpCalOpen){
    tpTab='all'; tpCalSel=null;
    const now=new Date(); tpCalMonth=now.getMonth(); tpCalYear=now.getFullYear();
  }
  go('todayPlan');
}

/* 新增 / 编辑 浮层 */
function todoFormHTML(){
  const catPills=TP_CATS.map(c=>`<span class="tp-pill" data-v="${c.key}" onclick="tpPick('tpCat','${c.key}')">${c.label}</span>`).join('');
  return `<div class="tp-modal" id="tpModal" onclick="if(event.target===this)closeTodoForm()">
    <div class="tp-modal-card">
      <div class="tp-modal-head"><span id="tpModalTitle">新增事项</span><button class="tp-x" onclick="closeTodoForm()">✕</button></div>
      <div class="tp-field"><label>标题</label><input id="tpTitle" placeholder="事项标题"></div>
      <div class="tp-section">
        <div class="tp-section-title">日期与时间</div>
        <label class="tp-switch-row">
          <span class="tp-switch-icon">📅</span>
          <span class="tp-switch-label">日期</span>
          <input type="checkbox" class="tp-switch" id="tpHasDate" onchange="tpToggleDate(this.checked)">
        </label>
        <div class="tp-switch-panel" id="tpDatePanel"><input type="date" id="tpDate"></div>
        <label class="tp-switch-row">
          <span class="tp-switch-icon">⏰</span>
          <span class="tp-switch-label">时间</span>
          <input type="checkbox" class="tp-switch" id="tpHasTime" onchange="tpToggleTime(this.checked)">
        </label>
        <div class="tp-switch-panel" id="tpTimePanel"><input type="time" id="tpTime"></div>
      </div>
      <div class="tp-field"><label>分类</label><div class="tp-pills" id="tpCat">${catPills}</div></div>
      <div class="tp-field"><label>紧急程度</label><div class="tp-pills" id="tpPri">
        <span class="tp-pill" data-v="high" onclick="tpPick('tpPri','high')">高</span>
        <span class="tp-pill" data-v="mid" onclick="tpPick('tpPri','mid')">中</span>
        <span class="tp-pill" data-v="low" onclick="tpPick('tpPri','low')">低</span>
      </div></div>
      <div class="tp-field"><label>重复</label><div class="tp-pills" id="tpRep">
        <span class="tp-pill" data-v="daily" onclick="tpPick('tpRep','daily')">每天</span>
        <span class="tp-pill" data-v="weekly" onclick="tpPick('tpRep','weekly')">每周</span>
        <span class="tp-pill" data-v="monthly" onclick="tpPick('tpRep','monthly')">每月</span>
        <span class="tp-pill" data-v="none" onclick="tpPick('tpRep','none')">无</span>
      </div></div>
      <div class="tp-modal-foot"><button class="tp-cancel" onclick="closeTodoForm()">取消</button><button class="tp-save" onclick="saveTodo()">保存</button></div>
    </div>
  </div>`;
}
function tpToggleDate(show){
  const p=document.getElementById('tpDatePanel'); if(!p)return;
  p.style.display=show?'block':'none';
  if(show){ const d=document.getElementById('tpDate'); if(!d.value) d.value=todayStr(); }
}
function tpToggleTime(show){
  const p=document.getElementById('tpTimePanel'); if(!p)return;
  p.style.display=show?'block':'none';
  if(show){ const t=document.getElementById('tpTime'); if(!t.value){ const n=new Date(); t.value=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0'); } }
}
function tpPick(group,val){
  const k=group==='tpCat'?'cat':group==='tpPri'?'pri':'rep';
  tpDraft[k]=val;
  document.querySelectorAll('#'+group+' .tp-pill').forEach(p=>p.classList.toggle('active',p.dataset.v===val));
}
function openTodoForm(){
  tpDraft={cat:'work',pri:'mid',rep:'none',editId:null};
  document.getElementById('tpModalTitle').textContent='新增事项';
  document.getElementById('tpTitle').value='';
  document.getElementById('tpDate').value='';
  document.getElementById('tpTime').value='';
  document.getElementById('tpHasDate').checked=false;
  document.getElementById('tpHasTime').checked=false;
  tpToggleDate(false); tpToggleTime(false);
  ['tpCat','tpPri','tpRep'].forEach(g=>{ const v=g==='tpCat'?'work':g==='tpPri'?'mid':'none'; document.querySelectorAll('#'+g+' .tp-pill').forEach(p=>p.classList.toggle('active',p.dataset.v===v)); });
  document.getElementById('tpModal').classList.add('show');
  setTimeout(()=>document.getElementById('tpTitle').focus(),200);
}
function closeTodoForm(){ document.getElementById('tpModal').classList.remove('show'); }
function saveTodo(){
  const title=document.getElementById('tpTitle').value.trim();
  if(!title){ document.getElementById('tpTitle').focus(); return; }
  const hasDate=document.getElementById('tpHasDate').checked;
  const hasTime=document.getElementById('tpHasTime').checked;
  const orig=tpDraft.editId?getTodos().find(x=>x.id===tpDraft.editId):null;
  const o={ id:tpDraft.editId||uid(), title, date:hasDate?document.getElementById('tpDate').value:'', time:hasTime?document.getElementById('tpTime').value:'', cat:tpDraft.cat, pri:tpDraft.pri, rep:tpDraft.rep, done:orig?orig.done:false, doneAt:orig?orig.doneAt:null, subs:orig&&orig.subs?orig.subs:[], tpl:orig?orig.tpl:null, created:orig?orig.created:Date.now() };
  if(tpDraft.editId) updateTodoItem(tpDraft.editId,o); else addTodoItem(o);
  closeTodoForm();
  renderTodoList();
}
function editTodo(id){
  const t=getTodos().find(x=>x.id===id); if(!t)return;
  tpDraft={cat:t.cat||'work',pri:t.pri||'mid',rep:t.rep||'none',editId:id};
  document.getElementById('tpModalTitle').textContent='编辑事项';
  document.getElementById('tpTitle').value=t.title;
  document.getElementById('tpDate').value=t.date||'';
  document.getElementById('tpTime').value=t.time||'';
  document.getElementById('tpHasDate').checked=!!t.date;
  document.getElementById('tpHasTime').checked=!!t.time;
  tpToggleDate(!!t.date); tpToggleTime(!!t.time);
  ['tpCat','tpPri','tpRep'].forEach(g=>{ const v=g==='tpCat'?tpDraft.cat:g==='tpPri'?tpDraft.pri:tpDraft.rep; document.querySelectorAll('#'+g+' .tp-pill').forEach(p=>p.classList.toggle('active',p.dataset.v===v)); });
  document.getElementById('tpModal').classList.add('show');
}

/* 月历总览浮层 */
function todoCalHTML(){
  return `<div class="tp-cal-modal" id="tpCalModal" onclick="if(event.target===this)closeTodoCal()">
    <div class="tp-cal-card">
      <div class="tp-cal-top">
        <button class="tp-cal-nav" onclick="tpCalChange(-1)">‹</button>
        <div class="tp-cal-title" id="tpCalTitle"></div>
        <button class="tp-cal-nav" onclick="tpCalChange(1)">›</button>
      </div>
      <div class="tp-cal-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
      <div class="tp-cal-days" id="tpCalDays"></div>
      <div class="tp-cal-detail" id="tpCalDetail"></div>
    </div>
  </div>`;
}
function openTodoCal(){ tpToggleCal(); }
function closeTodoCal(){ document.getElementById('tpCalModal').classList.remove('show'); }
function tpCalChange(delta){ tpCalMonth+=delta; if(tpCalMonth<0){tpCalMonth=11;tpCalYear--}else if(tpCalMonth>11){tpCalMonth=0;tpCalYear++} renderTodoCal(); }
function renderTodoCal(){
  const titleEl=document.getElementById('tpCalInlineTitle');
  const daysEl=document.getElementById('tpCalInlineDays');
  if(!titleEl || !daysEl) return;
  titleEl.textContent=tpCalYear+'年'+(tpCalMonth+1)+'月';
  const all=getTodos();
  const byDate={}; all.forEach(t=>{ if(t.date){ (byDate[t.date]=byDate[t.date]||[]).push(t); } });
  const first=new Date(tpCalYear,tpCalMonth,1);
  const startDay=first.getDay();
  const daysInMonth=new Date(tpCalYear,tpCalMonth+1,0).getDate();
  const prevDays=new Date(tpCalYear,tpCalMonth,0).getDate();
  const today=todayStr();
  let html='';
  for(let i=startDay-1;i>=0;i--) html+=`<div class="tp-cal-day other">${prevDays-i}</div>`;
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${tpCalYear}-${String(tpCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const items=byDate[ds]||[];
    const total=items.length, doneN=items.filter(t=>t.done).length;
    let dot='';
    if(total>0) dot= total===doneN?'<div class="tp-cal-dot all"></div>':(doneN>0?'<div class="tp-cal-dot part"></div>':'<div class="tp-cal-dot none"></div>');
    const isToday=ds===today;
    const isSel=ds===tpCalSel;
    html+=`<div class="tp-cal-day ${isToday?'today':''} ${isSel?'selected':''}" onclick="tpCalPick('${ds}')">${d}${dot}</div>`;
  }
  const totalCells=startDay+daysInMonth;
  const nextPad=(7-(totalCells%7))%7;
  for(let i=1;i<=nextPad;i++) html+=`<div class="tp-cal-day other">${i}</div>`;
  daysEl.innerHTML=html;
}
function tpCalPick(ds){ tpCalSel=(tpCalSel===ds?null:ds); renderTodoCal(); renderTodoList(); }
function renderTodoCalDetail(ds){
  const el=document.getElementById('tpCalDetail'); if(!el)return;
  if(!ds){ el.innerHTML=''; return; }
  const items=getTodos().filter(t=>t.date===ds).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  let h=`<div class="tp-cal-detail-head">${fmtDate(ds)} · ${items.length} 项</div>`;
  if(items.length===0) h+='<div class="tp-cal-empty">这一天没有安排</div>';
  else items.forEach(t=>{ h+=`<div class="tp-cal-item ${t.done?'done':''}" onclick="tpCalOpenTodo('${t.id}')"><div class="tp-check ${t.done?'done':''}">${t.done?'✓':''}</div><div class="tp-cal-item-t"><div class="tp-title">${esc(t.title)}</div><div class="tp-tags">${tpPriTag(t.pri)}${tpRepTag(t.rep)}${t.time?`<span class="tp-time">⏰${esc(t.time)}</span>`:''}</div></div></div>`; });
  el.innerHTML=h;
}
function tpCalOpenTodo(id){ closeTodoCal(); editTodo(id); }

function tpDateBarHTML(){
  const all=getTodos();
  const today=todayStr();
  const w=['日','一','二','三','四','五','六'];
  const cells=[];
  for(let off=-2;off<=2;off++){
    const d=new Date(); d.setDate(d.getDate()+off);
    const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const has=all.some(t=>t.date===ds && !t.done);
    const doneAll=all.filter(t=>t.date===ds).length>0 && all.filter(t=>t.date===ds).every(t=>t.done);
    cells.push({ds,m:d.getMonth()+1,d:d.getDate(),w:w[d.getDay()],today:ds===today,has,doneAll});
  }
  return `<div class="tp-date-bar">
    ${cells.map(c=>`<div class="tp-date-cell ${c.today?'today':''} ${tpCalOpen&&c.ds===tpCalSel?'selected':''}" onclick="tpPickDate('${c.ds}')">
      <span class="tp-date-w">${c.today?'今天':c.w}</span>
      <span class="tp-date-n">${c.m}/${c.d}</span>
      <span class="tp-date-dot ${c.doneAll?'all':c.has?'has':''}"></span>
    </div>`).join('')}
  </div>`;
}
function tpPickDate(ds){
  tpTab='all'; tpCalOpen=true; tpCalSel=ds;
  const d=new Date(ds+'T00:00:00'); tpCalMonth=d.getMonth(); tpCalYear=d.getFullYear();
  go('todayPlan');
}

PAGES.todayPlan=function(){
  ensureTodayTemplate();       // 当天模板注入（幂等）
  ensureTomorrowTemplate();    // 明天模板预注入到「明天」Tab（幂等）
  ensureTodayDoneOverride();   // 今日已完成项自动勾选（WorkBuddy 汇报的，按标题匹配）
  maintainTodos();             // 归档过期已完成 + 清理重复 + 按需顺延（原 ensureRollover 已废弃）
  syncSkincareCheckinFromTodo(); // 护肤 todos 完成 → HHD「养生护肤」自动打卡（双向同步）
  ensureWeeklyHabits();        // 周一固定家务项自动追加（仅周一当天）
  return `<div class="sec today-sec">
    <div class="tp-top">
      ${tpDateBarHTML()}
      <div class="tp-tab-row">
        <div class="tp-tabs" id="tpTabs">
          <span class="tp-tab ${tpTab==='today'&&!tpCalOpen?'active':''}" data-tab="today" onclick="tpSetTab('today')">今天</span>
          <span class="tp-tab ${tpTab==='tomorrow'&&!tpCalOpen?'active':''}" data-tab="tomorrow" onclick="tpSetTab('tomorrow')">明天</span>
          <span class="tp-tab ${tpTab==='future'&&!tpCalOpen?'active':''}" data-tab="future" onclick="tpSetTab('future')">未来</span>
        </div>
      </div>
    </div>
    <div class="tp-cal-inline ${tpCalOpen?'open':''}" id="tpCalInline">
      <div class="tp-cal-top">
        <button class="tp-cal-nav" onclick="tpCalChange(-1)">‹</button>
        <div class="tp-cal-title" id="tpCalInlineTitle"></div>
        <button class="tp-cal-nav" onclick="tpCalChange(1)">›</button>
      </div>
      <div class="tp-cal-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
      <div class="tp-cal-days" id="tpCalInlineDays"></div>
    </div>
    <div id="overdueWrap">${renderOverdue()}</div>
    <div class="tp-list" id="tpList">${renderTodos()}</div>
    <button class="tp-fab" onclick="openTodoForm()">➕</button>
  </div>`;
};

/* 将今日计划的表单弹窗挂载到 body，避免被 sidebar / #content 裁剪或遮挡 */
function attachTodoModals(){
  if(!document.getElementById('tpModal')){
    const wrap=document.createElement('div'); wrap.innerHTML=todoFormHTML();
    document.body.appendChild(wrap.firstElementChild);
  }
}

/* ===== 2.1 Career Development ===== */
PAGES.career=function(){
  const qa=Store.get('careerQA',[]);
  let html='<div class="sec">';
  html+=`<div class="card">
    <div class="card-title"><span class="ico">🎯</span>职业发展 · 经验与疑问</div>
    <div class="todo-add-row">
      <input type="text" id="qaInput" placeholder="输入你的问题或经验..." onkeydown="if(event.key==='Enter')addQuestion()">
      <button class="todo-add-btn" onclick="addQuestion()">+</button>
    </div>
    <div style="font-size:12px;color:var(--t3);margin-top:8px">点击问题可展开查看/添加回答</div>
  </div>`;
  if(qa.length===0){html+='<div class="card"><div class="empty-hint">还没有记录，开始输入你的第一个问题吧</div></div>'}
  else qa.forEach(item=>{
    html+=`<div class="qa-item">
      <div class="qa-q" onclick="toggleQA('${item.id}')">
        <span class="q-toggle">▶</span>
        <span style="flex:1">${esc(item.q)}</span>
        <button class="todo-del" onclick="event.stopPropagation();delQuestion('${item.id}')">✕</button>
      </div>
      <div class="qa-answers" id="qaAns_${item.id}">
        ${(item.answers||[]).map((a,i)=>`<div class="qa-answer"><span class="a-mark">${i+1}.</span><span style="flex:1">${esc(a)}</span><button class="todo-del" onclick="delAnswer('${item.id}',${i})">✕</button></div>`).join('')}
        <div class="qa-add-row">
          <input type="text" id="qaAnsInput_${item.id}" placeholder="添加回答/灵感..." onkeydown="if(event.key==='Enter')addAnswer('${item.id}')">
          <button class="todo-add-btn" onclick="addAnswer('${item.id}')">+</button>
        </div>
      </div>
    </div>`;
  });
  html+='</div>';
  return html;
};
function addQuestion(){
  const input=document.getElementById('qaInput');
  const text=input.value.trim();if(!text)return;
  const qa=Store.get('careerQA',[]);
  qa.push({id:uid(),q:text,answers:[]});
  Store.set('careerQA',qa);
  go('career');
}
function toggleQA(id){
  const el=document.querySelector(`.qa-q[onclick*="${id}"]`);
  const ans=document.getElementById('qaAns_'+id);
  if(ans.classList.contains('show')){
    ans.classList.remove('show');el.classList.remove('open');
  }else{
    ans.classList.add('show');el.classList.add('open');
  }
}
function addAnswer(id){
  const input=document.getElementById('qaAnsInput_'+id);
  const text=input.value.trim();if(!text)return;
  const qa=Store.get('careerQA',[]);
  const item=qa.find(x=>x.id===id);if(item){
    item.answers=item.answers||[];item.answers.push(text);
  }
  Store.set('careerQA',qa);
  go('career');
}
function delAnswer(id,idx){
  const qa=Store.get('careerQA',[]);
  const item=qa.find(x=>x.id===id);
  if(item)item.answers.splice(idx,1);
  Store.set('careerQA',qa);
  go('career');
}
function delQuestion(id){
  const qa=Store.get('careerQA',[]);
  Store.set('careerQA',qa.filter(x=>x.id!==id));
  go('career');
}

/* ===== 2.3 Media Plan ===== */
let mediaTab=0;
PAGES.mediaPlan=function(){
  const tabs=['小红书分析','抖音分析','剪辑创作'];
  let html='<div class="sec">';
  html+='<div class="media-tabs">';
  tabs.forEach((t,i)=>{html+=`<div class="media-tab ${i===mediaTab?'active':''}" onclick="switchMediaTab(${i})">${t}</div>`});
  html+='</div>';
  
  if(mediaTab===0){
    const data=Store.get('mediaRed',[]);
    html+=`<div class="card">
      <div class="card-title"><span class="ico">📕</span>小红书热门分析 & 选题灵感</div>
      <div class="f-label">日期</div><input type="date" class="f-input" id="mrDate" value="${todayStr()}">
      <div class="f-label">热门帖子分析</div><textarea class="f-area" id="mrAnalysis" style="min-height:80px" placeholder="今天看到的热门帖子特点、数据表现..."></textarea>
      <div class="f-label">选题灵感 / 推荐方向</div><textarea class="f-area" id="mrInspo" style="min-height:80px" placeholder="从女性成长/个人成长角度出发的选题灵感，影视/博客/访谈等..."></textarea>
      <button class="btn-save" onclick="saveMediaRed()">记录</button>
    </div>`;
    if(data.length)html+='<div class="card"><div class="card-title"><span class="ico">📖</span>历史记录</div>';
    data.reverse().forEach(d=>{
      html+=`<div class="inspo-item"><div class="inspo-date">${esc(d.date)}</div><div class="inspo-title">${esc(d.analysis)}</div><div class="inspo-body">${esc(d.inspo)}</div></div>`;
    });
    if(data.length)html+='</div>';
  }
  if(mediaTab===1){
    const data=Store.get('mediaDouyin',[]);
    html+=`<div class="card">
      <div class="card-title"><span class="ico">🎵</span>抖音爆款分析 & 选题灵感</div>
      <div class="f-label">日期</div><input type="date" class="f-input" id="mdDate" value="${todayStr()}">
      <div class="f-label">爆款视频分析</div><textarea class="f-area" id="mdAnalysis" style="min-height:80px" placeholder="爆款视频的特点、数据、为什么火..."></textarea>
      <div class="f-label">复盘 & 优化方向</div><textarea class="f-area" id="mdInspo" style="min-height:80px" placeholder="我发布的内容需要优化的点..."></textarea>
      <button class="btn-save" onclick="saveMediaDouyin()">记录</button>
    </div>`;
    if(data.length)html+='<div class="card"><div class="card-title"><span class="ico">📖</span>历史记录</div>';
    data.reverse().forEach(d=>{
      html+=`<div class="inspo-item"><div class="inspo-date">${esc(d.date)}</div><div class="inspo-title">${esc(d.analysis)}</div><div class="inspo-body">${esc(d.inspo)}</div></div>`;
    });
    if(data.length)html+='</div>';
  }
  if(mediaTab===2){
    const items=['剪映新手第一天','三大基本功：卡点','三大基本功：口播','三大基本功：字幕'];
    const notes=Store.get('mediaEditNotes',{});
    const check=Store.get('mediaEditCheck',{});
    html+=`<div class="card">
      <div class="card-title"><span class="ico">🎬</span>剪辑创作 · 从零到创作者</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:14px">一步步来，每掌握一项就点亮一项</div>`;
    items.forEach(it=>{
      html+=`<div class="todo-item">
        <div class="todo-check ${check[it]?'done':''}" onclick="toggleEditCheck('${esc(it)}')"></div>
        <div class="todo-text ${check[it]?'done':''}" style="flex:1">${esc(it)}</div>
      </div>
      <div style="margin-left:32px;margin-bottom:10px">
        <textarea class="f-area" style="min-height:60px" placeholder="学习笔记..." onblur="saveEditNote('${esc(it)}',this.value)">${esc(notes[it]||'')}</textarea>
      </div>`;
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
};
function switchMediaTab(i){mediaTab=i;go('mediaPlan')}
function saveMediaRed(){
  const data=Store.get('mediaRed',[]);
  data.push({id:uid(),date:document.getElementById('mrDate').value,analysis:document.getElementById('mrAnalysis').value,inspo:document.getElementById('mrInspo').value});
  Store.set('mediaRed',data);
  go('mediaPlan');
}
function saveMediaDouyin(){
  const data=Store.get('mediaDouyin',[]);
  data.push({id:uid(),date:document.getElementById('mdDate').value,analysis:document.getElementById('mdAnalysis').value,inspo:document.getElementById('mdInspo').value});
  Store.set('mediaDouyin',data);
  go('mediaPlan');
}
function toggleEditCheck(it){
  const check=Store.get('mediaEditCheck',{});
  check[it]=!check[it];
  Store.set('mediaEditCheck',check);
  go('mediaPlan');
}
function saveEditNote(it,val){
  const notes=Store.get('mediaEditNotes',{});
  notes[it]=val;
  Store.set('mediaEditNotes',notes);
}

/* ===== 2.4 AI Skills ===== */
const PROMPT_TEMPLATES=[
  {title:'📋 万能提词器公式',body:'请作为[角色]，帮我[任务]，输出[格式]的内容，要求[约束条件]，语气[语气]，字数约[字数]字。'},
  {title:'✍️ 内容创作模板',body:'我是一个[身份]，正在做[项目]。请帮我写一篇关于[主题]的[内容类型]，面向[目标读者]，核心信息包括[要点]，风格参考[参考样例]，字数约[字数]。'},
  {title:'📊 分析报告模板',body:'请对以下数据进行[分析类型]分析：\n[粘贴数据]\n输出要求：1.关键发现 2.趋势分析 3.建议行动 4.风险提示。请用[语言风格]表达。'},
  {title:'💡 头脑风暴模板',body:'关于[主题/问题]，请从[角度1]、[角度2]、[角度3]三个维度各给出5个创意方案，每个方案包含：方案名称、核心思路、预期效果、实施难度（1-5星）。'},
  {title:'🔄 优化迭代模板',body:'以下是我的[内容类型]：\n[粘贴内容]\n请从[优化维度1]、[优化维度2]、[优化维度3]三个方向给出修改建议，并输出优化后的完整版本。'},
];
PAGES.aiSkills=function(){
  const custom=Store.get('customPrompts',[]);
  let html='<div class="sec">';
  // Four elements
  html+=`<div class="card">
    <div class="card-title"><span class="ico">🧩</span>四要素结构化指令法</div>
    <div style="font-size:13px;color:var(--t2);margin-bottom:12px;line-height:1.7">好的指令=角色+任务+格式+约束，四个要素缺一不可。填好这四个维度，AI就能给出精准回答。</div>
    <div class="four-elem">
      <div class="fe-item"><div class="fe-icon">🎭</div><div class="fe-name">角色</div><div class="fe-desc">让AI扮演谁</div></div>
      <div class="fe-item"><div class="fe-icon">📌</div><div class="fe-name">任务</div><div class="fe-desc">具体做什么</div></div>
      <div class="fe-item"><div class="fe-icon">📐</div><div class="fe-name">格式</div><div class="fe-desc">输出长什么样</div></div>
      <div class="fe-item"><div class="fe-icon">⚙️</div><div class="fe-name">约束</div><div class="fe-desc">限制条件</div></div>
    </div>
    <div style="margin-top:14px;padding:12px;background:var(--card2);border-radius:var(--rs);font-size:13px;color:var(--t1);line-height:1.7">
      <b>示例：</b>请作为<b>资深营销策划</b>（角色），帮我<b>写一份新品发布的小红书种草文案</b>（任务），输出<b>标题+正文+话题标签</b>（格式），要求<b>口语化、不超过300字、带上emoji</b>（约束）。
    </div>
  </div>`;
  // Templates
  html+=`<div class="card">
    <div class="card-title"><span class="ico">📋</span>万能提词器模板</div>`;
  PROMPT_TEMPLATES.forEach(t=>{
    html+=`<div class="prompt-card">
      <div class="pc-title">${t.title}</div>
      <div class="pc-body">${esc(t.body).replace(/\n/g,'<br>')}</div>
      <div class="pc-copy" onclick="copyText(\`${t.body.replace(/`/g,'\\`')}\`)">📋 复制模板</div>
    </div>`;
  });
  // Custom
  html+='<div class="section-divider"></div>';
  html+='<div class="card-title"><span class="ico">⭐</span>我的自定义模板</div>';
  if(custom.length===0)html+='<div class="empty-hint">还没有自定义模板</div>';
  else custom.forEach(c=>{
    html+=`<div class="prompt-card">
      <div class="pc-title">${esc(c.title)} <button class="todo-del" onclick="delCustomPrompt('${c.id}')">✕</button></div>
      <div class="pc-body">${esc(c.body).replace(/\n/g,'<br>')}</div>
      <div class="pc-copy" onclick="copyText(\`${c.body.replace(/`/g,'\\`').replace(/\$/g,'\\$')}\`)">📋 复制</div>
    </div>`;
  });
  html+=`<div class="f-label">添加自定义模板</div>
    <input type="text" class="f-input" id="cpTitle" placeholder="模板标题" style="margin-bottom:8px">
    <textarea class="f-area" id="cpBody" placeholder="模板内容，可用[占位符]标记需要替换的部分..." style="min-height:80px"></textarea>
    <button class="btn-save" onclick="addCustomPrompt()">添加</button>
  </div>`;
  html+='</div>';
  return html;
};
function addCustomPrompt(){
  const t=document.getElementById('cpTitle').value.trim();
  const b=document.getElementById('cpBody').value.trim();
  if(!t||!b)return;
  const c=Store.get('customPrompts',[]);
  c.push({id:uid(),title:t,body:b});
  Store.set('customPrompts',c);
  go('aiSkills');
}
function delCustomPrompt(id){
  const c=Store.get('customPrompts',[]);
  Store.set('customPrompts',c.filter(x=>x.id!==id));
  go('aiSkills');
}
function copyText(text){
  const ta=document.createElement('textarea');
  ta.value=text;ta.style.position='fixed';ta.style.opacity=0;
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy')}catch(e){}
  document.body.removeChild(ta);
}

/* ===== Shared Theme Page (Learning / Exercise / Hobbies) ===== */
function renderThemePage(type,defaultThemes,defaultIdx,specials){
  const themesKey=type+'Themes';
  const dataKey=type+'Data_';
  const themes=Store.get(themesKey,defaultThemes);
  if(curTheme[type]>=themes.length)curTheme[type]=0;
  const theme=themes[curTheme[type]]||themes[0];
  const data=Store.get(dataKey+theme,{yearGoal:'',monthGoal:'',todos:[],checkin:Array(30).fill(false)});
  
  const isEnglishTheme=(type==='learning' && theme==='英语');
  let html='<div class="sec">';
  // Theme tabs
  html+='<div class="theme-tabs">';
  themes.forEach((t,i)=>{
    html+=`<div class="theme-tab ${i===curTheme[type]?'active':''}" onclick="switchTheme('${type}',${i})">${esc(t)}</div>`;
  });
  html+=`<div class="theme-tab-add" onclick="addTheme('${type}')">+ 新增</div>`;
  html+='</div>';

  if(!isEnglishTheme){
    // Goals
    html+=`<div class="card">
      <div class="card-title"><span class="ico">🎯</span>${esc(theme)} <span class="card-sub">${type==='learning'?'学习计划':type==='exercise'?'运动打卡':'兴趣爱好'}</span></div>
      <div class="f-label">📅 年度目标</div>
      <input type="text" class="f-input" value="${esc(data.yearGoal)}" onblur="saveThemeField('${type}','${esc(theme)}','yearGoal',this.value)">
      <div class="f-label">📆 月度目标</div>
      <input type="text" class="f-input" value="${esc(data.monthGoal)}" onblur="saveThemeField('${type}','${esc(theme)}','monthGoal',this.value)">
    </div>`;

    // Today's plan
    const todos=data.todos||[];
    const doneN=todos.filter(t=>t.done).length;
    html+=`<div class="card">
      <div class="card-title"><span class="ico">📌</span>今日计划 <span class="card-sub">${doneN}/${todos.length}</span></div>
      <div class="todo-add-row">
        <input type="text" id="themeTodoAdd" placeholder="添加今日计划..." onkeydown="if(event.key==='Enter')addThemeTodo('${type}','${esc(theme)}')">
        <button class="todo-add-btn" onclick="addThemeTodo('${type}','${esc(theme)}')">+</button>
      </div>`;
    if(todos.length===0)html+='<div class="empty-hint">暂无今日计划</div>';
    else todos.forEach(t=>{
      html+=`<div class="todo-item">
        <div class="todo-check ${t.done?'done':''}" onclick="toggleThemeTodo('${type}','${esc(theme)}','${t.id}')"></div>
        <div class="todo-text ${t.done?'done':''}">${esc(t.text)}</div>
        <button class="todo-del" onclick="delThemeTodo('${type}','${esc(theme)}','${t.id}')">✕</button>
      </div>`;
    });
    html+='</div>';
  }

  // 30-day checkin (always shown; first card for English theme)
  html+=`<div class="card">
    <div class="card-title"><span class="ico">🔥</span>30天打卡情况一览</div>`;
  if(isEnglishTheme){
    html+='<div style="font-size:12px;color:var(--t2);margin-bottom:10px">数据来源：多邻国（Duolingo）每日学习打卡记录</div>';
  }
  const checkin=data.checkin||Array(30).fill(false);
  const cnt=checkin.filter(x=>x).length;
  html+='<div class="checkin-grid">';
  for(let i=0;i<30;i++){
    html+=`<div class="checkin-block ${checkin[i]?'active':''}" onclick="toggleCheckin('${type}','${esc(theme)}',${i})"><span class="day-num">${i+1}</span></div>`;
  }
  html+='</div>';
  html+=`<div class="checkin-progress">已打卡 <b>${cnt}</b> / 30 天</div>`;
  html+='</div>';

  // Special sections
  if(specials)html+=specials(theme);

  // Delete theme (if not the only one)
  if(themes.length>1){
    html+=`<div style="text-align:center;margin:16px 0"><button class="btn" style="color:var(--rose);border:1px solid var(--bd)" onclick="delTheme('${type}','${esc(theme)}')">删除此主题</button></div>`;
  }

  html+='</div>';
  return html;
}
function switchTheme(type,idx){curTheme[type]=idx;go(type)}
function addTheme(type){
  const name=prompt('请输入新主题名称：');
  if(!name)return;
  const themes=Store.get(type+'Themes',[]);
  themes.push(name);
  Store.set(type+'Themes',themes);
  curTheme[type]=themes.length-1;
  go(type);
}
function delTheme(type,name){
  if(!confirm(`确定删除「${name}」主题及其所有数据？`))return;
  const themes=Store.get(type+'Themes',[]);
  const idx=themes.indexOf(name);
  themes.splice(idx,1);
  Store.set(type+'Themes',themes);
  Store._d[type+'Data_'+name]=undefined;delete Store._d[type+'Data_'+name];Store.save();
  curTheme[type]=0;
  go(type);
}
function saveThemeField(type,theme,field,val){
  const data=Store.get(type+'Data_'+theme,{yearGoal:'',monthGoal:'',todos:[],checkin:Array(30).fill(false)});
  data[field]=val;
  Store.set(type+'Data_'+theme,data);
}
function addThemeTodo(type,theme){
  const input=document.getElementById('themeTodoAdd');
  const text=input.value.trim();if(!text)return;
  const data=Store.get(type+'Data_'+theme,{yearGoal:'',monthGoal:'',todos:[],checkin:Array(30).fill(false)});
  data.todos.push({id:uid(),text,done:false});
  Store.set(type+'Data_'+theme,data);
  go(type);
}
function toggleThemeTodo(type,theme,id){
  const data=Store.get(type+'Data_'+theme,{todos:[]});
  const t=data.todos.find(x=>x.id===id);if(t)t.done=!t.done;
  Store.set(type+'Data_'+theme,data);
  go(type);
}
function delThemeTodo(type,theme,id){
  const data=Store.get(type+'Data_'+theme,{todos:[]});
  data.todos=data.todos.filter(x=>x.id!==id);
  Store.set(type+'Data_'+theme,data);
  go(type);
}
function toggleCheckin(type,theme,idx){
  const data=Store.get(type+'Data_'+theme,{checkin:Array(30).fill(false)});
  data.checkin[idx]=!data.checkin[idx];
  Store.set(type+'Data_'+theme,data);
  // 英语学习打卡同步到首页「日日是好日」英语提升项
  if(type==='learning' && theme==='英语'){
    syncEnglishCheckinToDashboard(data.checkin);
  }
  go(type);
}

/* 将学习计划-英语的30天打卡同步到首页「英语提升」打卡（HHD index 0） */
function syncEnglishCheckinToDashboard(checkinArr){
  const dc=Store.get('dailyCheckin',{});
  const t=todayStr();
  const todayDone=!!(checkinArr && checkinArr[new Date().getDate()-1]);
  if(!dc[t]) dc[t]=[false,false,false,false,false,false,false,false];
  if(dc[t][0]!==todayDone){
    dc[t][0]=todayDone;
    Store.set('dailyCheckin',dc);
  }
}

/* ===== 英语学习素材库 ===== */
const ORAL_MATERIALS=[
  {source:'走遍美国', scene:'日常', title:'自我介绍', en:'Hello. My name is Richard Stewart. I am a photographer.', zh:'你好，我叫 Richard Stewart，我是一名摄影师。'},
  {source:'老友记', scene:'餐厅', title:'点沙拉', en:'I will have the garden salad with the dressing on the side.', zh:'我要一份田园沙拉，酱汁另外放。'},
  {source:'阿甘正传', scene:'交通', title:'等公交车', en:'My mama always said life was like a box of chocolates. You never know what you are gonna get.', zh:'我妈妈常说，生活就像一盒巧克力，你永远不知道下一颗是什么。'},
  {source:'疯狂动物城', scene:'日常', title:'尝试一切', en:'I will not give up, no I will not give in. Till I reach the end, and then I will start again.', zh:'我不会放弃，也不会屈服。直到抵达终点，然后我会重新开始。'},
  {source:'老友记', scene:'购物', title:'买沙发', en:'I want to return this couch. It is cut in half.', zh:'我想退掉这张沙发，它被切成两半了。'},
  {source:'走遍美国', scene:'旅行', title:'问路', en:'Excuse me. Can you tell me how to get to Fifth Avenue?', zh:'打扰一下，请问去第五大道怎么走？'},
  {source:'阿甘正传', scene:'餐厅', title:'见珍妮', en:'Why don not you love me, Jenny? I am not a smart man, but I know what love is.', zh:'你为何不爱我，珍妮？我并不聪明，但我知道爱是什么。'},
  {source:'疯狂动物城', scene:'职场', title:'第一次合作', en:'Life is a little bit messy. We all make mistakes. No matter what type of animal you are, change starts with you.', zh:'生活有点混乱，我们都会犯错。无论你是什么动物，改变都从你自己开始。'},
  {source:'老友记', scene:'交通', title:'叫出租车', en:'Taxi! Hey, I am sorry, I did not see you there.', zh:'出租车！抱歉，我刚才没看到你。'},
  {source:'走遍美国', scene:'购物', title:'买礼物', en:'I am looking for something special for my wife.', zh:'我想给我妻子买一件特别的礼物。'}
];
const DAILY_READINGS=[
  {title:'The Power of Small Habits', en:'Tiny habits, done consistently, shape who we become. A five-minute review each day builds fluency faster than a long session once a month.', zh:'微小的习惯，坚持下来，会塑造我们成为什么样的人。每天五分钟的复习，比一个月一次长时间学习更能快速提升流利度。'},
  {title:'Why We Travel', en:'Travel opens our eyes to different ways of living. It teaches us that kindness needs no translation.', zh:'旅行让我们看到不同的生活方式。它教会我们，善意不需要翻译。'},
  {title:'A Good Meal', en:'Food connects people. Around a table, strangers become friends, and friends become family.', zh:'食物连接人心。围坐在桌边，陌生人成为朋友，朋友成为家人。'},
  {title:'Learning from Mistakes', en:'Mistakes are proof that you are trying. Each error is a step closer to speaking naturally.', zh:'错误证明你在尝试。每一次出错，都是更接近自然表达的一步。'},
  {title:'The Morning Routine', en:'A calm morning sets the tone for the whole day. Ten minutes of English listening can make the rest of the day feel productive.', zh:'平静的早晨决定一整天的基调。十分钟的英语听力能让一天都感到充实。'},
  {title:'Cities and Stories', en:'Every city has a story. Walk its streets, listen to its people, and you will hear history in every accent.', zh:'每座城市都有故事。走过它的街道，聆听它的人民，你会在每个口音中听到历史。'},
  {title:'Keep It Simple', en:'Clear communication is not about using big words. It is about being understood.', zh:'清晰的沟通不在于使用大词，而在于被理解。'}
];
const ORAL_SCENES=['日常','餐厅','交通','购物','职场','旅行'];

function getEnglishDaySeed(){
  const d=new Date();
  return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
}
function seededRandom(seed){
  let x=Math.sin(seed++)*10000;
  return x-Math.floor(x);
}
function getTodayOralPicks(){
  const seed=getEnglishDaySeed();
  const n=ORAL_MATERIALS.length;
  const pickCount=2;
  const picks=[];
  for(let i=0;i<pickCount;i++){
    picks.push(Math.floor(seededRandom(seed+i)*n));
  }
  return picks;
}
function getTodayReading(){
  const seed=getEnglishDaySeed();
  return Math.floor(seededRandom(seed+99)*DAILY_READINGS.length);
}
function getOralState(){ return Store.get('englishOralState',{modes:{},summaryOpen:false,currentPlaying:null}); }
function saveOralState(s){ Store.set('englishOralState',s); }
function setOralMode(idx,mode){
  const s=getOralState();
  s.modes[idx]=mode;
  if(mode==='listen') s.currentPlaying=idx;
  else if(s.currentPlaying===idx) s.currentPlaying=null;
  saveOralState(s);
  go('learning');
}
function stopOral(){ window.speechSynthesis&&window.speechSynthesis.cancel(); }
function playOralText(text,idx){
  stopOral();
  if(!('speechSynthesis' in window)){ showToast('当前浏览器不支持语音朗读'); return; }
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-US'; u.rate=0.85;
  window.speechSynthesis.speak(u);
  const s=getOralState(); s.currentPlaying=idx; saveOralState(s);
}
function toggleOralSummary(){
  const s=getOralState(); s.summaryOpen=!s.summaryOpen; saveOralState(s); go('learning');
}
function addVocabFromOral(word){
  const dict=Store.get('wordDict',[]);
  if(!word.trim()) return;
  dict.push({id:uid(),word:word.trim(),meaning:'',assoc:'',category:''});
  Store.set('wordDict',dict);
  showToast('已加入词典，请到「我的英语词典」补全词义');
}
function renderOralItem(idx,mat,mode,playing){
  const isListen=mode==='listen';
  const isRead=mode==='read';
  const listenCls=isListen?'oral-mode-listen':'';
  const readCls=isRead?'oral-mode-read':'';
  const sceneTag=`<span class="oral-scene">${esc(mat.scene)}</span>`;
  const activeBtn=(type)=>type===mode?'active':'';
  const playingDot=playing?'<span class="oral-playing">🔊</span>':'';
  return `<div class="oral-card ${listenCls} ${readCls}">
    <div class="oral-head">
      <div class="oral-source"><span class="oral-src">${esc(mat.source)}</span>${sceneTag}</div>
      <div class="oral-title">${esc(mat.title)}${playingDot}</div>
    </div>
    <div class="oral-body">
      ${isListen?'<div class="oral-hint">🎧 盲听模式：先听音频，不看字幕</div>':''}
      ${(isRead||isListen)?`<div class="oral-en">${esc(mat.en)}</div>`:''}
      ${isRead?`<div class="oral-zh">${esc(mat.zh)}</div>`:''}
    </div>
    <div class="oral-actions">
      <button class="oral-btn ${activeBtn('listen')}" onclick="setOralMode(${idx},'listen');playOralText('${esc(mat.en).replace(/'/g,'\\\'')}',${idx})">🎧 盲听</button>
      <button class="oral-btn ${activeBtn('read')}" onclick="setOralMode(${idx},'read')">📖 跟读</button>
      <button class="oral-btn" onclick="goVocab()">📚 生词</button>
      <button class="oral-btn" onclick="toggleOralSummary()">📂 汇总</button>
    </div>
  </div>`;
}
function renderOralSummary(){
  let html='<div class="oral-summary">';
  ORAL_SCENES.forEach(scene=>{
    const items=ORAL_MATERIALS.filter(m=>m.scene===scene);
    if(!items.length) return;
    html+=`<div class="oral-sum-group">
      <div class="oral-sum-title">${esc(scene)}</div>
      ${items.map(m=>`<div class="oral-sum-item"><b>${esc(m.source)}</b> · ${esc(m.title)}<div class="oral-sum-en">${esc(m.en)}</div><div class="oral-sum-zh">${esc(m.zh)}</div></div>`).join('')}
    </div>`;
  });
  html+='</div>';
  return html;
}
function renderDailyReading(){
  const idx=getTodayReading();
  const r=DAILY_READINGS[idx];
  return `<div class="reading-card">
    <div class="reading-title">${esc(r.title)}</div>
    <div class="reading-en">${esc(r.en)}</div>
    <div class="reading-zh">${esc(r.zh)}</div>
  </div>`;
}

/* ===== 3.1 Learning ===== */
PAGES.learning=function(){
  return renderThemePage('learning',['英语','书影音','中级经济师','考驾照'],0,function(theme){
    let html='';
    // English special: 每日口语 → 每日阅读 → 我的英语词典
    if(theme==='英语'){
      const oralState=getOralState();
      const picks=getTodayOralPicks();
      // 每日口语
      html+=`<div class="card">
        <div class="card-title"><span class="ico">🎬</span>每日口语 <span class="card-sub">今日精选 ${picks.length} 个片段</span></div>`;
      picks.forEach((idx,p)=>{
        const mat=ORAL_MATERIALS[idx];
        const mode=oralState.modes[idx]||'listen';
        html+=renderOralItem(idx,mat,mode,oralState.currentPlaying===idx);
      });
      html+='</div>';
      // 汇总浮层
      if(oralState.summaryOpen){
        html+=`<div class="card oral-summary-card">
          <div class="card-title"><span class="ico">📂</span>口语素材汇总 <button class="oral-close" onclick="toggleOralSummary()">✕</button></div>
          ${renderOralSummary()}
        </div>`;
      }
      // 每日阅读
      html+=`<div class="card">
        <div class="card-title"><span class="ico">📰</span>每日阅读 <span class="card-sub">每天一篇</span></div>
        ${renderDailyReading()}
      </div>`;
      // 我的英语词典
      const dict=Store.get('wordDict',[]);
      html+=`<div class="card">
        <div class="card-title"><span class="ico">📖</span>我的英语词典 <span class="card-sub">${dict.length}词</span></div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:10px">随时记录不认识的单词，形成你专属的词典</div>
        <div class="dict-add-row">
          <input type="text" id="dw" placeholder="单词">
          <input type="text" id="dm" placeholder="词义">
          <input type="text" id="da" placeholder="联想/搭配/例句">
          <select id="dc"><option value="">分类</option><option>旅行</option><option>餐厅</option><option>交通</option><option>购物</option><option>日常</option><option>职场</option><option>其他</option></select>
          <button class="dict-add-btn" onclick="addWord()">+</button>
        </div>`;
      if(dict.length===0)html+='<div class="empty-hint">还没有记录单词</div>';
      else{
        html+='<div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>单词</th><th>词义</th><th>联想/搭配/例句</th><th>分类</th><th></th></tr></thead><tbody>';
        dict.forEach(w=>{
          html+=`<tr><td><b>${esc(w.word)}</b></td><td>${esc(w.meaning)}</td><td style="max-width:200px;white-space:normal">${esc(w.assoc)}</td><td>${esc(w.category)}</td><td><button class="todo-del" onclick="delWord('${w.id}')">✕</button></td></tr>`;
        });
        html+='</tbody></table></div>';
      }
      html+=`<div class="dict-export" onclick="exportWords()">📥 导出词典 (CSV)</div>
        <div style="font-size:11px;color:var(--t3);text-align:center;margin-top:4px">导出后可用手机打开查看</div>
      </div>`;
    }
    // Book/Media special: content log
    if(theme==='书影音'){
      const log=Store.get('contentLog',[]);
      html+=`<div class="card">
        <div class="card-title"><span class="ico">📕</span>碎片化输入记录 <span class="card-sub">${log.length}条</span></div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:10px">书/影/音/短视频等碎片化内容输入记录</div>
        <div class="f-label">输入内容</div><input type="text" class="f-input" id="cl_content" style="margin-bottom:8px">
        <div class="grid2">
          <div><div class="f-label">分类</div><select class="f-input" id="cl_cat"><option>书</option><option>电影</option><option>剧集</option><option>综艺</option><option>短视频</option><option>播客</option><option>其他</option></select></div>
          <div><div class="f-label">观看日期</div><input type="date" class="f-input" id="cl_date" value="${todayStr()}"></div>
        </div>
        <div class="f-label">内容链接</div><input type="text" class="f-input" id="cl_link" style="margin-bottom:8px">
        <div class="f-label">核心观点</div><textarea class="f-area" id="cl_vp" style="min-height:50px"></textarea>
        <div class="f-label">触动点/感兴趣的点</div><textarea class="f-area" id="cl_touch" style="min-height:50px"></textarea>
        <div class="f-label">想到生活/工作中的对应点</div><textarea class="f-area" id="cl_relate" style="min-height:50px"></textarea>
        <div class="f-label">内容输出 / What I want to create</div><textarea class="f-area" id="cl_output" style="min-height:50px"></textarea>
        <button class="btn-save" onclick="addContentLog()">记录</button>
      </div>`;
      if(log.length){
        html+='<div class="card"><div class="card-title"><span class="ico">📖</span>历史记录</div>';
        log.reverse().forEach(c=>{
          html+=`<div class="inspo-item">
            <div class="inspo-date">${esc(c.date)} · ${esc(c.category)} · ${esc(c.content)}</div>
            ${c.link?`<div style="margin:4px 0"><a href="${esc(c.link)}" target="_blank" style="color:var(--blue);font-size:12px">${esc(c.link)}</a></div>`:''}
            ${c.viewpoint?`<div class="inspo-title">核心观点：${esc(c.viewpoint)}</div>`:''}
            ${c.touch?`<div class="inspo-body">触动点：${esc(c.touch)}</div>`:''}
            ${c.relate?`<div class="inspo-body">对应点：${esc(c.relate)}</div>`:''}
            ${c.output?`<div class="inspo-body" style="color:var(--sage)">输出：${esc(c.output)}</div>`:''}
            <button class="todo-del" style="margin-top:6px" onclick="delContentLog('${c.id}')">✕ 删除</button>
          </div>`;
        });
        html+='</div>';
      }
    }
    // Exam special
    if(theme==='中级经济师'){
      const ei=Store.get('examInfo',{date:'',regDate:'',location:'',subjects:'',materials:'',tasks:''});
      let cdText='';
      if(ei.date){
        const diff=Math.ceil((new Date(ei.date)-new Date(todayStr()))/86400000);
        cdText=`<div class="countdown"><div class="cd-num">${diff>0?diff:0}</div><div class="cd-label">距离考试还有${diff>0?'':'已过'}天</div></div>`;
      }
      html+=`<div class="card">
        <div class="card-title"><span class="ico">📊</span>考试信息</div>
        ${cdText}
        <div class="f-label">考试时间</div><input type="date" class="f-input" value="${esc(ei.date)}" onblur="saveExam('date',this.value)">
        <div class="f-label">报名时间</div><input type="date" class="f-input" value="${esc(ei.regDate)}" onblur="saveExam('regDate',this.value)">
        <div class="f-label">考试地点</div><input type="text" class="f-input" value="${esc(ei.location)}" onblur="saveExam('location',this.value)">
        <div class="f-label">考试科目</div><input type="text" class="f-input" value="${esc(ei.subjects)}" onblur="saveExam('subjects',this.value)">
        <div class="f-label">备考资料</div><textarea class="f-area" style="min-height:60px" onblur="saveExam('materials',this.value)">${esc(ei.materials)}</textarea>
        <div class="f-label">复习任务</div><textarea class="f-area" style="min-height:60px" onblur="saveExam('tasks',this.value)">${esc(ei.tasks)}</textarea>
      </div>`;
    }
    // 驾照 special
    if(theme==='考驾照'){
      const dt=Store.get('drivingProgress',{subjects:[{name:'科目一',done:false},{name:'科目二',done:false},{name:'科目三',done:false},{name:'科目四',done:false}],notes:''});
      html+=`<div class="card">
        <div class="card-title"><span class="ico">🚗</span>驾考进度</div>
        <div style="font-size:13px;color:var(--t2);margin-bottom:10px">先刷题，准备好再报名</div>`;
      dt.subjects.forEach((s,i)=>{
        html+=`<div class="todo-item"><div class="todo-check ${s.done?'done':''}" onclick="toggleDriving(${i})"></div><div class="todo-text ${s.done?'done':''}">${esc(s.name)}</div></div>`;
      });
      html+=`<div class="f-label">学习笔记</div><textarea class="f-area" style="min-height:80px" onblur="saveDrivingNote(this.value)">${esc(dt.notes)}</textarea></div>`;
    }
    return html;
  });
};
function addWord(){
  const w=document.getElementById('dw').value.trim();if(!w)return;
  const dict=Store.get('wordDict',[]);
  dict.push({id:uid(),word:w,meaning:document.getElementById('dm').value,assoc:document.getElementById('da').value,category:document.getElementById('dc').value});
  Store.set('wordDict',dict);
  go('learning');
}
function delWord(id){
  const dict=Store.get('wordDict',[]);
  Store.set('wordDict',dict.filter(x=>x.id!==id));
  go('learning');
}
function exportWords(){
  const dict=Store.get('wordDict',[]);
  if(!dict.length){alert('暂无单词可导出');return}
  let csv='\ufeff单词,词义,联想/搭配/例句,分类\n';
  dict.forEach(w=>{csv+=`${w.word},${w.meaning},${w.assoc},${w.category}\n`});
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='我的英语词典.csv';
  a.click();
}
function addContentLog(){
  const log=Store.get('contentLog',[]);
  log.push({id:uid(),content:document.getElementById('cl_content').value,category:document.getElementById('cl_cat').value,link:document.getElementById('cl_link').value,date:document.getElementById('cl_date').value,viewpoint:document.getElementById('cl_vp').value,touch:document.getElementById('cl_touch').value,relate:document.getElementById('cl_relate').value,output:document.getElementById('cl_output').value});
  Store.set('contentLog',log);
  go('learning');
}
function delContentLog(id){
  const log=Store.get('contentLog',[]);
  Store.set('contentLog',log.filter(x=>x.id!==id));
  go('learning');
}
function saveExam(field,val){const ei=Store.get('examInfo',{});ei[field]=val;Store.set('examInfo',ei)}
function toggleDriving(i){
  const dt=Store.get('drivingProgress',{subjects:[{name:'科目一',done:false},{name:'科目二',done:false},{name:'科目三',done:false},{name:'科目四',done:false}],notes:''});
  dt.subjects[i].done=!dt.subjects[i].done;
  Store.set('drivingProgress',dt);
  go('learning');
}
function saveDrivingNote(val){const dt=Store.get('drivingProgress',{subjects:[],notes:''});dt.notes=val;Store.set('drivingProgress',dt)}

/* ===== 3.2 Exercise ===== */
PAGES.exercise=function(){return renderThemePage('exercise',['超慢跑','散步','练背'],0)};

/* ===== 3.3 Hobbies ===== */
PAGES.hobbies=function(){
  return renderThemePage('hobbies',['毛笔字','小红书分享'],0,function(theme){
    if(theme==='小红书分享'){
      return `<div class="card">
        <div class="card-title"><span class="ico">✍️</span>输出型爱好培养</div>
        <div style="font-size:13px;color:var(--t1);line-height:1.8">
          <p>📝 写影评或从评论开始，锻炼文字能力</p>
          <p style="margin-top:6px">💡 每次看完一部影视/读完一本书，尝试写下3-5句感受</p>
          <p style="margin-top:6px">📊 目标：每周至少输出2篇</p>
        </div>
      </div>`;
    }
    return '';
  });
};

/* ===== 3.4 Wellness ===== */
const WELLNESS_ITEMS=[
  {icon:'😤',title:'戒掉生闷气/内耗',desc:'情绪来了先深呼吸，不憋着'},
  {icon:'🧋',title:'不喝奶茶、不喝冷饮',desc:'坚持就是胜利'},
  {icon:'🍳',title:'自己做饭',desc:'减脂+恢复生活热情，记录饮食'},
  {icon:'🧴',title:'皮肤护理',desc:'基础保湿、防晒、敷面膜'},
  {icon:'💪',title:'看剧时做上肢运动',desc:'利用碎片时间锻炼'},
  {icon:'✨',title:'光子+水光',desc:'每3-4月一次，提亮肤色、改善肤质'},
  {icon:'🦶',title:'边泡脚边刮脸',desc:'养生护肤两不误'},
];
PAGES.wellness=function(){
  const log=Store.get('wellnessLog',{});
  const today=log[todayStr()]||Array(7).fill(false);
  const doneN=today.filter(x=>x).length;
  let html='<div class="sec">';
  html+=`<div class="dash-hero" style="margin-bottom:14px">
    <div style="font-size:14px;color:var(--t2)">今日养生完成度</div>
    <div class="stat-val" style="font-size:36px;color:var(--mint)">${doneN}<span style="font-size:18px;color:var(--t3)">/7</span></div>
    <div class="progress-bar" style="margin-top:8px"><div class="progress-bar-fill" style="width:${doneN/7*100}%;background:var(--mint)"></div></div>
  </div>`;
  WELLNESS_ITEMS.forEach((it,i)=>{
    html+=`<div class="wellness-item">
      <div class="w-ico">${it.icon}</div>
      <div class="w-text">
        <div class="w-title">${it.title}</div>
        <div class="w-desc">${it.desc}</div>
      </div>
      <div class="wellness-check ${today[i]?'done':''}" onclick="toggleWellness(${i})"></div>
    </div>`;
  });
  html+='</div>';
  return html;
};
function toggleWellness(i){
  const log=Store.get('wellnessLog',{});
  const t=log[todayStr()]||Array(7).fill(false);
  t[i]=!t[i];
  log[todayStr()]=t;
  Store.set('wellnessLog',log);
  go('wellness');
}

/* ===== 3.5 Travel ===== */
PAGES.travel=function(){
  const longT=Store.get('travelLong',[]);
  const shortT=Store.get('travelShort',[]);
  let html='<div class="sec">';
  // Long term
  html+=`<div class="card">
    <div class="card-title"><span class="ico">🌍</span>长期旅行 <span class="card-sub">北京以外·和阿悦</span></div>
    <div class="todo-add-row">
      <input type="text" id="tlPlace" placeholder="目的地...">
      <input type="date" id="tlDate" style="max-width:140px">
      <button class="todo-add-btn" onclick="addTravel('long')">+</button>
    </div>`;
  if(longT.length===0)html+='<div class="empty-hint">还没有计划</div>';
  else longT.forEach(t=>{
    html+=`<div class="travel-item">
      <div class="travel-check ${t.done?'done':''}" onclick="toggleTravel('long','${t.id}')"></div>
      <div class="travel-info">
        <div class="travel-place ${t.done?'done':''}">${esc(t.place)}</div>
        <div class="travel-date">${esc(t.date||'未定日期')}</div>
      </div>
      <button class="todo-del" onclick="delTravel('long','${t.id}')">✕</button>
    </div>`;
  });
  html+='</div>';
  // Short term
  html+=`<div class="card">
    <div class="card-title"><span class="ico">📍</span>短期旅行 <span class="card-sub">北京或河南·自己或家人</span></div>
    <div class="todo-add-row">
      <input type="text" id="tsPlace" placeholder="目的地...">
      <input type="date" id="tsDate" style="max-width:140px">
      <button class="todo-add-btn" onclick="addTravel('short')">+</button>
    </div>`;
  if(shortT.length===0)html+='<div class="empty-hint">还没有计划</div>';
  else shortT.forEach(t=>{
    html+=`<div class="travel-item">
      <div class="travel-check ${t.done?'done':''}" onclick="toggleTravel('short','${t.id}')"></div>
      <div class="travel-info">
        <div class="travel-place ${t.done?'done':''}">${esc(t.place)}</div>
        <div class="travel-date">${esc(t.date||'未定日期')}</div>
      </div>
      <button class="todo-del" onclick="delTravel('short','${t.id}')">✕</button>
    </div>`;
  });
  html+='</div></div>';
  return html;
};
function addTravel(type){
  const placeEl=document.getElementById(type==='long'?'tlPlace':'tsPlace');
  const dateEl=document.getElementById(type==='long'?'tlDate':'tsDate');
  if(!placeEl.value.trim())return;
  const key=type==='long'?'travelLong':'travelShort';
  const arr=Store.get(key,[]);
  arr.push({id:uid(),place:placeEl.value.trim(),date:dateEl.value,done:false});
  Store.set(key,arr);
  go('travel');
}
function toggleTravel(type,id){
  const key=type==='long'?'travelLong':'travelShort';
  const arr=Store.get(key,[]);
  const t=arr.find(x=>x.id===id);if(t)t.done=!t.done;
  Store.set(key,arr);
  go('travel');
}
function delTravel(type,id){
  const key=type==='long'?'travelLong':'travelShort';
  const arr=Store.get(key,[]);
  Store.set(key,arr.filter(x=>x.id!==id));
  go('travel');
}

/* ===== 3.6 Insurance ===== */
PAGES.insurance=function(){
  const data=Store.get('insuranceData',[]);
  const cols=['保险名称','投保时间','保险公司','保障额度','保费/年','保险合同','生效日期','终止日期','下次缴费','人员','情况说明'];
  let html='<div class="sec">';
  html+=`<div class="card">
    <div class="card-title"><span class="ico">🛡️</span>保险计划 <span class="card-sub">${data.length}条</span></div>`;
  // Add form
  html+='<div style="font-size:13px;color:var(--t2);margin-bottom:10px">添加新的保险记录：</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">';
  cols.forEach(c=>{
    const type=(c.includes('时间')||c.includes('日期'))?'date':'text';
    html+=`<div><div class="f-label" style="margin:0">${c}</div><input type="${type}" class="f-input" id="ins_${c}" style="height:36px;font-size:13px"></div>`;
  });
  html+='</div>';
  html+=`<button class="btn-save" onclick="addInsurance()">添加保险</button>`;
  html+='</div>';
  // Table
  if(data.length){
    html+=`<div class="card"><div class="card-title"><span class="ico">📋</span>保险清单</div><div class="tbl-wrap"><table class="data-tbl"><thead><tr>`;
    cols.forEach(c=>{html+=`<th>${c}</th>`});
    html+='<th></th></tr></thead><tbody>';
    data.forEach(d=>{
      html+='<tr>';
      cols.forEach(c=>{html+=`<td>${esc(d[c]||'')}</td>`});
      html+=`<td><button class="todo-del" onclick="delInsurance('${d.id}')">✕</button></td></tr>`;
    });
    html+='</tbody></table></div></div>';
  }
  html+='</div>';
  return html;
};
function addInsurance(){
  const cols=['保险名称','投保时间','保险公司','保障额度','保费/年','保险合同','生效日期','终止日期','下次缴费','人员','情况说明'];
  const obj={id:uid()};
  let hasVal=false;
  cols.forEach(c=>{
    const v=document.getElementById('ins_'+c).value;
    obj[c]=v;if(v)hasVal=true;
  });
  if(!hasVal)return;
  const data=Store.get('insuranceData',[]);
  data.push(obj);
  Store.set('insuranceData',data);
  go('insurance');
}
function delInsurance(id){
  const data=Store.get('insuranceData',[]);
  Store.set('insuranceData',data.filter(x=>x.id!==id));
  go('insurance');
}

/* ===== 4. Review ===== */
PAGES.review=function(){
  const rv=Store.get('reviews',{});
  const selDate=document.getElementById('_reviewDate');
  const date=rv._curDate||todayStr();
  const entry=rv[date]||{要事:'',灵感:'',新知:'',睡眠:''};
  const sections=[
    {key:'要事',icon:'📌',label:'今日要事',ph:'去了哪、见了谁、做的具体事...'},
    {key:'灵感',icon:'💡',label:'今日灵感',ph:'突然闪现的脑洞或观察...'},
    {key:'新知',icon:'🌱',label:'今日新知',ph:'今天学到了什么...'},
    {key:'睡眠',icon:'😴',label:'睡眠评分',ph:'记录起床和睡觉时间、睡眠质量、做的梦...'},
  ];
  const workReviews=Store.get('workReviews',{});
  const workContent=workReviews[date]||'';
  let html='<div class="sec">';
  html+=`<div class="card">
    <div class="card-title"><span class="ico">🌙</span>今日复盘</div>
    <div class="f-label">日期</div>
    <input type="date" class="f-input" id="reviewDate" value="${date}" onchange="changeReviewDate(this.value)">
    <div style="font-size:12px;color:var(--t3);margin-top:8px;line-height:1.6">写什么？<br>1 有重要的事→写事 2 有情绪触动→写情绪<br>3 有输入→写想法 4 平淡一天→写观察日记</div>
  </div>`;
  html+=`<div class="card">
    <div class="card-title"><span class="ico">📝</span>工作复盘</div>
    <textarea class="f-area" id="review_work" placeholder="记录今天的工作感想、遇到的问题、学到的经验..." style="min-height:120px">${esc(workContent)}</textarea>
  </div>`;
  sections.forEach(s=>{
    html+=`<div class="card">
      <div class="review-label"><span class="ico">${s.icon}</span>【${s.label}】</div>
      <textarea class="f-area" id="review_${s.key}" placeholder="${s.ph}" style="min-height:100px">${esc(entry[s.key]||'')}</textarea>
    </div>`;
  });
  html+=`<button class="btn-save" onclick="saveReview()">保存今日复盘</button>`;
  // Past entries
  const dates=Object.keys(rv).filter(d=>d!=='_curDate').sort().reverse();
  if(dates.length>1||(dates.length===1&&dates[0]!==date)){
    html+='<div class="card"><div class="card-title"><span class="ico">📚</span>历史复盘</div>';
    dates.filter(d=>d!==date).slice(0,15).forEach(d=>{
      const e=rv[d]||{};
      const preview=(e.要事||e.灵感||e.新知||'').slice(0,60);
      html+=`<div class="diary-entry" onclick="changeReviewDate('${d}')">
        <div class="diary-date">${fmtDate(d)}</div>
        <div class="diary-content">${esc(preview)}${preview.length>=60?'...':''}</div>
      </div>`;
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
};
function changeReviewDate(d){
  const rv=Store.get('reviews',{});
  rv._curDate=d;
  Store.set('reviews',rv);
  go('review');
}
function saveReview(){
  const date=document.getElementById('reviewDate').value;
  const rv=Store.get('reviews',{});
  ['要事','灵感','新知','睡眠'].forEach(k=>{
    rv[date]=rv[date]||{};
    rv[date][k]=document.getElementById('review_'+k).value;
  });
  Store.set('reviews',rv);
  // 保存工作复盘（原独立模块并入此处）
  const wr=Store.get('workReviews',{});
  wr[date]=document.getElementById('review_work').value;
  Store.set('workReviews',wr);
  // 标记为已打卡（与首页打卡状态一致）
  const rc=Store.get('reviewCheckin',{});
  rc[date]=true;
  Store.set('reviewCheckin',rc);
  // brief feedback
  const btn=event.target;btn.textContent='✅ 已保存';btn.style.background='var(--sage)';
  setTimeout(()=>{btn.textContent='保存今日复盘';btn.style.background=''},1500);
}

/* ===== 404 ===== */
function p404(){return '<div class="sec"><div class="empty-hint">页面建设中...</div></div>'}

/* ===== Init ===== */
Store.load();
initGate();
