// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title QuantumGuard Farmer Identity Registry
/// @notice Stores SHA-256 farmer identity hashes on Ethereum Sepolia
contract FarmerIdentity {

    struct Farmer {
        string  farmerIdHash;   // SHA-256 hash of farmer identity
        string  ipfsCID;        // IPFS CID of farmer metadata
        uint256 timestamp;      // Block timestamp of registration
        bool    isVerified;     // Always true once registered
    }

    // wallet address => Farmer record
    mapping(address => Farmer) public farmers;

    // SHA-256 hash => wallet address (for lookup by hash)
    mapping(string => address) public hashToAddress;

    event FarmerRegistered(
        address indexed wallet,
        string          farmerIdHash,
        string          ipfsCID,
        uint256         timestamp
    );

    /// @notice Register a farmer's identity on chain
    function registerFarmer(
        string memory _farmerIdHash,
        string memory _ipfsCID
    ) public {
        // Prevent duplicate registration from same wallet
        require(bytes(farmers[msg.sender].farmerIdHash).length == 0, "Wallet already registered");

        farmers[msg.sender] = Farmer({
            farmerIdHash: _farmerIdHash,
            ipfsCID:      _ipfsCID,
            timestamp:    block.timestamp,
            isVerified:   true
        });

        hashToAddress[_farmerIdHash] = msg.sender;

        emit FarmerRegistered(msg.sender, _farmerIdHash, _ipfsCID, block.timestamp);
    }

    /// @notice Get farmer record by wallet address
    function getFarmer(address _wallet)
        public view
        returns (Farmer memory)
    {
        return farmers[_wallet];
    }

    /// @notice Check if a farmer hash exists on chain
    function verifyHash(string memory _farmerIdHash)
        public view
        returns (bool)
    {
        return hashToAddress[_farmerIdHash] != address(0);
    }

    /// @notice Get wallet address by farmer hash
    function getAddressByHash(string memory _farmerIdHash)
        public view
        returns (address)
    {
        return hashToAddress[_farmerIdHash];
    }
}
