# dFuture-trade-demo
dFuture-trade-demo

## 1.安装依赖包
```bash
npm install
```
## 2.修改参数
修改bsc-config.js,heco-config.js两配置文件的账号和私钥，以及key
```bash
cd dFuture-trade-demo/
vim heco-config.js
vim bsc-config.js
修改这两个参数为自己的账号和私钥，私钥不需要加0x.
config.ACCOUNT_ADDRESS
config.PRIVATE_KEY
config.ACCESS_KEY
config.ACCESS_SK
```
## 3.启动
启动heco链
```bash
node dFuture-trade-demo.js heco
```
启动bsc链
```bash
node dFuture-trade-demo.js bsc
```

## 4.文档
开平仓 API 文档请查看 DFuture_SDK_V1.0.pdf
线上合约接口请查看 dFuture_Contract_Interface.pdf
