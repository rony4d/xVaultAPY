const Web3 = require('web3');
const BigNumber = require('bignumber.js')

const web3 = new Web3('https://bsc-dataseed.binance.org/');

// for usdt
const vault = {
    address: '0x40f3f93795dA825c5DD353e3850685ed8fFe3b55',
    strategies: [
      '0x9Ba4A8C5CE226A1daC42B9D2ba5bFe62eF545Fc9'
    ]
  }

const wantAddress = '0x55d398326f99059ff775485246999027b3197955'

// // for usdc
// const vault = {
//   address: '0xe9629a6dcaab278aafdef20cd85e94b7bb93990c',
//   strategies: [
//     '0x998d139B7e9Ce5e98741aD75305fE6f2D81Aa2D9'
//   ]
// }
// const wantAddress = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'

// // for busd
// const vault = {
//   address: '0xeef340100b77b1574147a30d11b2bd76b26ed19c',
//   strategies: [
//     '0x7D6E27AbAd389F09535ba4c15719f5f16DBDc3Fc'
//   ]
// }

// const wantAddress = '0xe9e7cea3dedca5984780bafc599bd69add087d56'

async function runCode() {
  const vaultAbi = require('../abi/vault.json')
  const strategyAbi = require('../abi/strategy.json')
  const xvsAddress = '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63'

  const vaultContract = new web3.eth.Contract(vaultAbi, vault.address);
  const strategyContract = new web3.eth.Contract(strategyAbi, vault.strategies[0]);

  const flashLoanFee = 0.0003
  const collateral = 73

  const now = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp
  const lastReport = (await vaultContract.methods.strategies(vault.strategies[0]).call()).lastReport
  const elapsedTime = parseInt(now) - parseInt(lastReport)

  const accXVS = await strategyContract.methods.predictXvsAccrued().call()
  const ValueOfXVS = await strategyContract.methods.priceCheck(xvsAddress, wantAddress, accXVS).call()

  const rateLimit = new BigNumber(ValueOfXVS).div(flashLoanFee * collateral / (100 -collateral)).div(elapsedTime)
  console.log('rateLimit:', web3.utils.fromWei(parseInt(rateLimit).toString()))
}

runCode();
