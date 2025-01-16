const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function manageBroadcasting() {
  try {
    const certificateId = 'cert_123abc'; // ID du certificat de la vidéo

    // 1. Vérifier les droits de diffusion disponibles
    console.log('📺 Vérification des droits de diffusion...');
    const rights = await client.getBroadcastingRights(certificateId);
    console.log('Droits par territoire:');
    Object.entries(rights).forEach(([territory, info]) => {
      console.log(`\n${territory}:`);
      console.log(`- Plateformes: ${info.platforms.join(', ')}`);
      console.log(`- Prix: ${info.price}`);
      console.log(`- Durée: ${info.duration}`);
    });

    // 2. Acheter des droits de diffusion
    console.log('\n💰 Achat des droits de diffusion pour l\'Europe...');
    const purchase = await client.purchaseBroadcastingRights(certificateId, {
      territory: 'EU',
      platform: 'canal+',
      duration: '2_years',
      payment: {
        amount: '8',
        currency: 'MATIC'
      }
    });

    console.log('Droits acquis !');
    console.log('ID de licence:', purchase.id);
    console.log('Transaction:', purchase.transactionHash);

    // 3. Gérer les sous-titres
    console.log('\n🗣️ Gestion des sous-titres...');
    
    // Acheter le droit de sous-titrage
    const subtitleRights = await client.purchaseSubtitleRights(certificateId, {
      languages: ['fr', 'de'],
      payment: {
        amount: '2',
        currency: 'MATIC'
      }
    });

    // Soumettre les sous-titres
    const subtitlePath = path.join(__dirname, 'subtitles_fr.srt');
    const subtitleBuffer = fs.readFileSync(subtitlePath);

    await client.submitSubtitles(certificateId, {
      language: 'fr',
      content: subtitleBuffer,
      translator: "0xabcd...",
      format: 'srt'
    });

    // 4. Gérer le doublage
    console.log('\n🎙️ Gestion du doublage...');
    
    // Acheter le droit de doublage
    const dubbingRights = await client.purchaseDubbingRights(certificateId, {
      languages: ['fr'],
      payment: {
        amount: '3',
        currency: 'MATIC'
      }
    });

    // Soumettre le doublage
    const dubbingPath = path.join(__dirname, 'dubbing_fr.mp3');
    const dubbingBuffer = fs.readFileSync(dubbingPath);

    await client.submitDubbing(certificateId, {
      language: 'fr',
      content: dubbingBuffer,
      studio: "Studio Doublage Pro",
      format: 'mp3'
    });

    // 5. Configurer la diffusion
    console.log('\n📡 Configuration de la diffusion...');
    await client.setupBroadcast(certificateId, {
      platform: 'canal+',
      startDate: '2024-02-01',
      endDate: '2026-02-01',
      territories: ['FR', 'BE', 'CH'],
      quality: '4K',
      drm: true
    });

    // 6. Tracking des vues
    console.log('\n📊 Configuration du tracking...');
    await client.setupViewTracking(certificateId, {
      platforms: ['canal+'],
      metrics: ['views', 'duration', 'engagement'],
      reportingFrequency: 'daily'
    });

    // 7. Générer un rapport de diffusion
    console.log('\n📄 Génération du rapport...');
    const report = await client.generateBroadcastReport(certificateId, {
      output: path.join(__dirname, 'broadcast_report.pdf'),
      includeMetrics: true,
      includeLicenses: true
    });

    console.log('\n✨ Processus terminé avec succès !');
    console.log('La vidéo est prête pour la diffusion !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la gestion de la diffusion
manageBroadcasting();
