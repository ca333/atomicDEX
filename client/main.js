import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import '../imports/api/data/consist.js';
import './main.html';
import { Session } from 'meteor/session';
import sweetalert from 'sweetalert';
import 'sweetalert/dist/sweetalert.css';

import './scripts/loginform.js';
import './scripts/walletview.js';

Meteor.startup(function(){
	Session.set("coin", "KMD"); //default coin is KMD
});
