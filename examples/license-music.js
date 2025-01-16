const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function licenseMusicExample() {
  try {
    const certificateId = 'cert_123abc'; // ID du certificat de la musique

    // 1. Obtenir les informations de licence disponibles
    console.log('📜 Vérification des licences disponibles...');
    const licenses = await client.getAvailableLicenses(certificateId);
    console.log('Licences disponibles:');
    console.log(licenses);

    // 2. Acheter une licence de streaming
    console.log('\n💳 Achat d\'une licence de streaming...');
    const streamingLicense = await client.purchaseLicense(certificateId, {
      type: 'streaming',
      duration: 'per_play',
      payment: {
        amount: '0.001',
        currency: 'MATIC'
      }
    });

    console.log('Licence de streaming acquise !');
    console.log('ID de licence:', streamingLicense.id);
    console.log('Transaction:', streamingLicense.transactionHash);

    // 3. Acheter une licence commerciale
    console.log('\n💼 Achat d\'une licence commerciale...');
    const commercialLicense = await client.purchaseLicense(certificateId, {
      type: 'commercial',
      duration: '1_year',
      usage: {
        territory: 'France',
        platform: 'Radio',
        plays: 'unlimited'
      },
      payment: {
        amount: '1',
        currency: 'MATIC'
      }
    });

    console.log('Licence commerciale acquise !');
    console.log('ID de licence:', commercialLicense.id);
    console.log('Transaction:', commercialLicense.transactionHash);

    // 4. Vérifier les droits d'utilisation
    console.log('\n✅ Vérification des droits...');
    const rights = await client.verifyUsageRights(certificateId);
    console.log('Droits actuels:');
    console.log('- Streaming:', rights.canStream ? 'Oui' : 'Non');
    console.log('- Download:', rights.canDownload ? 'Oui' : 'Non');
    console.log('- Usage Commercial:', rights.commercialUse ? 'Oui' : 'Non');

    // 5. Générer un rapport de licence
    console.log('\n📊 Génération du rapport de licence...');
    const report = await client.generateLicenseReport(certificateId);
    console.log('Rapport de licence généré:', report.url);

    // 6. Configurer le tracking d'utilisation
    console.log('\n📈 Configuration du tracking...');
    await client.setupUsageTracking(certificateId, {
      platforms: ['spotify', 'youtube', 'radio'],
      reportingFrequency: 'daily',
      minimumThreshold: '0.0001 MATIC'
    });

    // 7. Exemple de paiement de royalties
    console.log('\n💰 Simulation de paiement de royalties...');
    const payment = await client.processRoyaltyPayment(certificateId, {
      plays: 1000,
      platform: 'spotify',
      period: 'monthly'
    });

    console.log('Paiement de royalties effectué !');
    console.log('Total distribué:', payment.total, 'MATIC');
    console.log('Distribution:');
    payment.distribution.forEach(d => {
      console.log(`- ${d.recipient}: ${d.amount} MATIC`);
    });

    console.log('\n✨ Processus terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter l'exemple
licenseMusicExample();
