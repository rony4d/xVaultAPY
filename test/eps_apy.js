
const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const ibUsdtAbi = require('../abi/ibUsdtAbi.json');
const alpacaConfigAbi = require('../abi/alpacaConfigAbi.json');


const fairLaunch = require('../abi/fairLaunchAbi.json')
const uniswapRouterAbi = require('../abi/UniswapRouterAbi.json');

const ibBusdAddress = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f";
const lpTokenAddress = "0xae70e3f6050d6ab05e03a50c655309c2148615be";
const epsPoolID = 25;
const ibTokenPoolId = 3;

const fairLanuchAddress = "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F";
const uniswapRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const web3 = new Web3('https://bsc-dataseed.binance.org/');

const blocksPerDay = 60 * 60 * 24 / 3;
const daysPerYear = 365;

const stabilityFee = 0.018;
const collateralFactor = 0.875;


async function runCode() {

    var ibToken = new web3.eth.Contract(ibUsdtAbi, ibBusdAddress);
    var alpacaConfigAddress = await ibToken.methods.config().call();
    var alpacaConfigContract = new web3.eth.Contract(alpacaConfigAbi, alpacaConfigAddress);
    var alpacaTotalToken = await ibToken.methods.totalToken().call();
    var alpacaVaultDebtVal = await ibToken.methods.vaultDebtVal().call();
    var alpacaBorrowInterest = await alpacaConfigContract.methods.getInterestRate(alpacaVaultDebtVal, new BigNumber(alpacaTotalToken).minus(alpacaVaultDebtVal)).call();
    alpacaBorrowInterest = new BigNumber(alpacaBorrowInterest).multipliedBy(365 * 24 * 3600);
    var performanceFee = await alpacaConfigContract.methods.getReservePoolBps().call();
    performanceFee = new BigNumber(performanceFee).dividedBy(10000);
    var alpacaLendingApr = alpacaBorrowInterest.multipliedBy(alpacaVaultDebtVal).dividedBy(alpacaTotalToken).multipliedBy(new BigNumber(1).minus(performanceFee)).dividedBy(web3.utils.toWei('1'));

    var fairLanuchContract = new web3.eth.Contract(fairLaunch, fairLanuchAddress);
    var poolInfo = await fairLanuchContract.methods.poolInfo(epsPoolID).call()
    var allocPoint = poolInfo.allocPoint;
    var alpacaPerBlock = await fairLanuchContract.methods.alpacaPerBlock().call();
    var totalAllocPoint = await fairLanuchContract.methods.totalAllocPoint().call();
    var lpToken = new web3.eth.Contract(ibUsdtAbi, lpTokenAddress);
    var balanceOfLpToken = await lpToken.methods.balanceOf(fairLanuchAddress).call();
    var path = ["0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"];
    var routerContract = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddress);
    var amountIn = new BigNumber(10).pow(18);
    var amountOut = await routerContract.methods.getAmountsOut(amountIn, path).call();
    var alpacaPrice = amountOut[amountOut.length - 1];
    var stakingAprOfEps = new BigNumber(alpacaPerBlock).multipliedBy(allocPoint).dividedBy(totalAllocPoint).multipliedBy(new BigNumber(blocksPerDay)).multipliedBy(daysPerYear).multipliedBy(alpacaPrice).dividedBy(balanceOfLpToken).dividedBy(web3.utils.toWei('1'))

    poolInfo = await fairLanuchContract.methods.poolInfo(ibTokenPoolId).call()
    allocPoint = poolInfo.allocPoint;
    var balanceOfIbToken = await ibToken.methods.balanceOf(fairLanuchAddress).call();
    var stakingAprOfIbToken = new BigNumber(alpacaPerBlock).multipliedBy(allocPoint).dividedBy(totalAllocPoint).multipliedBy(new BigNumber(blocksPerDay)).multipliedBy(daysPerYear).multipliedBy(alpacaPrice).dividedBy(balanceOfIbToken).dividedBy(web3.utils.toWei('1'))

    var totalApr = alpacaLendingApr.plus(stakingAprOfIbToken).plus(stakingAprOfEps.minus(stabilityFee).multipliedBy(collateralFactor));
    var totalApy = totalApr.dividedBy(daysPerYear).plus(1).pow(daysPerYear).minus(1).multipliedBy(100)                  // apy = (1 + apr/n)^n - 1
    console.log('totalApy:', totalApy.toFixed(2).toString())

}

runCode();
