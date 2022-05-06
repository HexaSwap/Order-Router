import { network, run } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import config from '../config';

export const ROUTER_DID = 'ROUTER_DID';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Compile contracts
  await run('compile');
  console.log('Compiled contracts.');

  const networkName = network.name;

  console.log('Deploying to network:', networkName);

  console.log('Deploying HexaFinityRouter...');

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  // @ts-ignore
  const factory = config.HexaFinityFactory[networkName];
  // @ts-ignore
  const wbnb = config.WBNB[networkName];
  // @ts-ignore
  const feeToSeeter = config.FeeToSetter[networkName];

  const deployment = await deploy('HexaFinityRouter', {
    from: deployer,
    args: [factory, wbnb, feeToSeeter],
    log: true,
  });

  console.log('HexaFinityRouter deployed to ', deployment.address);
};

export default func;
func.id = ROUTER_DID;
func.tags = ['local', 'testnet', 'mainnet', 'exchange-protocol', 'router', ROUTER_DID];
