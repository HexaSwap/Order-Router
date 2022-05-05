import { network, run } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

export const ROUTER_DID = 'ROUTER_DID';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Compile contracts
  await run('compile');
  console.log('Compiled contracts.');

  const networkName = network.name;

  console.log('Deploying to network:', networkName);

  console.log('Deploying HexaFinityRouter...');

  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await getNamedAccounts();

  const factory = await get('HexaFinityFactory');
  const wbnb = await get('WBNB');

  const deployment = await deploy('HexaFinityRouter', {
    from: deployer,
    args: [factory.address, wbnb.address],
    log: true,
  });

  try {
    await run('verify:verify', {
      address: deployment.address,
      constructorArguments: [factory.address, wbnb.address, ''],
    });
    console.log('HexaFinityRouter verify success');
  } catch (e) {
    console.log(e);
  }
};

export default func;
func.id = ROUTER_DID;
func.tags = ['local', 'testnet', 'mainnet', 'exchange-protocol', 'router', ROUTER_DID];
