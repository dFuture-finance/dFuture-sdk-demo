const { _TypedDataEncoder } = require("@ethersproject/hash");
const { keccak256 } = require("@ethersproject/keccak256");
const { hexConcat } = require("@ethersproject/bytes");
const { SigningKey } = require("@ethersproject/signing-key");

const CLOSEORDER_TYPEHASH = "0x48fb8cdaeeda15258a71c70d3a317a5244f9ee2a7974763405e0b86478e4cf4a";
class CloseOrder {
    constructor(
        symbol,
        amount,
        acceptablePrice,
        deadline,
        maker,
        gasLevel
    ) {
        this.symbol = symbol;
        this.amount = amount;
        this.acceptablePrice = acceptablePrice;
        this.deadline = deadline;
        this.maker = maker;
        this.gasLevel = gasLevel;
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
                    "uint8"
                ],
                [
                    CLOSEORDER_TYPEHASH,
                    this.symbol,
                    this.amount,
                    this.acceptablePrice,
                    this.deadline,
                    this.maker,
                    this.gasLevel
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
            v,
            r,
            s,
        ];
    }
}

module.exports = CloseOrder;
