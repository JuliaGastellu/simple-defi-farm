const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  
  const DAPP_TOKEN_ADDRESS = "0x373642fD816AB3bc81fd531e8C503192e744d0f3"; 
  const LP_TOKEN_ADDRESS = "0x2c61927Ca09f990EeDd99ec64e29E1Bc87Cb3a01";   
  const TOKEN_FARM_ADDRESS = "0x28831620D7e3878866f1CE0F1e5390A0139f9E6A"; 

  const dappToken = await hre.ethers.getContractAt("DAppToken", DAPP_TOKEN_ADDRESS);
  const lpToken = await hre.ethers.getContractAt("LPToken", LP_TOKEN_ADDRESS);
  const tokenFarm = await hre.ethers.getContractAt("TokenFarm", TOKEN_FARM_ADDRESS);

  console.log(`Interactuando con contratos desde la cuenta: ${deployer.address}`);
  const deployerEthBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance de cuenta: ${hre.ethers.formatEther(deployerEthBalance)} ETH`);

  const farmDappBalance = await dappToken.balanceOf(TOKEN_FARM_ADDRESS);
  console.log(`Balance de DAppToken en TokenFarm: ${hre.ethers.formatEther(farmDappBalance)} DAPP`);

  console.log("\n--- Información inicial de la Farm ---");
  console.log(`Nombre de la Farm: ${await tokenFarm.name()}`);
  console.log(`Owner de la Farm: ${await tokenFarm.owner()}`);
  console.log(`Recompensa por bloque actual: ${hre.ethers.formatEther(await tokenFarm.rewardPerBlock())}`);
  console.log(`Porcentaje de comisión de retiro: ${await tokenFarm.withdrawalFeeBasisPoints()} basis points`);

  console.log("\n--- Simulación de depósito por " + deployer.address + " ---");
  const amountToStake = hre.ethers.parseEther("100");

  const deployerLpBalanceBeforeMint = await lpToken.balanceOf(deployer.address);
  console.log(`Balance de LPT de ${deployer.address} antes de mintear: ${hre.ethers.formatEther(deployerLpBalanceBeforeMint)}`);

  console.log(`Minteando ${hre.ethers.formatEther(amountToStake)} LPT para ${deployer.address}...`);
  await (await lpToken.connect(deployer).mint(deployer.address, amountToStake)).wait();
  const deployerLpBalanceAfterMint = await lpToken.balanceOf(deployer.address);
  console.log(`Balance de LPT de ${deployer.address} DESPUÉS de mintear: ${hre.ethers.formatEther(deployerLpBalanceAfterMint)}`);

  console.log(`Aprobando ${TOKEN_FARM_ADDRESS} para gastar ${hre.ethers.formatEther(amountToStake)} LPT de ${deployer.address}...`);
  await (await lpToken.connect(deployer).approve(TOKEN_FARM_ADDRESS, amountToStake)).wait();
  const allowance = await lpToken.allowance(deployer.address, TOKEN_FARM_ADDRESS);
  console.log(`Aprobación de LPT del deployer para TokenFarm: ${hre.ethers.formatEther(allowance)}`);

  console.log(`Depositando ${hre.ethers.formatEther(amountToStake)} LPT...`);
  await (await tokenFarm.connect(deployer).deposit(amountToStake)).wait();
  const deployerStakingBalance = await tokenFarm.stakers(deployer.address);
  console.log(`Balance de staking de ${deployer.address}: ${hre.ethers.formatEther(deployerStakingBalance.stakingBalance)} LPT`);
  console.log(`Total Staking Balance en Farm: ${hre.ethers.formatEther(await tokenFarm.totalStakingBalance())} LPT`);
  console.log(`Reward Debt del deployer después del depósito: ${hre.ethers.formatEther(deployerStakingBalance.rewardDebt)}`);

  console.log("\n--- Avanzando bloques para acumular recompensas... ---");
  console.log("Esperando 10 segundos para que se minen algunos bloques en Sepolia...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  const pendingRewardsBeforeClaim = await tokenFarm.getPendingRewards(deployer.address);
  console.log(`Recompensas pendientes para ${deployer.address} ANTES de reclamar: ${hre.ethers.formatEther(pendingRewardsBeforeClaim)} DAPP`);

  console.log("\n--- Simulación de reclamar recompensas por " + deployer.address + " ---");
  const dappBalanceBeforeClaim = await dappToken.balanceOf(deployer.address);
  await (await tokenFarm.connect(deployer).claimRewards()).wait();
  const dappBalanceAfterClaim = await dappToken.balanceOf(deployer.address);
  const rewardsReceived = dappBalanceAfterClaim - dappBalanceBeforeClaim;
  console.log(`Recompensas recibidas por ${deployer.address}: ${hre.ethers.formatEther(rewardsReceived)} DAPP`);
  console.log(`Fees acumulados en la Farm: ${hre.ethers.formatEther(await tokenFarm.accumulatedFees())} DAPP`);

  console.log("\n--- Simulación de retiro de fees por el owner (" + deployer.address + ") ---");
  const ownerDappBalanceBeforeWithdrawFees = await dappToken.balanceOf(deployer.address);
  const accumulatedFeesBeforeWithdraw = await tokenFarm.accumulatedFees();
  await (await tokenFarm.connect(deployer).withdrawFees()).wait();
  const ownerDappBalanceAfterWithdrawFees = await dappToken.balanceOf(deployer.address);
  const feesWithdrawn = ownerDappBalanceAfterWithdrawFees - ownerDappBalanceBeforeWithdrawFees;
  console.log(`Fees retirados por el owner: ${hre.ethers.formatEther(feesWithdrawn)} DAPP`);

  console.log("\n--- Simulación de retiro de LP por " + deployer.address + " ---");
  const deployerLpBalanceBeforeWithdraw = await lpToken.balanceOf(deployer.address);
  await (await tokenFarm.connect(deployer).withdraw()).wait();
  const deployerLpBalanceAfterWithdraw = await lpToken.balanceOf(deployer.address);
  const lpWithdrawn = deployerLpBalanceAfterWithdraw - deployerLpBalanceBeforeWithdraw;
  console.log(`LP Tokens retirados por ${deployer.address}: ${hre.ethers.formatEther(lpWithdrawn)} LPT`);
  console.log(`Total Staking Balance en Farm: ${hre.ethers.formatEther(await tokenFarm.totalStakingBalance())} LPT`);

  console.log("\n¡Interacción completada!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});