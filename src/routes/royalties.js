const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const auth = require('../middleware/auth');
const CopyrightManager = require('../contracts/CopyrightManager.json');

// Distribuer les royalties pour une œuvre
router.post('/distribute/:tokenId', auth, async (req, res) => {
    try {
        const { tokenId } = req.params;
        const { amount } = req.body;

        const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(
            process.env.COPYRIGHT_CONTRACT_ADDRESS,
            CopyrightManager.abi,
            wallet
        );

        const tx = await contract.distributeRoyalties(tokenId, {
            value: ethers.utils.parseEther(amount.toString())
        });
        const receipt = await tx.wait();

        const events = receipt.events.filter(event => event.event === 'RoyaltyDistributed');
        const distributions = events.map(event => ({
            recipient: event.args.recipient,
            amount: ethers.utils.formatEther(event.args.amount)
        }));

        res.json({
            status: 'success',
            data: {
                tokenId,
                distributions,
                transactionHash: receipt.transactionHash
            }
        });
    } catch (error) {
        console.error('Erreur lors de la distribution des royalties:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la distribution des royalties'
        });
    }
});

// Obtenir les parts de royalties pour une œuvre
router.get('/:tokenId', auth, async (req, res) => {
    try {
        const { tokenId } = req.params;

        const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
        const contract = new ethers.Contract(
            process.env.COPYRIGHT_CONTRACT_ADDRESS,
            CopyrightManager.abi,
            provider
        );

        const workDetails = await contract.getWorkDetails(tokenId);
        
        // Récupérer les parts de royalties pour chaque destinataire
        const royaltyShares = {};
        for (const recipient of workDetails.royaltyRecipients) {
            const share = await contract.getRoyaltyShare(tokenId, recipient);
            royaltyShares[recipient] = share.toString();
        }

        res.json({
            status: 'success',
            data: {
                tokenId,
                royaltyShares
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des parts de royalties:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des parts de royalties'
        });
    }
});

module.exports = router;
