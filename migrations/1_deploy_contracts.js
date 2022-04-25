// const PancakeFactoryV2 = artifacts.require("PancakeFactoryV2");

// let addressFeeSetter = "0x4E7C949ae02b253F6FEFBe99D07F2fd6aC873f35";

// module.exports = function (deployer) {
//   deployer.deploy(PancakeFactoryV2, addressFeeSetter);
// };

const PancakeRouterV2 = artifacts.require("PancakeRouterV2");

let weth = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
let factory = "0x46E9aD48575d08072E9A05a9BDE4F22973628A8E";
let addressFeeSetter = "0xe5D1cb60cb065bf23d3022D02a205D829Feb9831";

module.exports = function (deployer) {
  deployer.deploy(PancakeRouterV2, factory, weth, addressFeeSetter);
};
