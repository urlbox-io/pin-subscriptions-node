# spreedly-node

This is a node.js module for <http://spreedly.com> Payments API. It aims to be compatible with API v4 - <https://spreedly.com/manual/integration-reference/>.

# Compatibility

This project has been tested with node.js 0.6.10.

Testing with earlier versions of Node.js planned.

# Installation
	
	npm install spreedly-node
	
# Usage
	
	var Spreedly = require("spreedly-node").Spreedly;
	…
	var cli = new Spreedly( site_name, api_key );

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

	var Spreedly = require("spreedly-node").Spreedly
		util = require("util");
	
	var cli = new Spreedly(site_name, api_key);
	var subscriber = { client_id: 100, screen_name: "some name", email: "some@email.com" };
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

# Supported operations

## getSubscriber( subscriber_id, callback )
Errors codes:

	- subscriber_not_found

## createSubscriber( subscriber, callback )
	
	- subscriber: required, object
	- callback - function( error, result )

## updateSubscriber( id, subscriber, callback )

## changeSubscriberId( id, new_id, callback )
## updatePaymentCreditCardInfo( id, credit_card, billing_info, callback )
## addStoreCredit( subscriber_id, amount, callback )
## addComplimentarySubscription( subscriber_id, quantity, units, amount, feature_level, callback )
## addComplimentaryExtension( subscriber_id, quantity, units, callback )
## addLifetimeComplimentarySubscription( subscriber_id, feature_level, callback )
## addSubscriberFee( subscriber_id, name, description, group, amount, callback )
## stopAutoRenew( subscriber_id, callback )
## subscribeToFreeTrial( subscriber_id, plan_id, callback )
## extendFreeTrial( subscriber_id, callback )
## changeSubscriptionPlan( subscriber_id, new_plan_id, callback )
## clearLifeTimeSubscription( subscriber_id, callback )
## raiseInvoice( plan_id, subscriber, callback )
## payWithCreditCard( invoice_id, credit_card, billing_info, callback )
## payWithOnFilePayment( invoice_id, callback )
## payWithStoreCredit( invoice_id, callback )
## payWithGenralCredit( invoice_id, description, callback )
## getSubscriptionPlans( callback )
## getTransactions( since, callback )
## testSite_deleteSubscribers( callback )
## testSite_deleteSubscriber( subscriber_id, callback )

# License

Apache License, Version 2.0<br/><http://www.apache.org/licenses/LICENSE-2.0>