const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function certifyBook() {
  try {
    // 1. Lire le fichier du livre (epub, pdf, etc.)
    const bookPath = path.join(__dirname, 'mybook.epub');
    const fileBuffer = fs.readFileSync(bookPath);

    // 2. Métadonnées du livre
    const metadata = {
      // Informations de base
      title: "Le Guide de la Blockchain",
      subtitle: "Une révolution numérique",
      author: "Satoshi Nakamoto Jr.",
      isbn: "978-3-16-148410-0",
      language: "fr",
      
      // Informations de publication
      publication: {
        publisher: "Éditions Crypto",
        date: "2024-01-10",
        edition: "1ère édition",
        format: "ebook"
      },

      // Droits d'auteur
      copyright: {
        holder: "Satoshi Nakamoto Jr.",
        year: 2024,
        territory: "Worldwide",
        reserved_rights: [
          "translation",
          "adaptation",
          "film_rights",
          "audio_rights"
        ]
      },

      // Distribution des revenus
      royalties: {
        "0x1234...": 70,  // Auteur
        "0x5678...": 20,  // Éditeur
        "0x9abc...": 10   // Agent
      },

      // Droits de traduction par territoire
      translation_rights: {
        "en": {
          available: true,
          price: "5 MATIC",
          territory: ["US", "UK", "AU"]
        },
        "es": {
          available: true,
          price: "3 MATIC",
          territory: ["ES", "MX", "AR"]
        },
        "zh": {
          available: true,
          price: "4 MATIC",
          territory: ["CN", "HK", "TW"]
        }
      },

      // Informations sur le contenu
      content: {
        pages: 250,
        chapters: 12,
        words: 75000,
        categories: ["Technology", "Blockchain", "Finance"],
        keywords: ["crypto", "blockchain", "bitcoin", "ethereum"]
      }
    };

    // 3. Certifier le livre
    console.log('📚 Certification du livre en cours...');
    const certificate = await client.certifyBook({
      content: fileBuffer,
      ...metadata
    });

    console.log('\n✅ Certification réussie !');
    console.log('ID du Certificat:', certificate.id);
    console.log('Transaction Hash:', certificate.transactionHash);
    console.log('Smart Contract:', certificate.contractAddress);

    // 4. Configurer les droits de traduction
    console.log('\n🌍 Configuration des droits de traduction...');
    await client.setupTranslationRights(certificate.id, metadata.translation_rights);

    // 5. Configurer la distribution des revenus
    console.log('\n💰 Configuration des royalties...');
    await client.setupBookRoyalties(certificate.id, metadata.royalties);

    // 6. Protéger le contenu
    console.log('\n🔒 Protection du contenu...');
    const protectedBuffer = await client.createBookDRM(fileBuffer, {
      certificateId: certificate.id,
      watermark: true,
      encryption: true,
      tracking: true
    });

    // Sauvegarder la version protégée
    const protectedPath = path.join(__dirname, 'mybook_protected.epub');
    fs.writeFileSync(protectedPath, protectedBuffer);

    // 7. Générer le certificat de copyright
    console.log('\n📄 Génération du certificat...');
    await client.generateBookCertificate(certificate.id, {
      output: path.join(__dirname, 'book_certificate.pdf'),
      template: 'publisher',
      includeMetadata: true,
      includeCover: true
    });

    // 8. Créer les smart contracts pour les droits
    console.log('\n📜 Création des smart contracts...');
    
    // Contract pour les ventes
    const salesContract = await client.createBookSalesContract(certificate.id, {
      basePrice: "0.1 MATIC",
      authorRoyalty: 70,
      publisherRoyalty: 20,
      agentRoyalty: 10
    });

    // Contract pour les traductions
    const translationContract = await client.createTranslationContract(certificate.id, {
      languages: Object.keys(metadata.translation_rights),
      prices: metadata.translation_rights
    });

    console.log('\n📊 Résumé des contrats:');
    console.log('- Contrat de vente:', salesContract.address);
    console.log('- Contrat de traduction:', translationContract.address);

    // 9. Configurer le tracking des ventes
    console.log('\n📈 Configuration du tracking...');
    await client.setupBookTracking(certificate.id, {
      platforms: ['amazon', 'google_books', 'apple_books'],
      reportingFrequency: 'daily',
      minimumThreshold: '0.01 MATIC'
    });

    console.log('\n✨ Processus terminé avec succès !');
    console.log('Votre livre est maintenant protégé sur la blockchain !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la certification
certifyBook();
