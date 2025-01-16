const { BlockchainCopyright } = require('blockchain-copyright');
const fs = require('fs');
const path = require('path');

// Configuration du client
const client = new BlockchainCopyright({
  apiKey: process.env.COPYRIGHT_API_KEY,
  network: 'polygon'
});

async function certifyVideo() {
  try {
    // 1. Lire le fichier vidéo
    const videoPath = path.join(__dirname, 'myvideo.mp4');
    const fileBuffer = fs.readFileSync(videoPath);

    // 2. Métadonnées du film/vidéo
    const metadata = {
      // Informations de base
      title: "Blockchain Revolution",
      type: "documentary",
      duration: "01:23:45",
      releaseDate: "2024-01-10",
      
      // Équipe de production
      credits: {
        director: "Steven Spielblock",
        producer: "Crypto Productions",
        writer: "Alice Nakamoto",
        cinematographer: "Bob Chain",
        editor: "Charlie Block",
        cast: [
          "David Token",
          "Eve Crypto",
          "Frank Blockchain"
        ]
      },

      // Droits d'auteur
      copyright: {
        owner: "Crypto Productions Inc.",
        year: 2024,
        territory: "Worldwide"
      },

      // Distribution des revenus
      royalties: {
        "0x1234...": 40,  // Production
        "0x5678...": 20,  // Réalisateur
        "0x9abc...": 15,  // Scénariste
        "0xdef0...": 25   // Investisseurs
      },

      // Droits de diffusion par territoire
      broadcasting_rights: {
        "US": {
          platforms: ["netflix", "amazon"],
          price: "10 MATIC",
          duration: "2_years"
        },
        "EU": {
          platforms: ["canal+", "arte"],
          price: "8 MATIC",
          duration: "2_years"
        },
        "ASIA": {
          platforms: ["tencent", "rakuten"],
          price: "7 MATIC",
          duration: "2_years"
        }
      },

      // Droits de sous-titrage/doublage
      localization_rights: {
        subtitles: {
          available_languages: ["en", "es", "fr", "de", "ja", "zh"],
          price_per_language: "1 MATIC"
        },
        dubbing: {
          available_languages: ["es", "fr", "de", "ja"],
          price_per_language: "3 MATIC"
        }
      },

      // Informations techniques
      technical: {
        format: "MP4",
        resolution: "4K",
        codec: "H.264",
        bitrate: "20Mbps",
        audio: "5.1 Surround"
      }
    };

    // 3. Certifier la vidéo
    console.log('🎬 Certification de la vidéo en cours...');
    const certificate = await client.certifyVideo({
      content: fileBuffer,
      ...metadata
    });

    console.log('\n✅ Certification réussie !');
    console.log('ID du Certificat:', certificate.id);
    console.log('Transaction Hash:', certificate.transactionHash);
    console.log('Smart Contract:', certificate.contractAddress);

    // 4. Créer le watermark vidéo
    console.log('\n🔒 Création du watermark vidéo...');
    const watermarkedBuffer = await client.createVideoWatermark(fileBuffer, {
      certificateId: certificate.id,
      visible: true,
      invisible: true,
      position: "bottom-right",
      opacity: 0.3
    });

    // Sauvegarder la version watermarkée
    const watermarkedPath = path.join(__dirname, 'myvideo_protected.mp4');
    fs.writeFileSync(watermarkedPath, watermarkedBuffer);

    // 5. Configurer les droits de diffusion
    console.log('\n📺 Configuration des droits de diffusion...');
    await client.setupBroadcastingRights(certificate.id, metadata.broadcasting_rights);

    // 6. Configurer les droits de localisation
    console.log('\n🌍 Configuration des droits de localisation...');
    await client.setupLocalizationRights(certificate.id, metadata.localization_rights);

    // 7. Créer les smart contracts
    console.log('\n📜 Création des smart contracts...');
    
    // Contract pour la diffusion
    const broadcastContract = await client.createBroadcastingContract(certificate.id, {
      territories: Object.keys(metadata.broadcasting_rights),
      prices: metadata.broadcasting_rights
    });

    // Contract pour la localisation
    const localizationContract = await client.createLocalizationContract(certificate.id, {
      subtitleLanguages: metadata.localization_rights.subtitles.available_languages,
      dubbingLanguages: metadata.localization_rights.dubbing.available_languages,
      prices: {
        subtitles: metadata.localization_rights.subtitles.price_per_language,
        dubbing: metadata.localization_rights.dubbing.price_per_language
      }
    });

    // 8. Configurer le DRM
    console.log('\n🔐 Configuration du DRM...');
    await client.setupVideoDRM(certificate.id, {
      encryption: "AES-256",
      keyRotation: true,
      playbackPolicy: {
        maxDevices: 3,
        offlineViewing: true,
        expiryDays: 30
      }
    });

    // 9. Générer les previews
    console.log('\n🎥 Génération des previews...');
    await client.generatePreviews(certificate.id, {
      trailer: true,
      thumbnails: true,
      watermarked: true
    });

    // 10. Générer le certificat
    console.log('\n📄 Génération du certificat...');
    await client.generateVideoCertificate(certificate.id, {
      output: path.join(__dirname, 'video_certificate.pdf'),
      template: 'professional',
      includeScreenshots: true,
      includeTechnicalInfo: true
    });

    console.log('\n✨ Processus terminé avec succès !');
    console.log('Votre vidéo est maintenant protégée sur la blockchain !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la certification
certifyVideo();
