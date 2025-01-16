// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CopyrightManager is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Work {
        string title;
        string contentHash;
        address creator;
        uint256 creationDate;
        mapping(address => uint256) royaltyShares; // Pourcentage des royalties (base 10000)
    }

    mapping(uint256 => Work) private _works;
    mapping(string => bool) private _contentHashExists;

    event WorkRegistered(uint256 indexed tokenId, string title, address creator);
    event RoyaltyDistributed(uint256 indexed tokenId, address recipient, uint256 amount);

    constructor() ERC721("Copyright NFT", "CPRT") {}

    function registerWork(
        string memory title,
        string memory contentHash,
        address[] memory royaltyRecipients,
        uint256[] memory shares
    ) public returns (uint256) {
        require(!_contentHashExists[contentHash], "Work already registered");
        require(royaltyRecipients.length == shares.length, "Recipients and shares mismatch");
        
        uint256 totalShares = 0;
        for(uint i = 0; i < shares.length; i++) {
            totalShares += shares[i];
        }
        require(totalShares == 10000, "Total shares must be 100%");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        Work storage newWork = _works[newTokenId];
        newWork.title = title;
        newWork.contentHash = contentHash;
        newWork.creator = msg.sender;
        newWork.creationDate = block.timestamp;

        for(uint i = 0; i < royaltyRecipients.length; i++) {
            newWork.royaltyShares[royaltyRecipients[i]] = shares[i];
        }

        _safeMint(msg.sender, newTokenId);
        _contentHashExists[contentHash] = true;

        emit WorkRegistered(newTokenId, title, msg.sender);
        return newTokenId;
    }

    function distributeRoyalties(uint256 tokenId) public payable {
        require(_exists(tokenId), "Work does not exist");
        Work storage work = _works[tokenId];
        
        uint256 amount = msg.value;
        require(amount > 0, "No payment provided");

        for(uint i = 0; i < 100; i++) { // Limite arbitraire pour éviter les boucles infinies
            address recipient = address(uint160(uint256(keccak256(abi.encodePacked(tokenId, i)))));
            uint256 share = work.royaltyShares[recipient];
            if(share == 0) break;
            
            uint256 payment = (amount * share) / 10000;
            payable(recipient).transfer(payment);
            emit RoyaltyDistributed(tokenId, recipient, payment);
        }
    }

    function getWorkDetails(uint256 tokenId) public view returns (
        string memory title,
        string memory contentHash,
        address creator,
        uint256 creationDate
    ) {
        require(_exists(tokenId), "Work does not exist");
        Work storage work = _works[tokenId];
        return (work.title, work.contentHash, work.creator, work.creationDate);
    }

    function getRoyaltyShare(uint256 tokenId, address recipient) public view returns (uint256) {
        require(_exists(tokenId), "Work does not exist");
        return _works[tokenId].royaltyShares[recipient];
    }
}
