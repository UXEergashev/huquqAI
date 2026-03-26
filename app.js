// ============================================================
//  ADALAT AI — app.js  (to'liq ishlaydigan versiya)
// ============================================================

// ===== AUTH STATE =====
// Foydalanuvchi ma'lumotlari localStorage da saqlanadi
const AUTH = {
  get user() { try { return JSON.parse(localStorage.getItem('adalat_user')) || null; } catch { return null; } },
  save(u)    { localStorage.setItem('adalat_user', JSON.stringify(u)); },
  logout()   { localStorage.removeItem('adalat_user'); },
  get history() { try { return JSON.parse(localStorage.getItem('adalat_history')) || []; } catch { return []; } },
  addHistory(q, topic) {
    const h = this.history;
    h.unshift({ q, topic, date: new Date().toLocaleDateString('uz-UZ'), id: Date.now() });
    if (h.length > 10) h.pop();
    localStorage.setItem('adalat_history', JSON.stringify(h));
  }
};

// ===== REGISTERED USERS (localStorage) =====
function getUsers() { try { return JSON.parse(localStorage.getItem('adalat_users')) || []; } catch { return []; } }
function saveUsers(arr) { localStorage.setItem('adalat_users', JSON.stringify(arr)); }

// ===== PAGE NAVIGATION =====
let _pendingQ = ''; // hero qidiruv so'rovi

function goPage(name) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('pg-' + name);
  if (el) el.classList.add('active');
  if (name === 'lawyers') renderLawyers(LAWYERS);
  if (name === 'dashboard') renderDashboard();
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
    nr.innerHTML = `
      <button class="nav-user-btn" onclick="goPage('dashboard')">👤 ${AUTH.user.name.split(' ')[0]}</button>
      <button class="nav-btn-login" onclick="doLogout()">Chiqish</button>`;
  } else {
    nr.innerHTML = `
      <button class="nav-btn-prem" onclick="openPremium()">👑 Premium</button>
      <button class="nav-btn-login" onclick="openAuth()">Kirish</button>`;
  }
}

function doLogout() {
  AUTH.logout();
  updateNav();
  goPage('home');
  toast('Tizimdan chiqdingiz');
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
const LAWYERS = [
  { id:1, emoji:'👨‍💼', name:'Akbar Yusupov',    spec:'Mehnat Huquqi',    specKey:'mehnat',  region:'toshkent', loc:'Toshkent', rating:4.9, cases:312, exp:12, reviews:87,  price:'Bepul konsultatsiya', phone:'+998 90 123 45 67', tags:['Mehnat shartnomasi','Ishdan bo\'shatish','Ish haqi'], about:'Mehnat nizolari va ish haqi to\'lovlari bo\'yicha 12 yillik tajriba. 300+ muvaffaqiyatli ish.' },
  { id:2, emoji:'👩‍⚖️', name:'Zulfiya Karimova', spec:'Oilaviy Huquq',    specKey:'oila',    region:'samarqand',loc:'Samarqand',rating:5.0, cases:198, exp:8,  reviews:64,  price:'50,000 so\'m/konsultatsiya', phone:'+998 90 234 56 78', tags:['Ajralish','Aliment','Vasiyat'], about:'Oilaviy nizolar, ajralish va aliment masalalarida tajribali advokat.' },
  { id:3, emoji:'👨‍💼', name:'Bobur Toshmatov',  spec:'Biznes Huquqi',   specKey:'biznes',  region:'toshkent', loc:'Toshkent', rating:4.8, cases:425, exp:15, reviews:112, price:'Birinchi konsultatsiya bepul', phone:'+998 90 345 67 89', tags:['IE va MChJ','Shartnomalar','Intellektual mulk'], about:'Kompaniya tashkil etish va korporativ huquq sohasida yetakchi mutaxassis.' },
  { id:4, emoji:'👩‍💼', name:'Malika Ergasheva', spec:'Mulk Huquqi',      specKey:'mulk',    region:'buxoro',   loc:'Buxoro',   rating:4.7, cases:156, exp:9,  reviews:48,  price:'30,000 so\'m/konsultatsiya', phone:'+998 90 456 78 90', tags:['Uy-joy','Ijara','Mulk ro\'yxati'], about:'Ko\'chmas mulk va uy-joy ijarasi masalalarida mutaxassis.' },
  { id:5, emoji:'👨‍⚖️', name:'Sherzod Nazarov',  spec:'Jinoiy Huquq',    specKey:'jinoyat', region:'namangan', loc:'Namangan', rating:4.9, cases:289, exp:14, reviews:93,  price:'Bepul konsultatsiya', phone:'+998 90 567 89 01', tags:['Jinoiy mudofaa','Sud vakili','Apellyatsiya'], about:'Jinoiy ishlar bo\'yicha shoshilinch mudofaa va sud jarayonlarida vakillik.' },
  { id:6, emoji:'👩‍💼', name:'Nodira Hasanova',  spec:'Iste\'molchi Huquqi',specKey:'isteMol',region:'fargona',  loc:'Farg\'ona', rating:4.6, cases:134, exp:6,  reviews:39,  price:'Bepul konsultatsiya', phone:'+998 90 678 90 12', tags:['Sifatsiz tovar','Bank nizosi','Sug\'urta'], about:'Iste\'molchilarni himoya qilish va bank nizolari bo\'yicha mutaxassis.' },
  { id:7, emoji:'👨‍💼', name:'Jamshid Pulatov',  spec:'Ma\'muriy Huquq',  specKey:'mamuriy', region:'andijon',  loc:'Andijon',  rating:4.8, cases:201, exp:11, reviews:67,  price:'40,000 so\'m/konsultatsiya', phone:'+998 90 789 01 23', tags:['Davlat organlari','Jarimalar','Litsenziya'], about:'Davlat organlari bilan nizolar va ma\'muriy huquq bo\'yicha tajribali advokat.' },
  { id:8, emoji:'👩‍⚖️', name:'Shahnoza Mirova',  spec:'Mehnat Huquqi',    specKey:'mehnat',  region:'samarqand',loc:'Samarqand',rating:4.7, cases:178, exp:7,  reviews:55,  price:'25,000 so\'m/konsultatsiya', phone:'+998 90 890 12 34', tags:['Ish haqi','Ta\'til huquqi','Diskriminatsiya'], about:'Mehnat diskriminatsiyasi va xotin-qizlar huquqlari bo\'yicha ixtisoslashgan.' },
];

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

// ===== DASHBOARD =====
function renderDashboard() {
  const u = AUTH.user;
  if (!u) { goPage('home'); return; }
  document.getElementById('dashName').textContent = u.name;
  const hist = AUTH.history;
  const hl = document.getElementById('userHistory');
  if (!hist.length) {
    hl.innerHTML = `<div class="no-hist">Hali savol yo'q. AI bilan gaplashing!</div>`;
  } else {
    hl.innerHTML = hist.map(h => `
      <div class="hist-item" onclick="sendQ('${h.q.replace(/'/g,"\\'")}');goPage('chat')">
        <div class="hist-ico">💬</div>
        <div class="hist-info"><strong>${h.q.length>60?h.q.slice(0,60)+'...':h.q}</strong><span>${h.date}</span></div>
        <div class="hist-arr">›</div>
      </div>`).join('');
  }
}

// ===== AUTH MODAL =====
let _regData = {}; // ro'yxat jarayonidagi vaqtincha ma'lumot

function openAuth()  { openModal('authOverlay'); switchTab('login'); }
function openPremium() { openModal('premOverlay'); }

function switchTab(tab) {
  ['formLogin','formReg','formOTP'].forEach(f => document.getElementById(f).style.display = 'none');
  document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('formReg').style.display   = tab === 'reg'   ? 'block' : 'none';
  document.querySelectorAll('.atab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='reg')));
  ['loginErr','regErr','otpErr'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=''; });
}

// --- LOGIN ---
function doLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const err   = document.getElementById('loginErr');
  err.textContent = '';

  if (!phone) { err.textContent = 'Telefon raqam kiriting'; return; }
  if (!pass)  { err.textContent = 'Parol kiriting'; return; }

  const users = getUsers();
  const u = users.find(x => x.phone === phone);
  if (!u)          { err.textContent = '❌ Bu raqam ro\'yxatdan o\'tmagan'; return; }
  if (u.pass !== pass) { err.textContent = '❌ Parol noto\'g\'ri'; return; }

  AUTH.save(u);
  closeModal('authOverlay');
  updateNav();
  toast(`✅ Xush kelibsiz, ${u.name}!`);
  goPage('dashboard');
}

// --- REGISTER ---
function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const err   = document.getElementById('regErr');
  err.textContent = '';

  if (!name)           { err.textContent = 'Ismingizni kiriting'; return; }
  if (name.length < 2) { err.textContent = 'Ism kamida 2 ta harf bo\'lsin'; return; }
  if (!phone)          { err.textContent = 'Telefon raqam kiriting'; return; }
  // Telefon: +998 bilan boshlanishi va kamida 9 raqam bo'lishi kerak
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) { err.textContent = 'To\'g\'ri telefon raqam kiriting'; return; }
  if (pass.length < 6)   { err.textContent = 'Parol kamida 6 ta belgi bo\'lsin'; return; }
  if (pass2 && pass !== pass2) { err.textContent = 'Parollar mos kelmadi'; return; }

  const users = getUsers();
  const normalizedPhone = phone.replace(/\s/g, ''); // probellarsiz saqlash
  if (users.find(x => x.phone.replace(/\s/g,'') === normalizedPhone)) {
    err.textContent = '❌ Bu raqam allaqachon ro\'yxatdan o\'tgan'; return;
  }

  _regData = { name, phone: normalizedPhone, pass };
  // OTP bosqichiga o'tish
  document.getElementById('formReg').style.display = 'none';
  document.getElementById('formOTP').style.display = 'block';
  document.getElementById('otpPhone').textContent   = normalizedPhone;
  document.querySelectorAll('.otp-inp').forEach(i => i.value = '');
  setTimeout(() => document.getElementById('otp0').focus(), 100);
}

// --- OTP ---
function otpNext(el, idx) {
  el.value = el.value.replace(/\D/g, '');
  if (el.value && idx < 5) {
    document.getElementById('otp' + (idx + 1)).focus();
  }
  // Agar hammasi to'ldirilsa avtomatik tekshirish
  const all = Array.from({length:6}, (_,i) => document.getElementById('otp'+i).value);
  if (all.every(v => v)) verifyOTP();
}

function verifyOTP() {
  const code = Array.from({length:6}, (_,i) => document.getElementById('otp'+i).value).join('');
  const err  = document.getElementById('otpErr');
  err.textContent = '';

  if (code.length < 6) { err.textContent = 'Barcha 6 ta raqamni kiriting'; return; }
  if (code !== '123456') {
    err.textContent = '❌ Noto\'g\'ri kod. Demo uchun: 123456';
    document.querySelectorAll('.otp-inp').forEach(i => i.value = '');
    document.getElementById('otp0').focus();
    return;
  }

  // Foydalanuvchini saqlash
  const newUser = { name: _regData.name, phone: _regData.phone, pass: _regData.pass, plan: 'free', createdAt: Date.now() };
  const users = getUsers();
  users.push(newUser);
  saveUsers(users);
  AUTH.save(newUser);

  closeModal('authOverlay');
  updateNav();
  toast(`🎉 Ro'yxatdan o'tdingiz! Xush kelibsiz, ${newUser.name}!`);
  goPage('dashboard');
}

function resendOTP() {
  document.querySelectorAll('.otp-inp').forEach(i => i.value = '');
  document.getElementById('otp0').focus();
  document.getElementById('otpErr').textContent = '';
  toast('📱 Kod qayta yuborildi (demo: 123456)');
}

function telegramLogin() {
  toast('📱 Telegram bot orqali kirish tez orada ishga tushadi!');
}

function buyPremium() {
  if (!AUTH.user) {
    closeModal('premOverlay');
    openAuth();
    return;
  }
  toast('💳 To\'lov tizimi tez orada — Payme va Click ulanganda ishlaydi!');
}

// ===== CHAT LOGIC =====
const TOPICS = {
  mehnat: {
    kw: ['mehnat','ish','shartnoma','ishdan','maosh','ish haqi','ta\'til','ishchi','kompensatsiya','bo\'shatish'],
    resp: () => ({
      text: `**Mehnat huquqi bo'yicha ma'lumot:**\n\nO'zbekiston Mehnat Kodeksiga ko'ra:\n\n• **Ishdan bo'shatish** faqat asosli sabablar bilan va 2 hafta oldin ogohlantirish orqali mumkin (52-modda)\n• **Ish haqi** oyiga kamida 1 marta to'lanishi shart\n• **Yillik ta'til** 15 ish kunidan kam bo'lmasligi kerak\n• Shartnomani bir tomonlama buzish uchun kompensatsiya talab qilish mumkin`,
      roadmap: ['Mehnat shartnomasini nusxasini oling','Buzilgan bandlarni yozma qayd eting','HR bo\'limiga rasmiy ariza yuboring','Mehnat inspektsiyasiga shikoyat yuboring','Kerak bo\'lsa sudga murojaat qiling'],
      lawType: 'mehnat', needLawyer: true
    })
  },
  oila: {
    kw: ['oila','ajralish','aliment','bola','nikoh','er','xotin','vasiyat','meros'],
    resp: () => ({
      text: `**Oilaviy huquq bo'yicha ma'lumot:**\n\nO'zbekiston Oila Kodeksiga ko'ra:\n\n• **Ajralish** da mulk 50/50 taqsimlanadi (umumiy qoida)\n• **Aliment**: 1 bola — 25%, 2 bola — 33%, 3+ bola — 50% daromaddan\n• **Bola vasiyati** sudda hal qilinadi, bolaning manfaati asosiy mezon\n• Nikoh hujjatlari muhim dalil — saqlang`,
      roadmap: ['Nikoh va mulk hujjatlarini to\'plang','Fuqarolik holati idorasiga murojaat qiling','Ajralish arizasini sudga bering','Mulk bo\'lish va aliment masalasini kelishib oling','Sud qarorini oling'],
      lawType: 'oila', needLawyer: true
    })
  },
  mulk: {
    kw: ['uy','mulk','ijara','kvartira','xona','er','dala','sotib olish','sotish','uy-joy'],
    resp: () => ({
      text: `**Mulk huquqi bo'yicha ma'lumot:**\n\n• **Ijara shartnomasi** notarius orqali tasdiqlanishi tavsiya etiladi\n• **Mulk ro'yxatdan o'tkazish** Davlat mulk qo'mitasi orqali amalga oshiriladi\n• Ijara to'lovini bank orqali to'lang (iz qoldirish uchun)\n• Noqonuniy haydash holatida — 3 oy ichida sudga ariza bering`,
      roadmap: ['Barcha shartnoma va hujjatlarni to\'plang','Mulkni davlat ro\'yxatidan tekshiring','To\'lov tarixini (cheklar, bank ko\'chirma) saqlang','Davlat mulk qo\'mitasiga murojaat qiling','Kerak bo\'lsa sudga murojaat qiling'],
      lawType: 'mulk', needLawyer: true
    })
  },
  biznes: {
    kw: ['biznes','IE','machj','мхж','kompaniya','litsenziya','soliq','tadbirkor','ochish','ro\'yxat'],
    resp: () => ({
      text: `**Biznes huquqi bo'yicha ma'lumot:**\n\n• **IE ochish**: pasport + ariza + davlat boji (my.gov.uz orqali online)\n• **MChJ**: nizom, ta'sischilar ro'yxati, minimal ustav kapitali\n• Ro'yxatdan o'tish **3 ish kuni** ichida amalga oshiriladi\n• Soliqqa ro'yxat (STIR) va bank hisob raqami oching`,
      roadmap: ['Biznes turini tanlang (IE/MChJ)','Hujjatlarni tayyorlang','my.gov.uz da online ro\'yxatdan o\'ting','Soliq organiga ro\'yxatdan o\'ting','Bank hisob raqami oching'],
      lawType: 'biznes', needLawyer: false
    })
  },
  jinoyat: {
    kw: ['jinoyat','jinoiy','qamoq','politsiya','tergovchi','ayblov','hibsga','ushlab olindi'],
    resp: () => ({
      text: `⚠️ **DIQQAT! Bu jiddiy masala:**\n\n• **Advokat talab qilish** huquqingiz bor — darhol!\n• Advokatsiz so'roqqa **javob bermang**\n• **72 soat** ichida ayblov e'lon qilinishi yoki ozod etilishi shart\n• **Jimlik huquqingiz bor** — o'zingizga qarshi guvohlik bermang`,
      roadmap: ['⚡ Darhol advokat chaqiring yoki so\'rang','Hech narsa imzowlamang advokatsiz','Yaqinlaringizni xabardor qiling','Barcha dalillarni saqlang','Advokat bilan to\'liq ma\'lumot ulashing'],
      lawType: 'jinoyat', needLawyer: true, urgent: true
    })
  },
  isteMol: {
    kw: ['iste\'mol','tovar','sifatsiz','qaytarish','bank','sug\'urta','aldov','firibgarlik'],
    resp: () => ({
      text: `**Iste'molchi huquqi bo'yicha ma'lumot:**\n\n• **Sifatsiz tovar** 14 kun ichida qaytarilishi mumkin\n• **Xizmat uchun pul** qaytarish talab qilish huquqingiz bor\n• Iste'molchilarni himoya qilish bo'yicha qo'mitaga murojaat qiling\n• **Bank muammolari** uchun Markaziy bank ilovasi orqali shikoyat yuboring`,
      roadmap: ['Chek va hujjatlarni saqlang','Do\'kon/xizmat ko\'rsatuvchiga rasmiy ariza bering','Iste\'molchilar himoyasi qo\'mitasiga murojaat qiling','Kerak bo\'lsa sudga murojaat qiling'],
      lawType: 'isteMol', needLawyer: false
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

function getResp(text) {
  const topic = detectTopic(text);
  if (topic) return { ...TOPICS[topic].resp(), topic };
  return {
    text: `**Savolingizni tushundim.**\n\nAniqroq yordam berish uchun bir nechta savol berishim kerak:\n\n• Bu qaysi shahar/viloyatda yuz berdi?\n• Hujjatlar bormi (shartnoma, chek va h.k.)?\n• Bu qachon sodir bo'ldi?\n\nYoki quyidagi sohalardan birini tanlang:`,
    roadmap: null, lawType: null, needLawyer: false, topic: null,
    showChips: true
  };
}

function topicAsk(key) {
  const names = { mehnat:'Mehnat huquqi', oila:'Oilaviy huquq', mulk:'Mulk va uy-joy', biznes:'Biznes huquqi', jinoyat:'Jinoiy huquq', isteMol:"Iste'molchi huquqi" };
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

async function sendMsg() {
  const inp = document.getElementById('inp');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = ''; inp.style.height = 'auto';

  addMsg(txt, 'user');
  addTyping();

  await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
  removeTyping();

  const resp = getResp(txt);
  const msgEl = addMsg(resp.text, 'ai');
  const bubble = msgEl.querySelector('.bubble');

  // Chips agar umumiy savol
  if (resp.showChips) {
    const cd = document.createElement('div');
    cd.className = 'chips';
    cd.innerHTML = [
      ['💼 Mehnat','Mehnat huquqi bo\'yicha ma\'lumot bering'],
      ['🏠 Mulk','Mulk va uy-joy masalalarini tushuntiring'],
      ['👨‍👩‍👧 Oila','Oilaviy huquq haqida ma\'lumot bering'],
      ['📋 Biznes','Biznes ochish uchun nima kerak?'],
    ].map(([l,q]) => `<button class="chip" onclick="sendQ('${q}')">${l}</button>`).join('');
    bubble.appendChild(cd);
  }

  // Roadmap
  if (resp.roadmap && resp.roadmap.length) {
    const rb = document.createElement('div');
    rb.className = 'roadmap-box';
    rb.innerHTML = `<h4>📋 Qadam-baqadam Yo'l Xaritasi</h4>` +
      resp.roadmap.map((s,i) => `<div class="rm-step"><div class="rm-n">${i+1}</div><p>${s}</p></div>`).join('');
    bubble.appendChild(rb);
  }

  // Lawyer recommendation
  if (resp.needLawyer && resp.lawType) {
    const lawyers = LAWYERS.filter(l => l.specKey === resp.lawType).slice(0,3);
    if (lawyers.length) {
      const lb = document.createElement('div');
      lb.className = 'lawyer-rec-box';
      lb.innerHTML = `<h4>👨‍⚖️ Mos advokatlar:</h4>` +
        lawyers.map(l => `
          <div class="mini-law" onclick="openLawyer(${l.id})">
            <div class="mini-av">${l.emoji}</div>
            <div class="mini-info"><strong>${l.name}</strong><span>${l.spec} · ${l.loc}</span></div>
            <div class="mini-rat">${l.rating}⭐</div>
          </div>`).join('') +
        `<button class="see-all-btn" onclick="goPage('lawyers')">Barcha advokatlarni ko'rish →</button>`;
      bubble.appendChild(lb);
    }
  }

  // Disclaimer
  const disc = document.createElement('div');
  disc.className = 'ai-disc';
  disc.textContent = '⚠️ Bu umumiy huquqiy ma\'lumot. Aniq va yakuniy maslahat uchun litsenziyalangan advokatga murojaat qiling.';
  bubble.appendChild(disc);

  // History saqlash
  if (AUTH.user) AUTH.addHistory(txt, resp.topic || 'umumiy');

  const msgs = document.getElementById('msgs');
  msgs.scrollTop = msgs.scrollHeight;
}

function newChat() {
  const msgs = document.getElementById('msgs');
  msgs.innerHTML = '';
  addMsg('Yangi savol uchun tayyorman! Muammongizni yozing 👇', 'ai');
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

// ===== KEYBOARD CLOSE MODAL =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['authOverlay','lawyerOverlay','premOverlay'].forEach(id => closeModal(id));
  }
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  goPage('home');

  // Chat sahifasi uchun boshlang'ich xabar
  const msgs = document.getElementById('msgs');
  if (msgs && !msgs.children.length) {
    addMsg(`Assalomu alaykum! Men **Adalat AI** — huquqiy yordamchingizman. 👋\n\nSavolingizni yozing yoki quyidagi sohalardan birini tanlang:`, 'ai');
    const msgEl = msgs.lastElementChild;
    const bubble = msgEl.querySelector('.bubble');
    const cd = document.createElement('div');
    cd.className = 'chips';
    cd.innerHTML = [
      ['💼 Mehnat huquqi','Mehnat huquqi bo\'yicha ma\'lumot bering'],
      ['🏠 Mulk va uy-joy','Mulk va uy-joy masalalarini tushuntiring'],
      ['👨‍👩‍👧 Oilaviy huquq','Oilaviy huquq haqida ma\'lumot bering'],
      ['📋 Biznes huquqi','Biznes ochish uchun nima kerak?'],
      ['⚖️ Jinoiy huquq','Jinoiy ish bo\'yicha nima qilishim kerak?'],
    ].map(([l,q]) => `<button class="chip" onclick="sendQ('${q}')">${l}</button>`).join('');
    bubble.appendChild(cd);
  }
});
