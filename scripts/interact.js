const { ethers } = require("hardhat");

const DAPP_TOKEN_ADDRESS = "0x811d593c2aE407F8BA307a6d8205F726EC4744C6";
const LP_TOKEN_ADDRESS = "0xa1d0F293ccD3bD2D920baDFB3Bc468dB02FCce3c";
const TOKEN_FARM_ADDRESS = "0x40171a8a9b24C50acE88bef1a913a4e2322c6036";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Interactuando con contratos desde la cuenta:", deployer.address);
    console.log("Balance de cuenta:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    const dappToken = await ethers.getContractAt("DAppToken", DAPP_TOKEN_ADDRESS);
    const lpToken = await ethers.getContractAt("LPToken", LP_TOKEN_ADDRESS);
    const tokenFarm = await ethers.getContractAt("TokenFarm", TOKEN_FARM_ADDRESS);

    console.log("Balance de DAppToken en TokenFarm:", ethers.formatEther(await dappToken.balanceOf(TOKEN_FARM_ADDRESS)), "DAPP");

    console.log("\n--- Información inicial de la Farm ---");
    console.log("Nombre de la Farm:", await tokenFarm.name());
    console.log("Owner de la Farm:", await tokenFarm.owner());
    console.log("Recompensa por bloque actual:", ethers.formatEther(await tokenFarm.rewardPerBlock()));
    console.log("Porcentaje de comisión de retiro:", (await tokenFarm.withdrawalFeeBasisPoints()).toString(), "basis points");

    const depositAmount = ethers.parseEther("100");

    console.log(`\n--- Simulación de depósito por ${deployer.address} ---`);
    console.log(`Balance de LPT de ${deployer.address} antes de mintear: ${ethers.formatEther(await lpToken.balanceOf(deployer.address))}`);

    const mintAmount = ethers.parseEther("5000");
    console.log(`Minteando ${ethers.formatEther(mintAmount)} LPT para ${deployer.address}...`);
    await (await lpToken.connect(deployer).mint(deployer.address, mintAmount)).wait();
    console.log(`Balance de LPT de ${deployer.address} DESPUÉS de mintear: ${ethers.formatEther(await lpToken.balanceOf(deployer.address))}`);

    console.log(`Aprobando ${TOKEN_FARM_ADDRESS} para gastar ${ethers.formatEther(depositAmount)} LPT de ${deployer.address}...`);
    await (await lpToken.connect(deployer).approve(TOKEN_FARM_ADDRESS, depositAmount)).wait();
    console.log(`Aprobación de LPT del deployer para TokenFarm: ${ethers.formatEther(await lpToken.allowance(deployer.address, TOKEN_FARM_ADDRESS))}`);

    console.log(`Depositando ${ethers.formatEther(depositAmount)} LPT...`);
    await (await tokenFarm.connect(deployer).deposit(depositAmount)).wait();
    console.log(`Balance de staking de ${deployer.address}: ${ethers.formatEther((await tokenFarm.stakers(deployer.address)).stakingBalance)} LPT`);
    console.log(`Total Staking Balance en Farm: ${ethers.formatEther(await tokenFarm.totalStakingBalance())} LPT`);
    console.log(`Checkpoint del deployer después del depósito: ${(await tokenFarm.stakers(deployer.address)).checkpoint.toString()}`);
    console.log(`Block number actual después del depósito: ${await ethers.provider.getBlockNumber()}`);

    console.log("\n--- Avanzando bloques para acumular recompensas... ---");
    console.log("Esperando 10 segundos para que se minen algunos bloques en Sepolia...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log(`Block number después de la espera: ${await ethers.provider.getBlockNumber()}`);

    console.log("\n--- Llamando a distributeRewardsAll para forzar el cálculo de recompensas ---");
    await (await tokenFarm.connect(deployer).distributeRewardsAll()).wait();

    console.log(`Recompensas pendientes para ${deployer.address} DESPUÉS DE DISTRIBUTE_ALL: ${ethers.formatEther((await tokenFarm.stakers(deployer.address)).pendingRewards)} DAPP`);

    console.log(`\n--- Simulación de reclamar recompensas por ${deployer.address} ---`);
    const initialDeployerDappBalanceForClaim = await dappToken.balanceOf(deployer.address);
    await (await tokenFarm.connect(deployer).claimRewards()).wait();
    const finalDeployerDappBalanceForClaim = await dappToken.balanceOf(deployer.address);
    console.log(`Recompensas recibidas por ${deployer.address}: ${ethers.formatEther(finalDeployerDappBalanceForClaim - initialDeployerDappBalanceForClaim)} DAPP`);
    console.log(`Fees acumulados en la Farm: ${ethers.formatEther(await tokenFarm.accumulatedFees())} DAPP`);

    console.log(`\n--- Simulación de retiro de fees por el owner (${deployer.address}) ---`);
    const initialDeployerDappBalanceAfterClaim = await dappToken.balanceOf(deployer.address);
    const feesBeforeWithdraw = await tokenFarm.accumulatedFees();

    if (feesBeforeWithdraw > 0) {
        await (await tokenFarm.connect(deployer).withdrawFees()).wait();
    } else {
        console.log("No hay fees acumulados para retirar.");
    }

    const finalDeployerDappBalanceAfterFeeWithdraw = await dappToken.balanceOf(deployer.address);
    console.log(`Fees retirados por el owner: ${ethers.formatEther(finalDeployerDappBalanceAfterFeeWithdraw - initialDeployerDappBalanceAfterClaim)} DAPP`);

    console.log(`\n--- Simulación de retiro de LP por ${deployer.address} ---`);
    const initialDeployerLpBalance = await lpToken.balanceOf(deployer.address);
    await (await tokenFarm.connect(deployer).withdraw()).wait();
    const finalDeployerLpBalance = await lpToken.balanceOf(deployer.address);

    console.log(`LP Tokens retirados por ${deployer.address}: ${ethers.formatEther(finalDeployerLpBalance - initialDeployerLpBalance)} LPT`);
    console.log(`Total Staking Balance en Farm: ${ethers.formatEther(await tokenFarm.totalStakingBalance())} LPT`);

    console.log("\n¡Interacción completada!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });