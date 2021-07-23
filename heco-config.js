class config {}
config.symbol = "btc"  //开仓的标的
config.handleAmount = 1; //开仓的手数，即btc最小为1，eth最小为10
config.approveUsdt = 10 //开仓每笔花费的U
config.tradeScheduleRobot = "10 */1 * * * *";
config.isImmediateClose = false; //开完仓位是否立即关仓
config.GAS_PRICE_MULTIPLE = 2;
config.OpenPositionUrl = "https://openoracle_prod_heco.dfuture.com/dev/web/sendOpenPosition"
config.ClosePositionUrl = "https://openoracle_prod_heco.dfuture.com/dev/web/sendClosePosition"
config.DeadlineSecond = 60  //开关仓截止期限，秒
config.ACCESS_KEY = "8967778135e4754"   // public test key, with requests freq limitation
config.ACCESS_SK = "f195e1be47b962625626"  // public test key, with requests freq limitation
config.GAS_LEVEL = 2 //gas等级
config.ACCEPTABLE_PRICE = 0 //可接受的价格
config.WITH_DISCOUNT = 1 //是否可享受折扣
config.CHAIN_ID = 128
config.OPEN_POSITION_FAIL_GAS_PRICE = 11*1e9
config.FUTURE_ADDRESS = "0x917e091cc000012bbd58afFa8E6DbB96fa06cb0a"
config.USDT_ADDRESS = "0xa71edc38d189767582c38a3145b5873052c3e47a"
config.PARAENT_ADDRESS = '0xAfc3DAFBB4296Ac80352685E334B95bf6F496e7F'
config.ACCOUNT_ADDRESS = "***" //账号地址
config.PRIVATE_KEY = "***" //私钥开头不需要加0x
config.PROVIDER_URL = "https://http-mainnet-node.huobichain.com"

module.exports = config
