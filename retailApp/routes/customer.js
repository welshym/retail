var express = require('express');
var mongoose = require('mongoose');
var Customer = require('../models/Customer.js');
var jsonUtils = require('../local_modules/jsonutility.js');
var router = express.Router();


var xml2js = require('xml2js');
var options = {
    charkey : "#",
    attrkey : "@",
    explicitArray: false
};

var xmlParser = xml2js.Parser(options);
var js2xmlparser = require("js2xmlparser");

/* GET /customer listing. */
router.get('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.customer; version=1; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
    Customer.find(function (err, customers) {
        if (err) return next(err);
                  
        if (customers.length != 0) {
            var cleanedUpJson = cleanUpCustomerJson(customers);
            res.send(getCustomerXML(cleanedUpJson));
        } else {
            var messageStr = "Customer details not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});

/* GET /customer/id */
router.get('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.customer; version=1; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'max-age=86400');
    
    var searchIds = [req.params.id];
    
           console.log("searchIds = ", searchIds);
    
    Customer.findByCustomerId(searchIds, function (err, customers) {
        if (err) return next(err);
        
                            
        if (customers.length != 0) {
            var cleanedUpJson = cleanUpCustomerJson(customers[0]);
            res.send(getCustomerXML(cleanedUpJson));
        } else {
            var messageStr = "Customer " + searchIds + " not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});

/* DELETE /customer/:id */
router.delete('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.customer; version=1; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
              
    if (req.params.id == "") {
        var messageStr = "Customer " + req.params.id + " not defined";
        res.status(400).send(jsonUtils.createErrorMessage(messageStr, "400"));
    }

    Customer.findAndRemoveByCustomerId(req.params.id, function (err, customers) {
        if (err) return next(err);
                                     
        if (customers != 0) {
            res.status(204).end();
        } else {
            var messageStr = "Customer " + req.params.id + " not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});

router.delete('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.customer; version=1; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
              
    var messageStr = "Customer not defined";
    res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
});


/* POST /customer */
router.post('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.customer; version=1; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'max-age=86400');
            
    if (JSON.stringify(req.body) == '{}')
    {
        xmlParser.parseString(req.rawData, function (err, result) {
            var requestJson = JSON.parse(JSON.stringify(result['cst:Customer']));
                              
            jsonUtils.makeIntoArray(requestJson, 'cst:AddressList', 'cst:Address');
            jsonUtils.makeIntoArray(requestJson, 'cst:ContactDetails', 'cmn:Email');
            jsonUtils.makeIntoArray(requestJson, 'cst:PreferencesList', 'cst:Preference');

            jsonUtils.updateJSONElementString(requestJson['cst:ContactDetails'], 'cmn:Email', "type", "emailType");
            jsonUtils.updateJSONElementString(requestJson['cst:PreferencesList'], 'cst:Preference', "type", "preferenceType");
                              
            for (var i = 0; i < requestJson['cst:AddressList']['cst:Address'].length; i++) {
                jsonUtils.updateJSONElementString(requestJson['cst:AddressList']['cst:Address'][i]['cst:ContactDetails'], 'cmn:Telephone', "type", "telephoneType");
                jsonUtils.makeIntoArray(requestJson['cst:AddressList']['cst:Address'][i], 'cst:ContactDetails', 'cmn:Telephone');
            }
            var localCustomer = new Customer(requestJson);
            
            Customer.findByCustomerId(result['cst:Customer']['cst:CustomerId'], function (err, customers) {
            
                if (customers.length == 0) {
                    localCustomer.save(function (err, post) {
                        if (err) return next(err);
                                   
                        res.set('Content-Type', 'text/xml');
                        var cleanedUpJson = cleanUpCustomerJson(post);
                        res.send(getCustomerXML(cleanedUpJson));
                    });
                } else {
                    var messageStr = "Customer " + result['cst:Customer']['cst:CustomerId'] + " already exists";
                    res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
                }
            });
                              
        });
    } else {
        var messageStr = "XML Payload only";
        res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
    }
});



function getCustomerXML(customerJson) {
    
    var options = {
        useCDATA: true,
        declaration: { include : false }
    };
    
    if (typeof customerJson['cst:Customer'] != 'undefined') {
        var sourceCustomerXMLString = js2xmlparser("cst:CustomerList", JSON.stringify(customerJson));
    } else {
        var sourceCustomerXMLString = js2xmlparser("cst:Customer", JSON.stringify(customerJson));
    }

    return sourceCustomerXMLString
}

function customerJsonUpdate(customerJson) {
    delete customerJson["__v"];
    delete customerJson["_id"];
    
    jsonUtils.removeId(customerJson, 'cst:AddressList', 'cst:Address');
    jsonUtils.removeId(customerJson, 'cst:ContactDetails', 'cmn:Email');
    jsonUtils.removeId(customerJson, 'cst:PreferencesList', 'cst:Preference');
    
    for (var i = 0; i < customerJson['cst:AddressList']['cst:Address'].length; i++) {
        if (jsonUtils.isArray(customerJson['cst:AddressList']['cst:Address'][i]['cst:ContactDetails']['cmn:Telephone'])) {
            jsonUtils.removeId(customerJson['cst:AddressList']['cst:Address'][i], 'cst:ContactDetails', 'cmn:Telephone');
        }
    }

}


function cleanUpCustomerJson(sourceJson) {
    var localCustomers = JSON.parse(JSON.stringify(sourceJson));
    
    if (localCustomers.length != undefined) {
        var myJsonString = {"cst:Customer" : [] };
        for (var i = 0; i < localCustomers.length; i++) {
            customerJsonUpdate(localCustomers[i]);
            myJsonString["cst:Customer"].push(localCustomers[i])
        }
    } else {
        customerJsonUpdate(localCustomers);
//        var myJsonString = {"cst:Customer" : [localCustomers]};
        var myJsonString = localCustomers;
    }
    
    return myJsonString;
}

module.exports = router;