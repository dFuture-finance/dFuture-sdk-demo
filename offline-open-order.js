const { _TypedDataEncoder } = require("@ethersproject/hash");
const { keccak256 } = require("@ethersproject/keccak256");
const { hexConcat } = require("@ethersproject/bytes");
const { SigningKey } = require("@ethersproject/signing-key");

const OPENORDER_TYPEHASH = "0xe87416872b44edd404861b2c9fd4150137a52afee7f92f32c8c0545692af057a";
class OpenOrder {

    constructor(
        symbol,
        amount,
        direction,
        acceptablePrice,
        approvedUsdt,
        parent,
        withDiscount,
        deadline,
        maker,
        gasLevel
    ) {
        this.symbol = symbol;
        this.amount = amount;
        this.direction = direction;
        this.acceptablePrice = acceptablePrice;
        this.approvedUsdt = approvedUsdt;
        this.parent = parent;
        this.withDiscount = withDiscount;
        this.deadline = deadline;
        this.maker = maker;
        this.gasLevel = gasLevel;
    }

    async hash(web3_rops) {
        return keccak256(
            // defaultAbiCoder.encode(
                web3_rops.eth.abi.encodeParameters(
                [
                    "bytes32",
                    "bytes32",
                    "uint256",
                    "int8",
                    "uint256",
                    "uint256",
                    "address",
                    "bool",
                    "uint256",
                    "address",
                    "uint8"
                ],
                [
                    OPENORDER_TYPEHASH,
                    this.symbol,
                    this.amount,
                    this.direction,
                    this.acceptablePrice,
                    this.approvedUsdt,
                    this.parent,
                    this.withDiscount,
                    this.deadline,
                    this.maker,
                    this.gasLevel
                ]
            )
        );
    }

    async sign(masterContract, privateKey,web3_rops, chainId) {
        //const chainId = 256; // chain id of ganache
        const domain = {
            name: "dFuture",
            version: "1",
            chainId,
            verifyingContract: masterContract,
        };
        console.log("masterContract");
        const digest = keccak256(hexConcat([
          "0x1901",
          _TypedDataEncoder.hashDomain(domain),
          await this.hash(web3_rops)
      ]));

      const key = new SigningKey(privateKey);
      const {v, r, s} = key.signDigest(digest);
    //   console.log(`
    //     OpenOrder:
    //     domain hash: ${_TypedDataEncoder.hashDomain(domain)}
    //     order  hash: ${await this.hash()}
    //     digest     : ${digest}
    //     privatekey : ${privateKey}
    //     v: ${v}
    //     r: ${r}
    //     s: ${s}
    //   `)

      return {v, r, s};
    }

    async toArgs(masterContract, privateKey,web3_rops, chainId) {
        const { v, r, s } = await this.sign(masterContract, privateKey,web3_rops, chainId);
        return [
            this.symbol,
            this.amount,
            this.direction,
            this.acceptablePrice,
            this.approvedUsdt,
            this.parent,
            this.withDiscount,
            this.deadline,
            this.maker,
            this.gasLevel,
            v,
            r,
            s,
        ];
    }
}

module.exports = OpenOrder;
