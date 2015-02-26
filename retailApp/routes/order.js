var express = require('express');
var mongoose = require('mongoose');
var Order = require('../models/Order.js');
var jsonUtils = require('../local_modules/jsonutility.js');
var router = express.Router();


var xml2js = require('xml2js');
var optionsXML2JS = {
    charkey : "#",
    attrkey : "@",
    explicitArray: false
};

var xmlParser = xml2js.Parser(optionsXML2JS);
var js2xmlparser = require("js2xmlparser");

/* GET /order listing. */
router.get('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
           
    var pageNumber = 1; // Default
    var pageSize = 5; // Default
           
    if (typeof req.query['pageNumber'] != 'undefined') {
        pageNumber = req.query['pageNumber'];
        if (pageNumber <= 0) {
           var messageStr = "Invalid page number.";
           res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
           return;
        }
    }
       
    if (typeof req.query['pageSize'] != 'undefined') {
        pageSize = req.query['pageSize'];
        if (pageSize <= 0) {
           var messageStr = "Invalid page size.";
           res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
           return;
        }
    }
    
    var queryArray = createGetQueryArray(req);

    if (queryArray.length > 0) {
        Order.findByGenericQuery(queryArray, function (err, orders) {
            if (err) return next(err);
            createOrderGetResponse(req, res, pageSize, pageNumber, orders);
        });
    } else {
        Order.find(function (err, orders) {
            if (err) return next(err);
                        
            createOrderGetResponse(req, res, pageSize, pageNumber, orders);
        });
    }
});

/* GET /order/id */
router.get('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.order; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'max-age=86400');
           
    var searchIds = [req.params.id];
           
    Order.findByOrderId(searchIds, function (err, orders) {

        if (err) return next(err);
                                   
        if (orders.length != 0) {
            var cleanedUpJson = cleanUpOrderJson(orders);
            res.send(getOrderXML(cleanedUpJson));
        } else {
            var messageStr = "Order " + searchIds + " not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});


/* DELETE /order/:id */
router.delete('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.order; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
              
    if (req.params.id == "") {
        var messageStr = "Order " + req.params.id + " not defined";
        res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
    }

    Order.findAndRemoveByOrderId(req.params.id, function (err, order) {
        if (err) return next(err);
                                     
        if (order != 0) {
            res.status(204).end();
        } else {
            var messageStr = "Order " + req.params.id + " not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});

router.delete('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.order; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
              
    var messageStr = "Order not defined";
    res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
});


/* POST /order */
router.post('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.order; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
            console.log("Within the post body");
    if (JSON.stringify(req.body) == '{}')
    {
            console.log("Definitely not JSON");
            console.log(req);
        xmlParser.parseString(req.rawData, function (err, result) {
            var requestJson = JSON.parse(JSON.stringify(result['ord:Order']));
            
                              console.log(JSON.stringify(result['ord:Order']));
                              
            jsonUtils.updateJSONElementString(requestJson, "ord:Fulfilment", "type", "fulfilmentType");
            jsonUtils.updateJSONElementString(requestJson["cst:Customer"]["cst:ContactDetails"], "cmn:Telephone", "type", "telephoneType");
            jsonUtils.updateJSONElementString(requestJson["cst:Customer"]["cst:ContactDetails"], "cmn:Email", "type", "emailType");
            jsonUtils.updateJSONElementString(requestJson["bsk:Basket"], "bsk:ItemList", "type", "itemType");
            jsonUtils.updateJSONElementString(requestJson, "bsk:Basket", "type", "quantityType");
            jsonUtils.makeIntoArray(requestJson['bsk:Basket'], 'bsk:ItemList', 'cmn:Item');
            
            requestJson['ord:EmailAddress'] = requestJson['cst:Customer']['cst:ContactDetails']['cmn:Email']['#'];
            if (typeof requestJson['ord:LifeCycleDate'] == 'undefined') {
                var currentDate = new Date(Date.now());
                var localDateJson = { '#' : currentDate.toISOString(), '@' : {'lifeCycleDateType' : "OrderPlacedDate"}};
                requestJson['ord:LifeCycleDate'] = localDateJson;
            } else {
                jsonUtils.updateJSONElementString(requestJson, "ord:LifeCycleDate", "type", "lifeCycleDateType");
            }
                              
            for (var i = 0; i < requestJson['bsk:Basket']['bsk:ItemList']['cmn:Item'].length; i++) {
                jsonUtils.convertIDToUri(requestJson['bsk:Basket']['bsk:ItemList']['cmn:Item'][i], "/product/argos", req);
            }

            if (requestJson['ord:Fulfilment']['@']['fulfilmentType'] == "Collection") {
                jsonUtils.convertIDToUri(requestJson['ord:Fulfilment']['loc:Store'], "/location/argos/store", req);
            }
            var orderId = jsonUtils.convertIDToUri(requestJson, "/order/argos", req);
                              
            if (orderId == '') {
                var messageStr = "Order URI not correctly defined";
                res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
                return;
            }
            requestJson['ord:OrderId'] = orderId;
                              
            if (typeof requestJson['cst:Customer']['cst:ContactDetails']['cmn:Telephone']['#'] != 'undefined') {
                requestJson['cmn:Telephone'] = requestJson['cst:Customer']['cst:ContactDetails']['cmn:Telephone']['#'];
            }
                              
            updateOrderStatus(requestJson);
                              
            var localOrder = new Order(requestJson);
            var orderIds = [requestJson['ord:OrderId']];
            Order.findByOrderId(orderIds, function (err, order) {
                if ((typeof order == 'undefined') || (order.length == 0)) {
                    localOrder.save(function (err, post) {
                        if (err) return next(err);
                                   
                        res.set('Content-Type', 'text/xml');
                        var responseString = cleanUpOrderJson(post);
                        responseString = getOrderXML(responseString);
                        res.send(responseString);
                    });
                } else {
                    var messageStr = "Order " + requestJson['ord:OrderId'] + " already exists";
                    res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
                }
            });
        });
                                   
    } else {
        var messageStr = "XML Payload only";
        res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
    }
});


function getOrderXML(orderJson, totalResults, resultsPerPage, pageCount, position) {
    
    var options = {
        declaration: { include : false }
    };
    
    rootElement = "ord:OrderList";
    
    var sourceOrderXMLString = js2xmlparser(rootElement, JSON.stringify(orderJson));

    if (typeof totalResults != 'undefined') {
        var pageData = "totalResults=\"" + totalResults + "\"";
        pageData += " resultsPerPage=\"" + resultsPerPage + "\"";
        pageData += " pageCount=\"" + pageCount + "\"";
        pageData += " position=\"" + position + "\">";
        
        sourceOrderXMLString = jsonUtils.replaceText("<ord:OrderList>", "<ord:OrderList " + pageData, sourceOrderXMLString.toString());
    }
    
    return sourceOrderXMLString;
}


function orderJsonUpdate(orderJson) {
    delete orderJson["ord:OrderId"];
    delete orderJson["ord:EmailAddress"];
    delete orderJson["cmn:Telephone"];
    delete orderJson["__v"];
    delete orderJson["_id"];
    
    jsonUtils.removeId(orderJson['bsk:Basket'], 'bsk:ItemList', 'cmn:Item');
    jsonUtils.updateJSONElementString(orderJson, "ord:Fulfilment", "fulfilmentType", "type");
    jsonUtils.updateJSONElementString(orderJson, "cst:Customer", "emailType", "type");
    jsonUtils.updateJSONElementString(orderJson, "cst:Customer", "telephoneType", "type");
    jsonUtils.updateJSONElementString(orderJson["bsk:Basket"], "bsk:ItemList", "itemType", "type");
    jsonUtils.updateJSONElementString(orderJson, "ord:LifeCycleDate", "lifeCycleDateType", "type");

}

function sortOrderResults (ordersJson) {
    ordersJson.sort(function (a, b) {
        var dateA = Date.parse(a['ord:LifeCycleDate']['#']);
        var dateB = Date.parse(b['ord:LifeCycleDate']['#']);
        if (dateA > dateB) {
            return 1;
        }
        if (dateA < dateB) {
            return -1;
        }
        // a must be equal to b
        return 0;
    });
}

function cleanUpOrderJson(sourceJson) {
    var localOrders = JSON.parse(JSON.stringify(sourceJson));
    
    if (localOrders.length != undefined) {
        var myJsonString = {"ord:Order" : [] };
        for (var i = 0; i < localOrders.length; i++) {
            orderJsonUpdate(localOrders[i]);
            myJsonString["ord:Order"].push(localOrders[i])
        }
    } else {
        orderJsonUpdate(localOrders);
        var myJsonString = {"ord:Order" : [localOrders]};
    }
    return myJsonString;
}


function createOrderGetResponse (request, response, pageSize, pageNumber, orders) {
    if (orders.length != 0) {
        var pagedOrders = jsonUtils.pageResults(orders, pageSize, pageNumber);
        var cleanedUpJson = cleanUpOrderJson(pagedOrders);
        sortOrderResults(cleanedUpJson['ord:Order'])
        response.send(getOrderXML(cleanedUpJson, orders.length, pageSize > cleanedUpJson['ord:Order'].length? cleanedUpJson['ord:Order'].length : pageSize, Math.ceil(orders.length/pageSize),((pageNumber-1)*pageSize) + 1));
    } else {
        var messageStr = "<ord:OrderList xmlns:ord=\"http://schemas.homeretailgroup.com/order\" xmlns:bsk=\"http://schemas.homeretailgroup.com/basket\" xmlns:cmn=\"http://schemas.homeretailgroup.com/common\" xmlns:cst=\"http://schemas.homeretailgroup.com/customer\" xmlns:loc=\"http://schemas.homeretailgroup.com/location\">\n</ord:OrderList>";
        response.status(200).send(messageStr);
    }
}

function updateOrderStatus (orderJson) {
    var currentDate = new Date(Date.now());
    var expiryDate;
    var orderStatusOpen = "Open";
    var orderStatusClosed = "Closed";
    var changed = false;
    
    if (typeof orderJson['ord:OrderStatus'] == 'undefined') {
        originalStatus = undefined;
    } else {
        originalStatus = orderJson['ord:OrderStatus'];
    }
    
    if (orderJson['ord:Fulfilment']['@']['fulfilmentType'] == "Collection") {
        expiryDate = Date.parse(orderJson['ord:Fulfilment']['cmn:LatestCollectionDate']);
    } else {
        expiryDate = Date.parse(orderJson['ord:Fulfilment']['dlv:Delivery']['dlv:DeliveryDetails']['dlv:DeliveryGroup']['dlv:DeliverySlot']['dlv:DeliveryTime']['dlv:End']);
        orderStatusClosed = "Delivered";
    }
    
    if (currentDate > expiryDate) {
        orderJson['ord:OrderStatus'] = orderStatusClosed;
    } else {
        orderJson['ord:OrderStatus'] = orderStatusOpen;
    }
    
    if (orderJson['ord:OrderStatus'] != originalStatus) {
        changed = true;
    }
    
    return changed;
}

function createGetQueryArray (req) {
    
    var queryArray = [];
    
    if (typeof req.query['emailAddress'] != 'undefined') {
        var emailAddressList = [];
        emailAddressList = emailAddressList.concat(req.query['emailAddress']);
        
        emailQuery = { "ord:EmailAddress" : { $in : emailAddressList} };
        queryArray.push(emailQuery);
    }
    
    if (typeof req.query['telephone'] != 'undefined') {
        var telephoneList = [];
        telephoneList = telephoneList.concat(req.query['telephone']);
        telephoneQuery = { "cmn:Telephone" : { $in : telephoneList} };
        queryArray.push(telephoneQuery);
    }
    
    if (typeof req.query['storeId'] != 'undefined') {
        var storeId = [];
        storeId = storeId.concat(req.query['storeId']);
        storeIdQuery = { "ord:Fulfilment.loc:Store.@.uri" : new RegExp(storeId, "g")  };
        queryArray.push(storeIdQuery);
    }
    
    if (typeof req.query['status'] != 'undefined') {
        var orderStatus = [];
        orderStatus = orderStatus.concat(req.query['status']);
        orderStatusQuery = { "ord:OrderStatus" : { $in : orderStatus} };
        queryArray.push(orderStatusQuery);
    }
    
    if (typeof req.query['startDate'] != 'undefined') {
        var startDate = [];
        startDate = startDate.concat(req.query['startDate']);
        
        startDateQuery = { "ord:LifeCycleDate.#" : { $gte : new Date(startDate)} };
        queryArray.push(startDateQuery);
    }
    
    if (typeof req.query['endDate'] != 'undefined') {
        var endDate = [];
        endDate = endDate.concat(req.query['endDate']);
        
        // This increments the date by one day and ends up with a different format, but its still recognised by the parser
        endDateQuery = { "ord:LifeCycleDate.#" : { $lte : new Date(endDate)+1} };
        queryArray.push(endDateQuery);
    }
    
    if (typeof req.query['collectionId'] != 'undefined') {
        var collectionIdList = [];
        collectionIdList = collectionIdList.concat(req.query['collectionId']);
        collectionIdQuery = { "bsk:Basket.bsk:ItemList.cmn:Item.@.collectionId" : { $in : collectionIdList} };
        queryArray.push(collectionIdQuery);
    }

    return queryArray;
}

module.exports = router;