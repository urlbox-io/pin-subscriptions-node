var https = require("https")
	, util = require("util")
	, xml2json = require("xml2json")
	, response_parser = require("./pin-response").PinResponse;
	
function Pin( site_name, api_key, err_callback ) {
	this.site_name = site_name;
	this.api_key = api_key;
	this.api_version = "v4";
	this.error_handler = err_callback || function( error ) {
		util.puts("There was an error: " + error);
	};
	this.response_parser = new response_parser();
}

Pin.prototype.$get_call = function( uri, callback ) {
	$this = this;
	var get_options = {
		host: 'subs.pinpayments.com',
		path: '/api/' + this.api_version + '/' + this.site_name + '/' + uri,
		method: 'GET',
		port: 443,
		headers: {
			'Authorization': 'Basic ' + new Buffer(this.api_key + ':X').toString('base64')
		}
	};
	var resp_buffer = "";
	var get_req = https.request(get_options, function(res) {
		res.on('data', function (chunk) {
			resp_buffer += chunk;
		});
		res.on('end', function () {
			callback( this.statusCode, resp_buffer );
		});
	});
	get_req.on('error', function( err ) {
		util.puts("Errror" + JSON.stringify( err ));
	});
	get_req.end();
};
Pin.prototype.$call = function( uri, xml_data, callback, method ) {
	method = method || "POST";
	$this = this;
	var post_options = {
		host: 'subs.pinpayments.com',
		path: '/api/' + this.api_version + '/' + this.site_name + '/' + uri,
		method: method,
		port: 443,
		headers: {
			'Content-Type': 'application/xml'
			, 'Content-Length': xml_data.length
			, 'Authorization': 'Basic ' + new Buffer(this.api_key + ':X').toString('base64')
		}
	};
	var resp_buffer = "";
	var post_req = https.request(post_options, function(res) {
		res.on('data', function (chunk) {
			resp_buffer += chunk;
		});
		res.on('end', function () {
			callback( this.statusCode, resp_buffer );
		});
	});
	post_req.on('error', function( err ) {
		util.puts("Errror" + JSON.stringify( err ));
	});
	post_req.write(xml_data);
	post_req.end();
};

Pin.prototype.$pad = function(number) {
	if ( (number + "").length == 1 ) {
		return '0' + number;
	}
	return '' + number;
};
Pin.prototype.$getDateString = function(date) {
	return date.getFullYear()
		+ "-" + this.$pad( date.getMonth()+1 )
		+ "-" + this.$pad(date.getDate())
		+ "T" + this.$pad(date.getHours())
		+ ":" + this.$pad(date.getMinutes())
		+ ":" + this.$pad(date.getSeconds()) + "Z";
};

Pin.prototype.$getType = function(obj) {
	if ( typeof obj === "boolean" ) {
		return ' type="boolean"';
	}
	if ( typeof obj.getMonth === "function" ) {
		return ' type="datetime"';
	}
	return '';
};

// SUBSCRIBERS:
Pin.prototype.getSubscriber = function( subscriber_id, callback ) {
	$this = this;
	this.$get_call( "subscribers/" + subscriber_id + ".xml", function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result }, null );
		} else {
			callback( { code: "error", message: result, code: code }, null );
		}
	} );
};

Pin.prototype.createSubscriber = function( subscriber, callback ) {
	var _xml = "<subscriber>";
	for ( var key in subscriber ) {
		var outputKey = key.replace(/_/g,"-");
		_xml += "<" + outputKey + this.$getType( subscriber[ key ] ) + ">"
			+ ( (typeof subscriber[ key ].getMonth === "function") ? this.$getDateString(subscriber[ key ]) : subscriber[ key ] )
			+ "</" + outputKey + ">";
	}
	_xml += "</subscriber>";
	$this = this;
	this.$call( "subscribers.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else {
			var err = {};
			switch (code) {
				case 404:
					err = { code: "subscriber_not_found", message: result };
					break;
				default:
					err = { code: "error", message: result };
			}
			callback( err, null );
		}
	} );
};
Pin.prototype.updateSubscriber = function( id, subscriber, callback ) {
	$this = this;
	var _xml = "<subscriber>";
	for ( var key in subscriber ) {
		var outputKey = key.replace(/_/g,"-");
		_xml += "<" + outputKey + this.$getType( subscriber[ key ] ) + ">"
			+ ( (typeof subscriber[ key ].getMonth === "function") ? this.$getDateString(subscriber[ key ]) : subscriber[ key ] )
			+ "</" + outputKey + ">";
	}
	_xml += "</subscriber>";
	this.$call( "subscribers/" + id + ".xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result } );
		} else {
			callback( { code: "error", message: result } );
		}
	}, "PUT" );
};
Pin.prototype.changeSubscriberId = function( id, new_id, callback ) {
	$this = this;
	var _xml = "<subscriber><new-customer-id>" + new_id + "</new-customer-id></subscriber>";
	this.$call( "subscribers/" + id + ".xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else if ( code == 403 ) {
			callback( { code: "new_id_in_use", message: result } );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result } );
		} else {
			callback( { code: "error", message: result } );
		}
	}, "PUT" );
};
Pin.prototype.updatePaymentCreditCardInfo = function( id, credit_card, billing_info, callback ) {
	$this = this;
	var _xml = "<subscriber><payment-method><credit-card>";
	for ( var key in credit_card ) {
		var outputKey = key.replace(/_/g,"-");
		_xml += "<" + outputKey + this.$getType( credit_card[ key ] ) + ">"
			+ ( (typeof credit_card[ key ].getMonth === "function") ? this.$getDateString(credit_card[ key ]) : credit_card[ key ] )
			+ "</" + outputKey + ">";
	}
	if ( billing_info != null ) {
		for ( var key in billing_info ) {
			var outputKey = key.replace(/_/g,"-");
			_xml += "<" + outputKey + this.$getType( billing_info[ key ] ) + ">"
				+ ( (typeof billing_info[ key ].getMonth === "function") ? this.$getDateString(billing_info[ key ]) : billing_info[ key ] )
				+ "</" + outputKey + ">";
		}
	}
	_xml += "</credit-card></payment-method></subscriber>";
	this.$call( "subscribers/" + id + ".xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else if ( code == 403 ) {
			callback( { code: "payment_auth_failed_or_subscriber_not_active_or_not_recurring", message: result } );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result } );
		} else if ( code == 422 ) {
			callback( { code: "payment_info_failed_verification", message: result } );
		} else if ( code == 504 ) {
			callback( { code: "payment_gateway_timeout", message: result } );
		} else {
			callback( { code: "error", message: result } );
		}
	}, "PUT" );
};

Pin.prototype.addStoreCredit = function( subscriber_id, amount, callback ) {
	$this = this;
	var _xml = "<credit><amount>" + amount + "</amount></credit>";
	this.$call( "subscribers/" + subscriber_id + "/credits.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result } );
		} else if ( code == 422 ) {
			callback( { code: "invalid_call", message: result } );
		} else {
			callback( { code: "error", message: result } );
		}
	} );
};

Pin.prototype.addComplimentarySubscription = function( subscriber_id, quantity, units, feature_level, callback ) { // test
	$this = this;
	var _xml = "<complimentary-subscription><duration-quantity>" + quantity + "</duration-quantity>";
	_xml += "<duration-units>" + units + "</duration-units>";
	if ( feature_level != null ) {
		_xml += "<feature-level>" + feature_level + "</feature-level>";
	}
	_xml += "</complimentary-subscription>";
	this.$call( "subscribers/" + subscriber_id + "/complimentary_subscriptions.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result }, null );
		} else if ( code == 403 ) {
			callback( { code: "subscriber_is_active", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "validation_errors", message: result }, null );
		} else {
			callback( { code: "error", message: result }, null );
		}
	} );
};

Pin.prototype.addComplimentaryExtension = function( subscriber_id, quantity, units, callback ) { // test
	$this = this;
	var _xml = "<complimentary-time-extension><duration-quantity>" + quantity + "</duration-quantity>";
	_xml += "<duration-units>" + units + "</duration-units>";
	_xml += "</complimentary-time-extension>";
	this.$call( "subscribers/" + subscriber_id + "/complimentary_time_extensions.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result }, null );
		} else if ( code == 403 ) {
			callback( { code: "subscriber_inactive", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "validation_errors", message: result }, null );
		} else {
			callback( { code: "error", message: result }, null );
		}
	} );
};

Pin.prototype.addLifetimeComplimentarySubscription = function( subscriber_id, feature_level, callback ) { // test
	$this = this;
	var _xml = "<lifetime-complimentary-subscription>";
	_xml += "<feature-level>" + feature_level + "</feature-level>";
	_xml += "</lifetime-complimentary-subscription>";
	this.$call( "subscribers/" + subscriber_id + "/lifetime_complimentary_subscriptions.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "validation_errors", message: result }, null );
		} else {
			callback( { code: "error", message: result }, null );
		}
	} );
};

Pin.prototype.addSubscriberFee = function( subscriber_id, name, description, group, amount, callback ) { // test
	$this = this;
	var _xml = "<fee><name>" + name + "</name><description>" + description + "</description><group>" + group + "</group><amount>" + amount + "</amount><allow_non_recurring_subscriber>true</allow_non_recurring_subscriber></fee>";
	this.$call( "subscribers/" + subscriber_id + "/fees.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "subscriber_not_recurring_active_or_fee_error", message: result }, null );
		} else {
			callback( { code: "error", message: result }, null );
		}
	} );
};

Pin.prototype.stopAutoRenew = function( subscriber_id, callback ) { // test
	$this = this;
	this.$call( "subscribers/" + subscriber_id + "/stop_auto_renew.xml", "", function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else {
			callback( { code: "error", message: result } );
		}
	} );
};

Pin.prototype.subscribeToFreeTrial = function( subscriber_id, plan_id, callback ) { // test
	$this = this;
	var _xml = "<subscription-plan><id>" + plan_id + "</id></subscription-plan>";
	this.$call( "subscribers/" + subscriber_id + "/subscribe_to_free_trial.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else if ( code == 403 ) {
			callback( { code: "plan_not_free_trial_or_subscriber_not_eligible", message: result }, null );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "no_plan_specified", message: result }, null );
		} else {
			callback( { code: "error", message: result }, null );
		}
	} );
};

Pin.prototype.extendFreeTrial = function( subscriber_id, callback ) { // test
	$this = this;
	this.$call( "subscribers/" + subscriber_id + "/allow_free_trial.xml", "", function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			callback( null, $this.response_parser.$get_normalized_single( json.subscriber ) );
		} else {
			callback( { code: "error", message: result }, null );
		}
	} );
};

Pin.prototype.changeSubscriptionPlan = function( subscriber_id, new_plan_id, callback ) { // test
	$this = this;
	var _xml = "<subscription_plan><id>" + new_plan_id + "</id></subscription_plan>";
	this.$call( "subscribers/" + subscriber_id + "/change_subscription_plan.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else if ( code == 404 ) {
			callback( { code: "subscriber_not_found", message: result } );
		} else {
			callback( { code: "error", message: result } );
		}
	}, "PUT" );
};

Pin.prototype.clearLifeTimeSubscription = function( subscriber_id, callback ) { // test
	$this = this;
	this.$call( "subscribers/" + subscriber_id + "/clear_lifetime_subscription.xml", "", function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			callback( null );
		} else {
			callback( { code: "error", message: result } );
		}
	} );
};

// INVOICES
Pin.prototype.raiseInvoice = function( plan_id, subscriber, callback ) {
	$this = this;
	var _xml = "<invoice><subscription-plan-id>" + plan_id + "</subscription-plan-id>";
	_xml += "<subscriber>";
	for ( var key in subscriber ) {
		var outputKey = key.replace(/_/g,"-");
		_xml += "<" + outputKey + this.$getType( subscriber[ key ] ) + ">"
			+ ( (typeof subscriber[ key ].getMonth === "function") ? this.$getDateString(subscriber[ key ]) : subscriber[ key ] )
			+ "</" + outputKey + ">";
	}
	_xml += "</subscriber></invoice>";
	this.$call( "invoices.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			json.invoice.subscriber.type = "subscriber";
			json = $this.response_parser.$get_normalized_single( json.invoice );
			json.subscriber = $this.response_parser.$get_normalized_single( json.subscriber );
			json.line_items = $this.response_parser.$get_normalized_array( json.line_items["line-item"] );
			callback( null, json );
		} else if ( code == 404 ) {
			callback( { code: "subscription_plan_not_found", message: result }, null );
		} else if ( code == 403 ) {
			callback( { code: "subscription_plan_disabled", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "subscriber_or_call_malformed", message: result }, null );
		} else {
			callback( { code: "error", message: result } );
		}
	} );
};
Pin.prototype.payWithCreditCard = function( invoice_id, credit_card, billing_info, callback ) {
	$this = this;
	var _xml = "<payment><account-type>credit-card</account-type>";
	_xml += "<credit-card>";
	for ( var key in credit_card ) {
		var outputKey = key.replace(/_/g,"-");
		_xml += "<" + outputKey + this.$getType( credit_card[ key ] ) + ">"
			+ ( (typeof credit_card[ key ].getMonth === "function") ? this.$getDateString(credit_card[ key ]) : credit_card[ key ] )
			+ "</" + outputKey + ">";
	}
	if ( billing_info != null ) {
		for ( var key in billing_info ) {
			var outputKey = key.replace(/_/g,"-");
			_xml += "<" + outputKey + this.$getType( billing_info[ key ] ) + ">"
				+ ( (typeof billing_info[ key ].getMonth === "function") ? this.$getDateString(billing_info[ key ]) : billing_info[ key ] )
				+ "</" + outputKey + ">";
		}
	}
	_xml += "</credit-card></payment>";
	this.$call( "invoices/" + invoice_id + "/pay.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			json.invoice.subscriber.type = "subscriber";
			json = $this.response_parser.$get_normalized_single( json.invoice );
			json.subscriber = $this.response_parser.$get_normalized_single( json.subscriber );
			json.line_items = $this.response_parser.$get_normalized_array( json.line_items["line-item"] );
			callback( null, json );
		} else if ( code == 403 ) {
			callback( { code: "invoice_closed_payment_failed_or_gateway_error", message: result }, null );
		} else if ( code == 404 ) {
			callback( { code: "invoice_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "invoice_failed", message: result }, null );
		} else if ( code == 504 ) {
			callback( { code: "gateway_timeout", message: result }, null );
		}
	}, "PUT");
};
Pin.prototype.payWithOnFilePayment = function( invoice_id, callback ) {
	$this = this;
	var _xml = "<payment><account-type>on-file</account-type></payment>";
	this.$call( "invoices/" + invoice_id + "/pay.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			json.invoice.subscriber.type = "subscriber";
			json = $this.response_parser.$get_normalized_single( json.invoice );
			json.subscriber = $this.response_parser.$get_normalized_single( json.subscriber );
			json.line_items = $this.response_parser.$get_normalized_array( json.line_items["line-item"] );
			callback( null, json );
		} else if ( code == 403 ) {
			callback( { code: "invoice_closed_payment_failed_or_gateway_error", message: result }, null );
		} else if ( code == 404 ) {
			callback( { code: "invoice_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "invoice_failed", message: result }, null );
		} else if ( code == 504 ) {
			callback( { code: "gateway_timeout", message: result }, null );
		}
	}, "PUT");
};
Pin.prototype.payWithStoreCredit = function( invoice_id, callback ) {
	$this = this;
	var _xml = "<payment><account-type>store-credit</account-type></payment>";
	this.$call( "invoices/" + invoice_id + "/pay.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			json.invoice.subscriber.type = "subscriber";
			json = $this.response_parser.$get_normalized_single( json.invoice );
			json.subscriber = $this.response_parser.$get_normalized_single( json.subscriber );
			json.line_items = $this.response_parser.$get_normalized_array( json.line_items["line-item"] );
			callback( null, json );
		} else if ( code == 403 ) {
			callback( { code: "invoice_closed_payment_failed_or_gateway_error", message: result }, null );
		} else if ( code == 404 ) {
			callback( { code: "invoice_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "invoice_failed", message: result }, null );
		} else if ( code == 504 ) {
			callback( { code: "gateway_timeout", message: result }, null );
		}
	}, "PUT");
};
Pin.prototype.payWithGenralCredit = function( invoice_id, description, callback ) {
	$this = this;
	var _xml = "<payment><account-type>general-credit</account-type><description>" + description + "</description></payment>";
	this.$call( "invoices/" + invoice_id + "/pay.xml", _xml, function( code, result ) {
		if ( Math.floor(code / 10) == 20 ) {
			var json = JSON.parse( xml2json.toJson( result ) );
			json.invoice.subscriber.type = "subscriber";
			json = $this.response_parser.$get_normalized_single( json.invoice );
			json.subscriber = $this.response_parser.$get_normalized_single( json.subscriber );
			json.line_items = $this.response_parser.$get_normalized_array( json.line_items["line-item"] );
			callback( null, json );
		} else if ( code == 403 ) {
			callback( { code: "invoice_closed_payment_failed_or_gateway_error", message: result }, null );
		} else if ( code == 404 ) {
			callback( { code: "invoice_not_found", message: result }, null );
		} else if ( code == 422 ) {
			callback( { code: "invoice_failed", message: result }, null );
		} else if ( code == 504 ) {
			callback( { code: "gateway_timeout", message: result }, null );
		}
	}, "PUT");
};

Pin.prototype.getSubscriptionPlans = function( callback ) {
	$this = this;
	this.$get_call( "subscription_plans.xml", function( code, result ) {
		var json = JSON.parse( xml2json.toJson( result ) );
		callback( $this.response_parser.plans_response( json ) );
	} );
};

Pin.prototype.getTransactions = function( since, callback ) {
	$this = this;
	var uri = "transactions.xml" + ( (typeof since === "number") ? "?since_id=" + since : "" );
	this.$get_call( uri, function( code, result ) {
		var json = JSON.parse( xml2json.toJson( result ) );
		if ( typeof json.transactions.transaction === "object" && typeof json.transactions.transaction.length !== "function" ) {
			json.transactions.transaction.detail.type = "Detail";
			json.transactions.transaction = [ json.transactions.transaction ];
		} else {
			for ( var i=0; i<json.transactions.transaction.length; i++ ) {
				json.transactions.transaction[i].detail.type = "Detail";
			}
		}
		json.transactions = $this.response_parser.$get_normalized_array( json.transactions.transaction );
		for ( var i=0; i<json.transactions.length; i++ ) {
			json.transactions[i].detail = $this.response_parser.$get_normalized_single( json.transactions[i].detail );
		}
		callback( json.transactions );
	} );
};

Pin.prototype.testSite_deleteSubscribers = function( callback ) {
	this.$call( "subscribers.xml", "", function( result ) {
		callback();
	}, "DELETE" );
};

Pin.prototype.testSite_deleteSubscriber = function( subscriber_id, callback ) {
	this.$call( "subscribers/" + subscriber_id + ".xml", "", function( result ) {
		callback();
	}, "DELETE" );
};

exports.Pin = Pin;