const numcoin = Number(100000000);

Template.walletview.onCreated(function() {
  this.autorun(() => {
      this.subscribe('userdata', {
        onReady: function () {
          console.log("render");
          if(UserData.findOne({key:"userpass"})) {
            Session.set("login", false);
            Session.set("logout", false);
          }
          else {
            Session.set("login", true);
          }
        },
        onError: function () {
        }
      });
      this.subscribe('tradedata', {
        onReady: function () {
          try{
            Session.set("price", TradeData.findOne({key:"btchprice"}).price/numcoin)
          }
          catch(e){
            Session.set("price", "NaN");
          }
        },
        onError: function () {
        }
      });
    });
});

Template.walletview.onRendered(function() {
  var clipboard = new Clipboard('.btn-copy-link');
});

Template.registerHelper('logout', function() {
  return Session.get("logout");
});

Template.walletview.helpers({
  coins: function(){
     return ["KMD", "BTCH", "BTC"];
  },
  currentcoin: function(){
    return Session.get("coin");
  },
  coinsString: function() {
    if (Session.get("coin") == "KMD") {
      return "Komodo";
    } else if (Session.get("coin") == "BTC") {
      return "Bitcoin";
    } else if (Session.get("coin") == "BTCH") {
      return "BitcoinHUSH";
    }
  },
  balance: function(){
      return UserData.findOne({coin:Session.get("coin")}) && parseFloat(UserData.findOne({coin:Session.get("coin")}).balance/numcoin).toFixed(8);
  },
  address: function(){
    return UserData.findOne({coin:Session.get("coin")}) && UserData.findOne({coin:Session.get("coin")}).smartaddress.toString();
  },
  addrx: function(){
    return UserData.findOne({coin:Session.get("coin")}).smartaddress.toString();
  },
  activecoinKMD: function(){
    if (Session.get("coin") == "KMD") {
      return true;
    } else {
      return false;
    }
  },
  activecoinBTC: function(){
    if (Session.get("coin") == "BTC") {
      return true;
    } else {
      return false;
    }
  },
  activecoinMNZ: function(){
    if (Session.get("coin") == "BTCH") {
      return true;
    } else {
      return false;
    }
  },
  price: function(){
    if(Session.get("price")==0){
      return NaN;
    }
    else{
      return Session.get("price");
    }
  },
  total: function(){
    return Session.get("price"); //* Session.get("buyamount")/numcoin;
  },
  swaps: function(){
    return SwapData.find({}, {sort: {sorttime: -1}});
  }
});

Template.registerHelper('formatDate', function(date) {
  return moment(date).format('MM-DD-YYYY');
});

Session.set("activeSendButton", true);
Template.walletview.events({
  'click .kmd'(event, intance) {
    Session.set("coin", "KMD");
  },
  'click .btc'(event, intance) {
    Session.set("coin", "BTC");
  },
  'click .mnz'(event, intance) {
    Session.set("coin", "BTCH");
  },
  "change #coin-select": function (event, template) {
      var coin = $(event.currentTarget).val();
      Session.set("coin", coin);

  },
  'keyup .amount': _.throttle(function(event) {
    var value = Number(event.target.value)*numcoin;
    var userBalance = UserData.findOne({coin:Session.get("coin")}).balance;
    //Session.set()
    //console.log(value);
    if(userBalance > (value + 10000) && value > 0) {
      //Session.set("activeSendButton", true);
    } else {
    //  Session.set("activeSendButton", false);
    }
  }),
  'keyup .buyamount': function(event) {
    Session.set("buyamount", Number(event.target.value)*numcoin);
  },
  'keyup .address': _.throttle(function(event) {
    if (event.target.value != "" && event.target.value.length == 34) {
    //  Session.set("activeAdressButton", true);
    } else {
    //  Session.set("activeAdressButton", false);
    }
  }),
 "click .sendcoins": function (event, template) {
    event.preventDefault();
    const amount = Number(Number(template.find(".amount").value).toFixed(8)) * numcoin;
    const addr = template.find(".sendaddress").value;

    if(Number(UserData.findOne({coin:Session.get("coin")}).balance) > (amount + Number(0.00010000*numcoin)))
    {
      Meteor.call("sendtoaddress", Session.get("coin"), addr, amount, function(error, result) {
        if(error) {
          swal("Oops!", error, "error");
        }
        else{
          swal("Transaction sent", "txid: " + result, "success");
        }
      });
    }
    else swal("Shit!", "Not enough balance or txfee ignored.", "error");
  },
  "click .stop": function (){
    Session.set("logout", true);
    Meteor.call('stopwallet', function(error, result){
      if(error){
        swal("Oops!", error, "error");
      }
      else{
        Session.set("login", true);
        swal("Wallet successfully closed!", "Getting back to loginpage", "success");
      }
    });
},
"click .buy": function (event, template) {
   event.preventDefault();
   const amount = Number(Number(template.find(".buyamount").value).toFixed(8)) * numcoin;

   if(amount > 0){
     Meteor.call("buy", amount, "KMD", function(error, result){
       if(error) {
         swal("Oops!", error, "error");
       }
       else{
         swal("Buy called", "id: " + result, "success");
       }
     });
   }else {
     {
       swal("Oops!", "Amount needs to be bigger than 0.", "error");
     }
   }

 }
});


Template.registerHelper('and',(a,b)=>{
  return a && b;
});
Template.registerHelper('or',(a,b)=>{
  return a || b;
});
