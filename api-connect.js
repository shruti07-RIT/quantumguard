// ══════════════════════════════════════════
//  QuantumGuard — API Connection Layer
//  ADD THIS BLOCK at the very TOP of your
//  existing js/app.js file (before everything else)
// ══════════════════════════════════════════

const API_BASE = 'http://localhost:5000/api';
let authToken  = localStorage.getItem('qg_token') || null;

// ── Generic API caller ──
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
      body: body ? JSON.stringify(body) : null,
    });
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return { error: 'Could not reach server. Is it running?' };
  }
}

// ── File upload API caller (for documents) ──
async function apiUpload(endpoint, formData) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method:  'POST',
      headers: { 'Authorization': authToken ? `Bearer ${authToken}` : '' },
      body:    formData,
    });
    return await res.json();
  } catch (err) {
    console.error('Upload error:', err);
    return { error: 'Upload failed. Is the server running?' };
  }
}


// ══════════════════════════════════════════
//  OVERRIDE: doLogin  →  real API login
// ══════════════════════════════════════════
window.doLogin = async function() {
  const phone = document.getElementById('login-phone')?.value.trim();
  const pin   = ['pin1','pin2','pin3','pin4']
                  .map(id => document.getElementById(id)?.value || '')
                  .join('');

  if (!phone || phone.length < 10) {
    showToast('⚠️ Enter a valid 10-digit phone number'); return;
  }
  if (pin.length < 4) {
    showToast('⚠️ Enter your 4-digit PIN'); return;
  }

  const btn = document.querySelector('[onclick*="doLogin"]');
  if (btn) { btn.textContent = '⏳ Verifying...'; btn.disabled = true; }
  showToast('🔐 Verifying credentials...');

  const result = await apiCall('/auth/login', 'POST', { phone, pin });

  if (btn) { btn.textContent = '🌾 Login to Dashboard'; btn.disabled = false; }

  if (result.success) {
    authToken = result.token;
    localStorage.setItem('qg_token', authToken);
    Object.assign(farmerData, result.farmer);
    showScreen('screen-dashboard');
    showToast('👋 Welcome back, ' + result.farmer.name + '!');
    setTimeout(() => {
      spreadFarmerData();
      renderDocumentsPage();
      updateValidationStatusPage();
    }, 200);
  } else {
    showToast('❌ ' + (result.error || 'Login failed'));
    // Fall back to localStorage login if server is not yet set up
    const allUsers = JSON.parse(localStorage.getItem('qg_all_farmers') || '{}');
    if (allUsers[phone]) {
      Object.assign(farmerData, allUsers[phone]);
      showScreen('screen-dashboard');
      showToast('👋 Welcome back (offline mode), ' + farmerData.name + '!');
      setTimeout(() => { spreadFarmerData(); renderDocumentsPage(); updateValidationStatusPage(); }, 200);
    }
  }
};


// ══════════════════════════════════════════
//  OVERRIDE: regStep (step 4 complete)  →  real API register
// ══════════════════════════════════════════
window.regStep = function(dir) {
  const cur = window.currentRegStep || 1;

  if (dir > 0) {
    collectRegStep(cur);
    if (!validateRegStep(cur)) return;

    // ── Step 4: Complete Registration → call real API ──
    if (cur === 4) {
      const btn = document.getElementById('reg-next-btn');
      btn.textContent = '⏳ Registering...';
      btn.disabled    = true;
      showToast('🚀 Registering on QuantumGuard...');

      // Get PIN from the 4 PIN input boxes in Step 1
      const pin = document.querySelectorAll('#reg-step-1 .pin-input');
      const pinValue = Array.from(pin).map(p => p.value).join('') || '0000';

      const payload = {
        name:           farmerData.name,
        dob:            farmerData.dob,
        phone:          farmerData.phone,
        aadhaar:        farmerData.aadhaar,
        pin:            pinValue,
        address:        farmerData.address,
        village:        farmerData.village,
        taluka:         farmerData.taluka,
        district:       farmerData.district,
        state:          farmerData.state,
        pincode:        farmerData.pincode,
        landArea:       farmerData.landArea,
        surveyNo:       farmerData.surveyNo,
        cropType:       farmerData.cropType,
        irrigationType: farmerData.irrigationType,
        soilType:       farmerData.soilType,
        ownership:      farmerData.ownership,
        monthlyIncome:  farmerData.monthlyIncome,
        annualIncome:   farmerData.annualIncome,
        bankAccount:    farmerData.bankAccount,
        ifsc:           farmerData.ifsc,
        loanHistory:    farmerData.loanHistory,
      };

      apiCall('/auth/register', 'POST', payload).then(result => {
        btn.disabled = false;

        if (result.success) {
          authToken = result.token;
          localStorage.setItem('qg_token', authToken);
          Object.assign(farmerData, result.farmer);
          showToast('🔗 Storing identity hash on Ethereum...');
          setTimeout(() => {
            // Trigger blockchain registration
            apiCall('/blockchain/register', 'POST').then(bcResult => {
              if (bcResult.success) {
                farmerData.blockchainTxHash = bcResult.txHash;
                farmerData.ipfsCID          = bcResult.ipfsCID;
                showToast('⛓️ Identity stored on Ethereum!');
              }
            });
            completeRegistration();
            showScreen('screen-dashboard');
            showToast('✅ Welcome to QuantumGuard, ' + farmerData.name + '!');
          }, 1000);
        } else {
          btn.textContent = '🚀 Complete Registration';
          showToast('❌ ' + (result.error || 'Registration failed'));
          // Fall back to local registration if server not set up
          completeRegistration();
          showScreen('screen-dashboard');
          showToast('✅ Welcome (offline mode), ' + farmerData.name + '!');
        }
      });
      return;
    }
  }
  regStepUI(dir);
};


// ══════════════════════════════════════════
//  OVERRIDE: handleRequiredDocUpload  →  real Pinata upload
// ══════════════════════════════════════════
window.handleRequiredDocUpload = async function(event, slotKey) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('⚠️ File too large — max 10MB'); return; }

  const slot = farmerData.requiredDocs?.[slotKey];
  showToast('📤 Uploading "' + file.name + '" to IPFS...');

  const formData = new FormData();
  formData.append('file',    file);
  formData.append('slotKey', slotKey);

  const result = await apiUpload('/documents/upload', formData);

  if (result.success) {
    addDocumentToListDynamic(result.docEntry, slotKey);
    showToast('✅ ' + (slot?.label || slotKey) + ' pinned to IPFS! CID: ' + result.ipfsCID.slice(0,12) + '...');
  } else {
    showToast('❌ Upload failed: ' + (result.error || 'Unknown error'));
    // Fall back to local simulation
    showToast('📎 Saving locally (offline mode)...');
    setTimeout(() => {
      addDocumentToListDynamic(file, slotKey);
      showToast('✅ ' + (slot?.label || slotKey) + ' saved locally!');
    }, 1500);
  }
};


// ══════════════════════════════════════════
//  OVERRIDE: deleteRequiredDoc  →  real API delete
// ══════════════════════════════════════════
window.deleteRequiredDoc = async function(slotKey) {
  const label = farmerData.requiredDocs?.[slotKey]?.label || slotKey;

  const result = await apiCall('/documents/' + slotKey, 'DELETE');

  // Always update locally regardless of API result
  if (farmerData.requiredDocs?.[slotKey]) {
    farmerData.requiredDocs[slotKey].file = null;
  }
  farmerData.documents = (farmerData.documents || []).filter(d => d.slotKey !== slotKey);
  const allUploaded = Object.values(farmerData.requiredDocs || {}).every(d => d.file !== null);
  farmerData.validationStatus.documents = allUploaded;

  try { localStorage.setItem('qg_farmer', JSON.stringify(farmerData)); } catch(e){}
  renderDocumentsPage();
  updateValidationStatusPage();
  showToast('🗑️ ' + label + ' removed');
};


// ══════════════════════════════════════════
//  OVERRIDE: submitContact  →  real API
// ══════════════════════════════════════════
window.submitContact = async function() {
  const name    = document.getElementById('contact-name')?.value.trim();
  const phone   = document.getElementById('contact-phone')?.value.trim();
  const subject = document.getElementById('contact-subject')?.value;
  const message = document.getElementById('contact-msg')?.value.trim();

  if (!name || !phone || !message) { showToast('⚠️ Please fill in all required fields'); return; }
  if (phone.length < 10)           { showToast('⚠️ Enter a valid 10-digit phone number'); return; }

  const btn = document.querySelector('[onclick*="submitContact"]');
  if (btn) { btn.textContent = '⏳ Sending...'; btn.disabled = true; }

  const result = await apiCall('/contact', 'POST', { name, phone, subject, message });

  if (btn) { btn.textContent = '📨 Send Message'; btn.disabled = false; }

  if (result.success) {
    document.getElementById('contact-name').value  = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-msg').value   = '';
    showToast('✅ Message sent! We\'ll respond within 24 hours.');
  } else {
    showToast('❌ ' + (result.error || 'Message failed to send'));
  }
};


// ══════════════════════════════════════════
//  AUTO-RESTORE: Load farmer from API on page load
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  if (authToken) {
    const result = await apiCall('/auth/me');
    if (result.success) {
      Object.assign(farmerData, result.farmer);
      spreadFarmerData();
      updateBlockchainPage();
    } else {
      // Token expired — clear it
      localStorage.removeItem('qg_token');
      authToken = null;
    }
  }
});
