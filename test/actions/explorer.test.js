import { expect } from 'chai';
import sinon from 'sinon';
import FakeProvider from 'web3-fake-provider';
import moment from 'moment';

import { loadContracts } from '../../src/actions/explorer';
import getWeb3 from '../../src/util/web3/getWeb3';

describe('ExplorerAction', () => {
  let dispatchSpy;
  let showErrorMessageSpy;
  let mockWindow;
  beforeEach(() => {
    dispatchSpy = sinon.spy();
    showErrorMessageSpy = sinon.spy();
    mockWindow = {
      addEventListener(event, cb) {
        if (event === 'load') { cb(); }
      },
    };
  });

  // helper to create a mock provider
  function getMockProvider() {
    const mockProvider = new FakeProvider();
    mockProvider.isMetaMask = true;
    // mockProvider.host = 'ws://remotenode.com:8546';
    return mockProvider;
  }

  // helper to setup window parameters
  function setupWindow({ provider, accounts }) {
    Object.assign(mockWindow, {
      web3: {
        currentProvider: provider,
        eth: {accounts},
      },
    });
  }

  it('should dispatch loading and then error if web3 is undefined', () => {
    const dispatchSpy = sinon.spy();
    const deployParams = {
      web3: null
    };
    const loadContractAction = loadContracts(deployParams, {});
    loadContractAction(dispatchSpy);
    expect(dispatchSpy).to.have.property('callCount', 2);

    expect(dispatchSpy.args[0][0].type).to.equals('GET_CONTRACTS_PENDING');
    expect(dispatchSpy.args[1][0].type).to.equals('GET_CONTRACTS_REJECTED');
  });

  it('should dispatch loading and then fulfilled if web3 is present', async () => {
    const mockProvider = getMockProvider();
    setupWindow({ provider: mockProvider, accounts: [{}] }); // accounts must not be empty

    await getWeb3(mockWindow, showErrorMessageSpy, dispatchSpy);

    const dispatchCall = dispatchSpy.getCall(0);
    const web3Instance = dispatchCall.args[0].payload.web3Instance;
    // expect(web3Instance.currentProvider.host).to.equals(defaultProviderHost);

    const deployParams = {
      contractSpecs: {
        priceFloor: 0,
        priceCap: 50,
        priceDecimalPlaces: 2,
        qtyMultiplier: 2,
        expirationTimeStamp: moment().add(1, 'days')

      },
      web3: web3Instance
    };
    const loadContractAction = loadContracts(deployParams, {});
    loadContractAction(dispatchSpy);
    expect(dispatchSpy.args[0][0].type).to.equals('WEB3_INITIALIZED');
    expect(dispatchSpy.args[1][0].type).to.equals('GET_CONTRACTS_PENDING');
  });

});
