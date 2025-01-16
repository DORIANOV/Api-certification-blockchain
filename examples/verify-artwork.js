const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function verifyArtwork(certificateId) {
  try {
    // 1. Vérifier le certificat
    console.log('Vérification du certificat...');
    const verification = await client.verify(certificateId);

    if (verification.isValid) {
      console.log('✅ Certificat valide !');
      console.log('Détails:');
      console.log('- Propriétaire:', verification.owner);
      console.log('- Date de création:', verification.createdAt);
      console.log('- Hash:', verification.contentHash);
      console.log('- Smart Contract:', verification.contractAddress);
    } else {
      console.log('❌ Certificat invalide ou non trouvé');
      return;
    }

    // 2. Vérifier si une œuvre est une copie
    console.log('\nVérification des copies potentielles...');
    const artworkPath = path.join(__dirname, 'artwork-to-check.jpg');
    const fileBuffer = fs.readFileSync(artworkPath);

    const similarityCheck = await client.checkSimilarity(fileBuffer);
    
    if (similarityCheck.matches.length > 0) {
      console.log('⚠️ Copies potentielles trouvées:');
      similarityCheck.matches.forEach(match => {
        console.log(`- Certificat ${match.certificateId}: ${match.similarity}% similaire`);
        console.log(`  Créé le: ${match.createdAt}`);
        console.log(`  Par: ${match.owner}`);
      });
    } else {
      console.log('✅ Aucune copie trouvée');
    }

    // 3. Obtenir les droits d'utilisation
    console.log('\nDroits d\'utilisation:');
    const rights = await client.getRights(certificateId);
    console.log('- Type:', rights.type);
    console.log('- Permissions:', rights.permissions.join(', '));
    console.log('- Restrictions:', rights.restrictions.join(', '));
    
    // 4. Vérifier la licence
    if (rights.license) {
      console.log('\nLicence:');
      console.log('- Type:', rights.license.type);
      console.log('- Durée:', rights.license.duration);
      console.log('- Territoire:', rights.license.territory);
      console.log('- Usage commercial:', rights.license.commercialUse ? 'Oui' : 'Non');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exemple d'utilisation
verifyArtwork('cert_123abc');
