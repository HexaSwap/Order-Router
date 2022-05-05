/* eslint-disable node/no-missing-import */
import chai, { expect } from 'chai';
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle';
import { constants, Contract } from 'ethers';
import { defaultAbiCoder, keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { coreFixture } from './shared/fixtures';
import { expandTo18Decimals } from './shared/utilities';

chai.use(solidity);

const TOTAL_SUPPLY = expandTo18Decimals(10000);
const TEST_AMOUNT1 = expandTo18Decimals(50);
const TEST_AMOUNT2 = expandTo18Decimals(100);

describe('HexaFinityERC20', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  });

  const [owner, addr1, addr2] = provider.getWallets();
  const loadFixture = createFixtureLoader([owner], provider);

  let token: Contract;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async () => {
    const fixture = await loadFixture(coreFixture);
    token = fixture.token0;
  });

  describe('Deployment', () => {
    it('name', async () => {
      expect(await token.name()).to.eq('HexaFinity LPs');
    });

    it('symbol', async () => {
      expect(await token.symbol()).to.eq('Hexa-LP');
    });

    it('decimals', async () => {
      expect(await token.decimals()).to.eq(18);
    });

    it('totalSupply', async () => {
      expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    });

    it('balanceOf', async () => {
      expect(await token.balanceOf(owner.address)).to.eq(TOTAL_SUPPLY);
    });

    it('DOMAIN_SEPARATOR', async () => {
      const name = await token.name();
      expect(await token.DOMAIN_SEPARATOR()).to.eq(
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [
              keccak256(
                toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
              ),
              keccak256(toUtf8Bytes(name)),
              keccak256(toUtf8Bytes('1')),
              1,
              token.address,
            ],
          ),
        ),
      );
    });

    it('PERMIT_TYPEHASH', async () => {
      expect(await token.PERMIT_TYPEHASH()).to.eq(
        keccak256(toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')),
      );
    });
  });

  describe('Approve', () => {
    it('Approve should emits an Approval event', async () => {
      await expect(token.approve(addr1.address, TEST_AMOUNT1))
        .to.emit(token, 'Approval')
        .withArgs(owner.address, addr1.address, TEST_AMOUNT1);
      expect(await token.allowance(owner.address, addr1.address)).to.eq(TEST_AMOUNT1);
    });
  });

  describe('Transfer', () => {
    it('Should transfer tokens between accounts', async () => {
      // Transfer 50 tokens from owner to addr1
      await token.transfer(addr1.address, TEST_AMOUNT1);
      expect(await token.balanceOf(addr1.address)).to.eq(TEST_AMOUNT1);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await token.connect(addr1).transfer(addr2.address, TEST_AMOUNT1);
      expect(await token.balanceOf(addr2.address)).to.eq(TEST_AMOUNT1);
    });

    it('Should fail if sender doesn`t have enough tokens', async () => {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(token.connect(addr1).transfer(owner.address, 1)).to.be.reverted;

      // Owner balance shouldn`t have changed
      expect(await token.balanceOf(owner.address)).to.eq(initialOwnerBalance);
    });

    it('Should update balances after transfers', async () => {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1
      await token.transfer(addr1.address, TEST_AMOUNT2);

      // Transfer 50 tokens from owner to addr2
      await token.transfer(addr2.address, TEST_AMOUNT1);

      // Check balance
      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.eq(initialOwnerBalance.sub(TEST_AMOUNT1.add(TEST_AMOUNT2)));
      expect(await token.balanceOf(addr1.address)).to.eq(TEST_AMOUNT2);
      expect(await token.balanceOf(addr2.address)).to.eq(TEST_AMOUNT1);
    });
  });

  describe('TransferFrom', () => {
    it('Should transfer tokens between accounts', async () => {
      // Approve 100 tokens to addr1
      await token.approve(addr1.address, TEST_AMOUNT2);

      // Transfer 100 tokens from owner to addr1
      await expect(token.connect(addr1).transferFrom(owner.address, addr1.address, TEST_AMOUNT2))
        .to.emit(token, 'Transfer')
        .withArgs(owner.address, addr1.address, TEST_AMOUNT2);

      // addr1`s allowance should be 0
      expect(await token.allowance(owner.address, addr1.address)).to.eq(0);

      // check balance
      expect(await token.balanceOf(addr1.address)).to.eq(TEST_AMOUNT2);
      expect(await token.balanceOf(owner.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT2));
    });
  });

  describe('TransferFrom:max', () => {
    it('Should approve MaxUint256', async () => {
      await token.approve(addr1.address, constants.MaxUint256);
      await expect(token.connect(addr1).transferFrom(owner.address, addr1.address, TEST_AMOUNT1))
        .to.emit(token, 'Transfer')
        .withArgs(owner.address, addr1.address, TEST_AMOUNT1);
      expect(await token.allowance(owner.address, addr1.address)).to.eq(constants.MaxUint256);
      expect(await token.balanceOf(owner.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT1));
      expect(await token.balanceOf(addr1.address)).to.eq(TEST_AMOUNT1);
    });
  });
});
