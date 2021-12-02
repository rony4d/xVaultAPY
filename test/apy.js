
const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const vUsdtAbi = require('../abi/vUsdtAbi.json');
const unitrollerAbi = require('../abi/unitrollerAbi.json');
const uniswapRouterAbi = require('../abi/UniswapRouterAbi.json');

// const vUsdtAddress = "0xfd5840cd36d94d7229439859c0112a4185bc0255";   //  vUSDT
// const vUsdtAddress = "0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8";   //  vUSDC
const vUsdtAddress = "0x95c78222B3D6e262426483D42CfA53685A67Ab9D";      //  vBUSD
// const vUsdtAddress = "0xA07c5b74C9B40447a954e1466938b865b6BBea36";      //  vBNB

const usdtStrategyAddress = '0x4bA58C32b994164218BC6a8A76107dcE6d374e07'    // usdt
// const usdtStrategyAddress = '0x16911E3d5354725349C355EA0d24Fc6845Aa13Eb'    // usdc
// const usdtStrategyAddress = '0x964407337aA2b8D2aB96B596651Ba9F5F53c4035'    // busd


const unitrollerAddress = "0xfD36E2c2a6789Db23113685031d7F16329158384";
const xvs = "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63";
const uniswapRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const web3 = new Web3('https://bsc-dataseed.binance.org/');

const usdtMantissa = 1e18;
const blocksPerDay = 60 * 60 * 24 / 3;
const daysPerYear = 365;

async function runCode() {

    var vToken = new web3.eth.Contract(vUsdtAbi, vUsdtAddress);
    var supplyRatePerBlock = await vToken.methods.supplyRatePerBlock().call();
    var borrowRatePerBlock = await vToken.methods.borrowRatePerBlock().call();

    var supplyApy = new BigNumber(supplyRatePerBlock).div(new BigNumber(usdtMantissa)).times(blocksPerDay).plus(1).pow(daysPerYear).minus(1).times(100);
    var borrowApy = new BigNumber(borrowRatePerBlock).div(new BigNumber(usdtMantissa)).times(blocksPerDay).plus(1).pow(daysPerYear).minus(1).times(100);
    
    var unitroller = new web3.eth.Contract(unitrollerAbi, unitrollerAddress);
    var venusSpeed = await unitroller.methods.venusSpeeds(vUsdtAddress).call();
    var venusPerYear = venusSpeed / 1e18 * blocksPerDay * daysPerYear;
    
    var path = ["0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x55d398326f99059ff775485246999027b3197955"];
    var routerContract = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddress);
    var amountIn = new BigNumber(10).pow(18);
    var amountOut = await routerContract.methods.getAmountsOut(amountIn, path).call();
    var price = amountOut[amountOut.length - 1];
    var theAmount = new BigNumber(price).times(venusPerYear);
    var totalBorrows = await vToken.methods.totalBorrows().call();
    var cash = await vToken.methods.getCash().call();
    var totalReserves = await vToken.methods.totalReserves().call();

    var totalSupply = new BigNumber(totalBorrows).plus(new BigNumber(cash)).minus(new BigNumber(totalReserves));
    var supplyRewardApy = new BigNumber(theAmount).div(totalSupply).times(100);
    var borrowRewardApy = new BigNumber(theAmount).div(totalBorrows).times(100);

    var apy = 0;
    var strategyContract = new web3.eth.Contract(strategyAbi, usdtStrategyAddress);
    var collateral = await strategyContract.methods.collateralTarget().call();
    var factor = new BigNumber(collateral).div(new BigNumber(web3.utils.toWei('1')).minus(collateral))
    var apr = supplyApy.plus(supplyRewardApy).times(factor.plus('1')).minus(factor.times(borrowApy.minus(borrowRewardApy)));
    apy = apr.dividedBy('100').dividedBy(daysPerYear).plus(1).pow(daysPerYear).minus(1).multipliedBy(100)                  // apy = (1 + apr/n)^n - 1

    console.log('APY:', apy.toString(10));

}

runCode();
