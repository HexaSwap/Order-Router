/* eslint-disable node/no-missing-import */
import chai, { expect } from 'chai';
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle';
import { BigNumber, constants, Contract } from 'ethers';
import { getCreate2Address } from './shared/utilities';

import { coreFixture } from './shared/fixtures';
import { artifacts } from 'hardhat';
import { Artifact } from 'hardhat/types';

chai.use(solidity);

describe('HexaFinityFactory contract', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  });

  const [owner, other] = provider.getWallets();
  const loadFixture = createFixtureLoader([owner], provider);

  let factory: Contract;
  let HexaFinityPair: Artifact;

  const TEST_ADDRESSES: [string, string] = [
    '0x1000000000000000000000000000000000000000',
    '0x2000000000000000000000000000000000000000',
  ];

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async () => {
    const fixture = await loadFixture(coreFixture);
    factory = fixture.factory;
    HexaFinityPair = await artifacts.readArtifact('HexaFinityPair');
  });

  describe('Deployment', () => {
    it('feeTo, feeToSetter, allPairsLength', async () => {
      // feeTo should be zero address
      expect(await factory.feeTo()).to.eq(constants.AddressZero);
      // feeToSetter should be same when set in constructor
      expect(await factory.feeToSetter()).to.eq(owner.address);
      // allPairsLength should be 0
      expect(await factory.allPairsLength()).to.eq(2);
    });
  });

  async function createPair(tokens: [string, string]) {
    const bytecode = HexaFinityPair.bytecode;
    const create2Address = getCreate2Address(factory.address, tokens, bytecode);
    await expect(factory.createPair(...tokens))
      .to.emit(factory, 'PairCreated')
      .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, BigNumber.from(3));

    await expect(factory.createPair(...tokens)).to.be.revertedWith('HexaFinity: PAIR_EXISTS');
    await expect(factory.createPair(...tokens.slice().reverse())).to.be.revertedWith('HexaFinity: PAIR_EXISTS');
    expect(await factory.getPair(...tokens)).to.eq(create2Address);
    expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address);
    expect(await factory.allPairs(2)).to.eq(create2Address);
    expect(await factory.allPairsLength()).to.eq(3);

    const pair = new Contract(create2Address, JSON.stringify(HexaFinityPair.abi), provider);
    expect(await pair.factory()).to.eq(factory.address);
    expect(await pair.token0()).to.eq(TEST_ADDRESSES[0]);
    expect(await pair.token1()).to.eq(TEST_ADDRESSES[1]);
  }

  describe('Create pair', () => {
    it('createPair', async () => {
      await createPair(TEST_ADDRESSES);
    });

    it('createPair:reverse', async () => {
      await createPair(TEST_ADDRESSES.slice().reverse() as [string, string]);
    });

    it('createPair:gas', async () => {
      const tx = await factory.createPair(...TEST_ADDRESSES);
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.eq(2529024);
    });
  });

  describe('setFeeTo', () => {
    it('setFeeTo', async () => {
      await factory.setFeeTo(other.address);
      expect(await factory.feeTo()).to.eq(other.address);
    });

    it('setFeeTo:Forbidden', async () => {
      // feeToSetter can only change the feeTo, otherwise it is forbidden.
      await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWith('HexaFinity: FORBIDDEN');
    });
  });

  describe('setFeeToSetter', () => {
    it('setFeeToSetter', async () => {
      await factory.setFeeToSetter(other.address);
      expect(await factory.feeToSetter()).to.eq(other.address);
    });

    it('setFeeToSetter:Forbidden', async () => {
      // feeToSetter can only change the feeTo, otherwise it is forbidden.
      await expect(factory.connect(other).setFeeToSetter(other.address)).to.be.revertedWith('HexaFinity: FORBIDDEN');
    });
  });
});
