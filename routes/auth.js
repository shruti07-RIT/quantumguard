// ══════════════════════════════════════════
//  QuantumGuard — Auth Routes
//  Handles: Register (4-step form) + Login (phone + PIN)
// ══════════════════════════════════════════
const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const CryptoJS  = require('crypto-js');
const Farmer    = require('../models/Farmer');

// ── HELPER: AES-256 Encrypt ──
function encryptAES(text) {
  return CryptoJS.AES.encrypt(text, process.env.AES_SECRET).toString();
}

// ── HELPER: AES-256 Decrypt ──
function decryptAES(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, process.env.AES_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '';
  }
}

// ── HELPER: Generate SHA-256 Farmer Identity Hash ──
function generateFarmerHash(phone, name, aadhaar, timestamp) {
  return crypto
    .createHash('sha256')
    .update(phone + name + aadhaar + timestamp)
    .digest('hex');
}

// ── HELPER: Generate Farmer ID ──
function generateFarmerId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `QG-${year}-${rand}`;
}

// ── HELPER: Sign JWT ──
function signToken(farmer) {
  return jwt.sign(
    { id: farmer._id, phone: farmer.phone, farmerId: farmer.farmerId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── HELPER: Safe farmer object (no sensitive fields) ──
function safeFarmer(f) {
  return {
    _id:              f._id,
    name:             f.name,
    dob:              f.dob,
    phone:            f.phone,
    // Show masked Aadhaar: XXXX XXXX 1234
    aadhaar:          f.aadhaarEncrypted
                        ? 'XXXX XXXX ' + decryptAES(f.aadhaarEncrypted).replace(/\D/g,'').slice(-4)
                        : '',
    address:          f.address,
    village:          f.village,
    taluka:           f.taluka,
    district:         f.district,
    state:            f.state,
    pincode:          f.pincode,
    landArea:         f.landArea,
    surveyNo:         f.surveyNo,
    cropType:         f.cropType,
    irrigationType:   f.irrigationType,
    soilType:         f.soilType,
    ownership:        f.ownership,
    monthlyIncome:    f.monthlyIncome,
    annualIncome:     f.annualIncome,
    bankAccount:      f.bankAccountEncrypted
                        ? '****' + decryptAES(f.bankAccountEncrypted).slice(-4)
                        : '',
    ifsc:             f.ifsc,
    loanHistory:      f.loanHistory,
    farmerId:         f.farmerId,
    farmerIdHash:     f.farmerIdHash,
    registered:       f.registered,
    registeredAt:     f.registeredAt,
    blockchainTxHash: f.blockchainTxHash,
    ipfsCID:          f.ipfsCID,
    isVerified:       f.isVerified,
    documents:        f.documents,
    requiredDocs:     f.requiredDocs,
    validationStatus: f.validationStatus,
  };
}


// ════════════════════════════
//  POST /api/auth/register
//  Called when farmer completes 4-step form
// ════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const {
      name, dob, phone, aadhaar, pin,
      address, village, taluka, district, state, pincode,
      landArea, surveyNo, cropType, irrigationType, soilType, ownership,
      monthlyIncome, annualIncome, bankAccount, ifsc, loanHistory,
    } = req.body;

    // ── Validate required fields ──
    if (!name || !phone || !aadhaar || !pin) {
      return res.status(400).json({ error: 'Name, phone, Aadhaar and PIN are required' });
    }
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number' });
    }
    if (pin.length !== 4) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    // ── Check if phone already registered ──
    const existing = await Farmer.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'This phone number is already registered' });
    }

    // ── Encrypt sensitive fields with AES-256 ──
    const aadhaarEncrypted     = encryptAES(aadhaar);
    const bankAccountEncrypted = bankAccount ? encryptAES(bankAccount) : '';

    // ── Hash the 4-digit PIN with bcrypt ──
    const pinHash = await bcrypt.hash(pin, 10);

    // ── Generate SHA-256 Farmer Identity Hash ──
    const timestamp    = Date.now().toString();
    const farmerIdHash = generateFarmerHash(phone, name, aadhaar, timestamp);

    // ── Generate Farmer ID ──
    const farmerId     = generateFarmerId();
    const registeredAt = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    // ── Create farmer document ──
    const farmer = new Farmer({
      name, dob, phone, pinHash,
      aadhaarEncrypted, bankAccountEncrypted,
      address, village, taluka,
      district, state: state || 'Maharashtra', pincode,
      landArea, surveyNo, cropType, irrigationType, soilType, ownership,
      monthlyIncome,
      annualIncome: annualIncome || (monthlyIncome ? String(Number(monthlyIncome) * 12) : ''),
      ifsc, loanHistory: loanHistory || 'No previous loans',
      farmerId, farmerIdHash,
      registered: true,
      registeredAt,
      validationStatus: {
        personal:   !!(name && phone && aadhaar),
        address:    !!(village && district),
        land:       !!landArea,
        financial:  !!(monthlyIncome && bankAccount),
        documents:  false,
        blockchain: false,
        identity:   true,
      },
    });

    await farmer.save();

    // ── Sign JWT token ──
    const token = signToken(farmer);

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully on QuantumGuard!',
      token,
      farmer:  safeFarmer(farmer),
    });

  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});


// ════════════════════════════
//  POST /api/auth/login
//  Called by doLogin() in app.js
// ════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Phone and PIN are required' });
    }

    // ── Find farmer by phone ──
    const farmer = await Farmer.findOne({ phone });
    if (!farmer) {
      return res.status(404).json({ error: 'No account found with this phone number' });
    }

    // ── Verify PIN ──
    const pinMatch = await bcrypt.compare(pin, farmer.pinHash);
    if (!pinMatch) {
      return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
    }

    // ── Sign JWT token ──
    const token = signToken(farmer);

    res.json({
      success: true,
      message: `Welcome back, ${farmer.name}!`,
      token,
      farmer:  safeFarmer(farmer),
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});


// ════════════════════════════
//  GET /api/auth/me
//  Returns current logged-in farmer's data
// ════════════════════════════
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ success: true, farmer: safeFarmer(farmer) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
