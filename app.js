// HUQUQ AI — app.js
const GPT = {
  get key() { return localStorage.getItem('huquq_gpt_key') || ''; },
  save(k)   { localStorage.setItem('huquq_gpt_key', k.trim()); },
  clear()   { localStorage.removeItem('huquq_gpt_key'); }
};

const SYSTEM_PROMPT = `Siz "Huquq AI" — O'zbekiston Respublikasining professional huquqiy yordamchisiz.
Foydalanuvchi har qanday savolini O'zbekiston Respublikasi qonunchiligi asosida KENG, BATAFSIL, ANIQ tahlil qiling.

Qoidalar:
1. Har doim O'ZBEK tilida, sodda va tushunarli tilda javob bering.
2. Javobda ANIQ qonun moddalarini raqami bilan nomlab, mazmunini tushuntiring.
3. Javob strukturasi:
   🔍 Savolning huquqiy tahlili
   📌 Tegishli qonunchilik (qonun nomi + modda raqami)
   📋 Nima qilish kerak? (qadam-baqadam ko'rsatma)
   🔗 Lex.uz manbasi: tegishli qonun havolasi
   📖 Manba: [qonun nomi va modda]
4. Lex.uz (https://lex.uz) — O'zbekiston qonunlari rasmiy portali. Har doim manba ko'rsating.
5. Konstitutsiya, Mehnat kodeksi, Fuqarolik kodeksi, Oila kodeksi, Jinoyat kodeksi kabi asosiy qonunlardan foydalaning.
6. Savol murakkab bo'lsa, tegishli davlat organi telefoni va manzilini ham bering.
7. ENG OXIRIDA: "⚠️ Eslatma: Bu umumiy ma'lumot. Muhim holatlarda malakali advokatga yoki tegishli davlat organiga murojaat qiling."

Asosiy Lex.uz havolalar:
- Konstitutsiya: https://lex.uz/docs/30948
- Mehnat kodeksi: https://lex.uz/docs/142859
- Fuqarolik kodeksi: https://lex.uz/docs/111181
- Oila kodeksi: https://lex.uz/docs/111364
- Jinoyat kodeksi: https://lex.uz/docs/111170
- Soliq kodeksi: https://lex.uz/docs/4674360

Emojilar va markdown bold (**) dan foydalaning. Minimum 300 so'z javob bering.`;

const AUTH = {
  get user() { try { return JSON.parse(localStorage.getItem('huquq_user')) || null; } catch { return null; } },
  save(u)    { localStorage.setItem('huquq_user', JSON.stringify(u)); },
  logout()   { localStorage.removeItem('huquq_user'); },
  get history() { try { return JSON.parse(localStorage.getItem('huquq_history')) || []; } catch { return []; } },
  addHistory(q, a) {
    const h = this.history;
    h.unshift({ q, a, date: new Date().toLocaleString('uz-UZ'), id: Date.now() });
    if (h.length > 50) h.pop();
    localStorage.setItem('huquq_history', JSON.stringify(h));
  },
  clearHistory() { localStorage.removeItem('huquq_history'); }
};

function getUsers() { try { return JSON.parse(localStorage.getItem('huquq_users')) || []; } catch { return []; } }
function saveUsers(arr) { localStorage.setItem('huquq_users', JSON.stringify(arr)); }

let currentPage = 'home';

function goPage(name) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('pg-' + name);
  if (el) el.classList.add('active');
  currentPage = name;
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  const bnMap = { home:'bn-home', chat:'bn-chat', docs:'bn-docs', history:'bn-docs', lawyers:'bn-lawyers', auth:'bn-auth' };
  const bn = document.getElementById(bnMap[name]);
  if (bn) bn.classList.add('active');
  if (name === 'lawyers') renderLawyers(LAWYERS);
  if (name === 'history') renderHistory();
  if (name === 'auth') renderProfile();
  if (name === 'chat') renderChatWelcome();
  if (name === 'docs') renderDocTemplates();
  if (name === 'admin') renderAdmin();
  window.scrollTo(0, 0);
}
function navTo(name) { goPage(name); }

// LAWYERS DATA
const DEFAULT_LAWYERS = [
  { id:1, initials:'A', name:'Azimov Bobur',     spec:'Oilaviy huquq',  specKey:'oila',    region:'toshkent', loc:'Toshkent', rating:4.8, exp:12, phone:'+998 90 123 45 67', about:'Oilaviy nizolar va ajralish masalalarida 12 yillik tajriba.' },
  { id:2, initials:'K', name:'Karimova Nilufar', spec:'Mehnat huquqi',  specKey:'mehnat',  region:'samarqand',loc:'Samarqand',rating:4.9, exp:8,  phone:'+998 90 234 56 78', about:'Mehnat nizolari va ish haqi to\'lovlari bo\'yicha mutaxassis.' },
  { id:3, initials:'R', name:'Rahimov Sardor',   spec:'Jinoyat huquqi', specKey:'jinoyat', region:'toshkent', loc:'Toshkent', rating:4.7, exp:15, phone:'+998 90 345 67 89', about:'Jinoiy ishlar bo\'yicha shoshilinch mudofaa va sud jarayonlari.' },
  { id:4, initials:'M', name:'Mirzayeva Dildora',spec:'Biznes huquqi',  specKey:'biznes',  region:'buxoro',   loc:'Buxoro',   rating:4.8, exp:10, phone:'+998 90 456 78 90', about:'Kompaniya tashkil etish va korporativ huquq sohasida mutaxassis.' },
  { id:5, initials:'T', name:'Toshmatov Jasur',  spec:'Mulk huquqi',    specKey:'mulk',    region:'namangan', loc:'Namangan', rating:4.6, exp:9,  phone:'+998 90 567 89 01', about:'Ko\'chmas mulk va uy-joy ijarasi masalalarida mutaxassis.' },
  { id:6, initials:'H', name:'Hasanova Nodira',  spec:'Oilaviy huquq',  specKey:'oila',    region:'fargona',  loc:'Farg\'ona',rating:4.9, exp:7,  phone:'+998 90 678 90 12', about:'Ajralish, aliment va bola vasiyati masalalarida tajribali advokat.' },
];
function getLawyers() { try { const s=localStorage.getItem('huquq_lawyers'); if(s) return JSON.parse(s); } catch(e){} return DEFAULT_LAWYERS; }
function saveLawyersDB(arr) { localStorage.setItem('huquq_lawyers', JSON.stringify(arr)); }
let LAWYERS = getLawyers();

function renderLawyers(list) {
  const grid = document.getElementById('lawyersGrid');
  if (!grid) return;
  if (!list || !list.length) {
    grid.innerHTML=`<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Hech narsa topilmadi</h3><p>Boshqa kalit so'z yoki filtrni sinab ko'ring.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(l => {
    const verifiedBadge = l.verified ? '<span class="verified-badge">✓ Tasdiqlangan</span>' : (l.verified === false && l.id > 1000000 ? '<span class="pending-badge">⏳ Kutilmoqda</span>' : '');
    const statusClass = l.status === 'busy' ? 'busy' : (l.status === 'offline' ? 'offline' : '');
    const statusText = l.status === 'busy' ? 'Band' : (l.status === 'offline' ? 'Offline' : 'Bo\'sh');
    return `
    <div class="lcard" onclick="openLawyer(${l.id})">
      <div class="lcard-top">
        <div class="lav-circle">${l.initials||l.name[0]}</div>
        <div class="linf">
          <div class="lname">${l.name}${verifiedBadge}</div>
          <div class="lspec">${l.spec}</div>
          <div class="lstats-row">⭐ ${l.rating} &nbsp;·&nbsp; ${l.exp} yil tajriba · ${l.loc}</div>
        </div>
        <div class="lbosh-badge ${statusClass}">${statusText}</div>
      </div>
      <div class="lcard-btns">
        <button class="lb-call" onclick="event.stopPropagation();callL(${l.id})">📞 Qo'ng'iroq</button>
        <button class="lb-video" onclick="event.stopPropagation();videoL(${l.id})">🎥 Video</button>
      </div>
    </div>`;
  }).join('');
}
function filterL() {
  const s=document.getElementById('fSpec').value, r=document.getElementById('fRegion').value, kw=document.getElementById('fSearch').value.toLowerCase();
  renderLawyers(LAWYERS.filter(l=>(!s||l.specKey===s)&&(!r||l.region===r)&&(!kw||l.name.toLowerCase().includes(kw)||l.spec.toLowerCase().includes(kw))));
}
function openLawyer(id) {
  const l=LAWYERS.find(x=>x.id===id); if(!l) return;
  document.getElementById('lawyerDetail').innerHTML=`
    <div class="lm-head"><div class="lm-av-c">${l.initials||l.name[0]}</div><div><div class="lm-name">${l.name}</div><div class="lm-spec">${l.spec} · ${l.loc}</div></div></div>
    <div class="lm-stats">
      <div class="lm-stat"><div class="v">⭐ ${l.rating}</div><div class="l">Reyting</div></div>
      <div class="lm-stat"><div class="v">${l.exp} yil</div><div class="l">Tajriba</div></div>
      <div class="lm-stat"><div class="v">Bo'sh</div><div class="l">Holati</div></div>
    </div>
    <p class="lm-about">${l.about}</p>
    <div class="lm-btns">
      <button class="lm-btn lm-call" onclick="callL(${l.id})">📞 ${l.phone}</button>
      <button class="lm-btn lm-video" onclick="videoL(${l.id})">🎥 Video konsultatsiya</button>
    </div>`;
  openModal('lawyerOverlay');
}
function callL(id) { const l=LAWYERS.find(x=>x.id===id); if(l) toast(`📞 ${l.name}: ${l.phone}`); }
function videoL(id) { const l=LAWYERS.find(x=>x.id===id); if(l){ closeModal('lawyerOverlay'); toast(`🎥 ${l.name} bilan video aloqa boshlandi`); } }

// HISTORY & PROFILE
function renderHistory() {
  const hist=AUTH.history, container=document.getElementById('historyList');
  if(!container) return;
  if(!hist.length){ container.innerHTML=`<div class="no-hist-big"><div style="font-size:56px;margin-bottom:12px">📜</div><h3>Tarix bo'sh</h3><p>Siz hali hech qanday savol bermadingiz.</p><button class="hist-chat-btn" onclick="goPage('chat')">🤖 AI Maslahat →</button></div>`; return; }
  container.innerHTML=hist.map(h=>`
    <div class="hist-card">
      <div class="hist-card-top"><div class="hist-q-icon">❓</div><div class="hist-q-text">${h.q}</div><div class="hist-date">${h.date}</div></div>
      <div class="hist-answer">${fmt(h.a)}</div>
      <button class="hist-repeat-btn" onclick="goPage('chat');setTimeout(()=>sendQ('${h.q.replace(/'/g,"\\'")}'),300)">🔄 Qayta so'rash</button>
    </div>`).join('');
}

function renderProfile() {
  const container=document.getElementById('profileContent'); if(!container) return;
  if(AUTH.user){
    const u=AUTH.user;
    const roleBadge=u.role==='lawyer'?'<div class="profile-role-badge">👨‍⚖️ Advokat</div>':'<div class="profile-role-badge user-badge">👤 Foydalanuvchi</div>';
    const apiStatus=GPT.key?'<span style="color:#10b981;font-weight:700">Ulangan ✅</span>':'<span style="color:#f59e0b">Ulanmagan</span>';
    const histCount=AUTH.history.length;
    container.innerHTML=`
      <div class="profile-header">
        <div class="profile-avatar">${u.role==='lawyer'?'👨‍⚖️':'👤'}</div>
        <div class="profile-name">${u.name}</div>
        ${roleBadge}
        <div class="profile-phone">${u.phone}</div>
      </div>
      <div style="padding:16px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:12px">
          <div class="settings-item" onclick="goPage('chat')">
            <div class="settings-item-icon" style="background:rgba(59,130,246,0.1)">💬</div>
            <div class="settings-item-text"><div class="settings-item-label">AI Maslahat</div><div class="settings-item-sub">Huquqiy savolingizni bering</div></div>
            <div class="settings-item-arrow">›</div>
          </div>
          <div class="settings-item" onclick="goPage('history')">
            <div class="settings-item-icon" style="background:rgba(139,92,246,0.1)">📜</div>
            <div class="settings-item-text"><div class="settings-item-label">Savol tarixi</div><div class="settings-item-sub">${histCount} ta savol</div></div>
            <div class="settings-item-arrow">›</div>
          </div>
          <div class="settings-item" onclick="goPage('lawyers')">
            <div class="settings-item-icon" style="background:rgba(16,185,129,0.1)">⚖️</div>
            <div class="settings-item-text"><div class="settings-item-label">Advokatlar</div><div class="settings-item-sub">${LAWYERS.length} ta advokat mavjud</div></div>
            <div class="settings-item-arrow">›</div>
          </div>
          <div class="settings-item" onclick="goPage('docs')">
            <div class="settings-item-icon" style="background:rgba(245,158,11,0.1)">📄</div>
            <div class="settings-item-text"><div class="settings-item-label">Hujjat yaratish</div><div class="settings-item-sub">6 ta shablon mavjud</div></div>
            <div class="settings-item-arrow">›</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:12px">
          <div class="settings-item" onclick="openApiSettings()">
            <div class="settings-item-icon" style="background:rgba(59,130,246,0.1)">🔑</div>
            <div class="settings-item-text"><div class="settings-item-label">GPT API kalit</div><div class="settings-item-sub">${GPT.key?'Ulangan — gpt-4o-mini faol':'Ulanmagan — mahalliy rejim'}</div></div>
            <div class="settings-item-arrow">›</div>
          </div>
          <div class="settings-item" onclick="openAdminLogin()">
            <div class="settings-item-icon" style="background:rgba(139,92,246,0.1)">🔒</div>
            <div class="settings-item-text"><div class="settings-item-label">Admin panel</div><div class="settings-item-sub">Boshqaruv markazi</div></div>
            <div class="settings-item-arrow">›</div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
          <div class="settings-item" onclick="doLogout()" style="color:var(--red)">
            <div class="settings-item-icon" style="background:rgba(239,68,68,0.1)">🚪</div>
            <div class="settings-item-text"><div class="settings-item-label" style="color:var(--red)">Tizimdan chiqish</div><div class="settings-item-sub">${u.name}</div></div>
          </div>
        </div>
      </div>`;
  } else {
    container.innerHTML=`
      <div class="auth-wrap">
        <div class="auth-logo"><div class="auth-logo-icon">⚖️</div><h2>Xush kelibsiz!</h2><p>Huquq AI platformasiga kiring</p></div>
        <div class="auth-tabs">
          <button id="authTabReg" class="atab active" onclick="switchAuthTab('reg')">Ro'yxatdan o'tish</button>
          <button id="authTabLogin" class="atab" onclick="switchAuthTab('login')">Kirish</button>
        </div>
        <div id="authRegForm">
          <div class="fgroup"><label>Ism va Familiya</label><input id="authRegName" type="text" placeholder="Ismingiz" class="finput"/></div>
          <div class="fgroup"><label>Telefon raqam</label><input id="authRegPhone" type="tel" placeholder="+998901234567" class="finput"/></div>
          <div class="fgroup"><label>Parol</label><input id="authRegPass" type="password" placeholder="Kamida 6 ta belgi" class="finput"/></div>
          <div class="fgroup">
            <label>Hisob turi</label>
            <div class="role-selector">
              <button type="button" class="role-btn active" id="roleUserBtn" onclick="selectRole('user')"><span class="role-icon">👤</span><span>Foydalanuvchi</span><small>Huquqiy maslahat olish uchun</small></button>
              <button type="button" class="role-btn" id="roleLawyerBtn" onclick="selectRole('lawyer')"><span class="role-icon">👨‍⚖️</span><span>Advokat</span><small>Xizmat ko'rsatish uchun</small></button>
            </div>
            <input type="hidden" id="authRegRole" value="user"/>
          </div>
          <div id="lawyerExtraFields" style="display:none">
            <div class="fgroup"><label>Mutaxassislik sohasi</label>
              <select id="authRegSpec" class="finput">
                <option>Oilaviy huquq</option>
                <option>Mehnat huquqi</option>
                <option>Jinoyat huquqi</option>
                <option>Biznes huquqi</option>
                <option>Mulk huquqi</option>
                <option>Umumiy huquq</option>
              </select>
            </div>
            <div class="fgroup"><label>Hudud</label>
              <select id="authRegRegion" class="finput">
                <option value="toshkent">Toshkent</option>
                <option value="samarqand">Samarqand</option>
                <option value="buxoro">Buxoro</option>
                <option value="namangan">Namangan</option>
                <option value="andijon">Andijon</option>
                <option value="fargona">Farg'ona</option>
              </select>
            </div>
            <div class="fgroup"><label>Tajriba (yil)</label><input id="authRegExp" type="number" min="1" max="50" placeholder="5" class="finput"/></div>
          </div>
          <div class="ferr" id="authRegErr"></div>
          <button class="fsubmit" onclick="doAuthRegister()">Ro'yxatdan o'tish →</button>
        </div>
        <div id="authLoginForm" style="display:none">
          <div class="fgroup"><label>Telefon raqam</label><input id="authLoginPhone" type="tel" placeholder="+998901234567" class="finput"/></div>
          <div class="fgroup"><label>Parol</label><input id="authLoginPass" type="password" placeholder="Parolingiz" class="finput"/></div>
          <div class="ferr" id="authLoginErr"></div>
          <button class="fsubmit" onclick="doAuthLogin()">Kirish →</button>
        </div>
        <div id="authOTPForm" style="display:none">
          <p style="text-align:center;margin-bottom:12px;color:var(--text2)">Raqamingizga kod yuborildi: <strong id="authOTPPhone"></strong></p>
          <div class="otp-row">
            <input class="otp-inp" maxlength="1" oninput="authOtpNext(this,0)" id="authOtp0"/>
            <input class="otp-inp" maxlength="1" oninput="authOtpNext(this,1)" id="authOtp1"/>
            <input class="otp-inp" maxlength="1" oninput="authOtpNext(this,2)" id="authOtp2"/>
            <input class="otp-inp" maxlength="1" oninput="authOtpNext(this,3)" id="authOtp3"/>
            <input class="otp-inp" maxlength="1" oninput="authOtpNext(this,4)" id="authOtp4"/>
            <input class="otp-inp" maxlength="1" oninput="authOtpNext(this,5)" id="authOtp5"/>
          </div>
          <p class="otp-hint">Demo uchun: <strong>123456</strong></p>
          <div class="ferr" id="authOTPErr"></div>
          <button class="fsubmit" onclick="doAuthVerifyOTP()">Tasdiqlash ✓</button>
          <button class="resend-btn" onclick="authResendOTP()">Kodni qayta yuborish</button>
        </div>
      </div>`;
  }
}

function switchAuthTab(tab) {
  document.getElementById('authLoginForm').style.display=tab==='login'?'block':'none';
  document.getElementById('authRegForm').style.display=tab==='reg'?'block':'none';
  const otp=document.getElementById('authOTPForm'); if(otp) otp.style.display='none';
  document.getElementById('authTabLogin').classList.toggle('active',tab==='login');
  document.getElementById('authTabReg').classList.toggle('active',tab==='reg');
}
let _regData={};
function doAuthRegister(){
  const name=document.getElementById('authRegName').value.trim(),
        phone=document.getElementById('authRegPhone').value.trim(),
        pass=document.getElementById('authRegPass').value,
        role=document.getElementById('authRegRole').value,
        err=document.getElementById('authRegErr');
  err.textContent='';
  if(!name){err.textContent='Ismingizni kiriting';return;}
  if(!phone){err.textContent='Telefon raqam kiriting';return;}
  if(pass.length<6){err.textContent='Parol kamida 6 ta belgi';return;}
  const users=getUsers(), np=phone.replace(/\s/g,'');
  if(users.find(x=>x.phone.replace(/\s/g,'')===np)){err.textContent='❌ Bu raqam allaqachon ro\'yxatdan o\'tgan';return;}
  // Advokat bo'lsa qo'shimcha ma'lumotlar
  if(role==='lawyer'){
    const spec=document.getElementById('authRegSpec')?.value||'Umumiy huquq';
    const region=document.getElementById('authRegRegion')?.value||'toshkent';
    const exp=parseInt(document.getElementById('authRegExp')?.value)||1;
    _regData={name,phone:np,pass,role,spec,region,exp};
  } else {
    _regData={name,phone:np,pass,role:'user'};
  }
  document.getElementById('authRegForm').style.display='none';
  document.getElementById('authOTPForm').style.display='block';
  document.getElementById('authOTPPhone').textContent=np;
  document.querySelectorAll('.otp-inp').forEach(i=>i.value='');
  setTimeout(()=>document.getElementById('authOtp0').focus(),100);
}
function doAuthLogin(){
  const phone=document.getElementById('authLoginPhone').value.trim(), pass=document.getElementById('authLoginPass').value, err=document.getElementById('authLoginErr');
  err.textContent='';
  if(!phone){err.textContent='Telefon raqam kiriting';return;}
  if(!pass){err.textContent='Parol kiriting';return;}
  const u=getUsers().find(x=>x.phone.replace(/\s/g,'')===phone.replace(/\s/g,''));
  if(!u){err.textContent='❌ Bu raqam ro\'yxatdan o\'tmagan';return;}
  if(u.pass!==pass){err.textContent='❌ Parol noto\'g\'ri';return;}
  AUTH.save(u); toast(`✅ Xush kelibsiz, ${u.name}!`); renderProfile();
}
function authOtpNext(el,idx){
  el.value=el.value.replace(/\D/g,'');
  if(el.value&&idx<5) document.getElementById('authOtp'+(idx+1)).focus();
  const all=Array.from({length:6},(_,i)=>document.getElementById('authOtp'+i).value);
  if(all.every(v=>v)) doAuthVerifyOTP();
}
function doAuthVerifyOTP(){
  const code=Array.from({length:6},(_,i)=>document.getElementById('authOtp'+i).value).join(''), err=document.getElementById('authOTPErr');
  err.textContent='';
  if(code.length<6){err.textContent='Barcha 6 ta raqamni kiriting';return;}
  if(code!=='123456'){err.textContent='❌ Noto\'g\'ri kod. Demo: 123456';return;}
  const newUser={name:_regData.name,phone:_regData.phone,pass:_regData.pass,role:_regData.role||'user'};
  const users=getUsers();
  users.push(newUser); saveUsers(users); AUTH.save(newUser);
  // Agar advokat bo'lsa, advokatlar ro'yxatiga qo'shish
  if(_regData.role==='lawyer'){
    const specMap={'Oilaviy huquq':'oila','Mehnat huquqi':'mehnat','Jinoyat huquqi':'jinoyat','Biznes huquqi':'biznes','Mulk huquqi':'mulk','Umumiy huquq':'boshqa'};
    const regionNames={toshkent:'Toshkent',samarqand:'Samarqand',buxoro:'Buxoro',namangan:'Namangan',andijon:'Andijon',fargona:"Farg'ona"};
    const newLawyer={
      id:Date.now(),
      initials:_regData.name[0],
      name:_regData.name,
      spec:_regData.spec||'Umumiy huquq',
      specKey:specMap[_regData.spec]||'boshqa',
      region:_regData.region||'toshkent',
      loc:regionNames[_regData.region]||'Toshkent',
      rating:4.5,
      exp:_regData.exp||1,
      phone:_regData.phone,
      about:`${_regData.name} — ${_regData.spec||'Umumiy huquq'} sohasida mutaxassis advokat.`,
      verified:false
    };
    LAWYERS.push(newLawyer); saveLawyersDB(LAWYERS);
    toast(`🎉 Xush kelibsiz, Advokat ${newUser.name}! Profilingiz advokatlar bo'limiga qo'shildi.`);
  } else {
    toast(`🎉 Xush kelibsiz, ${newUser.name}!`);
  }
  renderProfile();
}
function authResendOTP(){
  document.querySelectorAll('.otp-inp').forEach(i=>i.value='');
  document.getElementById('authOtp0').focus();
  document.getElementById('authOTPErr').textContent='';
  toast('📱 Kod qayta yuborildi (demo: 123456)');
}
function doLogout(){ AUTH.logout(); toast('Tizimdan chiqdingiz'); renderProfile(); }

function selectRole(role){
  document.getElementById('authRegRole').value=role;
  document.getElementById('roleUserBtn').classList.toggle('active',role==='user');
  document.getElementById('roleLawyerBtn').classList.toggle('active',role==='lawyer');
  const extra=document.getElementById('lawyerExtraFields');
  if(extra) extra.style.display=role==='lawyer'?'block':'none';
}


// CHAT
const SUGGESTIONS=['Nikohdan ajralish uchun qanday hujjatlar kerak?','Pensiya olish tartibi qanday?','Uy-joy sotib olishda qanday hujjatlar talab qilinadi?','Mehnat shartnomasi buzilsa nima qilish kerak?','Pasport yo\'qotilsa qanday tiklash mumkin?'];
let chatStarted=false;
function renderChatWelcome(){
  if(chatStarted) return;
  const msgs=document.getElementById('msgs'); if(!msgs) return;
  if(msgs.children.length>0) return;
  const welcome=document.createElement('div'); welcome.id='chat-welcome';
  welcome.innerHTML=`<div style="text-align:center;padding:20px 0 10px"><div style="font-size:48px">⚖️</div><h3 style="font-size:18px;font-weight:800;margin:8px 0 4px">Huquq AI</h3><p style="font-size:13px;color:var(--text3)">Huquqiy savolingizni bering</p></div><div class="suggestion-list">${SUGGESTIONS.map(q=>`<button class="suggestion-chip" onclick="sendQ('${q.replace(/'/g,"\\'")}')"><span style="margin-right:8px">💬</span>${q}</button>`).join('')}</div>`;
  msgs.appendChild(welcome);
}

const KONSTITUTSIYA=[
  {mod:25,bob:"IV bob",text:"Har bir kishi erkinlik va shaxsiy daxlsizlik huquqiga ega."},
  {mod:26,bob:"IV bob",text:"Aybsizlik prezumpsiyasi: shaxs aybdorligi isbotlanmagan ekan, u aybsiz hisoblanadi."},
  {mod:27,bob:"IV bob",text:"Hech kim qiynoqqa, zo'ravonlikka muomalaga tortilmasligi kafolatlanadi."},
  {mod:29,bob:"IV bob",text:"Har kimning so'z va fikr erkinligi kafolatlanadi."},
  {mod:36,bob:"V bob",text:"Har kim mehnat qilish, erkin kasb tanlash huquqiga ega. Majburiy mehnatga yo'l qo'yilmaydi."},
  {mod:37,bob:"V bob",text:"Ish vaqtining chegaralanishi, haftalik dam olish va yillik to'lov ta'tili kafolatlanadi."},
  {mod:38,bob:"V bob",text:"Fuqarolar keksayganda ijtimoiy ta'minot olish huquqiga ega."},
  {mod:40,bob:"V bob",text:"Har kim bilim olish huquqiga ega. Umumiy o'rta ta'lim bepuldir."},
  {mod:44,bob:"VI bob",text:"Har kimga o'z huquqlarini sud orqali himoya qilish kafolatlanadi."},
  {mod:45,bob:"VI bob",text:"Har kimning huquqlarini himoya qilish uchun yuridik yordam olish huquqi kafolatlanadi."},
  {mod:54,bob:"III bob",text:"Barcha mulk shakllari teng huquqli. Xususiy mulk daxlsizdir."},
  {mod:63,bob:"VI bob",text:"Oila jamiyatning asosiy bo'g'ini. Nikoh ixtiyoriy ravishda tuziladi."},
  {mod:64,bob:"VI bob",text:"Ota-onalar farzandlarini voyaga yetgunlariga qadar boqish majburiyatini o'tadilar."},
];

const TOPICS={
  mehnat:{kw:['mehnat','ish','shartnoma','ishdan','maosh','ish haqi','ta\'til','kompensatsiya','bo\'shatish'],resp:()=>({text:`**Mehnat huquqi — O'zbekiston qonunchiligi:**\n\nO'zbekiston Mehnat kodeksi ishchi va ish beruvchi o'rtasidagi munosabatlarni tartibga soladi.\n\n📌 **Tegishli qonunchilik:**\n- **37-modda (Konstitutsiya):** Mehnat va dam olish huquqi\n- **Mehnat kodeksi, 77-modda:** Shartnoma turlari\n- **Mehnat kodeksi, 154-modda:** Ish haqi to'lash tartibi\n- **Mehnat kodeksi, 99-modda:** Asosiy ta'til (21 ish kuni)\n\n📋 **Nima qilish kerak?**\n- Mehnat shartnomasini yozma tuzing\n- Ish haqingiz kechiksa HR ga rasmiy ariza bering\n- Mehnat inspektsiyasiga murojaat qiling: 1171\n- Kerak bo'lsa sudga da'vo bering\n\n📖 **Manba:** [O'zbekiston Respublikasi Mehnat kodeksi](https://lex.uz/docs/142859)`,lawType:'mehnat',needLawyer:true,articles:[36,37,38]})},
  oila:{kw:['oila','ajralish','aliment','bola','nikoh','er','xotin','vasiyat','meros','turmush'],resp:()=>({text:`**Oilaviy huquq — O'zbekiston qonunchiligi:**\n\nO'zbekiston Oila kodeksi nikoh, ajralish, aliment masalalarini tartibga soladi.\n\n📌 **Tegishli qonunchilik:**\n- **63-modda (Konstitutsiya):** Nikoh ixtiyoriyligi\n- **Oila kodeksi, 38-modda:** Ajralish tartibi\n- **Oila kodeksi, 99-modda:** Aliment to'lash\n- **Oila kodeksi, 63-modda:** Bola yashaydigan joy\n\n📋 **Nima qilish kerak?**\n- Nikoh va mulk hujjatlarini to'plang\n- FUAD ga murojaat qiling\n- Ajralish arizasini sudga bering\n\n📖 **Manba:** [O'zbekiston Respublikasi Oila kodeksi](https://lex.uz/docs/111364)`,lawType:'oila',needLawyer:true,articles:[63,64]})},
  mulk:{kw:['uy','mulk','ijara','kvartira','sotib olish','sotish','uy-joy','yer','arenda'],resp:()=>({text:`**Mulk huquqi — O'zbekiston qonunchiligi:**\n\nO'zbekistonda xususiy mulk qonun bilan himoya qilinadi. Ko'chmas mulkni sotish davlat ro'yxatidan o'tkazilishi shart.\n\n📌 **Tegishli qonunchilik:**\n- **54-modda (Konstitutsiya):** Xususiy mulk daxlsizligi\n- **Fuqarolik kodeksi, 169-modda:** Mulk huquqi\n- **Ko'chmas mulk qonuni, 8-modda:** Davlat ro'yxati\n\n📋 **Nima qilish kerak?**\n- Kadastr ma'lumotlarini tekshiring\n- Hududiy kadastr idorasiga murojaat qiling\n- Shartnomasini notarius orqali rasmiylashtiring\n\n📖 **Manba:** [O'zbekiston Respublikasi Fuqarolik kodeksi](https://lex.uz/docs/111181)`,lawType:'mulk',needLawyer:true,articles:[54]})},
  biznes:{kw:['biznes','ie','machj','kompaniya','litsenziya','soliq','tadbirkor','ochish','startap'],resp:()=>({text:`**Biznes huquqi — O'zbekiston qonunchiligi:**\n\nTadbirkorlik faoliyatini my.gov.uz orqali online boshlash mumkin.\n\n📌 **Tegishli qonunchilik:**\n- **Tadbirkorlik qonuni, 5-modda:** IE ro'yxati\n- **MChJ qonuni, 11-modda:** Ustav kapitali\n- **Soliq kodeksi, 461-modda:** Soddalashtirilgan soliq\n\n📋 **Nima qilish kerak?**\n- Biznes turini tanlang (IE yoki MChJ)\n- [my.gov.uz](https://my.gov.uz) da online ro'yxat (1-2 kun)\n- Soliq organiga ro'yxatdan o'ting\n\n📖 **Manba:** [Soliq kodeksi](https://lex.uz/docs/4674360)`,lawType:'biznes',needLawyer:false,articles:[54]})},
  jinoyat:{kw:['jinoyat','jinoiy','qamoq','politsiya','tergovchi','hibsga','ushlab','arrest'],resp:()=>({text:`**⚠️ Jinoiy huquq — O'zbekiston qonunchiligi:**\n\nSizga yo'naltirilgan jinoiy ta'qib qonun bilan tartibga solingan.\n\n📌 **Tegishli qonunchilik:**\n- **25-modda:** Shaxsiy daxlsizlik\n- **26-modda:** Aybsizlik prezumpsiyasi\n- **27-modda:** Qiynoqqa yo'l qo'yilmasligi\n- **45-modda:** Advokat yordam huquqi\n\n📋 **DARHOL nima qilish kerak?**\n- ⚡ Advokat bilan bog'laning\n- Hech qanday hujjat advokatsiz imzomang\n- Sukut saqlang\n- Yaqinlaringizga xabar bering\n\n📖 **Manba:** [Jinoyat-protsessual kodeksi](https://lex.uz/docs/111176)`,lawType:'jinoyat',needLawyer:true,urgent:true,articles:[25,26,27,45]})},
  pensiya:{kw:['pensiya','nafaqa','keksayish','yosh','qariganda','pensioner'],resp:()=>({text:`**Pensiya huquqi — O'zbekiston qonunchiligi:**\n\nO'zbekistonda pensiya yoshiga yetgan fuqarolar davlat pensiyasiga huquqlidir.\n\n📌 **Tegishli qonunchilik:**\n- **38-modda (Konstitutsiya):** Ijtimoiy ta'minot huquqi\n- **Davlat pensiya ta'minoti qonuni, 8-modda:** Pensiya shartlari\n- Erkaklar: 60 yosh, xizmat staji 25 yil\n- Ayollar: 55 yosh, xizmat staji 20 yil\n\n📋 **Nima qilish kerak?**\n- Mehnat daftarchasini tayyorlang\n- Hududiy FUAD ga murojaat qiling\n- Pensiya fondi: 1181 (bepul)\n\n📖 **Manba:** [Pensiya to'g'risidagi qonun](https://lex.uz/docs/99530)`,lawType:null,needLawyer:false,articles:[38]})},
};

function detectTopic(text){ const t=text.toLowerCase(); for(const[key,val]of Object.entries(TOPICS)){if(val.kw.some(kw=>t.includes(kw))) return key;} return null; }
function searchKonstitutsiya(text){ const t=text.toLowerCase(), m=t.match(/(\d+)\s*[-–]?\s*modda/i)||t.match(/modda\s*[-–]?\s*(\d+)/i); if(m){const found=KONSTITUTSIYA.find(k=>k.mod===parseInt(m[1])); if(found) return{found:true,article:found};} return{found:false}; }
function getResp(text){
  const modSearch=searchKonstitutsiya(text);
  if(modSearch.found){const art=modSearch.article; return{text:`**O'zbekiston Respublikasi Konstitutsiyasi, ${art.mod}-modda:**\n\n*(${art.bob})*\n\n"${art.text}"\n\n📖 **Manba:** [Konstitutsiya](https://lex.uz/docs/30948)`,lawType:null,needLawyer:false,articles:[art.mod],isArticleLookup:true};}
  const topic=detectTopic(text);
  if(topic) return{...TOPICS[topic].resp(),topic};
  return{text:`**Savolingiz qabul qilindi.**\n\nHuquqiy masalangizga oid to'liq javob olish uchun **[Lex.uz](https://lex.uz/)** portalidan foydalaning.\n\nQuyidagi huquq sohalaridan birini tanlang:`,lawType:null,needLawyer:false,showChips:true};
}

function fmt(text){ if(!text) return ''; return text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>'); }
function now(){ return new Date().toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'}); }

function addMsg(text,role){
  const msgs=document.getElementById('msgs'), welcome=document.getElementById('chat-welcome');
  if(welcome) welcome.remove(); chatStarted=true;
  const div=document.createElement('div'); div.className='msg '+(role==='user'?'user-msg':'');
  div.innerHTML=`<div class="msg-av">${role==='user'?'👤':'⚖'}</div><div class="msg-body"><div class="bubble">${fmt(text)}</div><div class="mtime">${now()}</div></div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div;
}
function addTyping(){ const msgs=document.getElementById('msgs'), div=document.createElement('div'); div.id='typing'; div.className='msg typing'; div.innerHTML=`<div class="msg-av">⚖</div><div class="msg-body"><div class="bubble"><div class="dots"><span></span><span></span><span></span></div></div></div>`; msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; }
function removeTyping(){ const el=document.getElementById('typing'); if(el) el.remove(); }

async function askGPT(q){
  if(!GPT.key) return null;
  // Lex.uz kontekstini qidirish
  const lexContext = getLexContext(q);
  const enhancedPrompt = lexContext ? `${SYSTEM_PROMPT}\n\nQo'shimcha Lex.uz manbalari:\n${lexContext}` : SYSTEM_PROMPT;
  try{
    const res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${GPT.key}`},body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'system',content:enhancedPrompt},{role:'user',content:q}],temperature:0.3,max_tokens:2000})});
    if(!res.ok){const e=await res.json(); throw new Error(e.error?.message||'API xatosi');}
    return (await res.json()).choices[0].message.content;
  }catch(e){console.error('GPT:',e);return null;}
}

function getLexContext(q){
  const t=q.toLowerCase();
  const contexts=[];
  if(t.includes('mehnat')||t.includes('ish haqi')||t.includes('ishdan bo\'shatish')) contexts.push('💼 Mehnat kodeksi: https://lex.uz/docs/142859 (ish haqi, ta\'til, ishdan bo\'shatish tartibi)');
  if(t.includes('oila')||t.includes('ajralish')||t.includes('aliment')||t.includes('nikoh')) contexts.push('👨‍👩‍👧 Oila kodeksi: https://lex.uz/docs/111364 (nikoh, ajralish, aliment, bola vasiyati)');
  if(t.includes('mulk')||t.includes('uy-joy')||t.includes('ijara')||t.includes('sotib')) contexts.push('🏠 Fuqarolik kodeksi: https://lex.uz/docs/111181 (mulk, ijara, shartnomalar)');
  if(t.includes('jinoyat')||t.includes('jinoiy')||t.includes('qamoq')||t.includes('hibsga')) contexts.push('⚖️ Jinoyat kodeksi: https://lex.uz/docs/111170 | JPK: https://lex.uz/docs/111176');
  if(t.includes('biznes')||t.includes('ie')||t.includes('mchj')||t.includes('soliq')) contexts.push('💼 Soliq kodeksi: https://lex.uz/docs/4674360 | Tadbirkorlik qonuni: https://lex.uz/docs/111200');
  if(t.includes('pensiya')||t.includes('nafaqa')) contexts.push('👴 Pensiya qonuni: https://lex.uz/docs/99530');
  if(t.includes('konstitutsiya')||t.includes('modda')) contexts.push('🇴🇿 Konstitutsiya: https://lex.uz/docs/30948');
  if(t.includes('yer')||t.includes('er')) contexts.push('🌱 Yer kodeksi: https://lex.uz/docs/175342');
  return contexts.join('\n');
}

function renderAiBubble(bubble,text,userQ){
  let html=text
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm,'<strong style="font-size:15px;color:#1e40af">$1</strong>')
    .replace(/^[-•]\s(.+)$/gm,'<div style="padding:3px 0 3px 12px;border-left:2px solid var(--blue);margin:3px 0">$1</div>')
    .replace(/\n/g,'<br>');
  bubble.innerHTML=html;

  // Copy button
  const copyBtn=document.createElement('button');
  copyBtn.className='copy-btn';
  copyBtn.innerHTML='📋 Nusxalash';
  copyBtn.onclick=()=>{
    navigator.clipboard.writeText(text).then(()=>{
      copyBtn.innerHTML='✅ Nusxalandi!';
      setTimeout(()=>copyBtn.innerHTML='📋 Nusxalash',2000);
    }).catch(()=>toast('Nusxalash amalga oshmadi'));
  };
  bubble.appendChild(copyBtn);

  // Lawyer recommendations
  const topic=detectTopic(userQ);
  if(topic&&TOPICS[topic]){
    const resp=TOPICS[topic].resp();
    if(resp.needLawyer&&resp.lawType){
      const lawyers=LAWYERS.filter(l=>l.specKey===resp.lawType).slice(0,2);
      if(lawyers.length){
        const lb=document.createElement('div');lb.className='lawyer-rec-box';
        lb.innerHTML=`<h4>👨‍⚖️ Mos advokatlar:</h4>`+lawyers.map(l=>`<div class="mini-law" onclick="openLawyer(${l.id})"><div class="mini-av">${l.initials||l.name[0]}</div><div class="mini-info"><strong>${l.name}</strong><span>${l.spec} · ${l.loc}</span></div><div class="mini-rat">⭐${l.rating}</div></div>`).join('')+`<button class="see-all-btn" onclick="goPage('lawyers')">Barcha advokatlarni ko'rish →</button>`;
        bubble.appendChild(lb);
      }
    }
  }

  const disc=document.createElement('div');disc.className='ai-disclaimer';
  disc.innerHTML='⚠️ Diqqat! Bu faqat umumiy ma\'lumot.<em style="font-size:11px;display:block;margin-top:4px">Har qanday qaror qabul qilishdan oldin malakali advokat yoki tegishli davlat organiga murojaat qiling.</em>';
  bubble.appendChild(disc);
}

async function sendMsg(){
  const inp=document.getElementById('inp'), txt=inp.value.trim(); if(!txt) return;
  inp.value=''; inp.style.height='auto';
  addMsg(txt,'user'); addTyping();
  if(GPT.key){
    const ans=await askGPT(txt); removeTyping();
    if(ans){
      const msgs=document.getElementById('msgs'), div=document.createElement('div'); div.className='msg';
      div.innerHTML=`<div class="msg-av">⚖</div><div class="msg-body"><div class="bubble"></div><div class="mtime">${now()}</div></div>`;
      msgs.appendChild(div); renderAiBubble(div.querySelector('.bubble'),ans,txt);
      AUTH.addHistory(txt,ans); msgs.scrollTop=msgs.scrollHeight; return;
    }
    toast('⚠️ GPT javob bermadi, mahalliy javobdan foydalanamiz');
  } else { await new Promise(r=>setTimeout(r,700+Math.random()*400)); removeTyping(); }
  const resp=getResp(txt), msgEl=addMsg(resp.text,'ai'), bubble=msgEl.querySelector('.bubble');
  if(resp.showChips){const cd=document.createElement('div');cd.className='chips';cd.innerHTML=[['💼 Mehnat','Mehnat huquqi bo\'yicha ma\'lumot bering'],['🏠 Mulk','Mulk va uy-joy masalalarini tushuntiring'],['👨‍👩‍👧 Oila','Oilaviy huquq haqida ma\'lumot bering'],['📋 Biznes','Biznes ochish uchun nima kerak?'],['⚖️ Jinoiy','Jinoiy ish bo\'yicha nima qilishim kerak?'],['👴 Pensiya','Pensiya olish tartibi qanday?']].map(([l,q])=>`<button class="chip" onclick="sendQ('${q.replace(/'/g,"\\'")}')"> ${l}</button>`).join('');bubble.appendChild(cd);}
  if(resp.articles&&resp.articles.length&&!resp.isArticleLookup){const ab=document.createElement('div');ab.className='const-box';ab.innerHTML=`<h4>📖 Konstitutsiya manbalari:</h4>`+resp.articles.map(num=>{const art=KONSTITUTSIYA.find(k=>k.mod===num);if(!art) return '';return`<div class="const-item"><span class="const-mod">${num}-modda</span><span class="const-bob">${art.bob}</span></div>`;}).filter(x=>x).join('');bubble.appendChild(ab);}
  if(resp.needLawyer&&resp.lawType){const lawyers=LAWYERS.filter(l=>l.specKey===resp.lawType).slice(0,2);if(lawyers.length){const lb=document.createElement('div');lb.className='lawyer-rec-box';lb.innerHTML=`<h4>👨‍⚖️ Mos advokatlar:</h4>`+lawyers.map(l=>`<div class="mini-law" onclick="openLawyer(${l.id})"><div class="mini-av">${l.initials||l.name[0]}</div><div class="mini-info"><strong>${l.name}</strong><span>${l.spec}·${l.loc}</span></div><div class="mini-rat">⭐${l.rating}</div></div>`).join('')+`<button class="see-all-btn" onclick="goPage('lawyers')">Barcha advokatlarni ko'rish →</button>`;bubble.appendChild(lb);}}
  const disc=document.createElement('div');disc.className='ai-disclaimer';disc.innerHTML='⚠️ Diqqat! Bu faqat umumiy ma\'lumot. Murakkab holatlarda mutaxassis advokatga murojaat qiling.\n\n<em style="font-size:11px;display:block;margin-top:4px">Eslatma: Bu AI tomonidan berilgan umumiy ma\'lumot. Har qanday qaror qabul qilishdan oldin malakali advokat yoki tegishli davlat organiga murojaat qiling.</em>';bubble.appendChild(disc);
  AUTH.addHistory(txt,resp.text);
}
function sendQ(q){ const inp=document.getElementById('inp'); if(!inp) return; inp.value=q; sendMsg(); }
function handleKey(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }
function autoH(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,100)+'px'; }
function newChat(){ const msgs=document.getElementById('msgs'); if(msgs) msgs.innerHTML=''; chatStarted=false; renderChatWelcome(); }

// DOCUMENT GENERATOR
const DOC_TEMPLATES=[
  {id:'ariza',icon:'📝',name:'Umumiy Ariza',desc:'Har qanday davlat organga',fields:[{id:'to',label:'Kimga (Organ nomi)',placeholder:'Toshkent shahar hokimligi'},{ id:'from',label:'Kimdan (F.I.Sh)',placeholder:'Yusupov Alisher'},{ id:'address',label:'Manzil',placeholder:'Toshkent sh., Chilonzor t.'},{ id:'phone',label:'Telefon',placeholder:'+998901234567'},{ id:'subject',label:'Mavzu',placeholder:'Ariza mavzusi'},{ id:'body',label:'Ariza matni',placeholder:'Men, quyidagi masala bo\'yicha...', type:'textarea'}]},
  {id:'mehnat_ariza',icon:'💼',name:'Mehnat nizosi arizasi',desc:'Ish beruvchiga rasmiy ariza',fields:[{id:'employer',label:'Ish beruvchi nomi',placeholder:'MChJ "Texnopark"'},{ id:'from',label:'Xodim F.I.Sh',placeholder:'Karimov Bobur'},{ id:'position',label:'Lavozim',placeholder:'Dasturchi'},{ id:'issue',label:'Muammo',placeholder:'Ish haqim 2 oydan beri to\'lanmayapti'},{ id:'demand',label:'Talab',placeholder:'Barcha qarzdorlikni 3 kun ichida to\'lang'},{ id:'date',label:'Sana',placeholder:'2026-yil 29-mart'}]},
  {id:'ajralish',icon:'⚖️',name:'Ajralish arizasi',desc:'Fuqarolik holati aktlari idorasiga',fields:[{id:'court',label:'Sud nomi',placeholder:'Toshkent Chilonzor tuman sudi'},{ id:'plaintiff',label:'Ariza beruvchi F.I.Sh',placeholder:'Yusupova Malika'},{ id:'defendant',label:'Turmush o\'rtog\'i F.I.Sh',placeholder:'Yusupov Alisher'},{ id:'marriage_date',label:'Nikoh sanasi',placeholder:'2020-yil 15-may'},{ id:'reason',label:'Ajralish sababi',placeholder:'Oilaviy munosabatlardagi kelishmovchiliklar'},{ id:'children',label:'Farzandlar (soni va yoshi)',placeholder:'2 nafar: 5 va 3 yoshda'}]},
  {id:'kvartira_ijara',icon:'🏠',name:'Ijara shartnomasi',desc:'Uy-joy ijaraga berish uchun',fields:[{id:'owner',label:'Mulk egasi',placeholder:'Rahimov Sardor'},{ id:'tenant',label:'Ijara oluvchi',placeholder:'Mirzayev Jasur'},{ id:'address',label:'Uy manzili',placeholder:'Toshkent, Yakkasaroy'},{ id:'rent',label:'Oylik ijara (so\'m)',placeholder:'2 000 000'},{ id:'start_date',label:'Boshlanish sanasi',placeholder:'2026-yil 1-aprel'},{ id:'duration',label:'Muddat',placeholder:'12 oy'}]},
  {id:'ishonch',icon:'📋',name:'Ishonch xati (Dovernosh)',desc:'Vakolatxona berish uchun',fields:[{id:'from',label:'Ishonch beruvchi',placeholder:'Toshmatov Davron'},{ id:'to',label:'Ishonch olinuvchi',placeholder:'Toshmatova Gulnora'},{ id:'passport_from',label:'Beruvchi pasport raqami',placeholder:'AA 1234567'},{ id:'passport_to',label:'Olinuvchi pasport raqami',placeholder:'AB 7654321'},{ id:'power',label:'Berilayotgan vakolat',placeholder:'Bank hisobidan pul olish'},{ id:'validity',label:'Amal qilish muddati',placeholder:'2026-yil 31-dekabr'}]},
  {id:'shikoyat',icon:'🚨',name:'Shikoyat xati',desc:'Huquq buzilishi bo\'yicha',fields:[{id:'to',label:'Kimga (Organ/Rahbar)',placeholder:'Prokuratura'},{ id:'from',label:'Shikoyat beruvchi',placeholder:'Alieva Nargiza'},{ id:'against',label:'Kim ustidan shikoyat',placeholder:'Kompaniya/mansabdor shaxs'},{ id:'incident',label:'Voqea tavsifi',placeholder:'Qachon va qanday huquq buzilgani'},{ id:'evidence',label:'Dalillar va guvohlar',placeholder:'Video, hujjatlar, guvohlar'},{ id:'demand',label:'Talab',placeholder:'Jinoiy ish qo\'zg\'atish'}]},
];

let selectedTemplate=null;

function renderDocTemplates(){
  const grid=document.getElementById('docTemplatesGrid'); if(!grid) return;
  grid.innerHTML=DOC_TEMPLATES.map(t=>`
    <div class="doc-template-card" onclick="selectDocTemplate('${t.id}')">
      <div class="doc-t-icon">${t.icon}</div>
      <div class="doc-t-name">${t.name}</div>
      <div class="doc-t-desc">${t.desc}</div>
    </div>`).join('');
}

function selectDocTemplate(id){
  selectedTemplate=DOC_TEMPLATES.find(t=>t.id===id); if(!selectedTemplate) return;
  document.getElementById('docTemplateList').style.display='none';
  document.getElementById('docFormArea').style.display='block';
  document.getElementById('docPreviewArea').style.display='none';
  document.getElementById('docFormTitle').textContent=`${selectedTemplate.icon} ${selectedTemplate.name}`;
  document.getElementById('docFormFields').innerHTML=selectedTemplate.fields.map(f=>`
    <div class="doc-field-group">
      <label>${f.label}</label>
      ${f.type==='textarea'?`<textarea id="df-${f.id}" class="doc-field-input" rows="3" placeholder="${f.placeholder}"></textarea>`:`<input id="df-${f.id}" type="text" class="doc-field-input" placeholder="${f.placeholder}"/>`}
    </div>`).join('');
}

function showDocTemplates(){
  document.getElementById('docTemplateList').style.display='block';
  document.getElementById('docFormArea').style.display='none';
  document.getElementById('docPreviewArea').style.display='none';
  selectedTemplate=null;
}

function getDocData(){
  const data={}; if(!selectedTemplate) return data;
  selectedTemplate.fields.forEach(f=>{ const el=document.getElementById('df-'+f.id); data[f.id]=el?el.value.trim():''; }); return data;
}

function generateDocText(tpl,data){
  const today=new Date().toLocaleDateString('uz-UZ',{year:'numeric',month:'long',day:'numeric'});
  if(tpl.id==='ariza') return `${data.to||'___'} ga\n${data.from||'___'} dan\nManzil: ${data.address||'___'}\nTel: ${data.phone||'___'}\n\nARIZA\n\nMavzu: ${data.subject||'___'}\n\n${data.body||'___'}\n\nIltimos, arizamni ko'rib chiqib, tegishli qaror qabul qilishingizni so'rayman.\n\n"${today}"\nImzo: _________\n${data.from||'___'}`;
  if(tpl.id==='mehnat_ariza') return `${data.employer||'___'} rahbariga\n${data.from||'___'} (${data.position||'___'}) dan\n\nMEHNAT NIZOSI BO'YICHA ARIZA\n\nMen, ${data.from||'___'}, quyidagi masala bo'yicha murojaat qilaman:\n\n${data.issue||'___'}\n\nO'zbekiston Respublikasi Mehnat kodeksi 154-moddasi asosida talab qilaman:\n${data.demand||'___'}\n\nAgar 3 ish kuni ichida muammo hal qilinmasa, mehnat inspektsiyasi (1171) va sudga murojaat qilaman.\n\nSana: ${data.date||today}\nImzo: _________`;
  if(tpl.id==='ajralish') return `${data.court||'___'}\n\nDA'VO ARIZASI\n\nAriza beruvchi: ${data.plaintiff||'___'}\nJavobgar: ${data.defendant||'___'}\nNikoh tuzilgan sana: ${data.marriage_date||'___'}\n\nAriza beruvchi va javobgar o'rtasida nikoh tuzilgan. Oilaviy hayotimizda quyidagi sabablarga ko'ra muammo yuzaga keldi:\n${data.reason||'___'}\n\nFarzandlar: ${data.children||"Farzand yo'q"}\n\nO'zbekiston Respublikasi Oila kodeksi 38-moddasi asosida nikohni bekor qilishni so'rayman.\n\nSana: ${today}\nImzo: _________\n${data.plaintiff||'___'}`;
  if(tpl.id==='kvartira_ijara') return `TURAR-JOY IJARA SHARTNOMASI\n\nBu shartnoma ${today} kuni tuzildi.\n\nMulk egasi: ${data.owner||'___'}\nIjara oluvchi: ${data.tenant||'___'}\n\nIjara ob'ekti: ${data.address||'___'}\nOylik ijara narxi: ${data.rent||'___'} so'm\nBoshlanish sanasi: ${data.start_date||'___'}\nMuddat: ${data.duration||'___'}\n\nMULK EGASI MAJBURIYATLARI:\n- Uy-joyni yashashga yaroqli holda topshirish\n- Kommunal xizmatlarni ta'minlash\n\nIJARA OLUVCHI MAJBURIYATLARI:\n- Oylik ijara to'lovini o'z vaqtida amalga oshirish\n- Mulkka zarar yetkazmaslik\n\nMulk egasi imzosi: _________\nIjara oluvchi imzosi: _________`;
  if(tpl.id==='ishonch') return `ISHONCH XATI\n\nMen, ${data.from||'___'} (pasport: ${data.passport_from||'___'}), ushbu ishonch xati orqali ${data.to||'___'} (pasport: ${data.passport_to||'___'}) ga quyidagi vakolatni beraman:\n\n${data.power||'___'}\n\nUshbu ishonch xati ${data.validity||'___'} gacha amal qiladi.\n\nSana: ${today}\nImzo: _________\n${data.from||'___'}`;
  if(tpl.id==='shikoyat') return `${data.to||'___'} ga\n${data.from||'___'} dan\n\nSHIKOYAT\n\n${data.against||'___'} tomonidan quyidagi huquq buzilishi sodir bo'ldi:\n\n${data.incident||'___'}\n\nDalillar: ${data.evidence||'___'}\n\nO'zbekiston Respublikasi Konstitutsiyasi 44-moddasi (sud himoyasi) asosida quyidagini talab qilaman:\n${data.demand||'___'}\n\nSana: ${today}\nImzo: _________\n${data.from||'___'}`;
  return 'Hujjat yaratildi.';
}

function previewDoc(){
  if(!selectedTemplate){toast('Shablon tanlanmagan');return;}
  const data=getDocData();
  const text=generateDocText(selectedTemplate,data);
  document.getElementById('docFormArea').style.display='none';
  document.getElementById('docPreviewArea').style.display='block';
  document.getElementById('docPreviewContent').innerHTML=`<h2>${selectedTemplate.icon} ${selectedTemplate.name}</h2><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.8">${text}</pre><div class="doc-footer">Ushbu hujjat Huquq AI tomonidan yaratildi | ${new Date().toLocaleString('uz-UZ')} | Bu umumiy shablon. Notarius orqali tasdiqlash tavsiya etiladi.</div>`;
}
function backToDocForm(){ document.getElementById('docPreviewArea').style.display='none'; document.getElementById('docFormArea').style.display='block'; }
function downloadPDF(){
  if(!selectedTemplate){toast('Avval hujjatni ko\'ring');return;}
  const data=getDocData(), text=generateDocText(selectedTemplate,data), printWin=window.open('','_blank','width=800,height=600');
  printWin.document.write(`<!DOCTYPE html><html><head><title>${selectedTemplate.name}</title><meta charset="UTF-8"><style>body{font-family:'Georgia',serif;max-width:720px;margin:40px auto;padding:40px;font-size:14px;line-height:1.8;color:#1a1a1a}h1{font-size:20px;text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:24px}.footer{margin-top:40px;font-size:11px;color:#666;text-align:center;border-top:1px solid #ccc;padding-top:12px}pre{white-space:pre-wrap;font-family:inherit}@media print{body{margin:0;padding:20px}}</style></head><body><h1>${selectedTemplate.icon} ${selectedTemplate.name}</h1><pre>${text}</pre><div class="footer">Huquq AI orqali yaratildi | ${new Date().toLocaleString('uz-UZ')}<br><em>Bu umumiy shablon. Yuridik kuchga ega bo'lishi uchun notarius orqali tasdiqlang.</em></div></body></html>`);
  printWin.document.close(); setTimeout(()=>printWin.print(),500);
  toast('📄 PDF chop etish oynasi ochildi');
}

// ADMIN PANEL
const ADMIN_PASS='admin2026';
let KB_DATA=[];
function getKB(){ try{return JSON.parse(localStorage.getItem('huquq_kb'))||[];}catch{return[];} }
function saveKB(arr){ localStorage.setItem('huquq_kb',JSON.stringify(arr)); }

function openAdminLogin(){
  const pass=prompt('Admin pароль kiriting:');
  if(pass===ADMIN_PASS){ toast('✅ Admin paneliga xush kelibsiz!'); goPage('admin'); }
  else if(pass!==null){ toast('❌ Parol noto\'g\'ri'); }
}

function switchAdminTab(tab){
  ['lawyers','kb','stats'].forEach(t=>{
    document.getElementById('adminTab'+t.charAt(0).toUpperCase()+t.slice(1)).style.display=t===tab?'block':'none';
    document.getElementById('atab-'+t).classList.toggle('active',t===tab);
  });
  if(tab==='lawyers') renderAdminLawyers();
  if(tab==='kb') renderAdminKb();
  if(tab==='stats') renderAdminStats();
}

function renderAdmin(){
  renderAdminLawyers();
}

function renderAdminLawyers(){
  const container=document.getElementById('adminLawyersList'); if(!container) return;
  if(!LAWYERS.length){container.innerHTML='<p style="color:var(--text3);text-align:center;padding:24px">Advokatlar yo\'q</p>';return;}
  container.innerHTML=LAWYERS.map(l=>`
    <div class="admin-lawyer-row">
      <div class="admin-lawyer-av">${l.initials||l.name[0]}</div>
      <div class="admin-lawyer-info">
        <div class="admin-lawyer-name">${l.name}</div>
        <div class="admin-lawyer-meta">${l.spec} · ${l.loc} · ⭐${l.rating} · ${l.exp} yil</div>
      </div>
      <button class="admin-delete-btn" onclick="deleteLawyer(${l.id})">🗑️</button>
    </div>`).join('');
}

function deleteLawyer(id){
  if(!confirm('Advokatni o\'chirishni tasdiqlaysizmi?')) return;
  LAWYERS=LAWYERS.filter(l=>l.id!==id); saveLawyersDB(LAWYERS);
  renderAdminLawyers(); toast('✅ Advokat o\'chirildi');
}

function openAddLawyerModal(){ openModal('addLawyerOverlay'); }

function saveNewLawyer(){
  const name=document.getElementById('al-name').value.trim(), specEl=document.getElementById('al-spec'), exp=parseInt(document.getElementById('al-exp').value), rating=parseFloat(document.getElementById('al-rating').value), phone=document.getElementById('al-phone').value.trim(), about=document.getElementById('al-about').value.trim(), region=document.getElementById('al-region').value, err=document.getElementById('alErr');
  err.textContent='';
  if(!name){err.textContent='Ism kiriting';return;}
  if(!exp||exp<1){err.textContent='Tajribani kiriting';return;}
  if(!rating||rating<1||rating>5){err.textContent='Reytingni to\'g\'ri kiriting (1-5)';return;}
  if(!phone){err.textContent='Telefon kiriting';return;}
  const specText=specEl.options[specEl.selectedIndex].text, specKey=specEl.options[specEl.selectedIndex].getAttribute('data-key')||specEl.value;
  const newL={id:Date.now(),initials:name[0],name,spec:specText,specKey,region,loc:region.charAt(0).toUpperCase()+region.slice(1),rating,exp,phone,about:about||`${name} — ${specText} sohasida mutaxassis.`};
  LAWYERS.push(newL); saveLawyersDB(LAWYERS);
  closeModal('addLawyerOverlay'); renderAdminLawyers(); toast('✅ Yangi advokat qo\'shildi!');
  ['al-name','al-exp','al-rating','al-phone','al-about'].forEach(id=>{const el=document.getElementById(id);if(el) el.value='';});
}

function renderAdminKb(){
  KB_DATA=getKB();
  const container=document.getElementById('adminKbList'); if(!container) return;
  if(!KB_DATA.length){container.innerHTML='<p style="color:var(--text3);text-align:center;padding:24px">FAQ ma\'lumotlari yo\'q. Birinchisini qo\'shing!</p>';return;}
  container.innerHTML=KB_DATA.map((kb,i)=>`
    <div class="admin-kb-row">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span class="admin-kb-cat-badge">${kb.cat||'boshqa'}</span>
      </div>
      <div class="admin-kb-q">❓ ${kb.q}</div>
      <div class="admin-kb-a">${kb.a}</div>
      ${kb.src?`<div class="admin-kb-src">🔗 <a href="${kb.src}" target="_blank">${kb.src}</a></div>`:''}
      <div class="admin-kb-actions">
        <button class="admin-kb-del" onclick="deleteKb(${i})">🗑️ O'chirish</button>
      </div>
    </div>`).join('');
}

function openAddKbModal(){ openModal('addKbOverlay'); }

function saveNewKb(){
  const q=document.getElementById('kb-q').value.trim(), a=document.getElementById('kb-a').value.trim(), src=document.getElementById('kb-src').value.trim(), cat=document.getElementById('kb-cat').value, err=document.getElementById('kbErr');
  err.textContent='';
  if(!q){err.textContent='Savol kiriting';return;}
  if(!a){err.textContent='Javob kiriting';return;}
  const kb=getKB(); kb.push({q,a,src,cat,date:new Date().toLocaleString('uz-UZ')});
  saveKB(kb); closeModal('addKbOverlay'); renderAdminKb();
  ['kb-q','kb-a','kb-src'].forEach(id=>{const el=document.getElementById(id);if(el) el.value='';});
  toast('✅ FAQ qo\'shildi!');
}

function deleteKb(idx){
  if(!confirm('O\'chirishni tasdiqlaysizmi?')) return;
  const kb=getKB(); kb.splice(idx,1); saveKB(kb); renderAdminKb(); toast('✅ O\'chirildi');
}

function renderAdminStats(){
  const container=document.getElementById('adminStatsGrid'); if(!container) return;
  const histCount=AUTH.history.length, lawyerCount=LAWYERS.length, kbCount=getKB().length, userCount=getUsers().length;
  container.innerHTML=[
    {icon:'👥',val:userCount,lbl:'Foydalanuvchilar'},
    {icon:'💬',val:histCount,lbl:'Savollar'},
    {icon:'👨‍⚖️',val:lawyerCount,lbl:'Advokatlar'},
    {icon:'📚',val:kbCount,lbl:'FAQ ma\'lumotlar'},
    {icon:'🔑',val:GPT.key?'✅':'❌',lbl:'API Holati'},
    {icon:'📅',val:new Date().toLocaleDateString('uz-UZ'),lbl:'Bugungi sana'},
  ].map(s=>`<div class="admin-stat-card"><div class="admin-stat-icon">${s.icon}</div><div class="admin-stat-val">${s.val}</div><div class="admin-stat-lbl">${s.lbl}</div></div>`).join('');
}

// VOICE
let recognition=null, voiceActive=false;
function toggleVoice(){
  const btn=document.getElementById('voiceBtn');
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){toast('⚠️ Brauzeringiz ovoz funksiyasini qo\'llab-quvvatlamaydi');return;}
  if(voiceActive){if(recognition) recognition.stop();voiceActive=false;btn.style.color='';return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; recognition=new SR();
  recognition.lang='uz-UZ'; recognition.continuous=false; recognition.interimResults=false;
  recognition.onstart=()=>{voiceActive=true;btn.style.color='#ef4444';toast('🎤 Gapiring...');};
  recognition.onresult=e=>{document.getElementById('inp').value=e.results[0][0].transcript;sendMsg();};
  recognition.onend=()=>{voiceActive=false;btn.style.color='';};
  recognition.onerror=()=>{voiceActive=false;btn.style.color='';toast('Ovoz tanilmadi');};
  recognition.start();
}

// API SETTINGS
function openApiSettings(){ const inp=document.getElementById('apiKeyInput'); if(inp) inp.value=GPT.key; openModal('apiOverlay'); }
function saveApiKey(){
  const val=document.getElementById('apiKeyInput').value.trim(), err=document.getElementById('apiKeyErr'); err.textContent='';
  if(!val){GPT.clear();toast('API kalit o\'chirildi');closeModal('apiOverlay');}
  else if(!val.startsWith('sk-')){err.textContent='❌ Noto\'g\'ri format (sk- bilan boshlanishi kerak)';return;}
  else{GPT.save(val);toast('✅ GPT API kaliti saqlandi!');closeModal('apiOverlay');}
  if(AUTH.user) renderProfile();
}
function updateProfile(){ if(currentPage==='auth') renderProfile(); }

// MODALS
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function closeOverlay(e,id){ if(e.target.classList.contains('overlay')) closeModal(id); }

// TOAST
function toast(msg,dur=2800){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),dur); }

// SPLASH
function hideSplash(){ const s=document.getElementById('splash-screen'); if(s){s.classList.add('hidden');setTimeout(()=>{s.style.display='none';},600);} }

// INIT
window.addEventListener('DOMContentLoaded',()=>{
  goPage('home');
  renderDocTemplates();
  setTimeout(hideSplash, 2500);
});
