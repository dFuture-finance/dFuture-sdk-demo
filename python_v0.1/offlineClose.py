# Make a unique domain
from py_eth_sig_utils.signing import *

FPADDR = '0x917e091cc000012bbd58afFa8E6DbB96fa06cb0a'
chainId = 128


data = {
    "types": {
        "EIP712Domain": [
            { "name": 'name', "type": 'string' },
            { "name": 'version', "type": 'string' },
            { "name": 'chainId', "type": 'uint256' },
            { "name": 'verifyingContract', "type": 'address' },
        ],
        "CloseOrder": [
            { "name": 'symbol', "type": 'bytes32' },
            { "name": 'amount', "type": 'uint256' },
            { "name": 'acceptablePrice', "type": 'uint256' },
            { "name": 'deadline', "type": 'uint256' },
            { "name": 'maker', "type": 'address' },
            { "name": 'gasLevel', "type": 'uint8' }
        ],
    },
    "primaryType": 'CloseOrder',
    "domain": {
        "name": 'dFuture',
        "version": '1',
        "chainId": chainId,
        'verifyingContract':FPADDR
    }
}

def toArgs(datadict, private_key):
    data['message'] = datadict
    pk = bytes.fromhex(private_key)
    s1 = sign_typed_data(data,pk)
    return s1


