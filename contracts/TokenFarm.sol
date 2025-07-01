// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./DAppToken.sol";
import "./LPToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenFarm {
    string public name = "Proportional Token Farm";
    address public owner;
    DAppToken public dappToken;
    LPToken public lpToken;

    uint256 public rewardPerBlockMin = 1e18;
    uint256 public rewardPerBlockMax = 5e18;
    uint256 public rewardPerBlock = 1e18;

    uint256 public totalStakingBalance;

    uint256 public accruedRewardPerShare;
    uint256 public lastRewardBlock;

    uint256 public withdrawalFeeBasisPoints = 100;
    uint256 public accumulatedFees;

    struct Staker {
        uint256 stakingBalance;
        uint256 pendingRewards;
        uint256 rewardDebt;
        bool hasStaked;
        bool isStaking;
    }

    mapping(address => Staker) public stakers;
    address[] public stakerAddresses;

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo owner puede ejecutar");
        _;
    }

    modifier onlyStaker() {
        require(stakers[msg.sender].isStaking, "No estas haciendo staking");
        _;
    }

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount, uint256 fee);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsUpdated(uint256 newAccruedRewardPerShare);

    constructor(DAppToken _dappToken, LPToken _lpToken) {
        owner = msg.sender;
        dappToken = _dappToken;
        lpToken = _lpToken;
        lastRewardBlock = block.number;
    }

    function setRewardPerBlock(uint256 _newReward) external onlyOwner {
        require(_newReward >= rewardPerBlockMin && _newReward <= rewardPerBlockMax, "Recompensa fuera del rango");
        updateAccruedRewards();
        rewardPerBlock = _newReward;
    }

    function setWithdrawalFee(uint256 _basisPoints) external onlyOwner {
        require(_basisPoints <= 1000, "Fee maximo 10%");
        withdrawalFeeBasisPoints = _basisPoints;
    }

    function withdrawFees() external onlyOwner {
        require(accumulatedFees > 0, "No hay fees para retirar");
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        bool sent = dappToken.transfer(owner, amount);
        require(sent, "Transferencia de DAppToken para fees fallo");
    }

    function deposit(uint256 _amount) external {
        require(_amount > 0, "Monto debe ser mayor a 0");
        Staker storage user = stakers[msg.sender];

        updateAccruedRewards();
        if (user.stakingBalance > 0) {
            user.pendingRewards += (user.stakingBalance * accruedRewardPerShare) / 1e18 - user.rewardDebt;
        }

        if (!user.hasStaked) {
            user.hasStaked = true;
            stakerAddresses.push(msg.sender);
        }

        user.stakingBalance += _amount;
        totalStakingBalance += _amount;
        user.isStaking = true;
        user.rewardDebt = (user.stakingBalance * accruedRewardPerShare) / 1e18;

        bool sent = lpToken.transferFrom(msg.sender, address(this), _amount);
        require(sent, "Transferencia LPToken fallo");

        emit Deposit(msg.sender, _amount);
    }

    function withdraw() external onlyStaker {
        Staker storage user = stakers[msg.sender];
        require(user.stakingBalance > 0, "No tienes tokens para retirar");

        updateAccruedRewards();
        if (user.stakingBalance > 0) {
            user.pendingRewards += (user.stakingBalance * accruedRewardPerShare) / 1e18 - user.rewardDebt;
        }

        uint256 amountToWithdraw = user.stakingBalance;
        user.stakingBalance = 0;
        user.isStaking = false;
        totalStakingBalance -= amountToWithdraw;
        user.rewardDebt = (user.stakingBalance * accruedRewardPerShare) / 1e18;

        bool sent = lpToken.transfer(msg.sender, amountToWithdraw);
        require(sent, "Transferencia LPToken fallo");

        emit Withdraw(msg.sender, amountToWithdraw, 0);
    }

    function claimRewards() external onlyStaker {
        Staker storage user = stakers[msg.sender];

        updateAccruedRewards();
        if (user.stakingBalance > 0) {
            user.pendingRewards += (user.stakingBalance * accruedRewardPerShare) / 1e18 - user.rewardDebt;
        }
        user.rewardDebt = (user.stakingBalance * accruedRewardPerShare) / 1e18;

        uint256 reward = user.pendingRewards;
        require(reward > 0, "No tienes recompensas pendientes");

        uint256 fee = (reward * withdrawalFeeBasisPoints) / 10000;
        uint256 rewardAfterFee = reward - fee;

        user.pendingRewards = 0;
        accumulatedFees += fee;

        bool sent = dappToken.transfer(msg.sender, rewardAfterFee);
        require(sent, "Transferencia de DAppToken de recompensa fallo");

        emit RewardsClaimed(msg.sender, rewardAfterFee);
    }

    function updateAccruedRewards() private {
        if (totalStakingBalance == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 blocksPassed = block.number - lastRewardBlock;
        if (blocksPassed == 0) {
            return;
        }

        uint256 rewardsThisPeriod = rewardPerBlock * blocksPassed;
        accruedRewardPerShare += (rewardsThisPeriod * 1e18) / totalStakingBalance;
        lastRewardBlock = block.number;
        emit RewardsUpdated(accruedRewardPerShare);
    }

    function getPendingRewards(address _staker) public view returns (uint256) {
        Staker storage user = stakers[_staker];
        uint256 currentAccruedRewardPerShare = accruedRewardPerShare;

        if (totalStakingBalance > 0 && block.number > lastRewardBlock) {
            uint256 blocksPassed = block.number - lastRewardBlock;
            uint256 rewardsThisPeriod = rewardPerBlock * blocksPassed;
            currentAccruedRewardPerShare += (rewardsThisPeriod * 1e18) / totalStakingBalance;
        }

        return (user.stakingBalance * currentAccruedRewardPerShare) / 1e18 - user.rewardDebt + user.pendingRewards;
    }
}