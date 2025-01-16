const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const auth = require('../middleware/auth');
const CopyrightManager = require('../contracts/CopyrightManager.json');

// Enregistrer une nouvelle œuvre
router.post('/', auth, async (req, res) => {
    try {
        const { title, contentHash, royaltyRecipients, shares } = req.body;

        const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(
            process.env.COPYRIGHT_CONTRACT_ADDRESS,
            CopyrightManager.abi,
            wallet
        );

        const tx = await contract.registerWork(title, contentHash, royaltyRecipients, shares);
        const receipt = await tx.wait();

        const event = receipt.events.find(event => event.event === 'WorkRegistered');
        const tokenId = event.args.tokenId;

        res.status(201).json({
            status: 'success',
            data: {
                tokenId: tokenId.toString(),
                title,
                contentHash,
                transactionHash: receipt.transactionHash
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'œuvre:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de l\'enregistrement de l\'œuvre'
        });
    }
});

// Récupérer les détails d'une œuvre
router.get('/:tokenId', async (req, res) => {
    try {
        const { tokenId } = req.params;

        const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
        const contract = new ethers.Contract(
            process.env.COPYRIGHT_CONTRACT_ADDRESS,
            CopyrightManager.abi,
            provider
        );

        const workDetails = await contract.getWorkDetails(tokenId);

        res.json({
            status: 'success',
            data: {
                title: workDetails.title,
                contentHash: workDetails.contentHash,
                creator: workDetails.creator,
                creationDate: new Date(workDetails.creationDate.toNumber() * 1000)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'œuvre:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des détails de l\'œuvre'
        });
    }
});

module.exports = router;
