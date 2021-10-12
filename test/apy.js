
const Web3 = require('web3');

// const { formatUnits } = require('@ethersproject/units');
// const { Zero } = require('@ethersproject/constants');
const vUsdtAbi = require('../abi/vUsdtAbi.json');
const unitrollerAbi = require('../abi/unitrollerAbi.json');
const uniswapRouterAbi = require('../abi/UniswapRouterAbi.json');

const vUsdtAddress = "0xfd5840cd36d94d7229439859c0112a4185bc0255";
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
    var vTokenTotalSupply = await vToken.methods.totalSupply().call();

    var supplyApy = (((Math.pow((supplyRatePerBlock / usdtMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
    var borrowApy = (((Math.pow((borrowRatePerBlock / usdtMantissa * blocksPerDay) + 1, daysPerYear))) - 1) * 100;
    
    var unitroller = new web3.eth.Contract(unitrollerAbi, unitrollerAddress);
    var venusSpeed = await unitroller.methods.venusSpeeds(vUsdtAddress).call();
    var venusPerYear = venusSpeed / 1e18 * blocksPerDay * daysPerYear;
    
    var path = ["0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x55d398326f99059ff775485246999027b3197955"];
    var routerContract = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddress);
    var amountIn = venusPerYear*1e11;
    var amounts = await routerContract.methods.getAmountsOut(amountIn.toString(), path).call();
    var theAmount = amounts[amounts.length - 1];
    // const vTokenTotalSupply = await vToken.methods.totalSupply().call();
    var rewardApy = theAmount / vTokenTotalSupply;
    
    var apy = (supplyApy + rewardApy) + 3 * (supplyApy + 2 * rewardApy - borrowApy);
    console.log(apy);

}

runCode();
