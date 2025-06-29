require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify"); // Añadir esta línea

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.22",
      },
    ],
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: { // Añadir este bloque
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
    },
  },
};