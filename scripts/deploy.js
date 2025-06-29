const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Desplegando contratos con la cuenta: ${deployer.address}`);

  const DAppToken = await hre.ethers.getContractFactory("DAppToken");
  const dappToken = await DAppToken.deploy(deployer.address); // Deployer becomes owner of DAppToken
  await dappToken.waitForDeployment();
  console.log(`DAppToken desplegado en: ${dappToken.target}`);

  // === NEW: Mint DAppTokens to the deployer (owner) ===
  const initialDeployerDappSupply = hre.ethers.parseEther("1000000"); // Define total supply to mint
  await (await dappToken.connect(deployer).mint(deployer.address, initialDeployerDappSupply)).wait();
  console.log(`Minteados ${hre.ethers.formatEther(initialDeployerDappSupply)} DAPP para ${deployer.address}.`);
  console.log(`Balance del deployer de DAppToken: ${hre.ethers.formatEther(await dappToken.balanceOf(deployer.address))} DAPP`);
  // ====================================================

  const LPToken = await hre.ethers.getContractFactory("LPToken");
  const lpToken = await LPToken.deploy(deployer.address); // Deployer becomes owner of LPToken
  await lpToken.waitForDeployment();
  console.log(`LPToken desplegado en: ${lpToken.target}`);

  const TokenFarm = await hre.ethers.getContractFactory("TokenFarm");
  const tokenFarm = await TokenFarm.deploy(dappToken.target, lpToken.target);
  await tokenFarm.waitForDeployment();
  console.log(`TokenFarm desplegado en: ${tokenFarm.target}`);

  const initialFarmBalance = hre.ethers.parseEther("1000000");
  console.log(`Transfiriendo ${hre.ethers.formatEther(initialFarmBalance)} DAPP a la TokenFarm (${tokenFarm.target})...`);
  // Now the deployer has the DAppTokens to transfer
  await (await dappToken.connect(deployer).transfer(tokenFarm.target, initialFarmBalance)).wait();
  console.log(`Balance de DAppToken en TokenFarm después del fondeo: ${hre.ethers.formatEther(await dappToken.balanceOf(tokenFarm.target))} DAPP`);

  console.log("¡Despliegue y configuración inicial completados!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});