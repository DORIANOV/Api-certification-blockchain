const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function certifyMusic() {
  try {
    // 1. Lire le fichier audio
    const musicPath = path.join(__dirname, 'mysong.mp3');
    const fileBuffer = fs.readFileSync(musicPath);

    // 2. Métadonnées de la musique
    const metadata = {
      // Informations de base
      title: "Ma Super Chanson",
      artist: "DJ Blockchain",
      album: "Crypto Beats",
      genre: "Electronic",
      year: "2024",
      
      // Crédits
      credits: {
        composer: ["DJ Blockchain"],
        lyricist: ["MC Crypto"],
        producer: ["Beat Master"],
        studio: "Blockchain Studio"
      },

      // Droits d'auteur
      copyright: {
        owner: "DJ Blockchain Music Ltd",
        year: 2024,
        territory: "Worldwide"
      },

      // Distribution des royalties (en pourcentage)
      royalties: {
        "0x1234...": 60,  // Artiste principal
        "0x5678...": 20,  // Compositeur
        "0x9abc...": 10,  // Producteur
        "0xdef0...": 10   // Studio
      },

      // Licences disponibles
      licenses: {
        streaming: {
          price: "0.001 MATIC",
          duration: "per_play"
        },
        download: {
          price: "0.1 MATIC",
          duration: "perpetual"
        },
        commercial: {
          price: "1 MATIC",
          duration: "1_year"
        }
      },

      // Informations techniques
      technical: {
        format: "MP3",
        duration: "3:45",
        bitrate: "320kbps",
        sampleRate: "44.1kHz"
      }
    };

    // 3. Certifier la musique
    console.log('🎵 Certification de la musique en cours...');
    const certificate = await client.certifyMusic({
      content: fileBuffer,
      ...metadata
    });

    console.log('\n✅ Certification réussie !');
    console.log('ID du Certificat:', certificate.id);
    console.log('Transaction Hash:', certificate.transactionHash);
    console.log('Smart Contract:', certificate.contractAddress);

    // 4. Configurer la distribution automatique des royalties
    console.log('\n💰 Configuration des royalties...');
    await client.setupRoyalties(certificate.id, metadata.royalties);

    // 5. Activer les licences
    console.log('\n📜 Activation des licences...');
    await client.setupLicenses(certificate.id, metadata.licenses);

    // 6. Générer le watermark audio
    console.log('\n🔒 Génération du watermark...');
    const watermarkedBuffer = await client.createAudioWatermark(fileBuffer, {
      certificateId: certificate.id,
      timestamp: new Date(),
      owner: metadata.copyright.owner
    });

    // Sauvegarder la version watermarkée
    const watermarkedPath = path.join(__dirname, 'mysong_protected.mp3');
    fs.writeFileSync(watermarkedPath, watermarkedBuffer);

    // 7. Générer le certificat PDF
    console.log('\n📄 Génération du certificat PDF...');
    await client.generateMusicCertificate(certificate.id, {
      output: path.join(__dirname, 'music_certificate.pdf'),
      template: 'professional',
      includeWaveform: true,
      includeMetadata: true
    });

    // 8. Exemple de vérification des revenus
    console.log('\n💵 Vérification des revenus...');
    const revenue = await client.getMusicRevenue(certificate.id);
    console.log('Revenus totaux:', revenue.total, 'MATIC');
    console.log('Répartition:');
    Object.entries(revenue.distribution).forEach(([address, amount]) => {
      console.log(`- ${address}: ${amount} MATIC`);
    });

    console.log('\n✨ Processus terminé avec succès !');
    console.log('Votre musique est maintenant protégée sur la blockchain !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la certification
certifyMusic();
