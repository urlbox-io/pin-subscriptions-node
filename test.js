var spreedly = require("./lib/spreedly/spreedly").Spreedly
	, http = require('http')
	, util = require("util");

var s = new spreedly( "radekg-test", "df6cab26dab1370b7a3b42401a319fb824ea7d1d" );

/*
s.createSubscriber( { customer_id: 110, screen_name: "some_name_2" }, function( error, result ) {
	if ( error ) {
		util.puts("error in createSubscriber : " + JSON.stringify(error) );
	} else {
		util.puts("createSubscriber : " + JSON.stringify(result) );
	}
} );
*/

/*
s.changeSubscriberId( 110, 120, function( error ) {
	if ( error ) {
		util.puts("error in changeSubscriberId : " + JSON.stringify(error));
	} else {
		util.puts("changeSubscriberId : changed");
	}
} );
*/

/*
s.updateSubscriber( 120, { email: "radek@gruchalski.com" }, function( error ) {
	if ( error ) {
		util.puts("error in updateSubscriber : " + JSON.stringify(error));
	} else {
		util.puts("updateSubscriber : updated");
	}
} );
*/

/*
s.raiseInvoice(18287, { customer_id: 120, email: "radek@gruchalski.com", screen_name: "some_name_2" }, function(error, result) {
	if ( error ) {
		util.puts("error in createInvoice : " + JSON.stringify(error));
	} else {
		util.puts("createInvoice : " + JSON.stringify(result));
	}
});
*/

/*
s.addStoreCredit(120, 190.48, function(error, result) {
	if ( error ) {
		util.puts("error in addStoreCredit : " + JSON.stringify(error));
	} else {
		util.puts("addStoreCredit : added");
	}
});
*/

/*
s.getSubscriptionPlans( function( plans ) {
	util.puts( "There are " + plans.length + " plans." );
} );
*/

s.getTransactions( null, function(result) {
	util.puts( "getTransactions: " + JSON.stringify( result ) );
} );

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');