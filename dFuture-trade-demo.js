const Web3 = require("web3");
const fs = require('fs');
const EthereumTx = require('ethereumjs-tx');
const OpenOrder = require("./offline-open-order");
const CloseOrder = require("./offline-close-order");
const sleep = require("sleep");
const { utils } = require('ethers');
var crypto = require('crypto');
const axios = require("axios");
let e18str = "000000000000000000";
//**************//参数设置
const curCommonPath = "./abi/"
const args = process.argv.slice(2)
console.log( "current select chain:", args[0]);
let config = null;
if( args[0] == "heco" ){
    config = require('./heco-config');
} else if ( args[0] == "bsc" ) {
    config = require('./bsc-config');
} else {
    console.log("plase select heco or bsc params");
    process.exit()
}
let FUTURE_ADDRESS = config.FUTURE_ADDRESS
let USDT_ADDRESS = config.USDT_ADDRESS
let PROVIDER_URL = config.PROVIDER_URL

const GAS_LIMIT = Web3.utils.toHex(5000000) //500万
let CURRENT_GAS_PRICE = 40000000000;
const PRIVATE_KEY = "0x" + config.PRIVATE_KEY
let ORDER_DIRECTION = 1; //1 看多，-1 看空
var symbol = Web3.utils.fromAscii;

const ABI_FILE_PATH = curCommonPath + "FuturePerpetual.json"
const ABI_USDT_FILE_PATH = curCommonPath + "usdt.json"
//定时配置
let web3_rops = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL))
var usdt_parsed = JSON.parse(fs.readFileSync(ABI_USDT_FILE_PATH));
var usdt_abi = usdt_parsed.abi
let usdt_contract = new web3_rops.eth.Contract(usdt_abi, USDT_ADDRESS);
var parsed = JSON.parse(fs.readFileSync(ABI_FILE_PATH));
var abi = parsed.abi
let future_contract = new web3_rops.eth.Contract(abi, FUTURE_ADDRESS);
//私钥转换为账号
const account = web3_rops.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
//私钥对应的账号地地址
const account_address = account.address
let last_openposition_status = true;
let nonce_number = 0;
let lastInitWeb3Time = 0;
var BN = Web3.utils.BN;
/**
 * 初始web3和合约
 */
async function  initWeb3Contract() {
    let currentDateTime = new Date();
    if( (currentDateTime - lastInitWeb3Time ) < 60 ){
        return;
    }
    lastInitWeb3Time = new Date();
    console.log("start initWeb3Contract lastInitWeb3Time:",lastInitWeb3Time,"currentDateTime:",currentDateTime);
    // web3_rops = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));
    usdt_contract = new web3_rops.eth.Contract(usdt_abi, USDT_ADDRESS);
    future_contract = new web3_rops.eth.Contract(abi, FUTURE_ADDRESS);
}

/**
 * 初始web3和合约
 */
async function  getCurGasPrice() {
    CURRENT_GAS_PRICE = await web3_rops.eth.getGasPrice();
    if( CURRENT_GAS_PRICE > 50*1e9 ){
        CURRENT_GAS_PRICE = 50*1e9;
    }
    CURRENT_GAS_PRICE = CURRENT_GAS_PRICE * config.GAS_PRICE_MULTIPLE;
    if( last_openposition_status == false ) {
        CURRENT_GAS_PRICE = config.OPEN_POSITION_FAIL_GAS_PRICE
    }
    console.log("CURRENT_GAS_PRICE:",CURRENT_GAS_PRICE/10**9,"Gwei"," last_openposition_status:",last_openposition_status);
    return CURRENT_GAS_PRICE;
}

/**
 * 构建deadline
 * @param {} fp
 * @returns
 */
async function deadlineOfOrderMaker(nonce_increase) {
    const block = await web3_rops.eth.getBlock('latest');
    const timestamp =  new BN(block.timestamp);
    let latest = (await timestamp).toNumber() + config.DeadlineSecond;
    let nonce = Number(nonce_increase);
    console.log("deadlineOfOrderMaker,nonce:",nonce,"latest:",latest, "DeadlineSecond:",config.DeadlineSecond);
    let b = new BN(nonce);
    let t = new BN(latest);
    let deadline = b.shln(192).add(t).toString(10);
    return deadline;
}
/**
 * 发送rpc交易
 */
 const sendRpcTrx = async (httpEndpoint, params ) => {
    try {

        let curTimestamp = Date.now();
        let accessKey = config.ACCESS_KEY
        let accessSk = config.ACCESS_SK
        var content = accessKey+"&"+curTimestamp.toString()+"&"+accessSk;
        var result = crypto.createHash('md5').update(content).digest("hex")
        console.log("token content:",content,"md5:",result);
        let headersMap = {
            headers: {
               'content-type': 'application/json',
               "accessKey":accessKey,
               "accessTime":curTimestamp.toString(),
               "token":result
            }
          }
        console.log("sendRpcTrx param:",JSON.stringify(params));
        let res = await axios.post(httpEndpoint, params,headersMap);
        console.log("sendRpcTrx resdata:",res["data"]);
        if( res["data"]["code"] ==  200){
            let retryCnt = 10;
            while(retryCnt > 0 ){
                retryCnt -= 1;
                let receipt = await web3_rops.eth.getTransactionReceipt(res["data"]["data"]["txHash"]);
                console.log("retry query hash:",res["data"]["data"]["txHash"]," retryCnt:",retryCnt);
                if( receipt != null ) {
                    console.log("retry query hash:",res["data"]["data"]["txHash"]," exec success ");
                    break;
                }
                sleep.msleep(1000);
            }
        }

    } catch (e) {
        console.log("sendRpcTrx error,",e);
    }
}

/**
 * 开仓
 */
async function openPositionWithPrice() {
    try {
        ORDER_DIRECTION = ORDER_DIRECTION == 1 ? -1:1;
        const ordermaker = config.ACCOUNT_ADDRESS;
        const makerPrivateKey = "0x" + config.PRIVATE_KEY
        let nonce  = await future_contract.methods.queryNonce(config.ACCOUNT_ADDRESS).call();
        let deadline = await deadlineOfOrderMaker( Number(nonce) + 1 );
        let openOrder = new OpenOrder(
          utils.formatBytes32String(config.symbol),
          config.handleAmount,
          ORDER_DIRECTION,
          config.ACCEPTABLE_PRICE,
          config.approveUsdt.toString() + e18str,
          config.PARAENT_ADDRESS,
          config.WITH_DISCOUNT,
          deadline,
          ordermaker,
          config.GAS_LEVEL
        );
        let args = await openOrder.toArgs(FUTURE_ADDRESS, makerPrivateKey, web3_rops, config.CHAIN_ID);
        console.log("args:",args);
        const params = {
            "symbol": args[0],
            "amount": args[1],
            "direction": args[2],
            "acceptablePrice": args[3],
            "approvedUsdt": args[4],
            "parent": args[5],
            "withDiscount": args[6],
            "deadline": args[7],
            "maker": args[8],
            "gasLevel": args[9],
            "r": args[11],
            "s": args[12],
            "v": args[10]
        };
        await sendRpcTrx(config.OpenPositionUrl, params);
    } catch (error) {
        console.log("openPositionWithPrice error:",error);
    }
}

/**
 * 关仓
 */
async function closePositionWithPrice(){
    try {
        const ordermaker = config.ACCOUNT_ADDRESS;
        const makerPrivateKey = "0x" + config.PRIVATE_KEY
        let nonce  = await future_contract.methods.queryNonce(config.ACCOUNT_ADDRESS).call();
        let deadline = await deadlineOfOrderMaker( Number(nonce) + 1 );
        let closeOrder = new CloseOrder(
            utils.formatBytes32String(config.symbol),
            config.handleAmount,
            0,
            deadline,
            ordermaker,
            config.GAS_LEVEL
        );
        let args = await closeOrder.toArgs(FUTURE_ADDRESS, makerPrivateKey, web3_rops, config.CHAIN_ID);
        console.log("args:",args);
        const params = {
            "acceptablePrice": args[2],
            "amount": args[1],
            "deadline": args[3],
            "gasLevel": args[5],
            "maker": args[4],
            "r": args[7],
            "s": args[8],
            "symbol": args[0],
            "v": args[6]
        };
        await sendRpcTrx(config.ClosePositionUrl, params);
    } catch (error) {
        console.log("closePositionWithPrice error:",error);
    }

}
/**
 * 构建交易
 * @returns {Promise<void>}
 */
async function generateApproveTx() {
   try {
      console.log("start generateApproveTx account_address: ",account_address)
      //获取nonce,使用本地私钥发送交易
      await getCurGasPrice();
      nonce_number = await web3_rops.eth.getTransactionCount(account_address).then();
      let current_nonce = nonce_number;
      console.log("generateApproveTx nonce: ",current_nonce)
      const txParams = {
               nonce: current_nonce,
               gasPrice: Web3.utils.toHex(CURRENT_GAS_PRICE),
               gasLimit: GAS_LIMIT,
               to: USDT_ADDRESS,
               data: usdt_contract.methods.approve(FUTURE_ADDRESS, "1000000000" + e18str ).encodeABI(),
         }
      const tx = new EthereumTx(txParams)
      tx.sign(Buffer.from(PRIVATE_KEY.slice(2), 'hex'))
      const serializedTx = await tx.serialize()
      await web3_rops.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).once('transactionHash', function(hash){
        console.log("generateApproveTx transaction exec success, hash:",hash," current_nonce:",current_nonce);
    })
      return true;
   } catch (error) {
      console.log("sendSignedTransaction generateApproveTx error:",error);
   }
   return false;
}

 /**
 * 程序入口
 * @returns {Promise<void>}
 */
async function dFutureDemo() {
    try {
        await initWeb3Contract();
        //第一次开仓需要approve操作
        await generateApproveTx();
        //查询开仓config.handleAmount手手续费
        let feeAndRatio = await future_contract.methods.queryPositionFeeAndRatio(symbol(config.symbol),config.handleAmount ,1, true).call();
        console.log("account:",config.ACCOUNT_ADDRESS,"queryPositionFeeAndRatio:",feeAndRatio);

        //开仓
        await openPositionWithPrice();
        sleep.msleep(3000);
        //获取用户持仓
        let PositionInfo = await future_contract.methods.queryPosition(config.ACCOUNT_ADDRESS,symbol(config.symbol)).call();
        console.log("account:",config.ACCOUNT_ADDRESS,"symbol:",config.symbol,"queryPosition:",PositionInfo);

        //获取账户信息
        let HolderInfo = await future_contract.methods.queryHolderInfo(config.ACCOUNT_ADDRESS,symbol(config.symbol)).call();
        console.log("account:",config.ACCOUNT_ADDRESS,"symbol:",config.symbol,"HolderInfo:",HolderInfo);

        //查询持仓利息
        let interestRatio = await future_contract.methods.queryInterestRatio(symbol(config.symbol), 0).call();
        console.log("account:",config.ACCOUNT_ADDRESS,"queryInterestRatio:",interestRatio);

        //关仓
        await closePositionWithPrice();
    } catch (error) {
        console.log( "execption Error :", error );
    }
};
dFutureDemo()
