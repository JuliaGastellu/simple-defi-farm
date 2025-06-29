const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFarm", function () {
  let dappToken, lpToken, tokenFarm;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const DAppToken = await ethers.getContractFactory("DAppToken");
    dappToken = await DAppToken.deploy();
    await dappToken.waitForDeployment();

    const LPToken = await ethers.getContractFactory("LPToken");
    lpToken = await LPToken.deploy();
    await lpToken.waitForDeployment();

    const TokenFarm = await ethers.getContractFactory("TokenFarm");
    tokenFarm = await TokenFarm.deploy(dappToken.target, lpToken.target);
    await tokenFarm.waitForDeployment();

    const mintAmount = ethers.parseUnits("1000", 18);
    await lpToken.mint(user1.address, mintAmount);
    await lpToken.mint(user2.address, mintAmount);
  });

  it("Usuario puede stakear LP tokens", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await lpToken.connect(user1).approve(tokenFarm.target, stakeAmount);
    await tokenFarm.connect(user1).deposit(stakeAmount);
    const stakingBalance = await tokenFarm.stakers(user1.address);
    expect(stakingBalance.stakingBalance).to.equal(stakeAmount);
  });

  it("Distribuye recompensas correctamente proporcional", async function () {
    const stakeAmount1 = ethers.parseUnits("100", 18);
    const stakeAmount2 = ethers.parseUnits("300", 18);

    await lpToken.connect(user1).approve(tokenFarm.target, stakeAmount1);
    await tokenFarm.connect(user1).deposit(stakeAmount1);

    await lpToken.connect(user2).approve(tokenFarm.target, stakeAmount2);
    await tokenFarm.connect(user2).deposit(stakeAmount2);

    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_mine");
    }

    await tokenFarm.distributeRewardsAll();

    const rewards1 = (await tokenFarm.stakers(user1.address)).pendingRewards;
    const rewards2 = (await tokenFarm.stakers(user2.address)).pendingRewards;

    expect(rewards1).to.be.gt(0);
    expect(rewards2).to.be.gt(0);
    expect(rewards2).to.be.gt(rewards1);
  });

  it("Usuario puede reclamar recompensas con fee", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await lpToken.connect(user1).approve(tokenFarm.target, stakeAmount);
    await tokenFarm.connect(user1).deposit(stakeAmount);

    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_mine");
    }

    await tokenFarm.distributeRewardsAll();

    const rewardsBefore = (await tokenFarm.stakers(user1.address)).pendingRewards;
    expect(rewardsBefore).to.be.gt(0);

    await tokenFarm.connect(user1).claimRewards();

    const rewardsAfter = (await tokenFarm.stakers(user1.address)).pendingRewards;
    expect(rewardsAfter).to.equal(0);
  });

  it("Usuario puede retirar tokens LP y reclamar recompensas pendientes", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await lpToken.connect(user1).approve(tokenFarm.target, stakeAmount);
    await tokenFarm.connect(user1).deposit(stakeAmount);

    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_mine");
    }

    await tokenFarm.connect(user1).withdraw();

    const stakingBalance = (await tokenFarm.stakers(user1.address)).stakingBalance;
    expect(stakingBalance).to.equal(0);

    const pending = (await tokenFarm.stakers(user1.address)).pendingRewards;
    expect(pending).to.be.gt(0);
  });
});
