class config {}
config.symbol = "btc"  //开仓的标的
config.handleAmount = 1; //开仓的手数，即btc最小为1，eth最小为10
config.approveUsdt = 10 //开仓每笔花费的U
config.tradeScheduleRobot = "10 */1 * * * *";
config.isImmediateClose = false; //开完仓位是否立即关仓
config.GAS_PRICE_MULTIPLE = 1;
config.OpenPositionUrl = "https://openoracle_prod_bsc.dfuture.com/dev/web/sendOpenPosition"
config.ClosePositionUrl = "https://openoracle_prod_bsc.dfuture.com/dev/web/sendClosePosition"
config.DeadlineSecond = 60  //开关仓截止期限，秒
config.ACCESS_KEY = "a592de6cf37b558"  // public test key, with requests freq limitation
config.ACCESS_SK = "9542773ba2cf148d3558" // public test key, with requests freq limitation
config.GAS_LEVEL = 12 //gas等级
config.ACCEPTABLE_PRICE = 0 //可接受的价格
config.WITH_DISCOUNT = 1 //是否可享受折扣
config.CHAIN_ID = 56
config.OPEN_POSITION_FAIL_GAS_PRICE = 21*1e9
config.FUTURE_ADDRESS = "0xc67eC5cbcE3E9aB546CF6077Dd2ad519887737BA"
config.USDT_ADDRESS = "0x55d398326f99059ff775485246999027b3197955"
config.PARAENT_ADDRESS = '0xAfc3DAFBB4296Ac80352685E334B95bf6F496e7F'
config.ACCOUNT_ADDRESS = "***" //账号地址
config.PRIVATE_KEY = "***" //私钥开头不需要加0x
config.PROVIDER_URL = "https://bsc-dataseed.binance.org/"

module.exports = config
