// ============================================================
//  ADALAT AI — app.js  (Konstitutsiya + GPT + Tarix)
// ============================================================

// ===== GPT API =====
const GPT = {
  get key() { return localStorage.getItem('adalat_gpt_key') || ''; },
  save(k)   { localStorage.setItem('adalat_gpt_key', k.trim()); },
  clear()   { localStorage.removeItem('adalat_gpt_key'); }
};

// O'zbekiston Konstitutsiyasi — GPT uchun system prompt
const SYSTEM_PROMPT = `Siz "Adalat AI" — O'zbekiston Respublikasining huquqiy yordamchisiz.
Foydalanuvchi savolini O'zbekiston Respublikasi qonunchiligi (Konstitutsiya, barcha kodekslar, qonunlar, farmon va qarorlar) asosida KENG, BATAFSIL va CHUQUR tahlil qiling. Faqat Konstitutsiya emas, balki boshqa barcha huquq sohalarida (soliq, bojxona, ta'lim, tibbiyot, tadbirkorlik va h.k.) bo'lgan savollarga ham TO'LIQ javob bering. Javobingiz juda qisqa bo'lmasin, yetarli darajada ochiqlab tushuntiring.

Qoidalar:
1. Har doim O'ZBEK tilida, batafsil, tushunarli va huquqiy jihatdan aniq tilda javob bering.
2. Javobda qonun yoki kodekslarning (masalan, Oila kodeksi, Mehnat kodeksi, Soliq kodeksi) joriy normalari, moddalarini aniq nomlab va tushuntirib bering.
3. Javobni quyidagi format bilan yozing:
   - Avval masalaning yuridik tahlili va tushuntirishi (kamida 4-5 jumla, iloji boricha to'liqroq yoritib bering)
   - Keyin "📌 Tegishli qonunchilik va moddalar" bo'limi (moddalar raqami, sarlavhasi)
   - So'ngra "📋 Nima qilish kerak?" bo'limida muammoni hal qilishning tugal, qadam-baqadam huquqiy yo'riqnomasi (algoritmi)
4. Muhim: Foydalanuvchi chuqurroq axborot va hujjatlarning to'liq matnini "O'zbekiston Respublikasi Qonunchilik ma'lumotlari milliy bazasi" — yagona davlat portali Lex.uz orqali izlab topib o'qishi mumkinligini aytib o'ting va [Lex.uz](https://lex.uz) havolasini bering.
5. Murakkab holatlarda yoki sud ishlari, muhim bitimlar tuzilishida malakali advokat ishtiroki shart ekanini tavsiya eting.
6. Javob oxirida: "📖 Manba: O'zbekiston Respublikasi [tegishli] qonun/kodekslari va Lex.uz milliy qonunchilik bazasi" shaklida bering.

Qo'shimcha tayanch qoidalar vizual tarzda yaxshi ko'rinishi uchun Markdown formatidan foydalanib ajratishingizni so'rayman (bullet pointlar va qalin harflar bilan). Agar savol noaniq bo'lsa, taxminiy turdosh huquqiy ehtimolliklarni keltirgan holda har tomonlama yoritib berishga harakat qiling.`;

// ===== AUTH STATE =====
const AUTH = {
  get user() { try { return JSON.parse(localStorage.getItem('adalat_user')) || null; } catch { return null; } },
  save(u)    { localStorage.setItem('adalat_user', JSON.stringify(u)); },
  logout()   { localStorage.removeItem('adalat_user'); },
  get history() { try { return JSON.parse(localStorage.getItem('adalat_history')) || []; } catch { return []; } },
  addHistory(q, a, topic) {
    const h = this.history;
    h.unshift({ q, a, topic, date: new Date().toLocaleString('uz-UZ'), id: Date.now() });
    if (h.length > 50) h.pop();
    localStorage.setItem('adalat_history', JSON.stringify(h));
  },
  clearHistory() { localStorage.removeItem('adalat_history'); }
};

// ===== REGISTERED USERS =====
function getUsers() { try { return JSON.parse(localStorage.getItem('adalat_users')) || []; } catch { return []; } }
function saveUsers(arr) { localStorage.setItem('adalat_users', JSON.stringify(arr)); }

// ===== PAGE NAVIGATION =====
let _pendingQ = '';

function goPage(name) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('pg-' + name);
  if (el) el.classList.add('active');
  if (name === 'lawyers') renderLawyers(LAWYERS);
  if (name === 'history') renderHistory();
  if (name === 'docs') renderDocGrid();
  if (name === 'chat' && _pendingQ) {
    setTimeout(() => { sendQ(_pendingQ); _pendingQ = ''; }, 300);
  }
  window.scrollTo(0, 0);
  updateNav();
}

function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ===== UPDATE NAVBAR =====
function updateNav() {
  const nr = document.getElementById('navRight');
  if (AUTH.user) {
    const apiStatus = GPT.key ? '🟢' : '🔑';
    const isPrem = AUTH.user.plan === 'premium';
    const premBtn = isPrem
      ? '<span class="nav-prem-badge">👑 Premium</span>'
      : '<button class="nav-prem-btn" onclick="goPage(\'premium\')">👑 Premium</button>';
    nr.innerHTML = `
      <button class="nav-api-btn" onclick="openApiSettings()">${apiStatus} API</button>
      <button class="nav-user-btn" onclick="goPage('history')">👤 ${AUTH.user.name.split(' ')[0]}</button>
      ${premBtn}
      <button class="nav-btn-login" onclick="doLogout()">Chiqish</button>`;
  } else {
    nr.innerHTML = `<button class="nav-btn-login" onclick="showRegPage()">Ro'yxatdan o'tish</button>`;
  }
}

function doLogout() {
  AUTH.logout();
  updateNav();
  showRegPage();
  toast('Tizimdan chiqdingiz');
}

// ===== SHOW REG PAGE (kirish sahifasi) =====
function showRegPage() {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  document.getElementById('pg-auth').classList.add('active');
  switchAuthTab('reg');
  window.scrollTo(0, 0);
  updateNav();
}

function showLoginPage() {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  document.getElementById('pg-auth').classList.add('active');
  switchAuthTab('login');
  window.scrollTo(0, 0);
  updateNav();
}

// ===== HERO SEARCH =====
function heroSearch() {
  const q = document.getElementById('heroQ').value.trim();
  if (!q) return;
  _pendingQ = q;
  goPage('chat');
}

function quickAsk(q) {
  _pendingQ = q;
  goPage('chat');
}

// ===== LAWYERS DATA =====
const DEFAULT_LAWYERS = [
  { id:1, emoji:'👨‍💼', name:'Akbar Yusupov',    spec:'Mehnat Huquqi',    specKey:'mehnat',  region:'toshkent', loc:'Toshkent', rating:4.9, cases:312, exp:12, reviews:87,  price:'Bepul konsultatsiya', phone:'+998 90 123 45 67', tags:['Mehnat shartnomasi','Ishdan bo\'shatish','Ish haqi'], about:'Mehnat nizolari va ish haqi to\'lovlari bo\'yicha 12 yillik tajriba. 300+ muvaffaqiyatli ish.' },
  { id:2, emoji:'👩‍⚖️', name:'Zulfiya Karimova', spec:'Oilaviy Huquq',    specKey:'oila',    region:'samarqand',loc:'Samarqand',rating:5.0, cases:198, exp:8,  reviews:64,  price:'50,000 so\'m/konsultatsiya', phone:'+998 90 234 56 78', tags:['Ajralish','Aliment','Vasiyat'], about:'Oilaviy nizolar, ajralish va aliment masalalarida tajribali advokat.' },
  { id:3, emoji:'👨‍💼', name:'Bobur Toshmatov',  spec:'Biznes Huquqi',   specKey:'biznes',  region:'toshkent', loc:'Toshkent', rating:4.8, cases:425, exp:15, reviews:112, price:'Birinchi konsultatsiya bepul', phone:'+998 90 345 67 89', tags:['IE va MChJ','Shartnomalar','Intellektual mulk'], about:'Kompaniya tashkil etish va korporativ huquq sohasida yetakchi mutaxassis.' },
  { id:4, emoji:'👩‍💼', name:'Malika Ergasheva', spec:'Mulk Huquqi',      specKey:'mulk',    region:'buxoro',   loc:'Buxoro',   rating:4.7, cases:156, exp:9,  reviews:48,  price:'30,000 so\'m/konsultatsiya', phone:'+998 90 456 78 90', tags:['Uy-joy','Ijara','Mulk ro\'yxati'], about:'Ko\'chmas mulk va uy-joy ijarasi masalalarida mutaxassis.' },
  { id:5, emoji:'👨‍⚖️', name:'Sherzod Nazarov',  spec:'Jinoiy Huquq',    specKey:'jinoyat', region:'namangan', loc:'Namangan', rating:4.9, cases:289, exp:14, reviews:93,  price:'Bepul konsultatsiya', phone:'+998 90 567 89 01', tags:['Jinoiy mudofaa','Sud vakili','Apellyatsiya'], about:'Jinoiy ishlar bo\'yicha shoshilinch mudofaa va sud jarayonlarida vakillik.' },
  { id:6, emoji:'👩‍💼', name:'Nodira Hasanova',  spec:'Iste\'molchi Huquqi',specKey:'isteMol',region:'fargona',  loc:'Farg\'ona', rating:4.6, cases:134, exp:6,  reviews:39,  price:'Bepul konsultatsiya', phone:'+998 90 678 90 12', tags:['Sifatsiz tovar','Bank nizosi','Sug\'urta'], about:'Iste\'molchilarni himoya qilish va bank nizolari bo\'yicha mutaxassis.' },
  { id:7, emoji:'👨‍💼', name:'Jamshid Pulatov',  spec:'Ma\'muriy Huquq',  specKey:'mamuriy', region:'andijon',  loc:'Andijon',  rating:4.8, cases:201, exp:11, reviews:67,  price:'40,000 so\'m/konsultatsiya', phone:'+998 90 789 01 23', tags:['Davlat organlari','Jarimalar','Litsenziya'], about:'Davlat organlari bilan nizolar va ma\'muriy huquq bo\'yicha tajribali advokat.' },
  { id:8, emoji:'👩‍⚖️', name:'Shahnoza Mirova',  spec:'Mehnat Huquqi',    specKey:'mehnat',  region:'samarqand',loc:'Samarqand',rating:4.7, cases:178, exp:7,  reviews:55,  price:'25,000 so\'m/konsultatsiya', phone:'+998 90 890 12 34', tags:['Ish haqi','Ta\'til huquqi','Diskriminatsiya'], about:'Mehnat diskriminatsiyasi va xotin-qizlar huquqlari bo\'yicha ixtisoslashgan.' },
];

function getLawyers() {
  try {
    const stored = localStorage.getItem('adalat_lawyers');
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  return DEFAULT_LAWYERS;
}
function saveLawyer(l) {
  const list = getLawyers();
  list.unshift(l);
  localStorage.setItem('adalat_lawyers', JSON.stringify(list));
  LAWYERS = list;
}
let LAWYERS = getLawyers();

// ===== RENDER LAWYERS =====
function renderLawyers(list) {
  const grid = document.getElementById('lawyersGrid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text3)">
      <div style="font-size:40px;margin-bottom:12px">🔍</div><p>Hech narsa topilmadi. Filtrlarni o'zgartiring.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(l => `
    <div class="lcard" onclick="openLawyer(${l.id})">
      <div class="lcard-top">
        <div class="lav">${l.emoji}</div>
        <div class="linf">
          <div class="lname">${l.name}</div>
          <div class="lspec">${l.spec}</div>
          <div class="lloc">📍 ${l.loc}</div>
        </div>
        <div class="lver">✓ Tasdiqlangan</div>
      </div>
      <div class="lstats">
        <div class="lst"><span class="v">${l.rating}⭐</span><span class="l">Reyting</span></div>
        <div class="lst"><span class="v">${l.cases}</span><span class="l">Ish</span></div>
        <div class="lst"><span class="v">${l.exp} yil</span><span class="l">Tajriba</span></div>
      </div>
      <div class="ltags">${l.tags.map(t => `<span class="ltag">${t}</span>`).join('')}</div>
      <div style="font-size:12px;color:var(--green);margin-bottom:12px">💬 ${l.price}</div>
      <div class="lcard-btns">
        <button class="lb lb-p" onclick="event.stopPropagation();callL(${l.id})">📞 Qo'ng'iroq</button>
        <button class="lb lb-s" onclick="event.stopPropagation();chatL(${l.id})">💬 Xabar</button>
      </div>
    </div>`).join('');
}

function filterL() {
  const r  = document.getElementById('fRegion').value;
  const s  = document.getElementById('fSpec').value;
  const kw = document.getElementById('fSearch').value.toLowerCase();
  const res = LAWYERS.filter(l =>
    (!r || l.region === r) &&
    (!s || l.specKey === s) &&
    (!kw || l.name.toLowerCase().includes(kw) || l.spec.toLowerCase().includes(kw))
  );
  renderLawyers(res);
}

function openLawyer(id) {
  const l = LAWYERS.find(x => x.id === id);
  if (!l) return;
  document.getElementById('lawyerDetail').innerHTML = `
    <div class="lm-head">
      <div class="lm-av">${l.emoji}</div>
      <div>
        <div class="lm-name">${l.name}</div>
        <div class="lver" style="display:inline-flex;margin:4px 0">✓ Tasdiqlangan</div>
        <div class="lm-spec">${l.spec} · ${l.loc}</div>
      </div>
    </div>
    <div class="lm-stats">
      <div class="lm-stat"><div class="v">${l.rating}⭐</div><div class="l">Reyting</div></div>
      <div class="lm-stat"><div class="v">${l.cases}</div><div class="l">Ishlar</div></div>
      <div class="lm-stat"><div class="v">${l.exp} yil</div><div class="l">Tajriba</div></div>
      <div class="lm-stat"><div class="v">${l.reviews}</div><div class="l">Sharhlar</div></div>
    </div>
    <p class="lm-about">${l.about}</p>
    <div class="ltags" style="margin-bottom:16px">${l.tags.map(t=>`<span class="ltag">${t}</span>`).join('')}</div>
    <div style="padding:12px;border-radius:9px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);margin-bottom:18px;font-size:13px;color:var(--green)">💬 ${l.price}</div>
    <div class="lm-btns">
      <button class="lm-btn lm-call" onclick="callL(${l.id})">📞 ${l.phone}</button>
      <button class="lm-btn lm-chat" onclick="chatL(${l.id})">💬 Chat boshlash</button>
    </div>`;
  openModal('lawyerOverlay');
}

function callL(id) {
  const l = LAWYERS.find(x => x.id === id);
  toast(`📞 ${l.name}: ${l.phone}`);
}
function chatL(id) {
  const l = LAWYERS.find(x => x.id === id);
  closeModal('lawyerOverlay');
  _pendingQ = `[${l.name} bilan chat]`;
  goPage('chat');
  setTimeout(() => {
    addMsg(`${l.emoji} **${l.name}** bilan chat boshlandi!\n\nSalom, men ${l.spec} bo'yicha advokatman. Sizga qanday yordam bera olaman?`, 'ai');
  }, 300);
}

// ===== TARIX BO'LIMI =====
function renderHistory() {
  const hist = AUTH.history;
  const container = document.getElementById('historyList');
  if (!container) return;
  if (!hist.length) {
    container.innerHTML = `<div class="no-hist-big">
      <div style="font-size:64px;margin-bottom:16px">📜</div>
      <h3>Tarix bo'sh</h3>
      <p>Siz hali hech qanday savol bermadingiz. AI bilan gaplashing!</p>
      <button class="hist-chat-btn" onclick="goPage('chat')">🤖 AI Maslahat →</button>
    </div>`;
    return;
  }
  container.innerHTML = hist.map(h => `
    <div class="hist-card">
      <div class="hist-card-top">
        <div class="hist-q-icon">❓</div>
        <div class="hist-q-text">${h.q}</div>
        <div class="hist-date">${h.date}</div>
      </div>
      <div class="hist-answer">${fmt(h.a)}</div>
      <button class="hist-repeat-btn" onclick="sendQ('${h.q.replace(/'/g,"\\'")}');goPage('chat')">🔄 Qayta so'rash</button>
    </div>`).join('');
}

function clearHistory() {
  if (!confirm('Barcha tarixni o\'chirmoqchimisiz?')) return;
  AUTH.clearHistory();
  renderHistory();
  toast('Tarix tozalandi');
}

// ===== AUTH INLINE PAGE =====
let _regData = {};

function switchAuthTab(tab) {
  const loginForm = document.getElementById('authLoginForm');
  const regForm   = document.getElementById('authRegForm');
  const otpForm   = document.getElementById('authOTPForm');
  const tabL = document.getElementById('authTabLogin');
  const tabR = document.getElementById('authTabReg');
  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (regForm)   regForm.style.display   = tab === 'reg'   ? 'block' : 'none';
  if (otpForm)   otpForm.style.display   = 'none';
  if (tabL) tabL.classList.toggle('active', tab === 'login');
  if (tabR) tabR.classList.toggle('active', tab === 'reg');
  ['authLoginErr','authRegErr','authOTPErr'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=''; });
}

function doAuthLogin() {
  const phone = document.getElementById('authLoginPhone').value.trim();
  const pass  = document.getElementById('authLoginPass').value;
  const err   = document.getElementById('authLoginErr');
  err.textContent = '';
  if (!phone) { err.textContent = 'Telefon raqam kiriting'; return; }
  if (!pass)  { err.textContent = 'Parol kiriting'; return; }
  const users = getUsers();
  const u = users.find(x => x.phone === phone.replace(/\s/g,''));
  if (!u)           { err.textContent = '❌ Bu raqam ro\'yxatdan o\'tmagan'; return; }
  if (u.pass !== pass) { err.textContent = '❌ Parol noto\'g\'ri'; return; }
  AUTH.save(u);
  updateNav();
  toast(`✅ Xush kelibsiz, ${u.name}!`);
  goPage('chat');
}

function doAuthRegister() {
  const role  = document.getElementById('authRegRole').value;
  const name  = document.getElementById('authRegName').value.trim();
  const phone = document.getElementById('authRegPhone').value.trim();
  const pass  = document.getElementById('authRegPass').value;
  const pass2 = document.getElementById('authRegPass2').value;
  const err   = document.getElementById('authRegErr');
  err.textContent = '';
  
  // Lawyer form fields
  const licence = document.getElementById('authRegLicence')?.value.trim();
  const exp = document.getElementById('authRegExp')?.value.trim();
  const specKey = document.getElementById('authRegSpec')?.value;
  const region = document.getElementById('authRegRegion')?.value.trim();
  const price = document.getElementById('authRegPrice')?.value.trim();
  const pic = document.getElementById('authRegPic')?.value.trim() || '👨‍⚖️';

  if (!name)           { err.textContent = 'Ismingizni kiriting'; return; }
  if (name.length < 2) { err.textContent = 'Ism kamida 2 ta harf bo\'lsin'; return; }
  if (!phone)          { err.textContent = 'Telefon raqam kiriting'; return; }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) { err.textContent = 'To\'g\'ri telefon raqam kiriting'; return; }
  if (pass.length < 6)   { err.textContent = 'Parol kamida 6 ta belgi bo\'lsin'; return; }
  if (pass2 && pass !== pass2) { err.textContent = 'Parollar mos kelmadi'; return; }

  if (role === 'lawyer') {
    if (!licence) { err.textContent = 'Litsenziya raqamini kiriting'; return; }
  }

  const users = getUsers();
  const normalizedPhone = phone.replace(/\s/g, '');
  if (users.find(x => x.phone.replace(/\s/g,'') === normalizedPhone)) {
    err.textContent = '❌ Bu raqam allaqachon ro\'yxatdan o\'tgan'; return;
  }
  _regData = { role, name, phone: normalizedPhone, pass, advokatData: {licence, exp, specKey, region, price, pic} };
  document.getElementById('authRegForm').style.display = 'none';
  document.getElementById('authOTPForm').style.display = 'block';
  document.getElementById('authOTPPhone').textContent = normalizedPhone;
  document.querySelectorAll('.auth-otp-inp').forEach(i => i.value = '');
  setTimeout(() => document.getElementById('authOtp0').focus(), 100);
}

function authOtpNext(el, idx) {
  el.value = el.value.replace(/\D/g, '');
  if (el.value && idx < 5) document.getElementById('authOtp' + (idx + 1)).focus();
  const all = Array.from({length:6}, (_,i) => document.getElementById('authOtp'+i).value);
  if (all.every(v => v)) doAuthVerifyOTP();
}

function doAuthVerifyOTP() {
  const code = Array.from({length:6}, (_,i) => document.getElementById('authOtp'+i).value).join('');
  const err = document.getElementById('authOTPErr');
  err.textContent = '';
  if (code.length < 6) { err.textContent = 'Barcha 6 ta raqamni kiriting'; return; }
  if (code !== '123456') {
    err.textContent = '❌ Noto\'g\'ri kod. Demo uchun: 123456';
    document.querySelectorAll('.auth-otp-inp').forEach(i => i.value = '');
    document.getElementById('authOtp0').focus();
    return;
  }
  const isLawyer = _regData.role === 'lawyer';
  const newUser = { name: _regData.name, phone: _regData.phone, pass: _regData.pass, plan: 'free', role: _regData.role, createdAt: Date.now() };

  if (isLawyer) {
    const specs = { jinoyat: 'Jinoiy Huquq', fuqarolik: 'Fuqarolik Huquqi', oila: 'Oilaviy Huquq', biznes: 'Biznes Huquqi' };
    const specName = specs[_regData.advokatData.specKey] || _regData.advokatData.specKey;
    
    const newLawyer = {
      id: Date.now(),
      emoji: _regData.advokatData.pic,
      name: _regData.name,
      spec: specName,
      specKey: _regData.advokatData.specKey,
      region: _regData.advokatData.region.toLowerCase(),
      loc: _regData.advokatData.region || 'Noma\'lum hudud',
      rating: 5.0,
      cases: 0,
      exp: parseInt(_regData.advokatData.exp) || 0,
      reviews: 0,
      price: _regData.advokatData.price || 'Kelishilgan narx',
      phone: _regData.phone,
      tags: ['Yangi advokat'],
      about: `Litsenziya raqami: ${_regData.advokatData.licence}. ${specName} bo\'yicha advokat.`
    };
    saveLawyer(newLawyer);
    newUser.lawyerId = newLawyer.id;
  }

  const users = getUsers();
  users.push(newUser);
  saveUsers(users);
  AUTH.save(newUser);
  updateNav();
  toast(`🎉 Ro\'yxatdan o\'tdingiz! Xush kelibsiz, ${newUser.name}!${isLawyer ? ' Advokat sifatida ro\'yxatdan o\'tdingiz!' : ''}`);
  goPage('chat');
}

function authResendOTP() {
  document.querySelectorAll('.auth-otp-inp').forEach(i => i.value = '');
  document.getElementById('authOtp0').focus();
  document.getElementById('authOTPErr').textContent = '';
  toast('📱 Kod qayta yuborildi (demo: 123456)');
}

// ===== O'ZBEKISTON KONSTITUTSIYASI MODDALAR BAZASI =====
const KONSTITUTSIYA = [
  // I BOB — ASOSIY QOIDALAR
  { mod: 1,  bob: "I bob. Davlat suvereniteti", text: "O'zbekiston Respublikasi — suveren demokratik respublika. O'zbekiston Respublikasining nomi O'zbekiston deb ham yuritiladi." },
  { mod: 2,  bob: "I bob. Davlat suvereniteti", text: "Davlat xalq manfaatlarini ko'zlab ish tutadi va uning faoliyati odamlar hayotini, huquqlari, erkinliklari va qonuniy manfaatlarini ta'minlashga yo'naltirilgan bo'ladi." },
  { mod: 7,  bob: "I bob. Davlat suvereniteti", text: "Xalq davlat hokimiyatining birdan-bir manbayidir. Davlat hokimiyati xalq manfaatlari yo'lida va xalq tomonidan amalga oshiriladi." },
  // II BOB — FUQAROLIK
  { mod: 17, bob: "II bob. Fuqarolik", text: "O'zbekiston Respublikasining fuqaroligi yagona va teng. O'zbekiston fuqarosi bo'la turib, boshqa davlatning fuqarosi bo'lish mumkin emas." },
  // III BOB — IQTISODIY ASOSLAR
  { mod: 53, bob: "III bob. Iqtisodiy asoslar", text: "Bozor муносабатларini rivojlantirish O'zbekiston iqtisodiy rivojlanishining asosi hisoblanadi." },
  { mod: 54, bob: "III bob. Iqtisodiy asoslar", text: "Barcha mulk shakllari teng huquqli bo'lib, qonun bilan bir xil himoya qilinadi. Xususiy mulk daxlsizdir. Mulk egasi o'z mulkidan o'zboshimchalik bilan mahrum etilishi mumkin emas." },
  // II QISM — ASOSIY HUQUQ VA ERKINLIKLAR
  // IV BOB — SHAXSIY HUQUQLAR
  { mod: 25, bob: "IV bob. Shaxsiy huquqlar", text: "Har bir kishi erkinlik va shaxsiy daxlsizlik huquqiga ega. Hech kim qonunda belgilangan tartibdan boshqacha usulda hibsga olinishi yoki qamoqqa olinishi mumkin emas." },
  { mod: 26, bob: "IV bob. Shaxsiy huquqlar", text: "Hech kim biror jinoyat sodir etganlik uchun qonunda ko'rsatilgan tartibda, sudning qonuniy kuchga kirgan hukmi bo'lmasa, aybdor deb topilishi va jinoiy jazoga tortilishi mumkin emas. Aybsizlik prezumpsiyasi: shaxs aybdorligi isbotlanmagan ekan, u aybsiz deb hisoblanadi." },
  { mod: 27, bob: "IV bob. Shaxsiy huquqlar", text: "Hech kim qiynoqqa, zo'ravonlikka, boshqa shafqatsiz, insoniy qadr-qimmatni kamsituvchi muomalaga javob berishga majbur etilishi mumkin emas. Hech kim o'ziga qarshi guvohlik berishga majbur etilishi mumkin emas." },
  { mod: 28, bob: "IV bob. Shaxsiy huquqlar", text: "O'zbekiston Respublikasining har bir fuqarosi O'zbekiston hududida erkin harakat qilish, yashash joyini tanlash, respublikadan tashqariga chiqib ketish huquqiga ega." },
  { mod: 29, bob: "IV bob. Shaxsiy huquqlar", text: "Har kimning so'z va fikr erkinligi huquqi kafolatlanadi. Har kim o'zi istagan axborotni izlash, olish va tarqatish huquqiga ega. Axborot erkinligini cheklashga faqat qonunda belgilangan hollarda yo'l qo'yiladi." },
  { mod: 30, bob: "IV bob. Shaxsiy huquqlar", text: "Davlat organlari, jamoat birlashmalari va mansabdor shaxslar fuqarolarga ularning huquqlari va manfaatlariga daxldor bo'lgan hujjatlar bilan tanishib chiqish imkoniyatini ta'minlaydi." },
  { mod: 31, bob: "IV bob. Shaxsiy huquqlar", text: "Vijdon erkinligi kafolatlanadi. Har bir kishi xohlagan dinga e'tiqod qilish yoki hech qaysi dinga e'tiqod qilmaslik huquqiga ega." },
  { mod: 32, bob: "IV bob. Shaxsiy huquqlar", text: "O'zbekiston Respublikasining fuqarolari davlat va jamiyat boshqaruvida bevosita va o'z vakillari orqali ishtirok etish huquqiga ega." },
  { mod: 33, bob: "IV bob. Shaxsiy huquqlar", text: "Fuqarolar mitinglar, yig'ilishlar va namoyishlar o'tkazish huquqiga ega. Ushbu huquqdan foydalanish tartibi qonun bilan tartibga solinadi." },
  // V BOB — IJTIMOIY-IQTISODIY HUQUQLAR
  { mod: 36, bob: "V bob. Ijtimoiy-iqtisodiy huquqlar", text: "Har kim mehnat qilish, erkin kasb tanlash, adolatli mehnat sharoitlarida ishlash va qonuniy yo'l bilan himoyalanish huquqiga ega. Majburiy mehnatga yo'l qo'yilmaydi." },
  { mod: 37, bob: "V bob. Ijtimoiy-iqtisodiy huquqlar", text: "Har kimning dam olish huquqi bor. Mehnat bilan band bo'lganlar uchun ish vaqtining chegaralanishi, haftalik dam olish kuni va yillik to'lov ta'tili qonun bilan kafolatlanadi." },
  { mod: 38, bob: "V bob. Ijtimoiy-iqtisodiy huquqlar", text: "Fuqarolar keksayganda, mehnat layoqatini yo'qotganda va boquvchisidan mahrum bo'lganda, shuningdek, boshqa qonuniy hollarda ijtimoiy ta'minot olish huquqiga ega." },
  { mod: 39, bob: "V bob. Ijtimoiy-iqtisodiy huquqlar", text: "Har kim tibbiy yordamdan foydalanish huquqiga ega. Fuqarolarga davlat tibbiy muassasalarida bepul tibbiy yordam ko'rsatiladi." },
  { mod: 40, bob: "V bob. Ijtimoiy-iqtisodiy huquqlar", text: "Har kim bilim olish huquqiga ega. Maktabgacha ta'lim, umumiy o'rta, o'rta maxsus va kasb-hunar ta'limi bepuldir." },
  { mod: 41, bob: "V bob. Ijtimoiy-iqtisodiy huquqlar", text: "Fuqarolar o'zaro birlashish, kasaba uyushmalari, siyosiy partiyalar va boshqa jamoat birlashmalarini tuzish huquqiga ega." },
  // VI BOB — OILA
  { mod: 63, bob: "VI bob. Oila", text: "Oila jamiyatning asosiy bo'g'ini va ijtimoiy institutdir. Nikoh faqat erkalik va ayollik asosida ixtiyoriy ravishda tuziladi." },
  { mod: 64, bob: "VI bob. Oila", text: "Ota-onalar o'z farzandlarini voyaga yetgunlariga qadar boqish va tarbiyalash majburiyatini o'taydlar. Davlat va jamiyat yetim va ota-ona qarovisiz qolgan bolalarni boqishni ta'minlaydi." },
  { mod: 65, bob: "VI bob. Oila", text: "Farzandlar ota-onalar oldida tengdir. Nosog'lom yoki mehnat layoqatini yo'qotgan ota-onalarni boqish farzandlarning burchidir." },
  // MULK VA YERGA OID
  { mod: 55, bob: "III bob. Iqtisodiy asoslar", text: "Er, yer osti boyliklari, suv, o'simlik va hayvonot dunyosi hamda boshqa tabiiy resurslar milliy boylikdir. Ulardan oqilona foydalanish davlat nazoratida bo'ladi." },
  // SUD VA HUQUQIY HIMOYA
  { mod: 19, bob: "II bob. Fuqarolik", text: "O'zbekiston Respublikasining fuqarosi, uning huquqlari va erkinliklari, shuningdek, ularni himoya qilishning kafolatlari. Davlat fuqarolar huquqlari va erkinligini ta'minlash majburiyatini oladi." },
  { mod: 44, bob: "VI bob. Huquqiy himoya", text: "Har kimga o'z huquq va erkinliklarini sud orqali himoya qilish kafolatlanadi, davlat va jamoat organlari, mansabdor shaxslarning qonunga xilof qaror va harakatlaridan shu organlarga yuqori turuvchi organga yoki sudga shikoyat qilish huquqi ta'minlanadi." },
  { mod: 45, bob: "VI bob. Huquqiy himoya", text: "Har kimning huquqlarini himoya qilish uchun yuridik yordam olish huquqi kafolatlanadi. Qonunda nazarda tutilgan hollarda yuridik yordam davlat hisobiga ko'rsatiladi." },
  { mod: 46, bob: "VI bob. Huquqiy himoya", text: "Hech kim faqat o'ziga o'xshash jinoyati ko'rib chiqilib, hukm yoki oqlash qarori chiqarilmagan holda qayta jinoiy javobgarlikka yoki ma'muriy javobgarlikka tortilishi mumkin emas (ne bis in idem)." },
  // SAYLOV
  { mod: 117, bob: "XVIII bob. Saylov tizimi", text: "O'zbekiston Respublikasi fuqarolari 18 yoshga to'lgach, saylov huquqiga va referendum o'tkazish to'g'risidagi masalalarni hal etishga ishtirok etish huquqiga ega bo'ladi." },
  { mod: 118, bob: "XVIII bob. Saylov tizimi", text: "Saylovlar umumiy, teng va to'g'ridan-to'g'ri saylov huquqi asosida yashirin ovoz berish yo'li bilan o'tkaziladi." },
  // PREZIDENT
  { mod: 90, bob: "XII bob. Prezident", text: "O'zbekiston Respublikasining Prezidenti davlat boshlig'i va ijroiya hokimiyatining rahbaridir." },
  { mod: 91, bob: "XII bob. Prezident", text: "Prezident O'zbekiston Respublikasining fuqarosi bo'lishi, 35 yoshdan kam bo'lmasligi, kamida 10 yil O'zbekistonda muqim yashagan bo'lishi va davlat tilini bilishi shart." },
  { mod: 94, bob: "XII bob. Prezident", text: "Prezident 7 yillik muddatga saylanadi. Bir shaxs Prezident lavozimida uch muddatdan ortiq bo'lishi mumkin emas." },
  // OLIY MAJLIS
  { mod: 76, bob: "XI bob. Oliy Majlis", text: "O'zbekiston Respublikasining Oliy Majlisi oliy vakillik organi bo'lib, qonun chiqarish vakolatini amalga oshiradi. Oliy Majlis ikki palatadan: Qonunchilik palatasi va Senatdan iborat." },
  // KONSTITUTSIYAVIY HUQUQLAR UMUMIY
  { mod: 13, bob: "II qism. Asosiy huquqlar va erkinliklar", text: "Demokratiya O'zbekistonda umumbashariy demokratik tamoyillarga asoslanadi. Fuqarolar va davlat organlari, mansabdor shaxslar, fuqarolar birlashmalari Konstitutsiya va qonunlar doirasida harakat qilishadi." },
  { mod: 16, bob: "I bob", text: "O'zbekiston Respublikasining Konstitutsiyasi oliy yuridik kuchga ega. Davlat va uning organlari, mansabdor shaxslar, fuqarolar va ularning birlashmalari Konstitutsiyaga va qonunlarga muvofiq ish tutishi shart. Nord." },
  { mod: 20, bob: "III bob. Insonning asosiy huquqlari", text: "Shaxsning huquqlari va erkinliklari faqat boshqa shaxslarning huquqlari va erkinliklarini ta'minlash, konstitutsiyaviy tuzumni va jamiyat axloqini himoya qilish maqsadida qonun bilan cheklanishi mumkin." },
];

// ===== SAVOL-JAVOB MEXANIZMI =====
const TOPICS = {
  mehnat: {
    kw: ['mehnat','ish','shartnoma','ishdan','maosh','ish haqi','ta\'til','ishchi','kompensatsiya','bo\'shatish','ishsiz','maosh','nafaqa','kasaba'],
    resp: () => ({
      text: `**Mehnat huquqi bo'yicha O'zbekiston Konstitutsiyasi:**\n\n📌 **37-modda:** Har kimning mehnat qilish huquqi bor. Erkin kasb tanlash, adolatli mehnat sharoitlari ta'minlanadi. Majburiy mehnatga yo'l qo'yilmaydi.\n\n📌 **36-modda:** Har kim mehnat qilish, erkin kasb tanlash va qonuniy yo'l bilan himoyalanish huquqiga ega.\n\n📌 **38-modda:** Mehnat layoqatini yo'qotgan fuqarolar ijtimoiy ta'minot olish huquqiga ega.`,
      roadmap: ['Mehnat shartnomasini ko\'rib chiqing','HR bo\'limiga rasmiy ariza bering','Mehnat inspektsiyasiga (292-00-00) murojaat qiling','Sudga ariza berishni ko\'rib chiqing (44-moddaga asosan)'],
      lawType: 'mehnat', needLawyer: true,
      articles: [36, 37, 38]
    })
  },
  oila: {
    kw: ['oila','ajralish','aliment','bola','nikoh','er','xotin','vasiyat','meros','turmush','divorce'],
    resp: () => ({
      text: `**Oilaviy huquq bo'yicha O'zbekiston Konstitutsiyasi:**\n\n📌 **63-modda:** Oila jamiyatning asosiy bo'g'ini. Nikoh faqat ixtiyoriy ravishda va erkalik-ayollik asosida tuziladi.\n\n📌 **64-modda:** Ota-onalar farzandlarini voyaga yetgunlariga qadar boqish va tarbiyalash majburiyatini o'tadilar.\n\n📌 **65-modda:** Farzandlar ota-onalari oldida tengdir. Mehnat layoqatini yo'qotgan ota-onalarni boqish farzandlarning burchidir.`,
      roadmap: ['Nikoh va mulk hujjatlarini to\'plang','Fuqarolik holati idorasiga murojaat qiling','Ajralish arizasini sudga bering','Aliment va bola vasiyati masalasini hal qiling'],
      lawType: 'oila', needLawyer: true,
      articles: [63, 64, 65]
    })
  },
  mulk: {
    kw: ['uy','mulk','ijara','kvartira','xona','er osti','dala','sotib olish','sotish','uy-joy','turar joy','yer','arenda'],
    resp: () => ({
      text: `**Mulk huquqi bo'yicha O'zbekiston Konstitutsiyasi:**\n\n📌 **54-modda:** Barcha mulk shakllari teng huquqli bo'lib, qonun bilan bir xil himoya qilinadi. **Xususiy mulk daxlsizdir.** Mulk egasi o'z mulkidan o'zboshimchalik bilan mahrum etilishi mumkin emas.\n\n📌 **55-modda:** Er, yer osti boyliklari, suv va boshqa tabiiy resurslar milliy boylikdir. Ulardan oqilona foydalanish davlat nazoratida bo'ladi.`,
      roadmap: ['Mulk hujjatlarini tekshiring','Davlat mulk qo\'mitasiga murojaat qiling','Ijara shartnomasini notarius orqali rasmiylashtiring','To\'lov tarixini saqlang (bank ko\'chirmalari)'],
      lawType: 'mulk', needLawyer: true,
      articles: [54, 55]
    })
  },
  biznes: {
    kw: ['biznes','IE','machj','мхж','kompaniya','litsenziya','soliq','tadbirkor','ochish','ro\'yxat','startap','firma'],
    resp: () => ({
      text: `**Biznes huquqi bo'yicha O'zbekiston Konstitutsiyasi:**\n\n📌 **53-modda:** Bozor муносабатларini rivojlantirish O'zbekiston iqtisodiy rivojlanishining asosi hisoblanadi.\n\n📌 **54-modda:** Barcha mulk shakllari (xususiy, davlat va boshqalar) teng huquqli bo'lib, qonun bilan bir xil himoya qilinadi.\n\n📌 **41-modda:** Fuqarolar o'zaro birlashish, kasaba uyushmalari va boshqa jamoat birlashmalarini tuzish huquqiga ega.`,
      roadmap: ['Biznes turini tanlang (IE/MChJ)','my.gov.uz da online ro\'yxatdan o\'ting','Soliq organiga ro\'yxatdan o\'ting','Bank hisob raqami oching'],
      lawType: 'biznes', needLawyer: false,
      articles: [53, 54, 41]
    })
  },
  jinoyat: {
    kw: ['jinoyat','jinoiy','qamoq','politsiya','tergovchi','aybl','hibsga','ushlab','arrest','sud','jazo', 'zo\'ravon', 'pichoq', 'o\'g\'ri', 'kaltakla', 'urish'],
    resp: () => ({
      text: `⚠️ **JINOIY HUQUQ VA JINOYAT PROTSESSI — O'zbekiston Respublikasi Qonunchiligi:**\n\nSiz jinoyat, zo'ravonlik yoki asossiz ayblov bo'yicha murojaat qildingiz. O'zbekiston qonunchiligida huquqlaringiz qanday himoyalanganini batafsil tushuntiramiz:\n\n📌 **25-modda (Konstitutsiya):** Hech kim qonunda belgilangan tartibdan boshqacha usulda **hibsga olinishi, qamoqqa olinishi yoki erkinlikdan mahrum etilishi mumkin emas.** Har kim erkinlik va shaxsiy daxlsizlik huquqiga ega.\n\n📌 **26-modda:** **Aybsizlik prezumpsiyasi** — Shaxs aybdorligi sudning qonuniy kuchga kirgan hukmi bilan isbotlanmagan ekan, u **aybsiz deb hisoblanadi.** Sizni ayblashayotgan bo'lsa, avvalo jinoyatingiz dalillar bilan isbotlanishi shart.\n\n📌 **27-modda:** Hech kim o'ziga va yaqin qarindoshlariga qarshi guvohlik berishga majbur emas. Hech kim **qiynoqqa, zo'ravonlikka** yoki qadr-qimmatni kamsituvchi muomalaga tortilishi mumkin emas.\n\n📌 **45-modda:** Har kimning cheklanmagan tarzda **yuridik yordam olish (advokat yollash) huquqi** bor. Jinoiy ishda advokat ishtirok etishi majburiy hollari qonunda aniq belgilangan.\n\n*Qo'shimcha ma'lumot:* Agar sizga nisbatan asossiz ravishda zo'ravonlik yoki ayblov qo'yilayotgan bo'lsa, siz sukut saqlash huquqiga (Miranda qoidasi kabi) to'liq egasiz va advokatingiz yetib kelmaguncha ko'rsatma berishdan bosh tortishingiz mumkin.`,
      roadmap: ['⚡ DARHOL advokat bilan bog\'laning — yuridik ishtirok sizning qonuniy huquqingiz (45-modda)', 'Hech qanday qog\'oz yoki bayonnomalarni advokatsiz o\'qib chiqmasdan imzolamang', 'Sukut saqlang. O\'zingizga qarshi guvohlik bermang (27-modda)', 'Yaqinlaringizga xabar bering, qaerda va qanday muassasada ekanligingizni ayting', 'Har bir majburlash va zo\'ravonlik bo\'yicha prokuraturaga shikoyat qiling! Barcha olingan tan jarohatlarini ekspertiza qildiring'],
      lawType: 'jinoyat', needLawyer: true, urgent: true,
      articles: [25, 26, 27, 45]
    })
  },
  isteMol: {
    kw: ['iste\'mol','tovar','sifatsiz','qaytarish','bank','sug\'urta','aldov','firibgarlik','savdo','mahsulot'],
    resp: () => ({
      text: `**Iste'molchi huquqi — O'zbekiston Konstitutsiyasi:**\n\n📌 **54-modda:** Xususiy mulk daxlsizdir. Iste'molchilarning huquqlari ham mulkiy huquqlar sifatida himoya qilinadi.\n\n📌 **44-modda:** Har kimga o'z **huquq va erkinliklarini sud orqali himoya qilish** kafolatlanadi.\n\n📌 **45-modda:** Har kimning **yuridik yordam olish huquqi** kafolatlanadi.`,
      roadmap: ['Chek va hujjatlarni saqlang','Do\'konga rasmiy ariza bering','Iste\'molchilar himoyasi qo\'mitasiga murojaat qiling','Kerak bo\'lsa sudga murojaat qiling (44-modda)'],
      lawType: 'isteMol', needLawyer: false,
      articles: [54, 44, 45]
    })
  },
  saylov: {
    kw: ['saylov','ovoz','referendum','parlament','deputat','prezident','kandidat','saylovchi'],
    resp: () => ({
      text: `**Saylov huquqlari — O'zbekiston Konstitutsiyasi:**\n\n📌 **117-modda:** 18 yoshga to'lgan O'zbekiston fuqarolari **saylov huquqiga** ega bo'ladi.\n\n📌 **118-modda:** Saylovlar **umumiy, teng va to'g'ridan-to'g'ri** saylov huquqi asosida **yashirin ovoz berish** yo'li bilan o'tkaziladi.\n\n📌 **32-modda:** Fuqarolar davlat va jamiyat boshqaruvida **bevosita va o'z vakillari orqali** ishtirok etish huquqiga ega.`,
      roadmap: ['Saylovchi ro\'yxatiga kiring','Ovoz berish joyingizni aniqlang','Saylov kuni fuqarolik pasportingizni olib boring'],
      lawType: null, needLawyer: false,
      articles: [117, 118, 32]
    })
  },
  huquq: {
    kw: ['huquq','erkinlik','asos','konstitutsiya','fuqaro','kafolat','demokratiya','sud','himoya'],
    resp: () => ({
      text: `**Asosiy fuqarolik huquqlari — O'zbekiston Konstitutsiyasi:**\n\n📌 **19-modda:** Davlat fuqarolar huquqlari va erkinligini ta'minlash majburiyatini oladi.\n\n📌 **29-modda:** **So'z va fikr erkinligi** huquqi kafolatlanadi. Har kim axborot izlash va tarqatish huquqiga ega.\n\n📌 **44-modda:** Har kimga **sud orqali himoya qilish** kafolatlanadi.\n\n📌 **45-modda:** **Yuridik yordam olish huquqi** kafolatlanadi.`,
      roadmap: ['Huquqlaringizni o\'rganing (Konstitutsiya 16-moddasi)','Huquq buzilganda darhol yozma ariza bering','Kerak bo\'lsa sudga murojaat qiling'],
      lawType: null, needLawyer: false,
      articles: [19, 29, 44, 45]
    })
  }
};

function detectTopic(text) {
  const t = text.toLowerCase();
  for (const [key, val] of Object.entries(TOPICS)) {
    if (val.kw.some(kw => t.includes(kw))) return key;
  }
  return null;
}

// Konstitutsiya moddasini qidirish
function searchKonstitutsiya(text) {
  const t = text.toLowerCase();
  // "X-modda" yoki "X modda" formatini izlash
  const modMatch = t.match(/(\d+)\s*[-–]?\s*modda/i) || t.match(/modda\s*[-–]?\s*(\d+)/i);
  if (modMatch) {
    const modNum = parseInt(modMatch[1]);
    const found = KONSTITUTSIYA.find(k => k.mod === modNum);
    if (found) return { found: true, article: found };
  }
  return { found: false };
}

function getResp(text) {
  // Avval modda raqami bo'yicha qidirish
  const modSearch = searchKonstitutsiya(text);
  if (modSearch.found) {
    const art = modSearch.article;
    return {
      text: `**O'zbekiston Respublikasi Konstitutsiyasi, ${art.mod}-modda:**\n\n*(${art.bob})*\n\n"${art.text}"`,
      roadmap: null, lawType: null, needLawyer: false, topic: 'konstitutsiya',
      articles: [art.mod],
      isArticleLookup: true
    };
  }

  const topic = detectTopic(text);
  if (topic) return { ...TOPICS[topic].resp(), topic };

  return {
    text: `**Savolingiz qabul qilindi.**\n\nSiz kiritgan masalada nafaqat asosiy moddalar, balki O'zbekiston Respublikasining boshqa qonun osti hujjatlari (kodekslar, vazirlar mahkamasi qarorlari va idoraviy normativ hujjatlar) ham ishtirok etishi mumkin.\n\nTo'liq, batafsil va rasmiy huquqiy javob topish uchun **O'zbekiston Respublikasi Qonunchilik ma'lumotlari milliy bazasi — [Lex.uz](https://lex.uz/)** portalidan foydalanishingizni qat'iy tavsiya etamiz. \n\nYoki aniqroq yordam berishim uchun, quyidagi huquq sohalaridan birini tanlang yoxud kalit so'zni kiriting:`,
    roadmap: ["Lex.uz portalini ochish va izlash", "O'z muammongizga tegishli hujjatni izlab topish", "Adalat AI'dagi mavjud yurist-advokatlardan maslahat olish"], 
    lawType: null, needLawyer: false, topic: null,
    showChips: true
  };
}

function topicAsk(key) {
  const names = { mehnat:'Mehnat huquqi', oila:'Oilaviy huquq', mulk:'Mulk va uy-joy', biznes:'Biznes huquqi', jinoyat:'Jinoiy huquq', isteMol:"Iste'molchi huquqi", saylov:'Saylov huquqi', huquq:'Asosiy fuqarolik huquqlari' };
  sendQ(`${names[key]} bo'yicha ma'lumot bering`);
}

function sendQ(q) {
  const inp = document.getElementById('inp');
  if (!inp) return;
  inp.value = q;
  sendMsg();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
}

function autoH(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function now() {
  return new Date().toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' });
}

function fmt(text) {
  if (!text) return '';
  return text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
}

function addMsg(text, role) {
  const msgs = document.getElementById('msgs');
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user-msg' : '');
  div.innerHTML = `
    <div class="msg-av">${role==='user'?'👤':'⚖️'}</div>
    <div class="msg-body">
      <div class="bubble" id="bubble-${Date.now()}">${fmt(text)}</div>
      <div class="mtime">${now()}</div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTyping() {
  const msgs = document.getElementById('msgs');
  const div = document.createElement('div');
  div.id = 'typing'; div.className = 'msg typing';
  div.innerHTML = `<div class="msg-av">⚖️</div><div class="msg-body"><div class="bubble"><div class="dots"><span></span><span></span><span></span></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() { const el=document.getElementById('typing'); if(el) el.remove(); }

// ===== GPT API CALL =====
async function askGPT(userQuestion) {
  const key = GPT.key;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userQuestion }
        ],
        temperature: 0.4,
        max_tokens: 1200
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'API xatosi');
    }
    const data = await res.json();
    return data.choices[0].message.content;
  } catch(e) {
    console.error('GPT xato:', e);
    return null;
  }
}

// ===== GPT API SETTINGS =====
function openApiSettings() {
  openModal('apiOverlay');
  const inp = document.getElementById('apiKeyInput');
  if (inp) inp.value = GPT.key;
}

function saveApiKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val) { GPT.clear(); toast('API kalit o\'chirildi'); }
  else if (!val.startsWith('sk-')) { document.getElementById('apiKeyErr').textContent = '❌ Noto\'g\'ri format (sk- bilan boshlanishi kerak)'; return; }
  else { GPT.save(val); toast('✅ GPT API kaliti saqlandi! Endi AI keng javob beradi.'); }
  closeModal('apiOverlay');
  updateNav();
}

// ===== RENDER GPT RESPONSE =====
function renderGptBubble(bubble, gptText, userQ) {
  // GPT markdown ni HTML ga o'girish
  let html = gptText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm, '<strong style="font-size:15px;color:var(--gold)">$1</strong>')
    .replace(/^[-•]\s(.+)$/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--blue);margin:3px 0">$1</div>')
    .replace(/\n/g, '<br>');
  bubble.innerHTML = html;

  // Mos advokatlarni ham ko'rsat
  const topic = detectTopic(userQ);
  if (topic && TOPICS[topic]) {
    const resp = TOPICS[topic].resp();
    if (resp.needLawyer && resp.lawType) {
      const lawyers = LAWYERS.filter(l => l.specKey === resp.lawType).slice(0,2);
      if (lawyers.length) {
        const lb = document.createElement('div');
        lb.className = 'lawyer-rec-box';
        lb.style.marginTop = '12px';
        lb.innerHTML = `<h4>👨‍⚖️ Mos advokatlar:</h4>` +
          lawyers.map(l => `<div class="mini-law" onclick="openLawyer(${l.id})"><div class="mini-av">${l.emoji}</div><div class="mini-info"><strong>${l.name}</strong><span>${l.spec} · ${l.loc}</span></div><div class="mini-rat">${l.rating}⭐</div></div>`).join('') +
          `<button class="see-all-btn" onclick="goPage('lawyers')">Barcha advokatlarni ko'rish →</button>`;
        bubble.appendChild(lb);
      }
    }
  }

  const disc = document.createElement('div');
  disc.className = 'ai-disc';
  disc.innerHTML = '🤖 <strong>GPT-4o-mini</strong> · 📖 <strong>Manba:</strong> O\'zbekiston Respublikasi Konstitutsiyasi &nbsp;|&nbsp; ⚠️ Aniq maslahat uchun advokatga murojaat qiling.';
  bubble.appendChild(disc);
}

// ===== SEND MESSAGE (GPT + fallback) =====
async function sendMsg() {
  const inp = document.getElementById('inp');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = ''; inp.style.height = 'auto';

  addMsg(txt, 'user');
  addTyping();

  // GPT bor bo'lsa ishlatamiz
  if (GPT.key) {
    const gptAnswer = await askGPT(txt);
    removeTyping();
    if (gptAnswer) {
      const msgs = document.getElementById('msgs');
      const div = document.createElement('div');
      div.className = 'msg';
      div.innerHTML = `<div class="msg-av">⚖️</div><div class="msg-body"><div class="bubble" id="bubble-${Date.now()}"></div><div class="mtime">${now()}</div></div>`;
      msgs.appendChild(div);
      const bubble = div.querySelector('.bubble');
      renderGptBubble(bubble, gptAnswer, txt);
      AUTH.addHistory(txt, gptAnswer, detectTopic(txt) || 'umumiy');
      msgs.scrollTop = msgs.scrollHeight;
      return;
    }
    toast('⚠️ GPT javob bermadi, mahalliy javobdan foydalanamiz');
  } else {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
    removeTyping();
  }

  // Fallback — mahalliy javob
  const resp = getResp(txt);
  const msgEl = addMsg(resp.text, 'ai');
  const bubble = msgEl.querySelector('.bubble');

  if (resp.showChips) {
    const cd = document.createElement('div');
    cd.className = 'chips';
    cd.innerHTML = [
      ['💼 Mehnat','Mehnat huquqi bo\'yicha ma\'lumot bering'],
      ['🏠 Mulk','Mulk va uy-joy masalalarini tushuntiring'],
      ['👨‍👩‍👧 Oila','Oilaviy huquq haqida ma\'lumot bering'],
      ['📋 Biznes','Biznes ochish uchun nima kerak?'],
      ['⚖️ Jinoiy','Jinoiy ish bo\'yicha nima qilishim kerak?'],
      ['🗳️ Saylov','Saylov huquqlari haqida tushuntiring'],
    ].map(([l,q]) => `<button class="chip" onclick="sendQ('${q}')">${l}</button>`).join('');
    bubble.appendChild(cd);
  }

  if (resp.articles && resp.articles.length && !resp.isArticleLookup) {
    const artBox = document.createElement('div');
    artBox.className = 'const-box';
    artBox.innerHTML = `<h4>📖 Konstitutsiya manbalari:</h4>` +
      resp.articles.map(num => {
        const art = KONSTITUTSIYA.find(k => k.mod === num);
        if (!art) return '';
        return `<div class="const-item"><span class="const-mod">${num}-modda</span><span class="const-bob">${art.bob}</span></div>`;
      }).filter(x=>x).join('');
    bubble.appendChild(artBox);
  }

  if (resp.roadmap && resp.roadmap.length) {
    const rb = document.createElement('div');
    rb.className = 'roadmap-box';
    rb.innerHTML = `<h4>📋 Qadam-baqadam Yo'l Xaritasi</h4>` +
      resp.roadmap.map((s,i) => `<div class="rm-step"><div class="rm-n">${i+1}</div><p>${s}</p></div>`).join('');
    bubble.appendChild(rb);
  }

  if (resp.needLawyer && resp.lawType) {
    const lawyers = LAWYERS.filter(l => l.specKey === resp.lawType).slice(0,2);
    if (lawyers.length) {
      const lb = document.createElement('div');
      lb.className = 'lawyer-rec-box';
      lb.innerHTML = `<h4>👨‍⚖️ Mos advokatlar:</h4>` +
        lawyers.map(l => `<div class="mini-law" onclick="openLawyer(${l.id})"><div class="mini-av">${l.emoji}</div><div class="mini-info"><strong>${l.name}</strong><span>${l.spec} · ${l.loc}</span></div><div class="mini-rat">${l.rating}⭐</div></div>`).join('') +
        `<button class="see-all-btn" onclick="goPage('lawyers')">Barcha advokatlarni ko'rish →</button>`;
      bubble.appendChild(lb);
    }
  }

  const disc = document.createElement('div');
  disc.className = 'ai-disc';
  disc.innerHTML = '📖 <strong>Manba:</strong> O\'zbekiston Respublikasi Konstitutsiyasi · <span style="color:var(--text3);font-size:11px">🔑 GPT ulash uchun API tugmasini bosing</span>';
  bubble.appendChild(disc);

  AUTH.addHistory(txt, resp.text, resp.topic || 'umumiy');
  document.getElementById('msgs').scrollTop = document.getElementById('msgs').scrollHeight;
}

function newChat() {
  const msgs = document.getElementById('msgs');
  msgs.innerHTML = '';
  addMsg('Yangi savol uchun tayyorman! 🎤 Gapiring yoki yozing 👇', 'ai');
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeOverlay(e, id) { if (e.target.id === id) closeModal(id); }

// ===== TOAST =====
function toast(msg, dur=3000) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') ['lawyerOverlay','apiOverlay','aiModalOverlay'].forEach(id => closeModal(id));
});

// ============================================================
// ===== 📄 HUJJAT GENERATORI =====
// ============================================================

const DOC_TEMPLATES = [
  { id:'ishdan-bosh', cat:'mehnat', isPremium:false, icon:'📋',
    name:"Ishdan bo'shatish arizasi (o'z xohishi)", desc:"O'z xohishi bilan ishdan ketish uchun rasmiy ariza",
    fields:[
      {id:'ism',label:'Ism Familiya',ph:'Abdullayev Jasur Hamidovich'},
      {id:'lavozim',label:'Lavozimingiz',ph:'Buxgalter'},
      {id:'rahbar',label:'Rahbar ismi',ph:'Karimov Bobur Salimovich'},
      {id:'tashkilot',label:'Tashkilot nomi',ph:'"Baxt" MChJ'},
      {id:'oxirgi_kun',label:'Oxirgi ish kuni',ph:'15.04.2025'},
      {id:'sana',label:'Ariza sanasi',ph:'01.04.2025'},
    ],
    tpl:(f)=>`O'ZBEKISTON RESPUBLIKASI\n${f.tashkilot} DIREKTORI\n${f.rahbar} JANOBLARIGA\n\nXodim: ${f.ism} (${f.lavozim})\n\nARIZA\n\nSizdan ${f.oxirgi_kun} sanadan boshlab meni o'z xohishim bilan bo'shatishingizni so'rayman.\n\nO'zR Mehnat Kodeksining 97-moddasi asosida taqdim etiladi.\n\nSana: ${f.sana}         Imzo: ____________ / ${f.ism} /`
  },
  { id:'mehnat-shikoyat', cat:'mehnat', isPremium:false, icon:'⚠️',
    name:"Noqonuniy ishdan bo'shatishga shikoyat", desc:"Mehnat inspeksiyasiga rasmiy shikoyat arizasi",
    fields:[
      {id:'ism',label:'Ism Familiya',ph:'Abdullayev Jasur'},
      {id:'tel',label:'Telefon',ph:'+998901234567'},
      {id:'tashkilot',label:'Tashkilot nomi',ph:'"Baxt" MChJ'},
      {id:'sana_bosh',label:"Ishdan bo'shatilgan sana",ph:'01.03.2025'},
      {id:'sabab',label:'Nima uchun noqonuniy?',ph:'Ogohlantirishsiz, hujjatsiz bo\'shatildi'},
      {id:'talab',label:'Talabingiz',ph:'Qayta ishga qabul qilish'},
      {id:'sana',label:'Ariza sanasi',ph:'10.03.2025'},
    ],
    tpl:(f)=>`O'ZBEKISTON RESPUBLIKASI MEHNAT INSPEKSIYASIGA\n\nAriza beruvchi: ${f.ism}  Tel: ${f.tel}\n\nSHIKOYAT ARIZASI\n\nMen, ${f.ism}, ${f.sana_bosh} kuni ${f.tashkilot} dan noqonuniy ravishda ishdan bo'shatildim.\n\nNoqonuniylik sababi: ${f.sabab}\n\nMK 100-103-moddalari asosida ogohlantirishsiz ishdan bo'shatish qonunga ziddir.\n\nTalabim: ${f.talab}\n\nSana: ${f.sana}         Imzo: ____________ / ${f.ism} /`
  },
  { id:'aliment', cat:'oila', isPremium:false, icon:'👶',
    name:"Aliment to'lash to'g'risida ariza", desc:"Aliment undirish uchun sudga ariza",
    fields:[
      {id:'ariza_beruvchi',label:"Ariza beruvchi (ism)",ph:'Karimova Zilola'},
      {id:'javobgar',label:'Javobgar (ism)',ph:'Karimov Sanjar'},
      {id:'bola',label:"Bola(lar) ismi va yoshi",ph:'Karimov Amir, 5 yosh'},
      {id:'nikoh_sana',label:"Nikoh bekor qilingan sana",ph:'01.01.2024'},
      {id:'sana',label:'Ariza sanasi',ph:'01.04.2025'},
    ],
    tpl:(f)=>`O'ZBEKISTON RESPUBLIKASI\n[SHAHAR/TUMAN] SUDIGA\n\nAriza beruvchi: ${f.ariza_beruvchi}\nJavobgar: ${f.javobgar}\n\nDA'VO ARIZASI (Aliment to'lash)\n\nMen, ${f.ariza_beruvchi}, ${f.javobgar} bilan ${f.nikoh_sana} kuni ajrashdim.\nUmumiy farzandim: ${f.bola} — hozirda mening qaramog'imda.\n\nOila Kodeksi 99-105-moddalari asosida:\n• 1 bola uchun: daromadning 25%\n\nTalabim: ${f.javobgar} dan ${f.bola} uchun aliment undirilsin.\n\nSana: ${f.sana}         Imzo: ____________ / ${f.ariza_beruvchi} /`
  },
  { id:'ijara', cat:'mulk', isPremium:false, icon:'🏠',
    name:'Uy-joy ijara shartnomasi', desc:'Rasmiy ijara shartnomasi',
    fields:[
      {id:'beruvchi',label:'Ijaraga beruvchi (ism)',ph:'Toshmatov Hamid'},
      {id:'ijarachi',label:'Ijarachi (ism)',ph:'Yusupov Sardor'},
      {id:'manzil',label:'Uy manzili',ph:'Toshkent, Chilonzor, 15-uy, 42-xonadon'},
      {id:'summa',label:"Oylik ijara narxi (so'm)",ph:"2,500,000"},
      {id:'muddat',label:'Shartnoma muddati',ph:'12 oy'},
      {id:'sana',label:'Shartnoma sanasi',ph:'01.04.2025'},
    ],
    tpl:(f)=>`IJARA SHARTNOMASI\n\nSana: ${f.sana}\n\nIjaraga beruvchi: ${f.beruvchi}\nIjarachi: ${f.ijarachi}\n\nPREDMET: ${f.manzil}\n\nOylik ijara: ${f.summa} so'm\nMuddat: ${f.muddat}\nTo'lov: Har oy 1-sanasiga qadar\n\nImzolar:\n${f.beruvchi}: ____________\n${f.ijarachi}: ____________`
  },
  { id:'istemol', cat:'mulk', isPremium:false, icon:'🛒',
    name:"Iste'molchi shikoyati", desc:"Sifatsiz tovar yoki xizmat uchun shikoyat",
    fields:[
      {id:'ism',label:'Ism Familiya',ph:'Nazarov Ulugbek'},
      {id:'dokon',label:"Do'kon/kompaniya",ph:'"Texnomart"'},
      {id:'tovar',label:'Tovar nomi',ph:'Samsung Galaxy A54'},
      {id:'narx',label:"To'langan narx",ph:"3,500,000 so'm"},
      {id:'muammo',label:'Muammo',ph:'Ekran 1 haftada sinib qoldi'},
      {id:'talab',label:'Talabingiz',ph:'Almashtirish yoki pulni qaytarish'},
    ],
    tpl:(f)=>`SHIKOYAT — ${f.dokon} rahbariyatiga\n\nAriza beruvchi: ${f.ism}\n\nMen ${f.dokon} dan ${f.tovar} ni ${f.narx} ga sotib oldim.\n\nMuammo: ${f.muammo}\n\n"Iste'molchilarni himoya qilish" qonuni asosida sifatsiz tovarni qaytarish huquqim bor.\n\nTalabim: ${f.talab}\n\nAks holda Inspeksiyaga va sudga murojaat qilaman.\n\nSana: ${new Date().toLocaleDateString('uz-UZ')}         ${f.ism}`
  },
  { id:'prokuratura', cat:'sud', isPremium:true, icon:'⚖️',
    name:'Prokuraturaga shikoyat', desc:"Qonun buzilishi bo'yicha prokuraturaga ariza",
    fields:[
      {id:'ism',label:'Ism Familiya',ph:'Ergashev Sanjar'},
      {id:'tel',label:'Telefon',ph:'+998901234567'},
      {id:'manzil',label:'Yashash manzilingiz',ph:'Toshkent sh., ...'},
      {id:'shikoyat',label:'Kim haqida shikoyat?',ph:'Chilonzor tumani...'},
      {id:'qonun',label:'Qonun buzarlik',ph:'Qonunsiz qurilishga ruxsat berildi'},
      {id:'sana',label:'Sana',ph:'01.04.2025'},
    ],
    tpl:(f)=>`O'ZBEKISTON RESPUBLIKASI PROKURATURA ORGANLARIGA\n\nAriza beruvchi: ${f.ism}  Tel: ${f.tel}\nManzil: ${f.manzil}\n\nSHIKOYAT\n\n${f.shikoyat} tomonidan quyidagi qonun buzarlik sodir etilgan:\n${f.qonun}\n\nTegishli tekshiruv o'tkazilsin va javobgarlar tortilsin.\n\nSana: ${f.sana}         Imzo: ____________ / ${f.ism} /`
  },
  { id:'davao', cat:'sud', isPremium:true, icon:'🏛️',
    name:"Sudga da'vo arizasi", desc:"Fuqarolik da'vosi uchun rasmiy ariza",
    fields:[
      {id:'davogar',label:"Da'vogar (ism)",ph:'Umarov Behruz'},
      {id:'javobgar',label:'Javobgar',ph:'Nazarov Sherzod'},
      {id:'summa',label:"Da'vo summasi",ph:"15,000,000 so'm"},
      {id:'voqea',label:"Qanday huquq buzildi?",ph:'Qarz qaytarilmadi'},
      {id:'dalil',label:'Asosiy dalil',ph:'Raspiskan mavjud'},
      {id:'talab',label:'Talabingiz',ph:'Qarzni undirish'},
      {id:'sana',label:'Sana',ph:'01.04.2025'},
    ],
    tpl:(f)=>`O'ZBEKISTON RESPUBLIKASI [SHAHAR] SUDIGA\n\nDA'VOGAR: ${f.davogar}\nJAVOBGAR: ${f.javobgar}\nDA'VO SUMMASI: ${f.summa}\n\nDA'VO ARIZASI\n\nVoqea: ${f.voqea}\nDalil: ${f.dalil}\n\nTalabim: ${f.talab}\n\nSana: ${f.sana}         Da'vogar: ____________ / ${f.davogar} /`
  },
  { id:'ishonchnoma', cat:'umumiy', isPremium:false, icon:'📝',
    name:"Ishonchnoma (Doverennost')", desc:'Birovga vakolat berish uchun ishonchnoma',
    fields:[
      {id:'beruvchi',label:'Ishonchnoma beruvchi',ph:'Toshmatov Hamid Salimovich'},
      {id:'pp_b',label:'Passport (beruvchi)',ph:'AB 1234567'},
      {id:'oluvchi',label:'Ishonchnoma oluvchi',ph:'Toshmatova Malika'},
      {id:'pp_o',label:'Passport (oluvchi)',ph:'AA 9876543'},
      {id:'vakolat',label:'Berilayotgan vakolat',ph:'Bankdan pul olish, hujjat imzolash'},
      {id:'muddat',label:'Amal qilish muddati',ph:'1 yil'},
      {id:'sana',label:'Sana',ph:'01.04.2025'},
    ],
    tpl:(f)=>`ISHONCHNOMA\n\nMen, ${f.beruvchi} (pasport: ${f.pp_b}),\nushbu ishonchnomani ${f.oluvchi} (pasport: ${f.pp_o}) ga beraman.\n\nVAKOLAT: ${f.vakolat}\nMUDDAT: ${f.muddat}\n\nSana: ${f.sana}\nImzo: ____________ / ${f.beruvchi} /\n\n[Notarius tavsiya etiladi]`
  },
];

let _currentTemplate = null;
let _docFields = {};

function renderDocGrid(cat='all') {
  const grid = document.getElementById('docGrid');
  if (!grid) return;
  const list = cat === 'all' ? DOC_TEMPLATES : DOC_TEMPLATES.filter(t => t.cat === cat);
  grid.innerHTML = list.map(t => `
    <div class="doc-card${t.isPremium?' doc-premium':''}" onclick="selectTemplate('${t.id}')">
      <div class="doc-card-ico">${t.icon}</div>
      <div class="doc-card-info">
        <div class="doc-card-name">${t.name}</div>
        <div class="doc-card-desc">${t.desc}</div>
      </div>
      ${t.isPremium
        ? '<span class="doc-prem-badge">👑 Premium</span>'
        : '<span class="doc-free-badge">✓ Bepul</span>'}
    </div>`).join('');
}

function filterDocs(cat, btn) {
  document.querySelectorAll('.doc-cat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDocGrid(cat);
}

function selectTemplate(id) {
  const t = DOC_TEMPLATES.find(x => x.id === id);
  if (!t) return;
  if (t.isPremium && AUTH.user?.plan !== 'premium') {
    toast('👑 Bu shablon Premium uchun!');
    setTimeout(() => goPage('premium'), 1500);
    return;
  }
  _currentTemplate = t;
  _docFields = {};
  ['docStep1','docStep2','docStep3'].forEach((s,i) =>
    document.getElementById(s).style.display = i===1?'block':'none');
  document.getElementById('docFormTitle').textContent = t.icon + ' ' + t.name;
  document.getElementById('docFormDesc').textContent = t.desc;
  document.getElementById('docFormFields').innerHTML = t.fields.map(f => `
    <div class="fgroup">
      <label>${f.label}</label>
      <input class="finput" id="dff_${f.id}" placeholder="${f.ph}" oninput="_docFields['${f.id}']=this.value"/>
    </div>`).join('');
}

function backToTemplates() {
  ['docStep1','docStep2','docStep3'].forEach((s,i) =>
    document.getElementById(s).style.display = i===0?'block':'none');
}

function backToForm() {
  document.getElementById('docStep2').style.display = 'block';
  document.getElementById('docStep3').style.display = 'none';
}

function getDocValues() {
  const v = {};
  _currentTemplate.fields.forEach(f => {
    v[f.id] = document.getElementById('dff_'+f.id)?.value || '';
  });
  return v;
}

function previewDoc() {
  _docFields = getDocValues();
  const empty = _currentTemplate.fields.find(f => !_docFields[f.id]);
  if (empty) { toast('⚠️ "'+empty.label+'" maydonini to\'ldiring'); return; }
  const text = _currentTemplate.tpl(_docFields);
  document.getElementById('docStep2').style.display = 'none';
  document.getElementById('docStep3').style.display = 'block';
  document.getElementById('docPreviewBox').innerHTML =
    '<pre class="doc-preview-text">'+text+'</pre>';
}

function autoFillWithAI() { openModal('aiModalOverlay'); }

async function processAISituation() {
  const sit = document.getElementById('aiSituationText').value.trim();
  if (!sit) { toast('Vaziyatingizni yozing'); return; }
  closeModal('aiModalOverlay');
  if (!GPT.key) {
    toast('⚠️ GPT ulanmagan. Navbar da 🔑 API tugmasini bosing.');
    return;
  }
  toast('🤖 AI to\'ldirmoqda...');
  const fieldNames = _currentTemplate.fields.map(f=>'"'+f.id+'"'+'('+f.label+')').join(', ');
  const prompt = `Vaziyat:\n${sit}\n\nQuyidagi JSON maydonlarni o'zbek tilida to'ldiring (faqat JSON qaytaring):\n{${_currentTemplate.fields.map(f=>'"'+f.id+'": ""').join(', ')}}`;
  const res = await askGPT(prompt);
  if (res) {
    try {
      const m = res.match(/\{[\s\S]+\}/);
      if (m) {
        const filled = JSON.parse(m[0]);
        Object.entries(filled).forEach(([k,v]) => {
          const el = document.getElementById('dff_'+k);
          if (el) { el.value = v; _docFields[k] = v; }
        });
        toast('✅ AI muvaffaqiyatli to\'ldirdi!');
      }
    } catch(e) { toast('Qo\'lda to\'ldiring'); }
  }
}

function printDoc() {
  _docFields = getDocValues();
  const text = _currentTemplate.tpl(_docFields);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${_currentTemplate.name}</title>
    <style>body{font-family:"Times New Roman",serif;font-size:14pt;line-height:1.9;padding:50px 70px;max-width:780px;margin:0 auto}
    pre{white-space:pre-wrap;font-family:inherit;font-size:14pt}
    @media print{body{padding:20px 40px}}</style>
    </head><body><pre>${text}</pre></body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 500);
}

function downloadPDF() {
  printDoc();
  toast('🖨️ Chop etish oynasida: "PDF ga saqlash" ni tanlang');
}

// ============================================================
// ===== 🎤 OVOZLI YORDAMCHI =====
// ============================================================

let _voiceActive = false;
let _recognition = null;

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('⚠️ Chrome yoki Edge brauzerini ishlating'); return null; }
  const rec = new SR();
  rec.lang = 'uz-UZ';
  rec.interimResults = true;
  rec.continuous = false;
  rec.onstart = () => {
    _voiceActive = true;
    const btn = document.getElementById('voiceBtn');
    if (btn) { btn.classList.add('voice-active'); btn.textContent = '🔴'; }
    const hint = document.getElementById('voiceHint');
    if (hint) hint.textContent = '🔴 Gapiring... (to\'xtatish uchun yana bosing)';
    const inp = document.getElementById('inp');
    if (inp) inp.placeholder = '🎤 Tinglanmoqda...';
  };
  rec.onresult = (e) => {
    const t = Array.from(e.results).map(r => r[0].transcript).join('');
    const inp = document.getElementById('inp');
    if (inp) inp.value = t;
    if (e.results[e.results.length-1].isFinal) {
      stopVoice();
      setTimeout(() => sendMsg(), 400);
    }
  };
  rec.onerror = (e) => { stopVoice(); if (e.error !== 'no-speech') toast('🎤 Xato: '+e.error); };
  rec.onend = () => stopVoice();
  return rec;
}

function toggleVoice() {
  if (_voiceActive) { stopVoice(); return; }
  if (!_recognition) _recognition = initVoice();
  if (!_recognition) return;
  try { _recognition.start(); } catch(e) { _recognition = initVoice(); if(_recognition) _recognition.start(); }
}

function stopVoice() {
  _voiceActive = false;
  const btn = document.getElementById('voiceBtn');
  if (btn) { btn.classList.remove('voice-active'); btn.textContent = '🎤'; }
  const hint = document.getElementById('voiceHint');
  if (hint) hint.textContent = '🎤 Ovoz | Enter — yuborish | Shift+Enter — yangi qator';
  const inp = document.getElementById('inp');
  if (inp) inp.placeholder = 'Huquqiy savolingizni yozing yoki gaplab bering...';
  try { if (_recognition) _recognition.stop(); } catch(e) {}
}

// ============================================================
// ===== 💳 PREMIUM / TO'LOV =====
// ============================================================

function buyPremium(provider) {
  if (!AUTH.user) { showRegPage(); return; }
  const name = provider === 'payme' ? 'Payme' : 'Click';
  toast(`💳 ${name} to'lov tizimi ulanyapti...`);
  setTimeout(() => {
    if (confirm(`✅ ${name} orqali 49,900 so'm to'lovni tasdiqlaysizmi?\n\n(Demo rejim — haqiqiy to'lov emas)`)) {
      const u = AUTH.user;
      u.plan = 'premium';
      u.plan_until = new Date(Date.now()+30*24*60*60*1000).toISOString();
      AUTH.save(u);
      const users = getUsers();
      const idx = users.findIndex(x => x.phone === u.phone);
      if (idx >= 0) { users[idx] = u; saveUsers(users); }
      updateNav();
      toast('🎉 Premium faollashtirildi! 30 kun muddatida foydalaning.');
      goPage('chat');
    }
  }, 1500);
}

function contactCorp() {
  toast('📞 +998 90 000 00 00 | adalatai@gmail.com — Korporativ bo\'lim');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (AUTH.user) {
    goPage('chat');
  } else {
    showRegPage();
  }
  const msgs = document.getElementById('msgs');
  if (msgs && !msgs.children.length) {
    addMsg(`Assalomu alaykum! Men **Adalat AI** — huquqiy yordamchingizman. 👋\n\n🎤 Gaplab savol bering yoki 📄 Hujjat yarating. Sohani tanlang:`, 'ai');
    const bubble = msgs.lastElementChild.querySelector('.bubble');
    const cd = document.createElement('div');
    cd.className = 'chips';
    cd.innerHTML = [
      ['💼 Mehnat','Mehnat huquqi bo\'yicha ma\'lumot bering'],
      ['🏠 Mulk','Mulk va uy-joy masalalarini tushuntiring'],
      ['👨‍👩‍👧 Oila','Oilaviy huquq haqida ma\'lumot bering'],
      ['📋 Biznes','Biznes ochish uchun nima kerak?'],
      ['⚖️ Jinoiy','Jinoiy ish bo\'yicha nima qilishim kerak?'],
    ].map(([l,q]) => `<button class="chip" onclick="sendQ('${q}')">${l}</button>`).join('')
    + `<button class="chip chip-docs" onclick="goPage('docs')">📄 Hujjat yaratish</button>`;
    bubble.appendChild(cd);
  }
});

