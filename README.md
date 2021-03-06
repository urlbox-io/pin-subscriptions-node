# pin-subscriptions-node

This is a node.js module for <http://https://subs.pinpayments.com> Payments API. It aims to be compatible with API v4 - <https://https://subs.pinpayments.com/manual/integration-reference/>.

# Installation
	
	npm install pin-subscriptions-node
	
# Usage
	
	var Pin = require("pin-subscriptions-node").Pin;
	…
	var cli = new Pin( site_name, api_key );

# Handling errors

Every operation that takes a <code>callback</code>, except of
	
	- getSubscriptionPlans( callback )
	- getTransactions( since, callback )
	- testSite_deleteSubscribers( callback )
	- testSite_deleteSubscriber( subscriber_id, callback )
	
calls the callback with max two arguments. First argument is always an error object. Every error object contains at least a <code>code</code> field and may but not must contain a text description of the error under a <code>message</code> field.

# What's different from the API

There is 1 implementation detail that differs from the original Payments API.

 - fields use <code>_</code> instead of <code>-</code> ; for example: <code>customer_id</code> instead of <code>customer-id</code> ; these are automatically translated to the correct format while constructing the XML ; this was implemented to simplify properties access

# Sample app

	var Pin = require("pin-subscriptions-node").Pin
		util = require("util");
	
	var cli = new Pin(site_name, api_key);
	var subscriber = { customer_id: 100, screen_name: "some name", email: "some@email.com" };
	cli.getSubscriptionPlans( function(result) {
		var plans = result;
		cli.createSubscriber( subscriber, function( error, result ) {
			if ( !error ) {
				cli.raiseInvoice( plans[0].id, subscriber, function( error, invoice ) {
					if ( !error ) {
						cli.payWithCreditCard( invoice.token, { … }, { … }, function( error, invoice ) {
							if ( !error ) {
								util.puts("Payment went through.");
							} else {
								util.puts("Error while putting a payment through: " + error.code + " :: " + error.message);
							}
						});
					}
				});
			}
		} );
	} );

# License

Apache License, Version 2.0<br/><http://www.apache.org/licenses/LICENSE-2.0>
