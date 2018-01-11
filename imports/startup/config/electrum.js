let electrumServers = {
  KMD: {
  address: 'electrum.cipig.net',
  port: 10001,
  proto: 'tcp',
  txfee: 00000,
  coin: 'KMD',
  altserverList: [
    'electrum1.cipig.net:10000',
    'electrum2.cipig.net:10000'
  ],
},
MNZ: {
  address: 'electrum.cipig.net',
  port: 10002,
  proto: 'tcp',
  txfee: 10000,
  coin: 'MNZ',
  altserverList: [
    'electrum1.cipig.net:10000',
    'electrum2.cipig.net:10000'
  ],
},
BTC: {
  address: 'electrum.cipig.net',
  port: 10000,
  proto: 'tcp',
  txfee: 10000,
  coin: 'BTC',
  altserverList: [
    'electrum1.cipig.net:10000',
    'electrum2.cipig.net:10000'
  ],
},
};

module.exports = electrumServers;
