// ══════════════════════════════════════════
//  QuantumGuard — Blockchain Routes
//  Handles: Write farmer hash to Ethereum Sepolia
//           Get blockchain details for dashboard
// ══════════════════════════════════════════
const express        = require('express');
const router         = express.Router();
const { ethers }     = require('ethers');
const axios          = require('axios');
const Farmer         = require('../models/Farmer');
const authMiddleware = require('../middleware/auth');

// ── Contract ABI (only the functions we use) ──
const CONTRACT_ABI = [
  "function registerFarmer(string memory farmerIdHash, string memory ipfsCID) public",
  "function getFarmer(address wallet) public view returns (tuple(string farmerIdHash, string ipfsCID, uint256 timestamp, bool isVerified))",
  "function verifyHash(string memory farmerIdHash) public view returns (bool)",
  "event FarmerRegistered(address indexed wallet, string farmerIdHash, string ipfsCID)"
];

// ── Get ethers provider and wallet ──
function getWallet() {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return wallet;
}

// ── Get contract instance ──
function getContract(wallet) {
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}


// ════════════════════════════
//  POST /api/blockchain/register
//  Writes farmer's SHA-256 hash + IPFS CID to Ethereum Sepolia
//  Called after farmer completes registration
// ════════════════════════════
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    if (!farmer.farmerIdHash) {
      return res.status(400).json({ error: 'Farmer identity hash not generated yet' });
    }

    // ── Pin farmer metadata to IPFS first ──
    let ipfsCID = farmer.ipfsCID;
    if (!ipfsCID) {
      const metadata = {
        farmerId:      farmer.farmerId,
        farmerIdHash:  farmer.farmerIdHash,
        name:          farmer.name,
        village:       farmer.village,
        district:      farmer.district,
        state:         farmer.state,
        landArea:      farmer.landArea,
        cropType:      farmer.cropType,
        registeredAt:  farmer.registeredAt,
        network:       'Ethereum Sepolia Testnet',
        platform:      'QuantumGuard',
      };

      const pinRes = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent:  metadata,
          pinataMetadata: { name: `QuantumGuard-${farmer.farmerId}-metadata` },
        },
        {
          headers: {
            'Content-Type':        'application/json',
            pinata_api_key:        process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
          }
        }
      );
      ipfsCID = pinRes.data.IpfsHash;
    }

    // ── Write to smart contract on Ethereum Sepolia ──
    const wallet   = getWallet();
    const contract = getContract(wallet);

    const tx = await contract.registerFarmer(farmer.farmerIdHash, ipfsCID);
    await tx.wait(); // wait for 1 confirmation

    // ── Save transaction hash and CID ──
    farmer.blockchainTxHash            = tx.hash;
    farmer.ipfsCID                     = ipfsCID;
    farmer.isVerified                  = true;
    farmer.validationStatus.blockchain = true;
    await farmer.save();

    res.json({
      success:          true,
      message:          'Farmer identity written to Ethereum Sepolia!',
      txHash:           tx.hash,
      ipfsCID,
      etherscanURL:     `https://sepolia.etherscan.io/tx/${tx.hash}`,
      ipfsURL:          `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
      farmerIdHash:     farmer.farmerIdHash,
    });

  } catch (err) {
    console.error('Blockchain register error:', err.message);
    res.status(500).json({ error: 'Failed to write to blockchain: ' + err.message });
  }
});


// ════════════════════════════
//  GET /api/blockchain/details
//  Returns blockchain info for the Blockchain Details page
//  Matches: updateBlockchainPage() in app.js
// ════════════════════════════
router.get('/details', authMiddleware, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer.id);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    res.json({
      success:          true,
      farmerName:       farmer.name,
      farmerId:         farmer.farmerId,
      farmerIdHash:     farmer.farmerIdHash || '—',
      ipfsCID:          farmer.ipfsCID      || '—',
      blockchainTxHash: farmer.blockchainTxHash || '—',
      isVerified:       farmer.isVerified,
      registeredAt:     farmer.registeredAt,
      network:          'Ethereum Sepolia Testnet',
      contractAddress:  process.env.CONTRACT_ADDRESS || '—',
      etherscanURL:     farmer.blockchainTxHash
                          ? `https://sepolia.etherscan.io/tx/${farmer.blockchainTxHash}`
                          : null,
      ipfsURL:          farmer.ipfsCID
                          ? `https://gateway.pinata.cloud/ipfs/${farmer.ipfsCID}`
                          : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ════════════════════════════
//  GET /api/blockchain/verify/:hash
//  Checks if a farmer hash exists on chain — public endpoint
// ════════════════════════════
router.get('/verify/:hash', async (req, res) => {
  try {
    const wallet   = getWallet();
    const contract = getContract(wallet);
    const exists   = await contract.verifyHash(req.params.hash);
    res.json({ success: true, verified: exists, hash: req.params.hash });
  } catch (err) {
    res.status(500).json({ error: 'Blockchain verification failed: ' + err.message });
  }
});

module.exports = router;
