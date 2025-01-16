const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Déploiement du smart contract CopyrightManager...");

    // Récupérer le compte de déploiement
    const [deployer] = await hre.ethers.getSigners();
    console.log("Déploiement avec le compte:", deployer.address);

    // Afficher le solde du compte
    const balance = await deployer.getBalance();
    console.log("Solde du compte:", hre.ethers.utils.formatEther(balance), "ETH");

    // Déployer le contrat
    const CopyrightManager = await hre.ethers.getContractFactory("CopyrightManager");
    const copyrightManager = await CopyrightManager.deploy();
    await copyrightManager.deployed();

    console.log("CopyrightManager déployé à l'adresse:", copyrightManager.address);

    // Sauvegarder l'adresse du contrat
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: copyrightManager.address,
        deploymentTime: new Date().toISOString(),
        deployer: deployer.address
    };

    // Créer le dossier deployments s'il n'existe pas
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    // Sauvegarder les informations de déploiement
    fs.writeFileSync(
        path.join(deploymentsDir, `${hre.network.name}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Vérifier le contrat sur Polygonscan
    if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
        console.log("Attente de 5 confirmations pour la vérification...");
        await copyrightManager.deployTransaction.wait(5);

        console.log("Vérification du contrat sur Polygonscan...");
        await hre.run("verify:verify", {
            address: copyrightManager.address,
            constructorArguments: []
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
