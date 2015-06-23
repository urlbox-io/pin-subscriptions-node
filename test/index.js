var testCase = require('nodeunit').testCase
    , util = require('util')
    , debug = require('util').debug
    , inspect = require('util').inspect
    , spreedly = require('../lib/spreedly/spreedly').Spreedly;

var client = null;
var site_name = process.env['SITE_NAME'] || "";
var api_key = process.env['API_KEY'] || "";

exports.setUp = function (callback) {
    var self = exports;
    client = new spreedly(site_name, api_key);
    callback();
};

exports.tearDown = function (callback) {
    var self = this;
    client.testSite_deleteSubscribers(function () {
        callback();
    });
}

exports.shouldReturnPlans = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.getSubscriptionPlans(function (result) {
        test.ok(typeof result == "object" && typeof result.push == "function", "Result should be an array of plans.");
        test.done();
    });
};

exports.updateSubscriber = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({
        customer_id: 115,
        screen_name: "test_user_2",
        email: "email1@test.com"
    }, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.updateSubscriber(115, {email: "email2@test.com"}, function (error) {
            test.equals(null, error, "updateSubscriber: Error should be null");
            cli.getSubscriber(115, function (error, new_subscriber) {
                test.equals(null, error, "getSubscriber: Error should be null");
                test.equals(new_subscriber.email, "email2@test.com", "Email not changed");
                test.done();
            });
        });
    });
};

exports.runCreateInvoiceCCPaymentProcess = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 110, screen_name: "test_user"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");

        cli.getSubscriber(110, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            //test.equals(110, subscriber.customer_id); //TODO : ???

            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 110,
                    screen_name: "test_user",
                    email: "test@test.com"
                }, function (error, invoice) {
                    test.equals(null, error);
                    var cc = {
                        number: "4222222222222"
                        , card_type: "visa"
                        , verification_value: 234
                        , month: 1
                        , year: 2016
                        , first_name: "Joe"
                        , last_name: "Doe"
                    };
                    cli.payWithCreditCard(invoice.token, cc, null, function (error, invoice) {
                        test.equals(null, error);
                        test.ok(invoice.closed)
                        test.done();
                    });
                });
            });
        });
    });
};

exports.runCreateInvoiceStoreCreditPaymentProcess = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 111, screen_name: "test_user_2"}, function (error, subscriber) {

        test.equals(null, error, "createSubscriber: Error should be null");
        //console.log("error is ", error);

        cli.getSubscriber(111, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            //test.equals(111, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.addStoreCredit(111, 500, function (error) {
                    test.equals(null, error, "addStoreCredit: Error should be null");
                    cli.raiseInvoice(plans[1].id, {
                        customer_id: 111,
                        screen_name: "test_user_2",
                        email: "test2@test.com"
                    }, function (error, invoice) {
                        test.equals(null, error)
                        cli.payWithStoreCredit(invoice.token, function (error, invoice) {
                            test.equals(null, error);
                            test.ok(invoice.closed)
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.runCreateInvoiceOnFilePaymentProcess = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 112, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(112, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            //test.equals(112, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 112,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithOnFilePayment(invoice.token, function (error, invoice) {
                        test.equals(null, error);
                        if (invoice) {
                            test.ok(invoice.closed);
                        }
                        test.done();
                    });
                });
            });
        });
    });
};

exports.runCreateInvoiceGenericCreditPaymentProcess = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 113, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(113, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            //test.equals(113, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 113,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithGenralCredit(invoice.token, "general credit test", function (error, invoice) {
                        test.equals(null, error, JSON.stringify(error));
                        test.ok(invoice.closed);
                        test.done();
                    });
                });
            });
        });
    });
};

exports.changeSubscriptionPlan = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 114, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(114, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            //test.equals(114, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 114,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithGenralCredit(invoice.token, "general credit test", function (error, invoice) {
                        test.equals(null, error, JSON.stringify(error));
                        test.ok(invoice.closed);
                        cli.changeSubscriptionPlan(114, plans[1].id, function (error) {
                            test.equals(null, error, JSON.stringify(error));
                            test.done();
                        });
                    });
                });
            });
        });
    });
};



exports.changeSubscriberId = function (test) {
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({
        customer_id: 130,
        screen_name: "test_user_2",
        email: "email1@test.com"
    }, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.changeSubscriberId(130, 131, function (error) {
            test.equals(null, error, "changeSubscriberId: Error should be null");
            cli.getSubscriber(131, function (error, new_subscriber) {
                test.equals(null, error, "getSubscriber: Error should be null");
                test.equals(new_subscriber.customer_id, 131, "Id not changed");
                test.done();
            });
        });
    });
};

exports.updatePaymentCreditCard = function (test) { // requires a recurring subscription
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 116, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(116, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            test.equals(116, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 116,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithGenralCredit(invoice.token, "general credit test", function (error, invoice) {
                        test.equals(null, error, JSON.stringify(error));
                        test.ok(invoice.closed);

                        var cc = {
                            number: "4222222222222"
                            , card_type: "visa"
                            , verification_value: 234
                            , month: 1
                            , year: 2016
                            , first_name: "Joe"
                            , last_name: "Doe"
                        };

                        cli.updatePaymentCreditCardInfo(116, cc, null, function (error) {
                            test.equals(null, error, JSON.stringify(error));
                            test.done();
                        });

                    });
                });
            });
        });
    });
};

exports.addSubscriberFee = function (test) { // recuires a recurring plan
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 117, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(117, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            test.equals(117, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 117,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithGenralCredit(invoice.token, "general credit test", function (error, invoice) {
                        test.equals(null, error, JSON.stringify(error));
                        test.ok(invoice.closed);
                        cli.addSubscriberFee(117, "Test fee", "Description for test fee", "test_grouqp", 50.91, function (error) {
                            test.equals(null, error, JSON.stringify(error));
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.freeTrials = function (test) { // recuires a free trial plan
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 118, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriptionPlans(function (plans) {
            cli.subscribeToFreeTrial(118, plans[0].id, function (error, subscriber) {
                test.equals(null, error, JSON.stringify(error));
                cli.extendFreeTrial(118, function (err, subscriber) {
                    test.equals(null, error, JSON.stringify(error));
                    test.done();
                });
            });
        });
    });
};

exports.stopAutorenew = function (test) { // recuires a recurring plan
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 118, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(118, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            test.equals(118, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 118,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithGenralCredit(invoice.token, "general credit test", function (error, invoice) {
                        test.equals(null, error, JSON.stringify(error));
                        test.ok(invoice.closed);
                        cli.stopAutoRenew(118, function (error) {
                            test.equals(null, error, JSON.stringify(error));
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.lifetimeSubscriptions = function (test) { // recuires a free trial plan
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 119, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.addLifetimeComplimentarySubscription(119, "pro", function (error) {
            test.equals(null, error, JSON.stringify(error));
            cli.clearLifeTimeSubscription(119, function (error) {
                test.equals(null, error, JSON.stringify(error));
                test.done();
            });
        });
    });
};

exports.complimentaryExtension = function (test) { // recuires a recurring plan
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 120, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.getSubscriber(120, function (error, subscriber) {
            test.equals(null, error, "getSubscriber: Error should be null");
            test.equals(120, subscriber.customer_id);
            cli.getSubscriptionPlans(function (plans) {
                cli.raiseInvoice(plans[1].id, {
                    customer_id: 120,
                    screen_name: "test_user_2",
                    email: "test2@test.com"
                }, function (error, invoice) {
                    test.equals(null, error)
                    cli.payWithGenralCredit(invoice.token, "general credit test", function (error, invoice) {
                        test.equals(null, error, JSON.stringify(error));
                        test.ok(invoice.closed);
                        cli.addComplimentaryExtension(120, 2, "months", function (error, subscriber) {
                            test.equals(null, error, JSON.stringify(error));
                            test.done();
                        });
                    });
                });
            });
        });
    });
};

exports.complimentarySubscription = function (test) { // recuires a recurring plan
    var cli = new spreedly(site_name, api_key);
    cli.createSubscriber({customer_id: 130, screen_name: "test_user_2"}, function (error, subscriber) {
        test.equals(null, error, "createSubscriber: Error should be null");
        cli.addComplimentarySubscription(130, 2, "months", "pro", function (error, subscriber) {
            test.equals(null, error, JSON.stringify(error));
            test.done();
        });
    });
};