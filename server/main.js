import { Meteor } from 'meteor/meteor';
import { sleep } from 'meteor/froatsnook:sleep';
import { rootPath} from 'meteor/ostrio:meteor-root';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import pm2 from 'pm2';
import os from 'os';
import '../imports/api/data/consist.js';
import electrumServers from '/imports/startup/config/electrum.js';
import fs from 'fs-extra';
import path from 'path';
import fixPath from 'fix-path';

let coindata = "";
const numcoin = Number(100000000);
const txfee = 10000;
var marketmakerBin = "";

Meteor.startup(() => {
    if (os.platform() === 'darwin') {
        fixPath();
        marketmakerBin = Meteor.rootPath + '/../../../../../private/static/OSX/marketmaker',
        marketmakerDir = `${process.env.HOME}/Library/Application Support/marketmaker`;
    }

    if (os.platform() === 'linux') {
        marketmakerBin = Meteor.rootPath + '/../../../../../private/static/LINUX/marketmaker',
        marketmakerDir = `${process.env.HOME}/.marketmaker`;
    }

    if (os.platform() === 'win32') {
        marketmakerBin = Meteor.rootPath + '/../../../../../private/static/WIN/marketmaker.exe',
        marketmakerBin = path.normalize(marketmakerBin);
    }

    var coinFile = 'static/coins.json';
    coindata = JSON.parse(Assets.getText(coinFile));

    Meteor.publish('userdata', function() {
        return UserData.find();
    });
    Meteor.publish('tradedata', function() {
        return TradeData.find();
    });
    Meteor.publish('swapdata', function() {
        return SwapData.find();
    });
});

Meteor.methods({
    startWallet(passphrase) {
        UserData.remove({});
        TradeData.remove({});
            if(TradeData.find().count() < 1){
              TradeData.insert({
                key: "btchprice",
                price: Number(0) * numcoin,
                createdAt: new Date()
              });
            }
            if(UserData.find().count() < 1) {
                UserData.insert({
                    coin: "BTC",
                    balance: Number(1000) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                });
                UserData.insert({
                    coin: "KMD",
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                });
                UserData.insert({
                    coin: "BTCH",
                    balance: Number(0) * numcoin,
                    smartaddress: "addr",
                    createdAt: new Date()
                });
            }
            const startparams = {
                'gui': 'atomicDEX',
                'client': 1,
                'canbind': 1,
                'userhome': `${process.env.HOME}`,
                'passphrase': passphrase,
                'coins': coindata
            };

            let params = JSON.stringify(startparams);
            let home = process.env.HOME;
            params = `'${params}'`;
            pm2.connect(function(err) { //start up pm2 god
              if (err) {
                console.error(err);
                process.exit(2);
              }
            });
            Meteor.sleep(5000);

            try{
              pm2.start({
                script    : marketmakerBin,         // path to MM binary
                exec_mode : 'fork',
                //cwd: home, //set correct working dir for MM data
                args: params,  //stringified params
              }, function(err, apps) {
                pm2.disconnect();   // Disconnect from PM2
                if (err) throw err;
                else{
                  //console.log("started MM");
                }
              });
            }catch(e){
              throw new Meteor.Error(e);
            }
            Meteor.sleep(5000);

            const paramsfirst = {
                'userpass': "x",
                'method': 'electrum',
                'coin': 'BTCH',
                'ipaddr': 'electrum1.cipig.net',
                'port': 10020
            };

            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: paramsfirst
                });
                UserData.insert({
                    key: "userpass",
                    userpass: JSON.parse(result.content).userpass,
                    createdAt: new Date()
                });
                UserData.insert({
                    key: "mypubkey",
                    mypubkey: JSON.parse(result.content).mypubkey,
                    createdAt: new Date()
                });

                var coins = JSON.parse(result.content).coins;
                for(var i = 0; i < coins.length; i++) {
                    var coinobj = coins[i];
                    try {
                        UserData.update({ coin: coinobj.coin }, { $set: { smartaddress: coinobj.smartaddress.toString() }});
                    } catch(e) {
                        throw new Meteor.Error(e);
                    }
                }
            } catch(e) {
                throw new Meteor.Error(e);
            }
            //todo - connect to electrum in a loop. use module electrumservers
            const paramsKMDadd = {
                'userpass': UserData.findOne({key: "userpass"}).userpass.toString(),
                'method': 'electrum',
                'coin': 'KMD',
                'ipaddr': 'electrum1.cipig.net',
                'port': 10001
            };

            const paramsMNZadd = {
                'userpass': UserData.findOne({key: "userpass"}).userpass.toString(),
                'method': 'electrum',
                'coin': 'MNZ',
                'ipaddr': 'electrum1.cipig.net',
                'port': 10002
            };
//curl --url "http://127.0.0.1:7783" --data "{\"userpass\":\"$userpass\",\"method\":\"electrum\",\"coin\":\"BTCH\",\"ipaddr\":\"electrum1.cipig.net\",\"port\":10020}"
//curl --url "http://127.0.0.1:7783" --data "{\"userpass\":\"$userpass\",\"method\":\"electrum\",\"coin\":\"BTCH\",\"ipaddr\":\"electrum2.cipig.net\",\"port\":10020}"
            const paramsBTCHadd = {
                'userpass': UserData.findOne({key: "userpass"}).userpass.toString(),
                'method': 'electrum',
                'coin': 'BTCH',
                'ipaddr': 'electrum1.cipig.net',
                'port': 10020
            };

            const paramsBTCadd = {
                'userpass': UserData.findOne({key: "userpass"}).userpass.toString(),
                'method': 'electrum',
                'coin': 'BTC',
                'ipaddr': 'electrum1.cipig.net',
                'port': 10000
            };

            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: paramsKMDadd
                });

            } catch(e) {
                throw new Meteor.Error(e);
                return false;
            }
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: paramsBTCadd
                });
            } catch(e) {
                throw new Meteor.Error(e);
                return false;
            }
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: paramsBTCHadd
                });
            } catch(e) {
                throw new Meteor.Error(e);
                return false;
            }
            if(UserData.find().count() > 4) {
                Meteor.call('getbalance', 'KMD');
                Meteor.call('getbalance', 'BTCH');
                Meteor.call('getbalance', 'BTC');
            }
        },
        sendtoaddress(coin, address, amount) {
            var outputs = '[{' + address + ':' + Number(amount)/numcoin + '}]';
            outputs = JSON.stringify(eval("(" + outputs + ")"));

            const sendparams = {
                'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'withdraw',
                'coin': coin,
                'outputs': JSON.parse(outputs)
            };
            let result = null;
            try {
                result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: sendparams
                });
            } catch(e) {
              return false;
            }
            const sendrawtx = {'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'sendrawtransaction',
                'coin': coin,
                'signedtx': JSON.parse(result.content).hex
            };
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: sendrawtx
                });
                return result.content;
            } catch(e) {
              return false;
            }
        },
        getprice(){
          if(UserData.findOne({key: "userpass"})){
            const getprices = {
              'userpass': UserData.findOne({key: "userpass"}).userpass,
              'method': 'orderbook',
              'base': "BTCH",
              'rel': "KMD"
            }
            var bestprice = 0;
            const buf = 1.04 * numcoin;
            var price  = 0;
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: getprices
                  });
                  try{
                    if(JSON.parse(result.content).asks.length > 0){
                      var i = 0;
                      while(JSON.parse(result.content).asks[i].maxvolume == 0 && i < JSON.parse(result.content).asks.length - 1){
                        i++;
                      }
                      if(JSON.parse(result.content).asks[i].maxvolume > 0){
                        //console.log(JSON.parse(result.content).asks[i]);
                        bestprice = Number((JSON.parse(result.content).asks[i].price*100000000).toFixed(0));
                      }
                      console.log("best price: "+bestprice);
                    }
                  }catch(e){
                    console.log(e);
                  }
                } catch(e) {
                  throw new Meteor.Error(e);
                }
                try {
                   if(bestprice > 0){
                     TradeData.update({ key: "btchprice" }, { $set: { price: Number(((buf/numcoin * bestprice/numcoin).toFixed(8)*100000000).toFixed(0)) }});
                   }else{
                     TradeData.update({ key: "btchprice" }, { $set: { price: 0 }});
                   }
                } catch(e) {
                    throw new Meteor.Error(e);
                }
          }else{
            console.log("getprice() not ready yet");
          }
        },
        buy(mnzamount, paycoin) {
          var unspent = Meteor.call("listunspent", paycoin);
          if(Number(unspent.length) < 2) {
            throw new Meteor.Error("Not enough utxos!");
          }
          else{
            if(paycoin == "KMD"){
              const getprices = {
                'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'orderbook',
                'base': "BTCH",
                'rel': "KMD"
              }
              var bestprice = 0;
              try {
                  const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                      data: getprices
                    });
                    //bestprice = Number((JSON.parse(result.content).asks[0].price*100000000).toFixed(0));
                    try{
                      if(JSON.parse(result.content).asks.length > 0){
                        var i = 0;
                        while(JSON.parse(result.content).asks[i].maxvolume == 0 && i < JSON.parse(result.content).asks.length){
                          i++;
                        }
                        if(JSON.parse(result.content).asks[i].maxvolume > 0){
                          //console.log(JSON.parse(result.content).asks[i]);
                          bestprice = Number((JSON.parse(result.content).asks[i].price*100000000).toFixed(0));
                        }
                        //console.log("best price: "+bestprice);
                      }
                    }catch(e){
                      console.log(e);
                    }
                  } catch(e) {
                    throw new Meteor.Error(e);
                  }
                  var buf = 1.04 * numcoin;
                  var bufprice = Number(((buf/numcoin * bestprice/numcoin).toFixed(8)*numcoin).toFixed(0));
                  var relvolume = Number(mnzamount/numcoin * bestprice/numcoin);
                  var buyparams = null;
                  if(relvolume*numcoin+txfee < Number(UserData.findOne({coin:paycoin}).balance)) {
                    buyparams = {
                      'userpass': UserData.findOne({key: "userpass"}).userpass,
                      'method': 'buy',
                      'base': 'BTCH',
                      'rel': 'KMD',
                      'relvolume': relvolume.toFixed(3),
                      'price': Number(bufprice/numcoin).toFixed(3)
                    }
                  }
                  else {
                    throw new Meteor.Error("Not enough balance!");
                  }
                  if(!TradeData.findOne({key: "tempswap"}) && bestprice > 0){
                    try {
                      const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                          data: buyparams,
                          timeout: 10000
                        });
                        //console.log("You are spending: "+relvolume.toFixed(3)+" KMD for "+Number(bufprice/numcoin).toFixed(3) + "KMD each and resulting in "+relvolume.toFixed(3)/Number(bufprice/numcoin).toFixed(3)+"MNZ");
                        //console.log(JSON.parse(result.content));
                        var alice = JSON.parse(result.content).pending.aliceid.toString();
                        try{
                          TradeData.insert({
                            key: "tempswap",
                            tradeid: JSON.parse(result.content).pending.tradeid,
                            aliceid: alice.substr(0,8),
                            paycoin: paycoin,
                            expiration: JSON.parse(result.content).pending.expiration,
                            createdAt: new Date()
                          });

                          SwapData.insert({
                            tradeid: JSON.parse(result.content).pending.tradeid,
                            expiration: JSON.parse(result.content).pending.expiration,
                            requestid: 0,
                            quoteid: 0,
                            value: mnzamount/numcoin,
                            aliceid: alice.substr(0,8),
                            status: "pending",
                            finished: false,
                            paycoin: paycoin,
                            price: Number(bufprice/numcoin).toFixed(3),
                            bobdeposit: 0,
                            alicepayment: 0,
                            bobpayment: "0000000000000000000000000000000000000000000000000000000000000000",
                            paymentspent: 0,
                            Apaymentspent: "0000000000000000000000000000000000000000000000000000000000000000",
                            depositspent: 0,
                            sorttime: 0,
                            swaplist: false,
                            finishtime: new Date().toGMTString(),
                            createdAt: new Date()
                          });
                        }catch(e){
                          throw new Meteor.Error(e);
                        }

                        return "Swap initiated - please wait min. 3 minutes before buying again!";

                      } catch(e) {
                        console.log(e);
                        throw new Meteor.Error(e);
                    }
                  }else if(bestprice == 0){
                    throw new Meteor.Error("Orderbook is not synced. Please wait a few minutes.");
                  }else{
                    throw new Meteor.Error("Already swap ongoing - please wait until finished.");
                  }
            }else {
               return "BTC swap initiated";
              //send BTC balance via sendtoaddress to investmentaddress
              //to be implemented when funding script is available
            }
          }
        },
        getbalance(coin) {
            const balanceparams = {
                'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'balance',
                'coin': coin,
                'address': UserData.findOne({coin:coin}).smartaddress.toString()
            };

            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: balanceparams
                });
                try {
                    UserData.update({ coin: coin }, { $set: { balance: (Number(JSON.parse(result.content).balance) * numcoin) }});
                } catch(e) {
                    throw new Meteor.Error(e);
                }
            } catch(e) {
                throw new Meteor.Error(e);
                return false;
            }
        },
        listunspent(coin) {
            const listunspentparams = {
                'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'listunspent',
                'coin': coin,
                'address': UserData.findOne({coin:coin}).smartaddress.toString() //hardcoded for now
            };

            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: listunspentparams
                });
                var utxos = JSON.parse(result.content);
                return utxos;
            } catch(e) {
                throw new Meteor.Error(e);
                return false;
            }
        },
        stopwallet() {
            const stopparams = {
                'userpass': UserData.findOne({key: "userpass"}).userpass.toString(),
                'method': 'stop'
            };
            TradeData.remove({});
            UserData.remove({});
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: stopparams
                });
            } catch(e) {
                pm2.connect(function(err) { //start up pm2 god
                  if (err) {
                    console.error(err);
                    process.exit(2);
                  }
                });
                Meteor.sleep(5000);
                try{
                  pm2.stop("marketmaker", function(err, apps) {
                    if (err) throw err;
                    else{
                      //console.log("stopped MM");
                    }
                  });
                  pm2.kill(function(err, apps) {
                    pm2.disconnect();   // Disconnect from PM2
                    if (err) throw err;
                    else{
                      //console.log("stopped pm2");
                    }
                  });
                }catch(e){
                  console.log(e);
                }
                return true;
            }
        },
        checkswapstatus(requestid, quoteid) {
          if(UserData.findOne({key: "userpass"})){
            if(requestid =="" && quoteid=="" || requestid ==null && quoteid==null){
              const swaplist = {
                'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'swapstatus'
              }
              try {
                  const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                      data: swaplist
                    });
                    var swaps = JSON.parse(result.content).swaps;
                   if(TradeData.findOne({key: "tempswap"})){
                     if(TradeData.findOne({key: "tempswap"}).expiration*1000<Date.now()){
                         TradeData.remove({key: "tempswap"});
                     }
                   }
                     var tswaps = SwapData.find({swaplist:false});
                     tswaps.forEach((swapelem) => {
                       if(swapelem.expiration*1000+12000000<Date.now()){
                         try{
                           SwapData.update({ tradeid: swapelem.tradeid }, { $set: {
                             status: "timedout",
                             finished: true,
                             Apaymentspent: 1
                           }});
                         }catch(e){
                           throw new Meteor.Error(e);
                         }
                       }
                     });

                    for(var i = 0; i < swaps.length; i++) {
                      var swapobj = swaps[i];
                      try {
                          Meteor.call('checkswapstatus', swapobj.requestid, swapobj.quoteid);
                        } catch(e) {
                          throw new Meteor.Error(e);
                        }
                      }
                    } catch(e) {
                      throw new Meteor.Error(e);
                    }
            }else{
              if(quoteid!=0 && requestid!=0){
              const swapelem = {
                'userpass': UserData.findOne({key: "userpass"}).userpass,
                'method': 'swapstatus',
                'requestid': requestid,
                'quoteid': quoteid
              }
              try {
                  const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                      data: swapelem
                    });
                    var swap = JSON.parse(result.content);
                    var alice = swap.aliceid.toString();
                    if(SwapData.findOne({aliceid: alice.substr(0,8)})){
                      if(SwapData.findOne({aliceid: alice.substr(0,8)}).bobpayment == "0000000000000000000000000000000000000000000000000000000000000000"){
                        try{
                          SwapData.update( {aliceid: alice.substr(0,8)}, { $set: {
                            requestid: swap.requestid,
                            quoteid: swap.quoteid,
                            //value: swap.values[0],
                            status: "pending",
                            finished: false,
                            aliceid: alice.substr(0,8),
                            bobdeposit: swap.bobdeposit,
                            alicepayment: swap.alicepayment,
                            bobpayment: swap.bobpayment,
                            paymentspent: swap.paymentspent,
                            Apaymentspent: swap.Apaymentspent,
                            depositspent: swap.depositspent,
                            swaplist: true,
                            finishtime: new Date(swap.finishtime*1000).toGMTString(),
                            sorttime: swap.finishtime*1000                        }});
                        }catch(e){
                          throw new Meteor.Error("Can not store Data into DB! Please report to dev.");
                        }
                      }else{
                        if(SwapData.findOne({aliceid: alice.substr(0,8)}).bobpayment != "0000000000000000000000000000000000000000000000000000000000000000"){
                          try{
                            SwapData.update({aliceid: alice.substr(0,8)}, { $set: {
                              bobdeposit: swap.bobdeposit,
                              alicepayment: swap.alicepayment,
                              bobpayment: swap.bobpayment,
                              paymentspent: swap.paymentspent,
                              Apaymentspent: swap.Apaymentspent,
                              depositspent: swap.depositspent,
                              value: Number(swap.values[0].toFixed(8)),
                              finishtime: new Date(swap.finishtime*1000).toGMTString(),
                              sorttime: swap.finishtime*1000,
                              status: "finished",
                              finished: true
                            }});
                          }catch(e){
                            throw new Meteor.Error("Can not update Data into DB! Please report to dev.");
                          }
                        }
                        else if(TradeData.findOne({key: "tempswap"})){
                          if(TradeData.findOne({key: "tempswap"}).tradeid == swap.tradeid){
                            if(swap.depositspent != "0000000000000000000000000000000000000000000000000000000000000000"){
                              TradeData.remove({key: "tempswap"});
                            }
                          }
                        }
                      }
                    }
                      return true;
                    } catch(e) {
                      throw new Meteor.Error(e);
                      return false;
                    }
            }
          }
          }
          else{
            console.log("checkswap() not ready yet");
          }
        },
        callAPI(jobj) {
            try {
                const result = HTTP.call('POST', 'http://127.0.0.1:7783', {
                    data: jobj
                });
                return result;
            } catch(e) {
                return e;
            }
        },
        hello() {
            console.log("hello etienne");
        }
});

//SwapData.remove({});

Meteor.setInterval(function() {
    if(UserData.find().count() > 4) {
        Meteor.call('getbalance', 'KMD');
        Meteor.call('getbalance', 'BTCH');
        Meteor.call('getbalance', 'BTC');
    }
    if(TradeData.find().count() > 0) {
    Meteor.call('getprice');
    Meteor.call("checkswapstatus");
    }
}, 60000);
