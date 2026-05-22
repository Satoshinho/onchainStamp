// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Stamp
 * @notice Certify any document or data by storing its hash on-chain.
 *         Proves a document existed at a specific time — forever.
 */
contract Stamp {
    event DocumentStamped(address indexed certifier, bytes32 indexed docHash, string description, uint256 timestamp);

    struct StampEntry {
        bytes32 docHash;
        string description;
        address certifier;
        uint256 timestamp;
    }

    StampEntry[] public stamps;
    mapping(bytes32 => uint256) public hashToStampId;  // hash → stamp index+1 (0 = not stamped)
    mapping(address => uint256[]) public myStamps;
    uint256 public totalStamps;

    function stampDocument(bytes32 docHash, string calldata description) external {
        require(hashToStampId[docHash] == 0, "Already stamped");
        require(docHash != bytes32(0), "Invalid hash");

        uint256 id = stamps.length;
        stamps.push(StampEntry({
            docHash: docHash,
            description: description,
            certifier: msg.sender,
            timestamp: block.timestamp
        }));

        hashToStampId[docHash] = id + 1;
        myStamps[msg.sender].push(id);
        totalStamps++;
        emit DocumentStamped(msg.sender, docHash, description, block.timestamp);
    }

    function verifyDocument(bytes32 docHash) external view returns (bool exists, StampEntry memory stamp) {
        uint256 idx = hashToStampId[docHash];
        if (idx == 0) return (false, StampEntry(bytes32(0), "", address(0), 0));
        return (true, stamps[idx - 1]);
    }

    function getRecentStamps(uint256 count) external view returns (StampEntry[] memory) {
        uint256 len = stamps.length;
        uint256 start = len > count ? len - count : 0;
        StampEntry[] memory result = new StampEntry[](len - start);
        for (uint256 i = 0; i < result.length; i++) result[i] = stamps[start + i];
        return result;
    }
}
