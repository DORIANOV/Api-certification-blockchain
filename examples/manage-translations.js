const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function manageTranslations() {
  try {
    const certificateId = 'cert_123abc'; // ID du certificat du livre

    // 1. Vérifier les droits de traduction disponibles
    console.log('🌍 Vérification des droits de traduction...');
    const rights = await client.getTranslationRights(certificateId);
    console.log('Droits disponibles:');
    Object.entries(rights).forEach(([lang, info]) => {
      console.log(`- ${lang}: ${info.available ? 'Disponible' : 'Non disponible'}`);
      if (info.available) {
        console.log(`  Prix: ${info.price}`);
        console.log(`  Territoires: ${info.territory.join(', ')}`);
      }
    });

    // 2. Acheter des droits de traduction
    console.log('\n💰 Achat des droits de traduction en espagnol...');
    const purchase = await client.purchaseTranslationRights(certificateId, {
      language: 'es',
      territory: ['ES', 'MX'],
      translator: "0xabcd...",
      payment: {
        amount: '3',
        currency: 'MATIC'
      }
    });

    console.log('Droits acquis !');
    console.log('ID de licence:', purchase.id);
    console.log('Transaction:', purchase.transactionHash);

    // 3. Soumettre une traduction
    console.log('\n📝 Soumission de la traduction...');
    const translationPath = path.join(__dirname, 'translation_es.epub');
    const translationBuffer = fs.readFileSync(translationPath);

    const submission = await client.submitTranslation(certificateId, {
      language: 'es',
      content: translationBuffer,
      translator: "0xabcd...",
      metadata: {
        title: "La Guía de la Blockchain",
        translator_name: "Juan Pérez",
        completion_date: new Date().toISOString()
      }
    });

    // 4. Validation de la traduction
    console.log('\n✅ Validation de la traduction...');
    await client.validateTranslation(submission.id, {
      approved: true,
      comments: "Traduction approuvée",
      validator: "0x1234..."
    });

    // 5. Publication de la traduction
    console.log('\n📚 Publication de la traduction...');
    const publishedTranslation = await client.publishTranslation(submission.id, {
      platforms: ['amazon', 'google_books'],
      price: "0.08 MATIC",
      royalties: {
        original_author: 40,
        translator: 30,
        publisher: 30
      }
    });

    // 6. Configurer le tracking des ventes de la traduction
    console.log('\n📊 Configuration du tracking...');
    await client.setupTranslationTracking(submission.id, {
      platforms: ['amazon', 'google_books'],
      reportingFrequency: 'daily'
    });

    // 7. Générer un rapport de traduction
    console.log('\n📄 Génération du rapport...');
    const report = await client.generateTranslationReport(submission.id, {
      output: path.join(__dirname, 'translation_report.pdf'),
      includeMetadata: true,
      includeSales: true
    });

    console.log('\n✨ Processus terminé avec succès !');
    console.log('La traduction est maintenant disponible !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la gestion des traductions
manageTranslations();
