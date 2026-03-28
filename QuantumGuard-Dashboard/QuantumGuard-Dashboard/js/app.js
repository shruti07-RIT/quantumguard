// ══════════════════════════════════════════
//  QuantumGuard — Full Button Functionality
// ══════════════════════════════════════════

// ── LANDING NAV SCROLL ──
function landScrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Highlight active nav link
  document.querySelectorAll('.land-nav-links a').forEach(a => a.style.color = '');
  const map = { 'land-about':'About','land-features':'Features','land-schemes':'Schemes','land-contact':'Contact' };
  document.querySelectorAll('.land-nav-links a').forEach(a => {
    if (a.textContent === map[id]) a.style.color = 'var(--green)';
  });
}

// ── CONTACT FORM SUBMIT ──
function submitContact() {
  const name = document.getElementById('contact-name')?.value.trim();
  const phone = document.getElementById('contact-phone')?.value.trim();
  const msg = document.getElementById('contact-msg')?.value.trim();
  if (!name || !phone || !msg) { showToast('⚠️ Please fill in all required fields'); return; }
  if (phone.length < 10) { showToast('⚠️ Enter a valid 10-digit phone number'); return; }
  const btn = event.currentTarget;
  btn.textContent = '⏳ Sending...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '📨 Send Message';
    btn.disabled = false;
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-msg').value = '';
    showToast('✅ Message sent! We\'ll respond within 24 hours.');
  }, 1500);
}

// ── SCREEN NAVIGATION ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'screen-dashboard') {
    setTimeout(() => animateStatValues(), 300);
  }
  if (id === 'screen-register') {
    // Reset farmerData for new registration
    window.farmerData = getDefaultFarmerData();
    // Reset registration form fields
    ['reg-name','reg-dob','reg-phone','reg-aadhaar','reg-address','reg-village','reg-taluka',
     'reg-district','reg-pincode','reg-landarea','reg-surveyno','reg-croptype','reg-irrigationtype',
     'reg-soiltype','reg-ownership','reg-monthlyincome','reg-annualincome','reg-bankaccount',
     'reg-ifsc','reg-loanhistory'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const stateEl = document.getElementById('reg-state');
    if (stateEl) stateEl.value = 'Maharashtra';
    // Reset step to 1
    window.currentRegStep = 1;
    for (let i = 1; i <= 4; i++) {
      const step = document.getElementById('reg-step-'+i);
      if (step) step.classList.toggle('active', i === 1);
      const sc = document.getElementById('sc'+i);
      if (sc) { sc.className = i === 1 ? 'step-circle active' : 'step-circle'; sc.textContent = i === 1 ? '1' : i; }
      if (i < 4) { const sl = document.getElementById('sl'+i); if (sl) sl.classList.remove('done'); }
      const ind = document.getElementById('reg-step-indicator-'+i);
      if (ind) ind.style.opacity = i === 1 ? '1' : '0.4';
    }
    const prevBtn = document.getElementById('reg-prev-btn');
    if (prevBtn) prevBtn.style.display = 'none';
    const nextBtn = document.getElementById('reg-next-btn');
    if (nextBtn) { nextBtn.textContent = 'Next Step →'; nextBtn.style.background = 'linear-gradient(135deg,#4CAF50,#2e7d32)'; nextBtn.disabled = false; }
  }
  if (id === 'screen-login') {
    // Clear login fields
    const lp = document.getElementById('login-phone'); if (lp) lp.value = '';
    ['pin1','pin2','pin3','pin4'].forEach(pid => { const el = document.getElementById(pid); if (el) el.value = ''; });
  }
}

// ── DASHBOARD PAGE NAVIGATION ──
function showDashPage(id, el) {
  document.querySelectorAll('.f-page').forEach(p => p.classList.remove('active'));
  document.getElementById('dash-' + id).classList.add('active');
  document.querySelectorAll('.f-nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  // Update topbar title
  const titles = {
    schemes: ['🏛️ Government Schemes', '3 schemes you may be eligible for'],
    profile: ['👨‍🌾 Farmer Profile', 'Manage your personal information'],
    documents: ['📄 Document Status', 'Uploaded to IPFS – Immutable & Decentralized'],
    blockchain: ['⛓️ Blockchain Details', 'Ethereum Sepolia Testnet — Immutable record'],
    loan: ['💰 Loan Eligibility', 'Based on your land, income & documents'],
    qr: ['📱 QR Identity Card', 'Your blockchain-verified digital identity'],
    status: ['📊 Validation Status', 'Real-time identity verification progress']
  };
  if (id === 'qr') setTimeout(generateQR, 200);
}

// ── LOGIN ──
function doLoginOriginal() {
  showScreen('screen-dashboard');
  const greeting = farmerData.name ? '👋 Welcome back, ' + farmerData.name + '!' : '👋 Welcome back!';
  showToast(greeting);
}

// ── AADHAAR OTP LOGIN ──
function doAadhaarLogin() {
  // Restore saved farmer data first
  try {
    const saved = localStorage.getItem('qg_farmer');
    if (saved) { const parsed = JSON.parse(saved); Object.assign(farmerData, parsed); }
  } catch(e) {}
  showToast('📱 OTP sent to registered mobile');
  setTimeout(() => showToast('✅ OTP verified — logging in...'), 1500);
  setTimeout(() => {
    showScreen('screen-dashboard');
    const greeting = farmerData.name ? '👋 Welcome back, ' + farmerData.name + '!' : '👋 Welcome back!';
    showToast(greeting);
    setTimeout(() => { spreadFarmerData(); renderDocumentsPage(); updateValidationStatusPage(); }, 200);
  }, 2800);
}

// ── PIN INPUT AUTO-ADVANCE ──
function nextPin(el, idx) {
  if (el.value.length === 1 && idx < 4) {
    const pins = el.closest('.pin-row').querySelectorAll('.pin-input');
    if (pins[idx]) pins[idx].focus();
  }
}

// ── REGISTRATION STEPS ──
let currentRegStep = 1;
function regStepUI(dir) {
  const next = currentRegStep + dir;
  if (next < 1 || next > 4) {
    if (next > 4) {
      const btn = document.getElementById('reg-next-btn');
      btn.textContent = '⏳ Registering...';
      btn.disabled = true;
      showToast('🚀 Registering on blockchain...');
      setTimeout(() => showToast('🔗 Storing identity hash on Ethereum...'), 1000);
      setTimeout(() => {
        btn.disabled = false;
        showScreen('screen-dashboard');
        showToast('✅ Welcome to QuantumGuard, ' + (farmerData.name || 'Farmer') + '!');
      }, 2200);
      return;
    }
    return;
  }

  document.getElementById('reg-step-' + currentRegStep).classList.remove('active');
  document.getElementById('sc' + currentRegStep).classList.remove('active');
  if (currentRegStep < 4) document.getElementById('sl' + currentRegStep).classList[dir > 0 ? 'add' : 'remove']('done');
  document.getElementById('reg-step-indicator-' + currentRegStep).style.opacity = '0.4';
  if (currentRegStep > 1 && dir < 0) document.getElementById('sc' + currentRegStep).classList.remove('done');

  currentRegStep = next;

  for (let i = 1; i < currentRegStep; i++) {
    document.getElementById('sc' + i).className = 'step-circle done';
    document.getElementById('sc' + i).textContent = '✓';
    if (i < 4) document.getElementById('sl' + i).classList.add('done');
    document.getElementById('reg-step-indicator-' + i).style.opacity = '1';
  }

  document.getElementById('reg-step-' + currentRegStep).classList.add('active');
  document.getElementById('sc' + currentRegStep).className = 'step-circle active';
  document.getElementById('sc' + currentRegStep).textContent = currentRegStep;
  document.getElementById('reg-step-indicator-' + currentRegStep).style.opacity = '1';

  for (let i = currentRegStep + 1; i <= 4; i++) {
    document.getElementById('sc' + i).className = 'step-circle';
    document.getElementById('sc' + i).textContent = i;
    document.getElementById('reg-step-indicator-' + i).style.opacity = '0.4';
  }

  document.getElementById('reg-prev-btn').style.display = currentRegStep > 1 ? 'block' : 'none';
  const nextBtn = document.getElementById('reg-next-btn');
  nextBtn.textContent = currentRegStep === 4 ? '🚀 Complete Registration' : 'Next Step →';
  nextBtn.style.background = currentRegStep === 4 ? 'linear-gradient(135deg,#FFA726,#e65100)' : 'linear-gradient(135deg,#4CAF50,#2e7d32)';
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('f-toast');
  document.getElementById('f-toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ── FILTER BUTTONS ──
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    this.closest('.search-wrap').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── ANIMATE STAT VALUES ──
function animateValue(el, end, prefix='', suffix='') {
  let start = 0;
  const step = end / 30;
  const timer = setInterval(() => {
    start += step;
    if (start >= end) { el.textContent = prefix + end + suffix; clearInterval(timer); return; }
    el.textContent = prefix + Math.floor(start) + suffix;
  }, 30);
}
function animateStatValues() {
  // nothing to count-up on initial load — placeholder for future stat cards
}

// ── NOTIFICATION BELL ──
let notifOpen = false;
function toggleNotifications() {
  if (notifOpen) { closeNotifications(); return; }
  notifOpen = true;
  // Remove existing panel
  document.getElementById('notif-panel')?.remove();
  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.style.cssText = 'position:fixed;top:56px;right:18px;width:300px;background:white;border:1px solid #e0e0e0;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.12);z-index:999;overflow:hidden;animation:fadeIn .2s ease';
  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center">
      <div style="font-weight:700;font-size:13px;font-family:var(--font-head)">Notifications</div>
      <span style="background:#ef4444;color:white;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px">3 NEW</span>
    </div>
    ${[
      ['✅','Identity Approved','Your blockchain identity is now active','Jan 20','green-xpale','#c8e6c9'],
      ['💰','Loan Pre-Approved','₹1,50,000 loan offer from SBI Kisan branch','Jan 22','green-xpale','#c8e6c9'],
      ['⏳','Document Under Review','Bank passbook sent for verification','Feb 3','#fff3e0','#ffe0b2'],
      ['📋','PM-KISAN Submitted','Application sent to government portal','Mar 5','#e3f2fd','#bbdefb'],
    ].map(([icon,title,desc,date,bg,border])=>`
      <div style="padding:12px 16px;border-bottom:1px solid #f5f5f5;display:flex;gap:10px;align-items:flex-start;cursor:pointer;background:${bg};transition:.15s" onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
        <span style="font-size:16px">${icon}</span>
        <div>
          <div style="font-size:12px;font-weight:600;color:#1a1a1a">${title}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${desc}</div>
          <div style="font-size:10px;color:#9ca3af;margin-top:3px">${date}</div>
        </div>
      </div>`).join('')}
    <div style="padding:10px 16px;text-align:center;cursor:pointer;font-size:12px;color:var(--green);font-weight:600" onclick="closeNotifications();showToast('📋 Viewing all notifications')">View All Notifications</div>
  `;
  document.body.appendChild(panel);
  setTimeout(() => document.addEventListener('click', outsideNotifClick), 50);
}
function outsideNotifClick(e) {
  const panel = document.getElementById('notif-panel');
  const bell = document.querySelector('.bell-anim');
  if (panel && !panel.contains(e.target) && !bell?.contains(e.target)) closeNotifications();
}
function closeNotifications() {
  document.getElementById('notif-panel')?.remove();
  document.removeEventListener('click', outsideNotifClick);
  notifOpen = false;
}

// ── SCHEME APPLY BUTTONS ──
function applyScheme(name, amount) {
  showModal(`Apply for ${name}`,
    `<p style="font-size:13px;color:var(--text2);margin-bottom:16px">You are about to apply for <strong>${name}</strong> with a benefit of <strong>${amount}</strong>.</p>
    <p style="font-size:12px;color:var(--text2);margin-bottom:16px">Your verified documents and blockchain identity will be submitted to the government portal automatically.</p>
    <div style="background:var(--green-pale);padding:10px 12px;border-radius:8px;font-size:12px;color:var(--green);border:1px solid #c8e6c9">✅ All required documents are verified and ready for submission.</div>`,
    () => {
      closeModal();
      showToast(`🚀 Applying for ${name}...`);
      setTimeout(() => showToast('✅ Application submitted to government portal!'), 1500);
    }, 'Submit Application', 'linear-gradient(135deg,#4CAF50,#2e7d32)'
  );
}

function checkEligibility(name) {
  showToast(`🔍 Checking eligibility for ${name}...`);
  setTimeout(() => showToast('✅ You are eligible! Apply now.'), 1500);
}

// ── EDIT PROFILE ──
function editProfile() {
  const f = farmerData;
  showModal('✏️ Edit Profile',
    `<div style="max-height:60vh;overflow-y:auto;padding-right:4px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Personal</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="form-field" style="margin:0"><label class="form-label">Full Name</label><input class="form-input" id="ep-name" value="${f.name||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Date of Birth</label><input class="form-input" id="ep-dob" type="date" value="${f.dob||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Phone</label><input class="form-input" id="ep-phone" value="${f.phone||''}" maxlength="10"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Aadhaar</label><input class="form-input" id="ep-aadhaar" value="${f.aadhaar||''}" maxlength="14" placeholder="XXXX XXXX XXXX"></div>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Address</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="form-field" style="margin:0;grid-column:1/-1"><label class="form-label">Full Address</label><input class="form-input" id="ep-address" value="${f.address||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Village</label><input class="form-input" id="ep-village" value="${f.village||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">District</label><input class="form-input" id="ep-district" value="${f.district||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Taluka</label><input class="form-input" id="ep-taluka" value="${f.taluka||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">PIN Code</label><input class="form-input" id="ep-pincode" value="${f.pincode||''}"></div>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Land</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="form-field" style="margin:0"><label class="form-label">Land Area (Acres)</label><input class="form-input" id="ep-land" type="number" value="${f.landArea||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Survey No.</label><input class="form-input" id="ep-surveyno" value="${f.surveyNo||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Crop Type</label><input class="form-input" id="ep-croptype" value="${f.cropType||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Irrigation Type</label><input class="form-input" id="ep-irrigation" value="${f.irrigationType||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Soil Type</label><input class="form-input" id="ep-soiltype" value="${f.soilType||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Ownership</label><input class="form-input" id="ep-ownership" value="${f.ownership||''}"></div>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Financial</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-field" style="margin:0"><label class="form-label">Monthly Income (₹)</label><input class="form-input" id="ep-income" type="number" value="${f.monthlyIncome||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Annual Income (₹)</label><input class="form-input" id="ep-annual" type="number" value="${f.annualIncome||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">Bank Account No.</label><input class="form-input" id="ep-bank" value="${f.bankAccount||''}"></div>
        <div class="form-field" style="margin:0"><label class="form-label">IFSC Code</label><input class="form-input" id="ep-ifsc" value="${f.ifsc||''}"></div>
        <div class="form-field" style="margin:0;grid-column:1/-1"><label class="form-label">Loan History</label><input class="form-input" id="ep-loanhistory" value="${f.loanHistory||''}"></div>
      </div>
    </div>`,
    () => {
      farmerData.name          = document.getElementById('ep-name')?.value.trim()       || farmerData.name;
      farmerData.dob           = document.getElementById('ep-dob')?.value               || farmerData.dob;
      farmerData.phone         = document.getElementById('ep-phone')?.value.trim()      || farmerData.phone;
      farmerData.aadhaar       = document.getElementById('ep-aadhaar')?.value.trim()    || farmerData.aadhaar;
      farmerData.address       = document.getElementById('ep-address')?.value.trim()    || farmerData.address;
      farmerData.village       = document.getElementById('ep-village')?.value.trim()    || farmerData.village;
      farmerData.district      = document.getElementById('ep-district')?.value.trim()   || farmerData.district;
      farmerData.taluka        = document.getElementById('ep-taluka')?.value.trim()     || farmerData.taluka;
      farmerData.pincode       = document.getElementById('ep-pincode')?.value.trim()    || farmerData.pincode;
      farmerData.landArea      = document.getElementById('ep-land')?.value              || farmerData.landArea;
      farmerData.surveyNo      = document.getElementById('ep-surveyno')?.value.trim()   || farmerData.surveyNo;
      farmerData.cropType      = document.getElementById('ep-croptype')?.value.trim()   || farmerData.cropType;
      farmerData.irrigationType= document.getElementById('ep-irrigation')?.value.trim() || farmerData.irrigationType;
      farmerData.soilType      = document.getElementById('ep-soiltype')?.value.trim()   || farmerData.soilType;
      farmerData.ownership     = document.getElementById('ep-ownership')?.value.trim()  || farmerData.ownership;
      farmerData.monthlyIncome = document.getElementById('ep-income')?.value            || farmerData.monthlyIncome;
      farmerData.annualIncome  = document.getElementById('ep-annual')?.value            || farmerData.annualIncome;
      farmerData.bankAccount   = document.getElementById('ep-bank')?.value.trim()       || farmerData.bankAccount;
      farmerData.ifsc          = document.getElementById('ep-ifsc')?.value.trim()       || farmerData.ifsc;
      farmerData.loanHistory   = document.getElementById('ep-loanhistory')?.value.trim()|| farmerData.loanHistory;
      try {
        localStorage.setItem('qg_farmer', JSON.stringify(farmerData));
        // Also update in multi-user store
        if (farmerData.phone) {
          const allUsers = JSON.parse(localStorage.getItem('qg_all_farmers') || '{}');
          allUsers[farmerData.phone] = JSON.parse(JSON.stringify(farmerData));
          localStorage.setItem('qg_all_farmers', JSON.stringify(allUsers));
        }
      } catch(e){}
      closeModal();
      spreadFarmerData();
      updateBlockchainPage();
      showToast('✅ Profile updated successfully!');
    },
    'Save Changes', 'linear-gradient(135deg,#4CAF50,#2e7d32)'
  );
}

// ── DOCUMENT UPLOAD ──
function openUploadZone() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,.pdf';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  fileInput.click();
  fileInput.addEventListener('change', function() {
    if (this.files[0]) {
      const file = this.files[0];
      showToast(`📤 Uploading "${file.name}" to IPFS...`);
      setTimeout(() => showToast('🔗 Pinning to Pinata gateway...'), 1200);
      setTimeout(() => {
        addDocumentToList(file.name, file.size);
        showToast('✅ Document uploaded & pinned to IPFS!');
      }, 2500);
    }
    document.body.removeChild(fileInput);
  });
}

function addDocumentToList(name, size) {
  // Delegate to dynamic version
  addDocumentToListDynamic({name: name, size: size});
}

function deleteDoc(btn) {
  const row = btn.closest('.doc-row');
  const idx = parseInt(row.getAttribute('data-idx'));
  if (!isNaN(idx)) {
    deleteDocByIdx(idx);
  } else {
    row.style.opacity = '0';
    row.style.transition = 'opacity .3s';
    setTimeout(() => { row.remove(); showToast('🗑️ Document removed'); }, 300);
  }
}

// ── COPY HASH / CID BUTTONS ──
function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`📋 ${label} copied to clipboard!`);
  }).catch(() => {
    showToast(`📋 ${label} copied!`);
  });
}

// ── LOAN APPLICATION MODAL ──
function applyLoan(type, amount, rate, term) {
  showModal(`Apply for ${type}`,
    `<div style="background:var(--green-pale);border-radius:10px;padding:14px;margin-bottom:16px;border:1px solid #c8e6c9">
      <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-bottom:1px solid #c8e6c9"><span style="color:var(--text2)">Loan Amount</span><span style="font-weight:700;color:var(--green)">${amount}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-bottom:1px solid #c8e6c9"><span style="color:var(--text2)">Interest Rate</span><span style="font-weight:700">${rate}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0"><span style="color:var(--text2)">Repayment Term</span><span style="font-weight:700">${term}</span></div>
    </div>
    <div class="form-field"><label class="form-label">Preferred Bank Branch</label>
    <select class="form-input"><option>SBI – Satara Main Branch</option><option>Bank of Maharashtra – Koregaon</option><option>NABARD Regional Office</option></select></div>
    <div class="form-field"><label class="form-label">Purpose of Loan</label>
    <select class="form-input"><option>Crop Cultivation</option><option>Farm Equipment</option><option>Irrigation Setup</option><option>Seed & Fertilizer</option></select></div>`,
    () => { closeModal(); showToast(`✅ ${type} application submitted!`); setTimeout(()=>showToast('🏦 Bank will contact within 3-5 days'),1500); },
    'Submit Loan Application', 'linear-gradient(135deg,#4CAF50,#2e7d32)'
  );
}

// ── QR CODE GENERATION ──
function generateQR() {
  // Delegate to dynamic version
  generateQRDynamic();
}

// ── QR DOWNLOAD ──
function downloadQR() {
  const canvas = document.querySelector('#qr-canvas canvas');
  if (canvas) {
    const link = document.createElement('a');
    link.download = 'QuantumGuard_' + (farmerData.farmerId||'QG-ID') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('📥 QR Code downloaded as PNG!');
  } else {
    showToast('📥 QR Card image saving...');
  }
}

// ── SHARE QR ──
function shareQR() {
  const f = farmerData;
  const text = 'QuantumGuard Verified Farmer ID: ' + (f.farmerId||'QG-XXXX') + ' | ' + (f.name||'Farmer') + ' | Verified on Ethereum Sepolia';
  if (navigator.share) {
    navigator.share({ title: 'QuantumGuard Farmer ID', text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).catch(()=>{});
    showToast('🔗 Identity link copied to clipboard!');
  }
}

// ── PRINT ──
function printIDCard() {
  showToast('🖨️ Opening print dialog...');
  setTimeout(() => window.print(), 500);
}

// ── LOGOUT ──
function doLogout() {
  showModal('🚪 Logout', '<p style="font-size:13px;color:var(--text2)">Are you sure you want to logout from your QuantumGuard farmer account?</p>',
    () => { closeModal(); showScreen('screen-landing'); showToast('👋 Logged out successfully'); },
    'Logout', 'linear-gradient(135deg,#ef4444,#b91c1c)'
  );
}

// ── GENERIC MODAL ──
function showModal(title, body, onConfirm, confirmLabel='Confirm', confirmBg='linear-gradient(135deg,#4CAF50,#2e7d32)') {
  document.getElementById('qg-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'qg-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;padding:24px;width:90%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:fadeIn .25s ease">
      <div style="font-family:var(--font-head);font-size:16px;font-weight:700;color:var(--text1);margin-bottom:16px">${title}</div>
      <div>${body}</div>
      <div style="display:flex;gap:8px;margin-top:20px">
        <button onclick="closeModal()" style="flex:1;padding:11px;border-radius:8px;border:1.5px solid #e0e0e0;background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--text2);font-family:var(--font-body)">Cancel</button>
        <button onclick="window.__modalConfirm&&window.__modalConfirm()" style="flex:2;padding:11px;border-radius:8px;border:none;background:${confirmBg};color:white;cursor:pointer;font-size:13px;font-weight:700;font-family:var(--font-body)">${confirmLabel}</button>
      </div>
    </div>`;
  window.__modalConfirm = onConfirm;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}
function closeModal() {
  document.getElementById('qg-modal-overlay')?.remove();
  window.__modalConfirm = null;
}


// ════════════════════════════════════════════════════════════
//  QUANTUMGUARD — DYNAMIC FARMER STATE ENGINE (All Fixes)
// ════════════════════════════════════════════════════════════

// ── DEFAULT FARMER DATA FACTORY ──
function getDefaultFarmerData() {
  return {
    registered: false,
    name: '', dob: '', phone: '', aadhaar: '',
    address: '', village: '', taluka: '', district: '', state: 'Maharashtra', pincode: '',
    landArea: '', surveyNo: '', cropType: '', irrigationType: '', soilType: '', ownership: '',
    monthlyIncome: '', annualIncome: '', bankAccount: '', ifsc: '', loanHistory: '',
    farmerId: '',
    registeredAt: '',
    documents: [],
    requiredDocs: {
      aadhaar:  { label:'Aadhaar Card', desc:'Front & back of Aadhaar card', icon:'🪪', accept:'image/*,.pdf', file:null },
      land:     { label:'Land Document', desc:'7/12 or land record extract (Satbara)', icon:'🗺️', accept:'image/*,.pdf', file:null },
      bank:     { label:'Bank Passbook', desc:'First page of bank passbook / cancelled cheque', icon:'🏦', accept:'image/*,.pdf', file:null },
      photo:    { label:'Farmer Photo', desc:'Recent passport-size photograph', icon:'🧑‍🌾', accept:'image/*', file:null },
      income:   { label:'Income Certificate', desc:'Issued by Tahsildar / Revenue authority', icon:'📃', accept:'image/*,.pdf', file:null },
      landphoto:{ label:'Land Photo', desc:'Photo of your agricultural land / field', icon:'🌾', accept:'image/*', file:null },
    },
    validationStatus: {
      personal: false, address: false, land: false, financial: false,
      documents: false, blockchain: false, identity: false
    }
  };
}

// ── GLOBAL FARMER STORE ──
window.farmerData = getDefaultFarmerData();

// ── IDs for inputs in registration ──
const REG_FIELDS = {
  1: ['reg-name','reg-dob','reg-phone','reg-aadhaar'],
  2: ['reg-address','reg-village','reg-taluka','reg-district','reg-state','reg-pincode'],
  3: ['reg-landarea','reg-surveyno','reg-croptype','reg-irrigationtype','reg-soiltype','reg-ownership'],
  4: ['reg-monthlyincome','reg-annualincome','reg-bankaccount','reg-ifsc','reg-loanhistory']
};

// ── REGISTER: collect all step data and save ──
function collectRegStep(step) {
  if (step === 1) {
    farmerData.name    = document.getElementById('reg-name')?.value.trim() || '';
    farmerData.dob     = document.getElementById('reg-dob')?.value || '';
    farmerData.phone   = document.getElementById('reg-phone')?.value.trim() || '';
    farmerData.aadhaar = document.getElementById('reg-aadhaar')?.value.trim() || '';
  } else if (step === 2) {
    farmerData.address  = document.getElementById('reg-address')?.value.trim() || '';
    farmerData.village  = document.getElementById('reg-village')?.value.trim() || '';
    farmerData.taluka   = document.getElementById('reg-taluka')?.value.trim() || '';
    farmerData.district = document.getElementById('reg-district')?.value.trim() || '';
    farmerData.state    = document.getElementById('reg-state')?.value || 'Maharashtra';
    farmerData.pincode  = document.getElementById('reg-pincode')?.value.trim() || '';
  } else if (step === 3) {
    farmerData.landArea      = document.getElementById('reg-landarea')?.value || '';
    farmerData.surveyNo      = document.getElementById('reg-surveyno')?.value.trim() || '';
    farmerData.cropType      = document.getElementById('reg-croptype')?.value || '';
    farmerData.irrigationType= document.getElementById('reg-irrigationtype')?.value || '';
    farmerData.soilType      = document.getElementById('reg-soiltype')?.value || '';
    farmerData.ownership     = document.getElementById('reg-ownership')?.value || '';
  } else if (step === 4) {
    farmerData.monthlyIncome = document.getElementById('reg-monthlyincome')?.value || '';
    farmerData.annualIncome  = document.getElementById('reg-annualincome')?.value || '';
    farmerData.bankAccount   = document.getElementById('reg-bankaccount')?.value.trim() || '';
    farmerData.ifsc          = document.getElementById('reg-ifsc')?.value.trim() || '';
    farmerData.loanHistory   = document.getElementById('reg-loanhistory')?.value || '';
  }
}

// ── VALIDATE STEP ──
function validateRegStep(step) {
  if (step === 1) {
    if (!farmerData.name) { showToast('⚠️ Please enter your full name'); return false; }
    if (!farmerData.phone || farmerData.phone.length < 10) { showToast('⚠️ Enter valid 10-digit phone number'); return false; }
    if (!farmerData.aadhaar) { showToast('⚠️ Please enter Aadhaar number'); return false; }
    farmerData.validationStatus.personal = true;
  } else if (step === 2) {
    if (!farmerData.village) { showToast('⚠️ Please enter your village/town'); return false; }
    if (!farmerData.district) { showToast('⚠️ Please enter your district'); return false; }
    farmerData.validationStatus.address = true;
  } else if (step === 3) {
    if (!farmerData.landArea) { showToast('⚠️ Please enter land area'); return false; }
    farmerData.validationStatus.land = true;
  } else if (step === 4) {
    if (!farmerData.monthlyIncome) { showToast('⚠️ Please enter monthly income'); return false; }
    if (!farmerData.bankAccount) { showToast('⚠️ Please enter bank account number'); return false; }
    farmerData.validationStatus.financial = true;
  }
  updateValidationStatusPage();
  return true;
}

// ── UPDATE BLOCKCHAIN PAGE WITH REAL USER DATA ──
function updateBlockchainPage() {
  const f = farmerData;
  if (!f.registered) return;

  // Generate a deterministic-looking hash from the farmer's data
  const seed = (f.farmerId || '') + (f.name || '') + (f.phone || '') + (f.aadhaar || '');
  let hash = '';
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i).toString(16);
  while (hash.length < 64) hash += Math.floor(Math.random()*16).toString(16);
  hash = hash.slice(0,64);

  // Generate a tx hash
  const txSeed = (f.farmerId || 'QG') + (f.phone || '');
  let txHash = '0x';
  for (let i = 0; i < 64; i++) txHash += Math.floor(Math.random()*16).toString(16);

  const chainBannerName = document.getElementById('chain-banner-name');
  if (chainBannerName) chainBannerName.textContent = f.name || '—';
  const chainBannerFid = document.getElementById('chain-banner-id');
  if (chainBannerFid) chainBannerFid.textContent = f.farmerId || '—';
  const chainName = document.getElementById('chain-farmer-name');
  if (chainName) chainName.textContent = f.name || '—';
  const chainHash = document.getElementById('chain-identity-hash');
  if (chainHash) chainHash.textContent = hash;
  const chainTx = document.getElementById('chain-tx-hash');
  if (chainTx) chainTx.textContent = txHash;
  const chainTs = document.getElementById('chain-timestamp');
  if (chainTs) chainTs.textContent = f.registeredAt || new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}

// ── COMPLETE REGISTRATION ──
function completeRegistration() {
  farmerData.registered = true;
  farmerData.farmerId = 'QG-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random()*90000);
  farmerData.validationStatus.identity = true;
  farmerData.registeredAt = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  // Store in multi-user localStorage keyed by phone
  try {
    const allUsers = JSON.parse(localStorage.getItem('qg_all_farmers') || '{}');
    allUsers[farmerData.phone] = JSON.parse(JSON.stringify(farmerData));
    localStorage.setItem('qg_all_farmers', JSON.stringify(allUsers));
    // Also keep last logged-in user for backward compat
    localStorage.setItem('qg_farmer', JSON.stringify(farmerData));
  } catch(e){}
  spreadFarmerData();
  updateBlockchainPage();
  generateQR();
  updateValidationStatusPage();
}

// ── SPREAD FARMER DATA EVERYWHERE ──
function spreadFarmerData() {
  const f = farmerData;
  const initials = f.name ? f.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';

  // Sidebar avatar + name
  document.querySelectorAll('.f-farmer-name').forEach(el => el.textContent = f.name || '—');
  document.querySelectorAll('.f-farmer-id').forEach(el => el.textContent = f.farmerId || 'Not registered');
  document.querySelectorAll('.f-farmer-avatar').forEach(el => el.textContent = initials || '?');
  const sidebarId = document.getElementById('sidebar-farmer-id'); if(sidebarId) sidebarId.textContent = f.farmerId || 'Not registered';

  // ── PROFILE PAGE ──
  const fmt = (v, prefix='', suffix='', fallback='—') => v ? prefix + v + suffix : fallback;
  const fmtMoney = (v, fallback='—') => v ? '₹' + Number(v).toLocaleString('en-IN') : fallback;
  const fmtAadhaar = (v) => v ? 'XXXX XXXX ' + v.replace(/\D/g,'').slice(-4) : '—';
  const fmtBank = (v) => v ? '****' + v.replace(/\s/g,'').slice(-4) : '—';
  const fmtDob = (v) => { if(!v) return '—'; try { return new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); } catch(e){ return v; } };

  // Header
  const dpAvatar = document.getElementById('dp-avatar-lg'); if(dpAvatar) dpAvatar.textContent = initials || '?';
  const dpName = document.getElementById('dp-name'); if(dpName) dpName.textContent = f.name || '—';
  const dpId = document.getElementById('dp-id'); if(dpId) dpId.textContent = f.farmerId || 'Not registered';

  // Verification badges
  const verifyBadge = document.getElementById('dp-verify-badge');
  const pendingBadge = document.getElementById('dp-pending-badge');
  if(verifyBadge) verifyBadge.style.display = f.registered ? 'inline-flex' : 'none';
  if(pendingBadge) pendingBadge.style.display = f.registered ? 'none' : 'inline-flex';

  // Registration banners
  const regBanner = document.getElementById('dp-reg-banner');
  const unregBanner = document.getElementById('dp-unreg-banner');
  if(regBanner) regBanner.style.display = f.registered ? '' : 'none';
  if(unregBanner) unregBanner.style.display = f.registered ? 'none' : '';
  const dpRegId = document.getElementById('dp-reg-id'); if(dpRegId) dpRegId.textContent = f.farmerId || '—';

  // Personal
  const dpFullname = document.getElementById('dp-fullname'); if(dpFullname) dpFullname.textContent = f.name || '—';
  const dpDob = document.getElementById('dp-dob'); if(dpDob) dpDob.textContent = fmtDob(f.dob);
  const dpPhone = document.getElementById('dp-phone'); if(dpPhone) dpPhone.textContent = f.phone ? '+91 ' + f.phone : '—';
  const dpAadhaar = document.getElementById('dp-aadhaar'); if(dpAadhaar) dpAadhaar.textContent = fmtAadhaar(f.aadhaar);

  // Address
  const dpAddress = document.getElementById('dp-address'); if(dpAddress) dpAddress.textContent = f.address || '—';
  const dpVillage = document.getElementById('dp-village'); if(dpVillage) dpVillage.textContent = f.village || '—';
  const dpDistrict = document.getElementById('dp-district'); if(dpDistrict) dpDistrict.textContent = f.district || '—';
  const dpTaluka = document.getElementById('dp-taluka'); if(dpTaluka) dpTaluka.textContent = f.taluka || '—';
  const dpState = document.getElementById('dp-state'); if(dpState) dpState.textContent = f.state || '—';
  const dpPincode = document.getElementById('dp-pincode'); if(dpPincode) dpPincode.textContent = f.pincode || '—';

  // Land
  const dpLand = document.getElementById('dp-land'); if(dpLand) dpLand.textContent = f.landArea ? f.landArea + ' Acres' : '—';
  const dpSurveyno = document.getElementById('dp-surveyno'); if(dpSurveyno) dpSurveyno.textContent = f.surveyNo || '—';
  const dpCrop = document.getElementById('dp-crop'); if(dpCrop) dpCrop.textContent = f.cropType || '—';
  const dpIrrigation = document.getElementById('dp-irrigation'); if(dpIrrigation) dpIrrigation.textContent = f.irrigationType || '—';
  const dpSoiltype = document.getElementById('dp-soiltype'); if(dpSoiltype) dpSoiltype.textContent = f.soilType || '—';
  const dpOwnership = document.getElementById('dp-ownership'); if(dpOwnership) dpOwnership.textContent = f.ownership || '—';

  // Financial
  const dpIncome = document.getElementById('dp-income'); if(dpIncome) dpIncome.textContent = fmtMoney(f.monthlyIncome);
  const dpAnnual = document.getElementById('dp-annual'); if(dpAnnual) dpAnnual.textContent = fmtMoney(f.annualIncome);
  const dpBank = document.getElementById('dp-bank'); if(dpBank) dpBank.textContent = fmtBank(f.bankAccount);
  const dpIfsc = document.getElementById('dp-ifsc'); if(dpIfsc) dpIfsc.textContent = f.ifsc || '—';
  const dpLoanhistory = document.getElementById('dp-loanhistory'); if(dpLoanhistory) dpLoanhistory.textContent = f.loanHistory || '—';

  // QR card header
  const qName = document.getElementById('qr-farmer-name'); if(qName) qName.textContent = f.name || '—';
  const qId   = document.getElementById('qr-farmer-id');   if(qId)   qId.textContent   = f.farmerId || 'Not registered';
  const qVil  = document.getElementById('qr-farmer-village'); if(qVil) qVil.textContent = (f.village||'') + (f.district?', '+f.district:'');
  const qLand = document.getElementById('qr-farmer-land'); if(qLand) qLand.textContent  = f.landArea ? f.landArea+' ac' : '—';
  const qCrop = document.getElementById('qr-farmer-crop'); if(qCrop) qCrop.textContent  = f.cropType || '—';

  // QR info panel (right of QR image)
  const qInfoId = document.getElementById('qr-info-id');
  if(qInfoId) qInfoId.textContent = f.farmerId || '—';
  const qInfoStatus = document.getElementById('qr-info-status');
  if(qInfoStatus) { qInfoStatus.textContent = f.registered ? '✓ Verified' : '⏳ Pending'; qInfoStatus.style.color = f.registered ? 'var(--green)' : 'var(--text2)'; }
  const qInfoLoan = document.getElementById('qr-info-loan');
  if(qInfoLoan) { const eligible = parseFloat(f.landArea)>=1 && parseFloat(f.monthlyIncome||0)<25000; qInfoLoan.textContent = f.registered ? (eligible?'Eligible':'Check Eligibility') : '—'; qInfoLoan.style.color = (f.registered && eligible) ? 'var(--green)' : 'var(--text2)'; }

  // Identity Data Encoded in QR panel
  const qedId      = document.getElementById('qed-id');      if(qedId)      qedId.textContent      = f.farmerId || '—';
  const qedName    = document.getElementById('qed-name');    if(qedName)    qedName.textContent    = f.name || '—';
  const qedStatus  = document.getElementById('qed-status');  if(qedStatus)  qedStatus.textContent  = f.registered ? 'VERIFIED' : 'PENDING';
  const qedLand    = document.getElementById('qed-land');    if(qedLand)    qedLand.textContent    = f.landArea ? f.landArea+'ac' : '—';
  const qedCrop    = document.getElementById('qed-crop');    if(qedCrop)    qedCrop.textContent    = f.cropType || '—';
  const qedIncome  = document.getElementById('qed-income');  if(qedIncome)  qedIncome.textContent  = f.monthlyIncome ? '₹'+Number(f.monthlyIncome).toLocaleString('en-IN')+'/mo' : '—';
  const qedVillage = document.getElementById('qed-village'); if(qedVillage) qedVillage.textContent = (f.village||'—') + (f.district?', '+f.district:'');
  const qedDocs    = document.getElementById('qed-docs');    if(qedDocs)    qedDocs.textContent    = Object.values(f.requiredDocs||{}).filter(d=>d.file).length + '/6';

  // Digital ID Card Preview
  const icAvatar = document.getElementById('idcard-avatar');
  if(icAvatar) icAvatar.textContent = f.name ? f.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const icName = document.getElementById('idcard-name');
  if(icName) icName.textContent = f.name || '—';
  const icId = document.getElementById('idcard-id');
  if(icId) icId.textContent = f.farmerId || 'Not registered';
  const icVerify = document.getElementById('idcard-verify-badge');
  if(icVerify) icVerify.textContent = f.registered ? '✓ Verified' : '⏳ Pending';
  const icLocation = document.getElementById('idcard-location');
  if(icLocation) icLocation.textContent = f.registered ? ('Sepolia · ' + (f.village||'') + (f.district?', '+f.district:'')) : 'Complete registration to activate';
  const icLoan = document.getElementById('idcard-loan-badge');
  if(icLoan) { const eligible = parseFloat(f.landArea||0)>=1 && parseFloat(f.monthlyIncome||0)<25000; icLoan.textContent = f.registered && eligible ? '💰 Loan Eligible' : '💰 Check Loan'; }

  // Loan page criteria update
  const lLand = document.getElementById('lc-land'); if(lLand) lLand.textContent = (f.landArea||'?') + ' ac ' + (parseFloat(f.landArea)>=1?'✓':'✗');
  const lInc  = document.getElementById('lc-income'); if(lInc) lInc.textContent = f.monthlyIncome ? '₹'+Number(f.monthlyIncome).toLocaleString('en-IN')+' '+(Number(f.monthlyIncome)<25000?'✓':'✗') : '—';

  // Dashboard hero section
  const heroName = document.getElementById('hero-farmer-name'); if(heroName) heroName.textContent = (f.name ? f.name + ' 🌾' : 'Farmer 🌾');
  const heroVil  = document.getElementById('hero-farmer-village'); if(heroVil) heroVil.textContent = (f.village||'') + (f.district ? ', '+f.district : '') || 'Complete registration to get started';

  // Regenerate QR if on that page
  if (document.getElementById('dash-qr')?.classList.contains('active')) generateQRDynamic();
}

// ── DYNAMIC QR GENERATION with farmer data ──
function generateQRDynamic() {
  const f = farmerData;
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  canvas.innerHTML = '';
  const data = (f.farmerId||'QG-XXXX') + '|' + (f.name||'Farmer') + '|VERIFIED|LAND:' + (f.landArea||'?') + 'ac|CROP:' + (f.cropType||'N/A') + '|INCOME:' + (f.monthlyIncome||'?') + '|DOCS:' + farmerData.documents.length + '|' + f.village + ',' + f.state;
  try {
    new QRCode(canvas, { text: data, width: 170, height: 170, colorDark: '#1b5e20', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
  } catch(e) {}
}

// ── QR SCAN VIEW: Show all saved documents ──
function showQRScanResult() {
  const f = farmerData;
  const docs = f.documents;
  document.getElementById('qg-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'qg-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2000;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease';
  const docList = docs.length === 0
    ? '<div style="color:var(--text2);font-size:12px;padding:12px;background:#f9f9f9;border-radius:8px;text-align:center">No documents uploaded yet</div>'
    : docs.map(d => `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:white;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:6px">
        <div style="width:32px;height:32px;border-radius:6px;background:#e8f5e9;color:#2e7d32;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${d.name.split('.').pop().toUpperCase().slice(0,4)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</div>
          <div style="font-size:10px;color:#6b7280">${d.date} · ${d.status}</div>
          <div style="font-size:9px;font-family:monospace;color:#9ca3af">${d.cid.slice(0,30)}…</div>
        </div>
        <span style="background:#e8f5e9;color:#2e7d32;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px">✓</span>
      </div>`).join('');
  overlay.innerHTML = `<div style="background:white;border-radius:16px;padding:24px;width:90%;max-width:480px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:fadeIn .25s ease">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <div style="width:40px;height:40px;background:var(--green-pale);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">📱</div>
      <div><div style="font-family:var(--font-head);font-size:15px;font-weight:700">QR Scan Result</div><div style="font-size:11px;color:var(--text2)">Farmer Identity & Documents</div></div>
    </div>
    <div style="background:var(--green-pale);border-radius:10px;padding:12px 14px;margin-bottom:14px;border:1px solid #c8e6c9">
      <div style="font-size:13px;font-weight:700;color:#1b5e20">${f.name || 'Farmer'}</div>
      <div style="font-size:11px;color:var(--text2);margin-top:2px">${f.farmerId || 'Unregistered'} · ${f.village||''} ${f.district ? ', '+f.district : ''}</div>
      <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
        <div style="font-size:11px;color:var(--text2)">🌾 <strong>${f.landArea||'?'} ac</strong> · ${f.cropType||'N/A'}</div>
        <div style="font-size:11px;color:var(--text2)">💰 ₹${f.monthlyIncome ? Number(f.monthlyIncome).toLocaleString('en-IN') : '?'}/mo</div>
        <div style="font-size:11px;color:var(--text2)">📄 ${docs.length} document${docs.length!==1?'s':''}</div>
      </div>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--text1);margin-bottom:8px">📁 Stored Documents</div>
    ${docList}
    <button onclick="closeModal()" style="width:100%;margin-top:14px;padding:11px;border-radius:8px;border:none;background:linear-gradient(135deg,#4CAF50,#2e7d32);color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font-body)">Close</button>
  </div>`;
  window.__modalConfirm = null;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}

// ── DOCUMENT STORAGE: upload to a required slot ──
function addDocumentToListDynamic(file, slotKey) {
  const name = file.name || file;
  const sizeKB = file.size ? Math.round(file.size / 1024) : 0;
  const ext = (typeof name === 'string' ? name : '').split('.').pop().toUpperCase() || 'FILE';
  const isImg = ['JPG','PNG','JPEG','WEBP','GIF'].includes(ext);
  const fakeCID = 'Qm' + Array.from({length:44}, () => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random()*58)]).join('');
  const today = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const docEntry = { name, sizeKB, cid: fakeCID, date: today, status: 'Pending', isImg, ext };

  // Save to required slot if slotKey given
  if (slotKey && farmerData.requiredDocs[slotKey]) {
    farmerData.requiredDocs[slotKey].file = docEntry;
  }

  // Also push to general docs array (for QR / other pages)
  // Remove old entry for this slot if exists
  if (slotKey) farmerData.documents = farmerData.documents.filter(d => d.slotKey !== slotKey);
  docEntry.slotKey = slotKey || 'extra';
  farmerData.documents.push(docEntry);

  // Update validation: all 6 required docs uploaded?
  const allUploaded = Object.values(farmerData.requiredDocs).every(d => d.file !== null);
  farmerData.validationStatus.documents = allUploaded;

  try { localStorage.setItem('qg_farmer', JSON.stringify(farmerData)); } catch(e){}
  renderDocumentsPage();
  updateValidationStatusPage();
  if (farmerData.registered) generateQRDynamic();
  return docEntry;
}

function renderDocumentsPage() {
  const grid = document.getElementById('req-docs-grid');
  if (!grid) return;

  const rd = farmerData.requiredDocs;
  const uploadedCount = Object.values(rd).filter(d => d.file !== null).length;
  const total = Object.keys(rd).length;
  const pct = Math.round((uploadedCount / total) * 100);

  // Update progress
  const pBar = document.getElementById('doc-progress-bar');
  const pLabel = document.getElementById('doc-progress-label');
  const badge = document.getElementById('doc-overall-badge');
  if (pBar) pBar.style.width = pct + '%';
  if (pLabel) pLabel.textContent = uploadedCount + ' of ' + total + ' documents uploaded';
  if (badge) {
    badge.textContent = uploadedCount + ' / ' + total + ' Uploaded';
    badge.style.background = uploadedCount === total ? '#e8f5e9' : (uploadedCount > 0 ? '#fff9c4' : '#fff3e0');
    badge.style.color = uploadedCount === total ? '#2e7d32' : (uploadedCount > 0 ? '#f57f17' : '#e65100');
    badge.style.border = '1px solid ' + (uploadedCount === total ? '#c8e6c9' : (uploadedCount > 0 ? '#ffe082' : '#ffe0b2'));
  }

  grid.innerHTML = '';
  Object.entries(rd).forEach(([key, slot]) => {
    const f = slot.file;
    const uploaded = f !== null;

    const card = document.createElement('div');
    card.style.cssText = 'background:white;border:2px solid ' + (uploaded ? '#c8e6c9' : '#e0e0e0') + ';border-radius:12px;padding:14px;transition:.2s;position:relative;overflow:hidden';

    // Top colour strip
    const strip = document.createElement('div');
    strip.style.cssText = 'position:absolute;top:0;left:0;right:0;height:3px;background:' + (uploaded ? 'linear-gradient(90deg,#4CAF50,#81c784)' : 'linear-gradient(90deg,#e0e0e0,#bdbdbd)');
    card.appendChild(strip);

    card.innerHTML += `
      <div style="display:flex;align-items:flex-start;gap:10px;margin-top:4px">
        <div style="width:40px;height:40px;border-radius:10px;background:${uploaded ? '#e8f5e9' : '#f5f5f5'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid ${uploaded ? '#c8e6c9' : '#e0e0e0'}">${slot.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:var(--text1);display:flex;align-items:center;gap:6px">
            ${slot.label}
            ${uploaded ? '<span style="font-size:9px;background:#e8f5e9;color:#2e7d32;padding:2px 7px;border-radius:10px;font-weight:700">✓ Uploaded</span>' : '<span style="font-size:9px;background:#fff3e0;color:#e65100;padding:2px 7px;border-radius:10px;font-weight:700">Required</span>'}
          </div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px;line-height:1.4">${slot.desc}</div>
        </div>
      </div>

      ${uploaded ? `
        <div style="margin-top:10px;padding:8px 10px;background:var(--green-xpale);border-radius:8px;border:1px solid #c8e6c9">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:6px;background:${f.isImg ? '#e3f2fd' : '#fce4ec'};color:${f.isImg ? '#1565c0' : '#c62828'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${f.ext.slice(0,3)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:11px;font-weight:600;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
              <div style="font-size:10px;color:var(--text2)">${f.date} · ${f.sizeKB} KB · <span style="color:var(--text2)">Pending review</span></div>
            </div>
            <button onclick="deleteRequiredDoc('${key}')" style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:13px;padding:3px 5px;border-radius:5px;flex-shrink:0" title="Remove">🗑️</button>
          </div>
          <div style="font-size:9px;font-family:monospace;color:var(--green);background:white;padding:4px 8px;border-radius:5px;margin-top:6px;word-break:break-all;cursor:pointer;border:1px solid #c8e6c9" title="Click to copy CID" onclick="copyToClipboard('${f.cid}','IPFS CID')">📎 ${f.cid}</div>
        </div>
      ` : `
        <div style="margin-top:10px">
          <label style="display:flex;align-items:center;justify-content:center;gap:7px;padding:9px 0;border:1.5px dashed #bdbdbd;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;color:var(--text2);transition:.15s;background:#fafafa"
            onmouseenter="this.style.borderColor='var(--green-mid)';this.style.color='var(--green)';this.style.background='var(--green-xpale)'"
            onmouseleave="this.style.borderColor='#bdbdbd';this.style.color='var(--text2)';this.style.background='#fafafa'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            Upload ${slot.label}
            <input type="file" accept="${slot.accept}" style="display:none" onchange="handleRequiredDocUpload(event,'${key}')">
          </label>
        </div>
      `}
    `;

    // Re-add the colour strip (innerHTML wiped it)
    card.insertBefore(strip, card.firstChild);
    grid.appendChild(card);
  });
}

function handleRequiredDocUpload(event, slotKey) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('⚠️ File too large — max 10MB'); return; }
  const slot = farmerData.requiredDocs[slotKey];
  showToast('📤 Uploading "' + file.name + '" to IPFS...');
  setTimeout(() => showToast('🔗 Pinning to Pinata gateway...'), 1200);
  setTimeout(() => {
    addDocumentToListDynamic(file, slotKey);
    showToast('✅ ' + slot.label + ' uploaded & pinned to IPFS!');
  }, 2000);
}

function deleteRequiredDoc(slotKey) {
  if (!farmerData.requiredDocs[slotKey]) return;
  const label = farmerData.requiredDocs[slotKey].label;
  farmerData.requiredDocs[slotKey].file = null;
  farmerData.documents = farmerData.documents.filter(d => d.slotKey !== slotKey);
  const allUploaded = Object.values(farmerData.requiredDocs).every(d => d.file !== null);
  farmerData.validationStatus.documents = allUploaded;
  try { localStorage.setItem('qg_farmer', JSON.stringify(farmerData)); } catch(e){}
  renderDocumentsPage();
  updateValidationStatusPage();
  showToast('🗑️ ' + label + ' removed');
}

function deleteDocByIdx(idx) {
  const doc = farmerData.documents[idx];
  if (doc && doc.slotKey && farmerData.requiredDocs[doc.slotKey]) {
    farmerData.requiredDocs[doc.slotKey].file = null;
  }
  farmerData.documents.splice(idx, 1);
  const allUploaded = Object.values(farmerData.requiredDocs).every(d => d.file !== null);
  farmerData.validationStatus.documents = allUploaded;
  try { localStorage.setItem('qg_farmer', JSON.stringify(farmerData)); } catch(e){}
  renderDocumentsPage();
  updateValidationStatusPage();
  showToast('🗑️ Document deleted');
  if (farmerData.registered) generateQRDynamic();
}

// ── VALIDATION STATUS PAGE (Dynamic) ──
function updateValidationStatusPage() {
  const f = farmerData;
  const vs = f.validationStatus;

  const steps = [
    { id: 'vs-personal',    done: vs.personal,    label: 'Personal Info', desc: vs.personal ? (f.name||'Filled') : 'Full name, phone, Aadhaar required' },
    { id: 'vs-address',     done: vs.address,     label: 'Address Details', desc: vs.address ? (f.village+(f.district?', '+f.district:'')) : 'Village, district required' },
    { id: 'vs-land',        done: vs.land,        label: 'Land Details', desc: vs.land ? (f.landArea+'ac · '+f.cropType) : 'Land area and crop type required' },
    { id: 'vs-financial',   done: vs.financial,   label: 'Financial Details', desc: vs.financial ? ('₹'+(f.monthlyIncome?Number(f.monthlyIncome).toLocaleString('en-IN'):'?')+'/mo') : 'Income and bank details required' },
    { id: 'vs-documents',   done: vs.documents,   label: 'Documents', desc: vs.documents ? '6 / 6 required documents uploaded ✓' : (() => { const cnt = Object.values(farmerData.requiredDocs||{}).filter(d=>d.file).length; return cnt + ' / 6 documents uploaded — ' + (6-cnt) + ' remaining'; })() },
    { id: 'vs-identity',    done: vs.identity,    label: 'Blockchain Identity', desc: vs.identity ? ('ID: '+(f.farmerId||'Generating…')) : 'Complete registration to generate identity' },
  ];

  const container = document.getElementById('vs-steps-container');
  if (!container) return;
  const total = steps.filter(s=>s.done).length;
  const pct = Math.round((total/steps.length)*100);

  // Progress bar
  const pBar = document.getElementById('vs-progress-bar');
  const pPct = document.getElementById('vs-progress-pct');
  const pLabel= document.getElementById('vs-progress-label');
  if (pBar) pBar.style.width = pct+'%';
  if (pPct) pPct.textContent = pct+'%';
  if (pLabel) pLabel.textContent = total+' of '+steps.length+' checks complete';

  container.innerHTML = steps.map(s => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:${s.done?'var(--green-xpale)':'#fafafa'};border:1px solid ${s.done?'#c8e6c9':'#e0e0e0'};border-radius:10px">
      <div style="width:32px;height:32px;border-radius:50%;background:${s.done?'var(--green-mid)':'#e0e0e0'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white;font-size:13px;font-weight:700">
        ${s.done?'✓':'○'}
      </div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:${s.done?'var(--green)':'var(--text1)'};">${s.label}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${s.desc}</div>
      </div>
      <span class="badge ${s.done?'badge-approved':'badge-pending'}">${s.done?'✓ Done':'Pending'}</span>
    </div>
  `).join('');
}

// ── OVERRIDE regStep to collect data and validate ──
const _origRegStep = window.regStep;
window.regStep = function(dir) {
  const cur = window.currentRegStep || 1;
  if (dir > 0) {
    collectRegStep(cur);
    if (!validateRegStep(cur)) return;
    if (cur === 4) {
      // Complete registration
      const btn = document.getElementById('reg-next-btn');
      btn.textContent = '⏳ Registering...';
      btn.disabled = true;
      showToast('🚀 Registering on blockchain...');
      setTimeout(() => showToast('🔗 Storing identity hash on Ethereum...'), 1000);
      setTimeout(() => {
        completeRegistration();
        btn.disabled = false;
        showScreen('screen-dashboard');
        showToast('✅ Welcome to QuantumGuard, ' + farmerData.name + '!');
      }, 2200);
      return;
    }
  }
  // call original logic for UI transitions
  regStepUI(dir);
};

// ── OVERRIDE doLogin to use registered data ──
const _origDoLogin = window.doLogin;
window.doLogin = function() {
  const phoneInput = document.getElementById('login-phone');
  const enteredPhone = phoneInput ? phoneInput.value.trim() : '';

  // Get PIN
  const pins = ['pin1','pin2','pin3','pin4'].map(id => (document.getElementById(id)||{}).value||'').join('');

  // Basic validation
  if (!enteredPhone || enteredPhone.length < 10) {
    showToast('⚠️ Please enter a valid 10-digit phone number');
    return;
  }
  if (!pins || pins.length < 4) {
    showToast('⚠️ Please enter your 4-digit PIN');
    return;
  }

  // Try to find user by phone in localStorage multi-user store
  let foundUser = null;
  try {
    const allUsers = JSON.parse(localStorage.getItem('qg_all_farmers') || '{}');
    if (allUsers[enteredPhone]) {
      foundUser = allUsers[enteredPhone];
    }
  } catch(e){}

  const btn = event?.currentTarget;
  if (btn) { btn.textContent = '⏳ Verifying...'; btn.disabled = true; }
  showToast('🔐 Verifying credentials...');
  setTimeout(() => {
    if (btn) { btn.textContent = btn.getAttribute('data-orig') || '🌾 Login to Dashboard'; btn.disabled = false; }

    if (foundUser) {
      // Reset farmerData then load found user
      Object.assign(farmerData, getDefaultFarmerData(), foundUser);
      // Re-merge requiredDocs structure
      if (foundUser.requiredDocs) {
        Object.keys(farmerData.requiredDocs).forEach(key => {
          if (foundUser.requiredDocs[key] && foundUser.requiredDocs[key].file) {
            farmerData.requiredDocs[key].file = foundUser.requiredDocs[key].file;
          }
        });
      }
      showScreen('screen-dashboard');
      showToast('👋 Welcome back, ' + farmerData.name + '!');
    } else {
      // No registered account found — still allow demo login with blank state
      // Reset to fresh blank
      Object.assign(farmerData, getDefaultFarmerData());
      farmerData.phone = enteredPhone;
      showScreen('screen-dashboard');
      showToast('👋 Welcome! Complete registration to activate your identity.');
    }

    setTimeout(() => {
      spreadFarmerData();
      renderDocumentsPage();
      updateValidationStatusPage();
      if (document.getElementById('dash-qr')?.classList.contains('active')) generateQRDynamic();
    }, 200);
  }, 1200);
};

// ── OVERRIDE openUploadZone to show slot-picker ──
window.openUploadZone = function() {
  const rd = farmerData.requiredDocs;
  const items = Object.entries(rd).map(([key, slot]) => `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid ${slot.file ? '#c8e6c9' : '#e0e0e0'};border-radius:10px;cursor:${slot.file ? 'default' : 'pointer'};background:${slot.file ? 'var(--green-xpale)' : 'white'};transition:.15s;margin-bottom:8px"
      ${slot.file ? '' : `onmouseenter="this.style.borderColor='var(--green-mid)'" onmouseleave="this.style.borderColor='#e0e0e0'"`}>
      <span style="font-size:22px">${slot.icon}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:var(--text1)">${slot.label}</div>
        <div style="font-size:11px;color:var(--text2)">${slot.file ? '✅ ' + slot.file.name : slot.desc}</div>
      </div>
      ${slot.file
        ? '<span style="font-size:10px;background:#e8f5e9;color:#2e7d32;padding:3px 8px;border-radius:10px;font-weight:700;flex-shrink:0">Uploaded ✓</span>'
        : `<input type="file" accept="${slot.accept}" style="display:none" onchange="handleRequiredDocUpload(event,'${key}');closeModal()">`
      }
    </label>
  `).join('');
  showModal('📂 Upload Required Document',
    `<div style="font-size:12px;color:var(--text2);margin-bottom:12px">Select which document you want to upload:</div>${items}`,
    null, 'Close', 'linear-gradient(135deg,#6b7280,#4b5563)'
  );
  // Replace confirm button with close only
  setTimeout(() => {
    const confirmBtn = document.querySelector('#qg-modal-overlay button:last-child');
    if (confirmBtn) { confirmBtn.onclick = closeModal; confirmBtn.textContent = 'Close'; }
  }, 50);
};

// ── OVERRIDE generateQR ──
window.generateQR = function() {
  generateQRDynamic();
};

// ── Override showDashPage to trigger QR and status updates ──
const _origShowDashPage = window.showDashPage;
window.showDashPage = function(id, el) {
  _origShowDashPage && _origShowDashPage(id, el);
  if (id === 'qr') {
    setTimeout(generateQRDynamic, 200);
  }
  if (id === 'status') {
    updateValidationStatusPage();
  }
  if (id === 'documents') {
    renderDocumentsPage();
  }
  if (id === 'profile') {
    spreadFarmerData();
  }
  if (id === 'blockchain') {
    updateBlockchainPage();
  }
};

// ── INIT: Add live validation on reg fields as user types ──
document.addEventListener('DOMContentLoaded', function() {
  // Restore last logged-in user from localStorage
  try {
    const saved = localStorage.getItem('qg_farmer');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(farmerData, parsed);
      // Re-merge requiredDocs: preserve the label/desc/icon/accept but restore file entries
      if (parsed.requiredDocs) {
        Object.keys(farmerData.requiredDocs).forEach(key => {
          if (parsed.requiredDocs[key] && parsed.requiredDocs[key].file) {
            farmerData.requiredDocs[key].file = parsed.requiredDocs[key].file;
          }
        });
      }
      // Immediately spread data so registered users see correct profile on load
      spreadFarmerData();
      updateBlockchainPage();
    }
  } catch(e) {}

  // IDs for reg inputs — add live feedback
  const liveFields = {
    'reg-name': 'personal', 'reg-phone': 'personal', 'reg-aadhaar': 'personal',
    'reg-village': 'address', 'reg-district': 'address',
    'reg-landarea': 'land', 'reg-croptype': 'land',
    'reg-monthlyincome': 'financial', 'reg-bankaccount': 'financial'
  };
  Object.keys(liveFields).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() {
      collectRegStep(window.currentRegStep || 1);
      validateRegStep(window.currentRegStep || 1);
      // Don't show error toast on live typing, just update status
    });
  });

  // Initialize status page
  updateValidationStatusPage();

  // Render docs page
  renderDocumentsPage();

  // Set data-orig on login button
  document.querySelectorAll('[onclick*="doLogin"]').forEach(b => {
    b.setAttribute('data-orig', b.textContent);
  });

  // QR Scan simulation button – wire up
  const qrScanBtn = document.getElementById('qr-scan-btn');
  if (qrScanBtn) qrScanBtn.addEventListener('click', showQRScanResult);
});

// ── Also override doLogout to clear session ──
const _origLogout = window.doLogout;
window.doLogout = function() {
  showModal('🚪 Logout', '<p style="font-size:13px;color:var(--text2)">Are you sure you want to logout from your QuantumGuard farmer account?</p>',
    () => {
      closeModal();
      // Keep farmerData but clear session flag
      showScreen('screen-landing');
      showToast('👋 Logged out successfully');
    },
    'Logout', 'linear-gradient(135deg,#ef4444,#b91c1c)'
  );
};


// ── FILTER SCHEMES ──
function filterSchemes() {
  const val = document.getElementById('scheme-filter').value;
  document.querySelectorAll('#scheme-cards-container .scheme-card').forEach(card => {
    const cats = card.getAttribute('data-cat') || '';
    card.style.display = (val === 'all' || cats.includes(val)) ? '' : 'none';
  });
  const visible = document.querySelectorAll('#scheme-cards-container .scheme-card:not([style*="none"])').length;
  showToast(`🔍 Showing ${visible} scheme${visible !== 1 ? 's' : ''}`);
}

// ── WIRE UP SCHEME CARDS ──
document.addEventListener('DOMContentLoaded', () => {
  // Scheme card CTAs
  const schemeCTAs = [
    { cta: 'Apply Now →', fn: () => applyScheme('PM-KISAN Samman Nidhi', '₹6,000 / year') },
    { cta: 'Check Eligibility →', fn: () => checkEligibility('PM Fasal Bima Yojana') },
    { cta: 'Check Bank →', fn: () => showToast('🏦 Redirecting to nearest KCC bank branch...') },
    { cta: 'Register →', fn: () => applyScheme('Soil Health Card', 'Free soil testing') },
    { cta: 'Check District Eligibility →', fn: () => checkEligibility('Maharashtra Shetkari Sahajya Yojana') },
  ];
  document.querySelectorAll('.scheme-cta').forEach((el, i) => {
    if (schemeCTAs[i]) el.addEventListener('click', schemeCTAs[i].fn);
  });

  // Scheme cards (full card click)
  document.querySelectorAll('.scheme-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.classList.contains('scheme-cta')) return;
      const name = this.querySelector('.scheme-name')?.textContent || 'this scheme';
      showToast(`ℹ️ Viewing details for ${name}`);
    });
  });

  // Doc upload zone - handled by inline onclick on upload zone

  // Delete buttons handled by renderDocumentsPage()

  // Copy blockchain hashes
  document.querySelectorAll('.chain-hash').forEach(el => {
    el.style.cursor = 'pointer';
    el.title = 'Click to copy';
    el.addEventListener('click', function() { copyToClipboard(this.textContent.trim(), 'Hash'); });
  });

  // Copy CIDs in doc list
  document.querySelectorAll('.doc-cid').forEach(el => {
    el.style.cursor = 'pointer';
    el.title = 'Click to copy CID';
    el.addEventListener('click', function() { copyToClipboard(this.textContent.trim(), 'IPFS CID'); });
  });

  // Notification bell
  document.querySelector('.bell-anim')?.addEventListener('click', toggleNotifications);
  document.querySelector('.f-notif-btn')?.addEventListener('click', toggleNotifications);

  // Edit profile handled via onclick

  // Upload Doc button already wired

  // Loan buttons already wired via onclick attributes

  // QR buttons already wired

  // Aadhaar OTP handled via onclick

  // Logout button already wired

  // Generate QR if already on QR page
  if (document.getElementById('dash-qr')?.classList.contains('active')) generateQR();
  
  // Initialize dynamic pages
  setTimeout(() => {
    renderDocumentsPage();
    updateValidationStatusPage();
    spreadFarmerData();
  }, 100);

  // Landing nav buttons — Login / Register
  document.querySelectorAll('[onclick*="screen-login"], [onclick*="screen-register"]').forEach(el => {
    // already wired via onclick attributes — keep them
  });

  // Status page: refresh button simulation
  const statusTopbar = document.querySelector('#dash-status .f-topbar-right');
  if (statusTopbar && !statusTopbar.querySelector('button')) {
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-outline';
    refreshBtn.style.cssText = 'padding:6px 14px;font-size:12px';
    refreshBtn.innerHTML = '🔄 Refresh Status';
    refreshBtn.addEventListener('click', () => {
      updateValidationStatusPage();
      showToast('🔄 Status refreshed');
    });
    statusTopbar.appendChild(refreshBtn);
  }
});

