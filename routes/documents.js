// ══════════════════════════════════════════
//  QuantumGuard — Documents Routes
//  Handles: Upload to IPFS via Pinata, Delete document
//  Matches: handleRequiredDocUpload(), deleteRequiredDoc()
// ══════════════════════════════════════════
const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const axios          = require('axios');
const FormData       = require('form-data');
const Farmer         = require('../models/Farmer');
const authMiddleware = require('../middleware/auth');

// ── Store file in memory (not disk) before sending to Pinata ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP and PDF files are allowed'));
  }
});


// ════════════════════════════
//  POST /api/documents/upload
//  Uploads a file to IPFS via Pinata
//  Body: multipart/form-data  { file, slotKey }
//  slotKey: one of aadhaar | land | bank | photo | income | landphoto
// ════════════════════════════
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { slotKey } = req.body;
    const validSlots  = ['aadhaar','land','bank','photo','income','landphoto'];
    if (!slotKey || !validSlots.includes(slotKey)) {
      return res.status(400).json({ error: 'Invalid document slot. Must be one of: ' + validSlots.join(', ') });
    }

    // ── Pin file to IPFS via Pinata ──
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('pinataMetadata', JSON.stringify({
      name: `QuantumGuard-${req.farmer.farmerId || 'farmer'}-${slotKey}-${Date.now()}`,
    }));
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));

    const pinataRes = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key:        process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
        },
        maxBodyLength: Infinity,
      }
    );

    const ipfsCID = pinataRes.data.IpfsHash;

    // ── Build document entry (matches dashboard format) ──
    const ext    = req.file.originalname.split('.').pop().toUpperCase();
    const isImg  = ['JPG','PNG','JPEG','WEBP','GIF'].includes(ext);
    const today  = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const docEntry = {
      name:    req.file.originalname,
      sizeKB:  Math.round(req.file.size / 1024),
      cid:     ipfsCID,
      date:    today,
      status:  'Pending',
      isImg,
      ext,
      slotKey,
    };

    // ── Save to farmer record ──
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    // Update required doc slot
    if (!farmer.requiredDocs) farmer.requiredDocs = {};
    farmer.requiredDocs[slotKey] = {
      ...(farmer.requiredDocs[slotKey] || {}),
      label: getSlotLabel(slotKey),
      cid:   ipfsCID,
      file:  docEntry,
    };

    // Remove old entry for this slot from documents array
    farmer.documents = (farmer.documents || []).filter(d => d.slotKey !== slotKey);
    farmer.documents.push(docEntry);

    // Check if all 6 docs uploaded
    const uploadedSlots = ['aadhaar','land','bank','photo','income','landphoto']
      .filter(k => farmer.requiredDocs[k]?.file);
    farmer.validationStatus.documents = uploadedSlots.length === 6;

    await farmer.save();

    res.json({
      success:  true,
      message:  `${getSlotLabel(slotKey)} uploaded and pinned to IPFS!`,
      ipfsCID,
      ipfsURL:  `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
      docEntry,
    });

  } catch (err) {
    console.error('Document upload error:', err.response?.data || err.message);
    if (err.message.includes('Only JPG')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to upload document to IPFS' });
  }
});


// ════════════════════════════
//  DELETE /api/documents/:slotKey
//  Removes a document from farmer record
//  Matches: deleteRequiredDoc() in app.js
// ════════════════════════════
router.delete('/:slotKey', authMiddleware, async (req, res) => {
  try {
    const { slotKey } = req.params;
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    // Clear slot
    if (farmer.requiredDocs?.[slotKey]) {
      farmer.requiredDocs[slotKey].file = null;
      farmer.requiredDocs[slotKey].cid  = null;
    }

    // Remove from documents array
    farmer.documents = (farmer.documents || []).filter(d => d.slotKey !== slotKey);

    // Update validation status
    const uploadedSlots = ['aadhaar','land','bank','photo','income','landphoto']
      .filter(k => farmer.requiredDocs?.[k]?.file);
    farmer.validationStatus.documents = uploadedSlots.length === 6;

    await farmer.save();

    res.json({
      success: true,
      message: `${getSlotLabel(slotKey)} removed successfully`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ── Helper: slot key → human label ──
function getSlotLabel(key) {
  const labels = {
    aadhaar:   'Aadhaar Card',
    land:      'Land Document',
    bank:      'Bank Passbook',
    photo:     'Farmer Photo',
    income:    'Income Certificate',
    landphoto: 'Land Photo',
  };
  return labels[key] || key;
}

module.exports = router;
