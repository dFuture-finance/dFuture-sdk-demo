import json
import hashlib
import os
import time
import requests
import binascii
from web3 import Web3

import offlineOpen
import offlineClose

providerAddr = 'https://http-mainnet-node.huobichain.com'
w3 = Web3(Web3.HTTPProvider(providerAddr))
FPABIFILE = "./abi/FuturePerpetual.json"
FPADDR = '0x917e091cc000012bbd58afFa8E6DbB96fa06cb0a'
with open(FPABIFILE) as fp:
    fpabi = json.loads(fp.read())

FPHANDLER = w3.eth.contract(abi=fpabi, address=FPADDR)
MUL = 20
USDTDEC = 1e18
openUrl = 'https://openoracle_prod_heco.dfuture.com/dev/web/sendOpenPosition'
closeUrl = 'https://openoracle_prod_heco.dfuture.com/dev/web/sendClosePosition'
ack = '8967778135e4754'
ask = 'f195e1be47b962625626'

#use your root
root = ''
# use your address pk and sk
pk = ''
sk = ''

def doOpen(user, usersk, sym, amount, dire, total, deadline, gasfee):
    openpara = getOpenPara(user, sym, amount, dire, 0, int(total/MUL*USDTDEC), deadline, gasfee)
    args = offlineOpen.toArgs(openpara, usersk)
    openpara['approvedUsdt'] = str(openpara['approvedUsdt'])
    openpara['v'] = args[0]
    print(f'{"*"*10}{hex(args[1])}, {hex(args[2])}')
    openpara['r'] = '0x'+hex(args[1])[2:].rjust(64,'0')
    openpara['s'] = '0x'+hex(args[2])[2:].rjust(64,'0')
    print(f'{"*"*10}{openpara["r"]}, {openpara["s"]}')
    openpara['accessKey'] = '123'
    print(f'{openpara}')
    header = getHeader()
    r = requests.post(url=openUrl,data=json.dumps(openpara),headers = header)
    print(f'post res {r.text}')
    res = json.loads(r.text)
    print(type(res), res)
    if res['success']:
        trxReceipt = w3.eth.waitForTransactionReceipt(res['data']['txHash'])
        print(f'res: {trxReceipt}')
        return trxReceipt['status']
    print(res)
    return False

def getHeader():
    header = {}
    header["Content-Type"] = "application/json"
    header["accessKey"] = ack
    header["accessTime"] = str(int(time.time()*1000))
    md5org = "&".join(list(header.values())[1:])+"&"+ask
    header["token"] = hashlib.md5(md5org.encode()).hexdigest()
    print(f"header is {md5org} {header}")
    return header

def doClose(user, usersk, symbol, amount, ac, deadline, gasfee):
    closepara = getClosePara(user, symbol, amount, ac, deadline, gasfee)
    args = offlineClose.toArgs(closepara, usersk)
    closepara['v'] = args[0]
    closepara['r'] = '0x'+hex(args[1])[2:].rjust(64,'0')
    closepara['s'] = '0x'+hex(args[2])[2:].rjust(64,'0')
    closepara['accessKey'] = '123'
    print(f'{closepara}')
    header = getHeader()
    r = requests.post(url=closeUrl,data=json.dumps(closepara),headers=header)
    res = json.loads(r.text)
    print(type(res), res)
    if res['success']:
        trxReceipt = w3.eth.waitForTransactionReceipt(res['data']['txHash'])
        print(f'res: {trxReceipt}')
        return trxReceipt['status']
    print(res)
    return False

def getClosePara(user, symbol, amount, ac, deadline, gasfee):
    sym = binascii.hexlify(symbol.encode()).decode()
    para = {
        'symbol': '0x'+sym.ljust(64, '0'),
        'amount': amount,
        'acceptablePrice': ac,
        'deadline': deadline,
        'maker': user,
        'gasLevel': gasfee
    }

    return para

def getOpenPara(user, symbol, amount, direction, ac, ap, deadline, gasfee):
    sym = binascii.hexlify(symbol.encode()).decode()
    para =  {
            'symbol': '0x'+sym.ljust(64, '0'),
            'amount': amount,
            'direction': direction,
            'acceptablePrice': ac,
            'approvedUsdt': ap,
            'parent': root,
            'withDiscount': True,
            'deadline': deadline,
            'maker': user,
            'gasLevel': gasfee
        }
    return para


def getNonce(user):
    nonce = FPHANDLER.functions.queryNonce(user).call()
    nonce+=1
    ts = nonce << (256-64)
    ts += int(time.time()+300)
    print(f'nonce {nonce}, {ts}')
    return ts

def openallPosition(user, usersk, sym, dire):
    total = 100 # 交易金额U,决定了杠杆倍数
    amount = 2 # 交易多少手
    gasfee = 10
    ts = getNonce(user)
    doOpen(user, usersk, sym, amount, dire, total, ts, gasfee)
    time.sleep(10)
    ts = getNonce(user)
    doClose(user, usersk, sym, amount, 0, ts, gasfee)

if __name__ == '__main__':
    dire = 1
    openallPosition(pk, sk, 'btc', dire)

