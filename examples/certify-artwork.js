const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'  // ou 'polygon_testnet' pour les tests
});

async function certifyArtwork() {
  try {
    // 1. Lire le fichier de l'œuvre
    const artworkPath = path.join(__dirname, 'artwork.jpg');
    const fileBuffer = fs.readFileSync(artworkPath);

    // 2. Métadonnées de l'œuvre
    const metadata = {
      title: "La Joconde 2.0",
      author: "Leonardo Da Vinci Jr",
      description: "Version numérique de La Joconde",
      creationDate: new Date().toISOString(),
      type: "digital-art",
      medium: "digital-painting",
      rights: "all-rights-reserved",
      tags: ["art", "digital", "painting"],
      additionalInfo: {
        software: "Photoshop",
        resolution: "4K",
        format: "JPG"
      }
    };

    // 3. Certifier l'œuvre
    console.log('Certification en cours...');
    const certificate = await client.certify({
      content: fileBuffer,
      ...metadata
    });

    console.log('✅ Certification réussie !');
    console.log('ID du Certificat:', certificate.id);
    console.log('Transaction Hash:', certificate.transactionHash);
    console.log('Smart Contract:', certificate.contractAddress);
    console.log('Timestamp:', certificate.timestamp);
    console.log('Preuve de propriété:', certificate.proofUrl);

    // 4. Vérifier le certificat
    console.log('\nVérification du certificat...');
    const verification = await client.verify(certificate.id);
    
    console.log('Status:', verification.isValid ? '✅ Valide' : '❌ Invalid');
    console.log('Propriétaire:', verification.owner);
    console.log('Date de création:', verification.createdAt);
    console.log('Blockchain:', verification.network);

    // 5. Obtenir l'historique
    console.log('\nHistorique des transferts:');
    const history = await client.getHistory(certificate.id);
    history.forEach(event => {
      console.log(`- ${event.date}: ${event.action} par ${event.address}`);
    });

    // 6. Générer le certificat PDF
    console.log('\nGénération du certificat PDF...');
    await client.generateCertificatePDF(certificate.id, {
      output: path.join(__dirname, 'certificate.pdf'),
      template: 'premium',
      includeThumbnail: true
    });

    console.log('✨ Processus terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la certification
certifyArtwork();
