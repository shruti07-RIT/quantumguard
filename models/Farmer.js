// ══════════════════════════════════════════
//  QuantumGuard — Farmer Model
//  Matches every field in the dashboard
// ══════════════════════════════════════════
const mongoose = require('mongoose');

const RequiredDocSchema = new mongoose.Schema({
  name:    String,
  sizeKB:  Number,
  cid:     String,   // IPFS CID from Pinata
  date:    String,
  status:  { type: String, default: 'Pending' },
  isImg:   Boolean,
  ext:     String,
  slotKey: String,
}, { _id: false });

const FarmerSchema = new mongoose.Schema({

  // ── PERSONAL ──
  name:    { type: String, required: true, trim: true },
  dob:     { type: String },
  phone:   { type: String, required: true, unique: true, trim: true },
  pinHash: { type: String, required: true },           // bcrypt hashed 4-digit PIN

  // Sensitive fields — AES-256 encrypted before storing
  aadhaarEncrypted:      { type: String },
  bankAccountEncrypted:  { type: String },

  // ── ADDRESS ──
  address:  String,
  village:  String,
  taluka:   String,
  district: String,
  state:    { type: String, default: 'Maharashtra' },
  pincode:  String,

  // ── LAND ──
  landArea:      String,
  surveyNo:      String,
  cropType:      String,
  irrigationType:String,
  soilType:      String,
  ownership:     String,

  // ── FINANCIAL ──
  monthlyIncome: String,
  annualIncome:  String,
  ifsc:          String,
  loanHistory:   { type: String, default: 'No previous loans' },

  // ── IDENTITY ──
  farmerId:         String,   // e.g. QG-2024-84712
  farmerIdHash:     String,   // SHA-256 identity hash
  registered:       { type: Boolean, default: false },
  registeredAt:     String,

  // ── BLOCKCHAIN ──
  blockchainTxHash: String,   // Ethereum tx hash
  ipfsCID:          String,   // Primary metadata CID
  isVerified:       { type: Boolean, default: false },

  // ── DOCUMENTS (6 required slots) ──
  documents: { type: Array, default: [] },
  requiredDocs: {
    aadhaar:   { label: String, cid: String, file: RequiredDocSchema },
    land:      { label: String, cid: String, file: RequiredDocSchema },
    bank:      { label: String, cid: String, file: RequiredDocSchema },
    photo:     { label: String, cid: String, file: RequiredDocSchema },
    income:    { label: String, cid: String, file: RequiredDocSchema },
    landphoto: { label: String, cid: String, file: RequiredDocSchema },
  },

  // ── VALIDATION STATUS ──
  validationStatus: {
    personal:   { type: Boolean, default: false },
    address:    { type: Boolean, default: false },
    land:       { type: Boolean, default: false },
    financial:  { type: Boolean, default: false },
    documents:  { type: Boolean, default: false },
    blockchain: { type: Boolean, default: false },
    identity:   { type: Boolean, default: false },
  },

}, { timestamps: true });

module.exports = mongoose.model('Farmer', FarmerSchema);
