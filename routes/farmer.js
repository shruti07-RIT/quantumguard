// ══════════════════════════════════════════
//  QuantumGuard — Farmer Profile Routes
//  Handles: Get profile, Update profile (editProfile modal)
// ══════════════════════════════════════════
const express        = require('express');
const router         = express.Router();
const CryptoJS       = require('crypto-js');
const Farmer         = require('../models/Farmer');
const authMiddleware = require('../middleware/auth');

function encryptAES(text) {
  return CryptoJS.AES.encrypt(text, process.env.AES_SECRET).toString();
}
function decryptAES(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, process.env.AES_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) { return ''; }
}

// ════════════════════════════
//  GET /api/farmer/profile
//  Returns farmer profile (masked sensitive fields)
// ════════════════════════════
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    res.json({
      success: true,
      farmer: {
        name:             farmer.name,
        dob:              farmer.dob,
        phone:            farmer.phone,
        aadhaar:          farmer.aadhaarEncrypted
                            ? 'XXXX XXXX ' + decryptAES(farmer.aadhaarEncrypted).replace(/\D/g,'').slice(-4)
                            : '',
        address:          farmer.address,
        village:          farmer.village,
        taluka:           farmer.taluka,
        district:         farmer.district,
        state:            farmer.state,
        pincode:          farmer.pincode,
        landArea:         farmer.landArea,
        surveyNo:         farmer.surveyNo,
        cropType:         farmer.cropType,
        irrigationType:   farmer.irrigationType,
        soilType:         farmer.soilType,
        ownership:        farmer.ownership,
        monthlyIncome:    farmer.monthlyIncome,
        annualIncome:     farmer.annualIncome,
        bankAccount:      farmer.bankAccountEncrypted
                            ? '****' + decryptAES(farmer.bankAccountEncrypted).slice(-4)
                            : '',
        ifsc:             farmer.ifsc,
        loanHistory:      farmer.loanHistory,
        farmerId:         farmer.farmerId,
        farmerIdHash:     farmer.farmerIdHash,
        registered:       farmer.registered,
        registeredAt:     farmer.registeredAt,
        blockchainTxHash: farmer.blockchainTxHash,
        ipfsCID:          farmer.ipfsCID,
        isVerified:       farmer.isVerified,
        validationStatus: farmer.validationStatus,
        documents:        farmer.documents,
        requiredDocs:     farmer.requiredDocs,
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ════════════════════════════
//  PUT /api/farmer/profile
//  Called when farmer saves edits from editProfile() modal
// ════════════════════════════
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    const {
      name, dob, phone, aadhaar,
      address, village, taluka, district, state, pincode,
      landArea, surveyNo, cropType, irrigationType, soilType, ownership,
      monthlyIncome, annualIncome, bankAccount, ifsc, loanHistory,
    } = req.body;

    // ── Update plain fields ──
    if (name)          farmer.name           = name;
    if (dob)           farmer.dob            = dob;
    if (address)       farmer.address        = address;
    if (village)       farmer.village        = village;
    if (taluka)        farmer.taluka         = taluka;
    if (district)      farmer.district       = district;
    if (state)         farmer.state          = state;
    if (pincode)       farmer.pincode        = pincode;
    if (landArea)      farmer.landArea       = landArea;
    if (surveyNo)      farmer.surveyNo       = surveyNo;
    if (cropType)      farmer.cropType       = cropType;
    if (irrigationType)farmer.irrigationType = irrigationType;
    if (soilType)      farmer.soilType       = soilType;
    if (ownership)     farmer.ownership      = ownership;
    if (monthlyIncome) farmer.monthlyIncome  = monthlyIncome;
    if (annualIncome)  farmer.annualIncome   = annualIncome;
    if (ifsc)          farmer.ifsc           = ifsc;
    if (loanHistory)   farmer.loanHistory    = loanHistory;

    // ── Re-encrypt if sensitive fields changed ──
    if (aadhaar && !aadhaar.startsWith('XXXX')) {
      farmer.aadhaarEncrypted = encryptAES(aadhaar);
    }
    if (bankAccount && !bankAccount.startsWith('****')) {
      farmer.bankAccountEncrypted = encryptAES(bankAccount);
    }

    // ── Update validation status ──
    farmer.validationStatus.personal  = !!(farmer.name && farmer.phone);
    farmer.validationStatus.address   = !!(farmer.village && farmer.district);
    farmer.validationStatus.land      = !!farmer.landArea;
    farmer.validationStatus.financial = !!farmer.monthlyIncome;

    await farmer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});


// ════════════════════════════
//  GET /api/farmer/loan-eligibility
//  Called when visiting Loan Eligibility page
// ════════════════════════════
router.get('/loan-eligibility', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    const land    = parseFloat(farmer.landArea || 0);
    const income  = parseFloat(farmer.monthlyIncome || 0);
    const hasBank = !!farmer.bankAccountEncrypted;
    const hasId   = farmer.registered;
    const noDef   = (farmer.loanHistory || '').toLowerCase().includes('repaid') ||
                    (farmer.loanHistory || '').toLowerCase().includes('no previous');
    const docsOk  = farmer.validationStatus?.documents || false;

    const eligible = land >= 1 && income < 25000 && hasBank && hasId;
    const score    = [land >= 1, income < 25000, hasBank, hasId, noDef, docsOk].filter(Boolean).length;

    const suggestedAmount = land >= 3 ? 150000 : land >= 2 ? 100000 : 75000;

    res.json({
      success: true,
      eligible,
      score,
      maxScore: 6,
      suggestedAmount: `₹${suggestedAmount.toLocaleString('en-IN')}`,
      criteria: {
        landAbove1Acre:    { pass: land >= 1,         value: `${land} acres` },
        incomeBelow25k:    { pass: income < 25000,    value: `₹${income.toLocaleString('en-IN')}/mo` },
        bankAccountLinked: { pass: hasBank,            value: hasBank ? 'Linked' : 'Not linked' },
        identityVerified:  { pass: hasId,              value: hasId ? 'Verified' : 'Not verified' },
        noLoanDefault:     { pass: noDef,              value: noDef ? 'None' : 'Has defaults' },
        documentsUploaded: { pass: docsOk,             value: docsOk ? 'All uploaded' : 'Incomplete' },
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
