//to consist any of the userdata (trades, bot statuses)
UserData = new Mongo.Collection("userdata");
//to store price info in chronical manner - provide layer for chartJS impl.
TradeData = new Mongo.Collection("tradedata");
//to persist mm related data and connection information such as electrum server details, banned peers, etc.
SwapData = new Mongo.Collection("swapdata");
