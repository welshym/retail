var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Product = require('../models/Product.js');

var xml2js = require('xml2js');
var options = {
    charkey : "#",
    attrkey : "@",
    explicitArray: false
};

var xmlParser = xml2js.Parser(options);
var js2xmlparser = require("js2xmlparser");

/* GET /product listing. */
router.get('/', function(req, res, next) {

           if (typeof req.query['id'] != 'undefined') {
                var searchIds = [];
                searchIds = searchIds.concat(req.query['id']);
           
                Product.findByProductId(searchIds, function (err, products) {
                        if (err) return next(err);
                                   
                        if (products.length != 0) {
                            var cleanedUpJson = cleanUpProductJson(products);
                            shortenProductResponse(cleanedUpJson);
                            res.send(getProductXML(cleanedUpJson));
                        } else {
                            var messageStr = "Product " + searchIds + " not found";
                            res.status(404).send(createErrorMessage (messageStr, "404"));
                        }
                });

           }
           else {
                Product.find(function (err, products) {
                        if (err) return next(err);
                        res.set('Content-Type', 'text/xml');
                        
                        if (products.length != 0) {
                             var cleanedUpJson = cleanUpProductJson(products);
                             shortenProductResponse(cleanedUpJson);
                             res.send(getProductXML(cleanedUpJson));
                        } else {
                             var messageStr = "Products not found";
                             res.status(404).send(createErrorMessage (messageStr, "404"));
                        }
                });
           
           }
           
           
           
           });

/* GET /product/id */
router.get('/:id', function(req, res, next) {
    var searchIds = [req.params.id];
           
    if (typeof req.query['id'] != 'undefined') {
        searchIds = searchIds.concat(req.query['id']);
    }
           
    Product.findByProductId(searchIds, function (err, products) {
        if (err) return next(err);
        
        res.set('Content-Type', 'text/xml');
                            
        if (products.length != 0) {
            var cleanedUpJson = cleanUpProductJson(products);
            res.send(getProductXML(cleanedUpJson));
        } else {
            var messageStr = "Product " + searchIds + " not found";
            res.status(404).send(createErrorMessage (messageStr, "404"));
        }
    });
});

/* PUT /product/:id */
router.put('/:id', function(req, res, next) {
    Product.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
                              
        if (err) return next(err);
        res.json(post);
    });
});

/* DELETE /product/:id */
router.delete('/:id', function(req, res, next) {
    if (req.params.id == "") {
        var messageStr = "Product " + req.params.id + " not defined";
        res.status(400).send(createErrorMessage (messageStr, "400"));
    }

    Product.findAndRemoveByProductId(req.params.id, function (err, products) {
        if (err) return next(err);
                                               
        if (products != 0) {
            res.status(204).end();
        } else {
            var messageStr = "Product " + req.params.id + " not found";
            res.status(404).send(createErrorMessage (messageStr, "404"));
        }
    });
});

router.delete('/', function(req, res, next) {
    var messageStr = "Product not defined";
    res.status(400).send(createErrorMessage (messageStr, "400"));
});


/* POST /product */
router.post('/', function(req, res, next) {
            
    if (JSON.stringify(req.body) == '{}')
    {
        var inspect = require('eyes').inspector({maxLength: false})
        xmlParser.parseString(req.rawData, function (err, result) {
            var requestJson = JSON.parse(JSON.stringify(result['prd:ProductList']['prd:Product']));
            updateJSONElementString(requestJson, "prd:DescriptionList", "type", "descriptionType");
            updateJSONElementString(requestJson, "prd:PurchasingOptions", "type", "optionType");
            updateJSONElementString(requestJson, "prd:AssociatedMedia", "type", "contentType");
            updateJSONElementString(requestJson, "prd:AssociatedMedia", "type", "subContentType");
            updateJSONElementString(requestJson, "prd:RelatedProducts", "type", "relatedType");
            updateJSONElementString(requestJson, "prd:PricingInformation", "type", "priceType");
            updateJSONElementString(requestJson, "prd:PricingInformation", "type", "commentaryType");
                              
            requestJson['prd:ProductId'] = result['prd:ProductList']['prd:Product']['@']['id'];
                              
            makeIntoArray(requestJson, 'prd:DescriptionList', 'prd:Description');
            makeIntoArray(requestJson, 'prd:PurchasingOptions', 'prd:Option');
            makeIntoArray(requestJson, 'prd:RelatedProducts', 'prd:Product');
            
            if (isArray(requestJson['prd:PricingInformation']['prc:Price'])) {
                for (i = 0; i < requestJson['prd:PricingInformation']['prc:Price'].length; i++) {
                    makeIntoArray(requestJson['prd:PricingInformation']['prc:Price'], i, 'prc:Commentary');
                }
            } else {
                makeIntoArray(requestJson['prd:PricingInformation'], 'prc:Price', 'prc:Commentary');
            }
            makeIntoArray(requestJson, 'prd:PricingInformation', 'prc:Price');

            if (isArray(requestJson['prd:AssociatedMedia']['prc:Content'])) {
                for (i = 0; i < requestJson['prd:AssociatedMedia']['prc:Content'].length; i++) {
                    makeIntoArray(requestJson['prd:AssociatedMedia']['prc:Content'], i, 'prd:SubContent');
                }
            } else {
                makeIntoArray(requestJson['prd:AssociatedMedia'], 'prc:Content', 'prd:SubContent');
            }
            makeIntoArray(requestJson, 'prd:AssociatedMedia', 'prd:Content');

            if (isArray(requestJson['prm:RelatedPromotions']['prm:Promotion'])) {
                for (i = 0; i < requestJson['prm:RelatedPromotions']['prm:Promotion'].length; i++) {
                    makeIntoArray(requestJson['prm:RelatedPromotions']['prm:Promotion'], i, 'prm:DescriptionList');
                }
            } else {
                makeIntoArray(requestJson['prm:RelatedPromotions'], 'prm:Promotion', 'prm:DescriptionList');
            }
            makeIntoArray(requestJson, 'prm:RelatedPromotions', 'prm:Promotion');
                              
            var localProd = new Product(requestJson);
            
            Product.findByProductId([result['prd:ProductList']['prd:Product']['@']['id']], function (err, products) {
            
                if (products.length == 0) {
                    localProd.save(function (err, post) {
                        if (err) return next(err);
                        res.set('Content-Type', 'text/xml');
                        res.send(getProductXML(cleanUpProductJson(post)));
                    });
                } else {
                    var messageStr = "Product " + requestJson['prd:ProductId'] + " already exists";
                    res.status(404).send(createErrorMessage (messageStr, "404"));
                }
            });
                              
        });
    }
});


function replaceText(findText, replacementText, sourceString) {
    var re = new RegExp(findText,"g");
    
    return sourceString.replace(re, replacementText);
}

function updateJSONElementString(fullJson, jsonElementToUpdate, findText, replacementText) {
    
    if (typeof fullJson[jsonElementToUpdate] == 'undefined') {
        return
    }
    console.log(fullJson[jsonElementToUpdate]);
    
    var stringJson = JSON.stringify(fullJson[jsonElementToUpdate]);
    
    stringJson = replaceText(findText, replacementText, stringJson);
    delete fullJson[jsonElementToUpdate];
    fullJson[jsonElementToUpdate] = JSON.parse(stringJson);
}

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

function makeIntoArray(fullJsonToModify, rootElement, changeElement) {
    
    if ((typeof fullJsonToModify == 'undefined') ||
        (typeof fullJsonToModify[rootElement] == 'undefined') ||
        (typeof fullJsonToModify[rootElement][changeElement] == 'undefined')){
        return
    }
    
    if (!isArray(fullJsonToModify[rootElement][changeElement])) {
        
        var myString = "[" + JSON.stringify(fullJsonToModify[rootElement][changeElement]) + "]";
        var myJsonString = JSON.parse(myString);
                
        delete fullJsonToModify [rootElement][changeElement];
        
        fullJsonToModify[rootElement][changeElement] = myJsonString;
    }
}


function getProductXML(productJson) {
    
    var sourceLongHTMLJS = [];
    var options = {
                    useCDATA: true,
                    declaration: { include : false }
    };
    
    for (i = 0; i < productJson['prd:Product'].length; i++) {
        
        for (j = 0; j < productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'].length; j++) {
            if (productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]['@']['type'] == "longHtml") {
                productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]['#'] = productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]['#'].trim();
                sourceLongHTMLJS.push(productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]);
                productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]['@']['type'] = "longHtml"+i;
                productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]['#'] = productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'][j]['#'] + "MCWTEST" + i;
                break;
            }
        }
    }
  
    var sourceProductXMLString = js2xmlparser("prd:ProductList", JSON.stringify(productJson));
    for (i = 0; i < sourceLongHTMLJS.length; i++) {
        replacementText = js2xmlparser("prd:Description", JSON.stringify(sourceLongHTMLJS[i]), options);
        
        var typeString = "longHtml" + i;
        var re = new RegExp("<prd:Description type=\""+typeString+"\">[\x00-\xff]*MCWTEST" + i + "<\/prd:Description>");
        sourceProductXMLString = sourceProductXMLString.replace(re, replacementText);
        sourceProductXMLString = sourceProductXMLString.replace(typeString, "longHtml");
        sourceProductXMLString = sourceProductXMLString.replace("MCWTEST" + i, "");
    }

    return sourceProductXMLString
}

function productJsonUpdate(productJson) {
    delete productJson["prd:ProductId"];
    delete productJson["__v"];
    delete productJson["_id"];
    
    removeId(productJson, 'prd:DescriptionList', 'prd:Description');
    updateJSONElementString(productJson, "prd:DescriptionList", "descriptionType", "type");
    
    removeId(productJson, 'prd:PurchasingOptions', 'prd:Option');
    updateJSONElementString(productJson, "prd:PurchasingOptions", "optionType", "type");
    
    removeId(productJson, 'prd:PricingInformation', 'prc:Price');
    updateJSONElementString(productJson, "prd:PricingInformation", "priceType", "type");

    for (j = 0; j < productJson['prd:PricingInformation']['prc:Price'].length; j++) {
        removeId(productJson['prd:PricingInformation']['prc:Price'], j, 'prc:Commentary');
    }
    updateJSONElementString(productJson, "prd:PricingInformation", "commentaryType", "type");
    
    removeId(productJson, 'prd:AssociatedMedia', 'prd:Content');
    updateJSONElementString(productJson, "prd:AssociatedMedia", "contentType", "type");
    
    for (j = 0; j < productJson['prd:AssociatedMedia']['prd:Content'].length; j++) {
        removeId(productJson['prd:AssociatedMedia']['prd:Content'], j, 'prd:SubContent');
    }
    updateJSONElementString(productJson, "prd:AssociatedMedia", "subContentType", "type");

    removeId(productJson, 'prd:RelatedProducts', 'prd:Product');
    updateJSONElementString(productJson, "prd:RelatedProducts", "relatedType", "type");

    removeId(productJson, 'prm:RelatedPromotions', 'prm:Promotion');
    if (isArray(productJson['prm:RelatedPromotions']['prm:Promotion'])) {
        for (j = 0; j < productJson['prm:RelatedPromotions']['prm:Promotion'].length; j++) {
            removeId(productJson['prm:RelatedPromotions']['prm:Promotion'], j, 'prm:DescriptionList');
        }
    }
}

function removeId(jsonElement, rootElement, contentElement) {
    if (typeof jsonElement[rootElement][contentElement] != 'undefined') {
        if (isArray(jsonElement[rootElement][contentElement])) {
            for (removeCount = 0; removeCount < jsonElement[rootElement][contentElement].length; removeCount++) {
                delete jsonElement[rootElement][contentElement][removeCount]["_id"];
            }
        } else {
            delete jsonElement[rootElement][contentElement]["_id"];
        }
    }
    
    return jsonElement;
}


function cleanUpProductJson(sourceJson) {
    var localProds = JSON.parse(JSON.stringify(sourceJson));
    
    if (localProds.length != undefined) {
        var myJsonString = {"prd:Product" : [] };
        for (i = 0; i < localProds.length; i++) {
            productJsonUpdate(localProds[i]);
            myJsonString["prd:Product"].push(localProds[i])
        }
    } else {
        productJsonUpdate(localProds);
        myJsonString = {"prd:Product" : [localProds]};
    }
    return myJsonString;
}


function createErrorMessage (messageString, errorCode) {
    
    var errorString = "<rsp:Error xmlns:rsp=\"http://schemas.homeretailgroup.com/response\" xsi:schemaLocation=\"http://schemas.homeretailgroup.com/response group-response-v1.xsd\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n";
    
    errorString += "<rsp:Code>" + errorCode + "</rsp:Code>";
    errorString += "<rsp:Message>" + messageString + "</rsp:Message>";
    errorString += "</rsp:Error>";
    
    return errorString;
}

function removeProductArrayElements(productsJson) {
    delete productsJson['prd:RelatedProducts'];
    
    var descriptionLoop = productsJson['prd:DescriptionList']['prd:Description'].length
    while (descriptionLoop--) {
        if (productsJson['prd:DescriptionList']['prd:Description'][descriptionLoop]['@']['type'] == "long") {
            productsJson['prd:DescriptionList']['prd:Description'].splice(descriptionLoop, 1);
        } else {
            if (productsJson['prd:DescriptionList']['prd:Description'][descriptionLoop]['@']['type'] == "longHtml") {
                productsJson['prd:DescriptionList']['prd:Description'].splice(descriptionLoop, 1);
            }
        }
    }
    
}

function shortenProductResponse(fullProductJson) {
    
    var shortenLoop;
    var descriptionLoop;

    if (fullProductJson['prd:Product'].length != undefined) {
        for (shortenLoop = 0; shortenLoop < fullProductJson['prd:Product'].length; shortenLoop++) {
            removeProductArrayElements(fullProductJson['prd:Product'][shortenLoop])
        }
    } else {
        removeProductArrayElements(fullProductJson['prd:Product'])
    }
}

module.exports = router;


/*
 test data
 
 var testProductJson = {"@":   {
 "id":"123456",
 "uri":"testuri",
 "brand":"argos",
 "version":"2"
 },
 "prd:Brand":    "TestName3",
 "prd:DescriptionList":
 
 {"prd:Description": [
 {  "@" : { "descriptionType" : "123456"}, "#" : "Test Description"},
 {  "@" : { "descriptionType" : "1234567"}, "#" : "Test Description 2"}
 ]
 }
 };

*/