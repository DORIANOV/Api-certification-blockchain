require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    polygon_mumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
    },
    polygon_mainnet: {
      url: process.env.POLYGON_MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
    }
  }
};
