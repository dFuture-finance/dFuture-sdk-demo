const { _TypedDataEncoder } = require("@ethersproject/hash");
const { keccak256 } = require("@ethersproject/keccak256");
const { hexConcat } = require("@ethersproject/bytes");
const { SigningKey } = require("@ethersproject/signing-key");

const CLOSEORDER_TYPEHASH = "0x3c4ad2ad8e3797c83210a6a0f3c1d7275ed32acdeb5c857e3d7f0b2db3128663";
class CloseOrder {
    constructor(
        symbol,
        amount,
        acceptablePrice,
        deadline,
        maker,
        gasLevel,
        couponId,
        couponAmount
    ) {
        this.symbol = symbol;
        this.amount = amount;
        this.acceptablePrice = acceptablePrice;
        this.deadline = deadline;
        this.maker = maker;
        this.gasLevel = gasLevel;
        this.couponId = couponId;
        this.couponAmount = couponAmount;
    }

    async hash( web3_chain ) {
        return keccak256(
            web3_chain.eth.abi.encodeParameters(
                [
                    "bytes32",
                    "bytes32",
                    "uint256",
                    "uint256",
                    "uint256",
                    "address",
                    "uint8",
                    "uint256",
                    "uint256"
                ],
                [
                    CLOSEORDER_TYPEHASH,
                    this.symbol,
                    this.amount,
                    this.acceptablePrice,
                    this.deadline,
                    this.maker,
                    this.gasLevel,
                    this.couponId,
                    this.couponAmount
                ]
            )
        );
    }

    async sign(self, privateKey, web3_chain, chainId) {
        //const chainId = 256; // chain id of ganache
        const domain = {
            name: "dFuture",
            version: "1",
            chainId,
            verifyingContract: self,
        };
        const digest = keccak256(hexConcat([
          "0x1901",
          _TypedDataEncoder.hashDomain(domain),
          await this.hash( web3_chain )
      ]));

      const key = new SigningKey(privateKey);
      const {v, r, s} = key.signDigest(digest);

      return {v, r, s};
    }

    async toArgs(self, privateKey,web3_chain, chainId) {
        const { v, r, s } = await this.sign(self, privateKey, web3_chain, chainId);
        return [
            this.symbol,
            this.amount,
            this.acceptablePrice,
            this.deadline,
            this.maker,
            this.gasLevel,
            this.couponId,
            this.couponAmount,
            v,
            r,
            s,
        ];
    }
}

module.exports = CloseOrder;
