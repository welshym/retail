var express = require('express');
var mongoose = require('mongoose');
var Product = require('../models/Product.js');
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

/* GET /product listing. */
router.get('/', function(req, res, next) {
           res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
           res.set('Cache-Control', 'max-age=86400');
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
                            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
                        }
                });

           }
           else {
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
           
                Product.find(function (err, products) {
                        if (err) return next(err);
                        
                        createProductGetResponse(req, res, pageSize, pageNumber, products);
                });
           
           }
});

/* GET /product/id */
router.get('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'max-age=86400');
    
    var searchIds = [req.params.id];
           
    if (typeof req.query['id'] != 'undefined') {
        searchIds = searchIds.concat(req.query['id']);
    }
           
    Product.findByProductId(searchIds, function (err, products) {
        if (err) return next(err);
        
                            
        if (products.length != 0) {
            var cleanedUpJson = cleanUpProductJson(products);
            res.send(getProductXML(cleanedUpJson));
        } else {
            var messageStr = "Product " + searchIds + " not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});

/* PUT /product/:id */
router.put('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'max-age=86400');
           
    Product.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
                              
        if (err) return next(err);
        res.json(post);
    });
});

/* DELETE /product/:id */
router.delete('/:id', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
              
    if (req.params.id == "") {
        var messageStr = "Product " + req.params.id + " not defined";
        res.status(400).send(jsonUtils.createErrorMessage(messageStr, "400"));
    }

    Product.findAndRemoveByProductId(req.params.id, function (err, products) {
        if (err) return next(err);
                                     
        if (products != 0) {
            res.status(204).end();
        } else {
            var messageStr = "Product " + req.params.id + " not found";
            res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
        }
    });
});

router.delete('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'no-cache');
              
    var messageStr = "Product not defined";
    res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
});


/* POST /product */
router.post('/', function(req, res, next) {
    res.set('Content-Type', 'application/vnd.homeretailgroup.product; version=2; format=xml ; charset=UTF-8');
    res.set('Cache-Control', 'max-age=86400');
            
    if (JSON.stringify(req.body) == '{}')
    {
        xmlParser.parseString(req.rawData, function (err, result) {
            var requestJson = JSON.parse(JSON.stringify(result['prd:ProductList']['prd:Product']));
            requestJson['prd:ProductId'] = result['prd:ProductList']['prd:Product']['@']['id'];
            
            jsonUtils.updateJSONElementString(requestJson, "prd:DescriptionList", "type", "descriptionType");
            jsonUtils.updateJSONElementString(requestJson, "prd:PurchasingOptions", "type", "optionType");
            jsonUtils.updateJSONElementString(requestJson, "prd:RelatedProducts", "type", "relatedType");
                              
            jsonUtils.makeIntoArray(requestJson['prd:DescriptionList'], 'prd:Description');
            jsonUtils.makeIntoArray(requestJson['prd:PurchasingOptions'], 'prd:Option');
            jsonUtils.makeIntoArray(requestJson['prd:RelatedProducts'], 'prd:Product');
            
            if (jsonUtils.isArray(requestJson['prd:PricingInformation']['prc:Price'])) {
                for (var i = 0; i < requestJson['prd:PricingInformation']['prc:Price'].length; i++) {
                    jsonUtils.updateJSONElementString(requestJson['prd:PricingInformation']['prc:Price'][i], "prc:Commentary", "type", "commentaryType");
                    jsonUtils.makeIntoArray(requestJson['prd:PricingInformation']['prc:Price'][i], 'prc:Commentary');
                }
            } else {
                jsonUtils.updateJSONElementString(requestJson['prd:PricingInformation']['prc:Price'], "prc:Commentary", "type", "commentaryType");
                jsonUtils.makeIntoArray(requestJson['prd:PricingInformation']['prc:Price'], 'prc:Commentary');
            }
            jsonUtils.makeIntoArray(requestJson['prd:PricingInformation'], 'prc:Price');
            jsonUtils.updateJSONElementString(requestJson, "prd:PricingInformation", "type", "priceType");
                              
            if (jsonUtils.isArray(requestJson['prd:AssociatedMedia']['prd:Content'])) {
                for (var i = 0; i < requestJson['prd:AssociatedMedia']['prd:Content'].length; i++) {
                    jsonUtils.makeIntoArray(requestJson['prd:AssociatedMedia']['prd:Content'][i], 'prd:SubContent');
                    jsonUtils.updateJSONElementString(requestJson['prd:AssociatedMedia']['prd:Content'][i], ['prd:SubContent'], "type", "subContentType");
                }
            } else {
                jsonUtils.makeIntoArray(requestJson['prd:AssociatedMedia']['prd:Content'], 'prd:SubContent');
                jsonUtils.updateJSONElementString(requestJson['prd:AssociatedMedia']['prd:Content'], 'prd:SubContent', "type", "subContentType");
            }
            jsonUtils.makeIntoArray(requestJson['prd:AssociatedMedia'], 'prd:Content');
            jsonUtils.updateJSONElementString(requestJson, "prd:AssociatedMedia", "type", "contentType");

            // Do we have any promotions?
            if (typeof requestJson['prm:RelatedPromotions'] != 'undefined') {
                if (jsonUtils.isArray(requestJson['prm:RelatedPromotions']['prm:Promotion'])) {
                    for (var i = 0; i < requestJson['prm:RelatedPromotions']['prm:Promotion'].length; i++) {
                        jsonUtils.makeIntoArray(requestJson['prm:RelatedPromotions']['prm:Promotion'][i], 'prm:DescriptionList');
                    }
                } else {
                    jsonUtils.makeIntoArray(requestJson['prm:RelatedPromotions']['prm:Promotion'], 'prm:DescriptionList');
                }
                jsonUtils.makeIntoArray(requestJson['prm:RelatedPromotions'], 'prm:Promotion');
            }
                             
                              
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
                    res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
                }
            });
                              
        });
    } else {
        var messageStr = "XML Payload only";
        res.status(400).send(jsonUtils.createErrorMessage (messageStr, "400"));
    }
});



function getProductXML(productJson, totalResults, resultsPerPage, pageCount, position) {
    
    var sourceLongHTMLJS = [];
    var options = {
                    useCDATA: true,
                    declaration: { include : false }
    };
    
    for (var i = 0; i < productJson['prd:Product'].length; i++) {
        
        for (var j = 0; j < productJson['prd:Product'][i]['prd:DescriptionList']['prd:Description'].length; j++) {
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
    for (var i = 0; i < sourceLongHTMLJS.length; i++) {
        replacementText = js2xmlparser("prd:Description", JSON.stringify(sourceLongHTMLJS[i]), options);
        
        var typeString = "longHtml" + i;
        var re = new RegExp("<prd:Description type=\""+typeString+"\">[\x00-\xff]*MCWTEST" + i + "<\/prd:Description>");
        sourceProductXMLString = sourceProductXMLString.replace(re, replacementText);
        sourceProductXMLString = sourceProductXMLString.replace(typeString, "longHtml");
        sourceProductXMLString = sourceProductXMLString.replace("MCWTEST" + i, "");
    }

    if (typeof totalResults != 'undefined') {
        var pageData = "totalResults=\"" + totalResults + "\"";
        pageData += " resultsPerPage=\"" + resultsPerPage + "\"";
        pageData += " pageCount=\"" + pageCount + "\"";
        pageData += " position=\"" + position + "\">";
        
        sourceProductXMLString = jsonUtils.replaceText("<prd:ProductList>", "<prd:ProductList " + pageData, sourceProductXMLString.toString());
    }

    
    return sourceProductXMLString
}

function productJsonUpdate(productJson) {
    delete productJson["prd:ProductId"];
    delete productJson["__v"];
    delete productJson["_id"];
    
    if (typeof productJson['prd:FalconEligible'] == 'undefined') {
        productJson['prd:FalconEligible'] = 'false';
    }

    jsonUtils.removeId(productJson['prd:DescriptionList'], 'prd:Description');
    jsonUtils.updateJSONElementString(productJson, "prd:DescriptionList", "descriptionType", "type");
    
    jsonUtils.removeId(productJson['prd:PurchasingOptions'], 'prd:Option');
    jsonUtils.updateJSONElementString(productJson, "prd:PurchasingOptions", "optionType", "type");
    
    jsonUtils.removeId(productJson['prd:PricingInformation'], 'prc:Price');
    jsonUtils.updateJSONElementString(productJson, "prd:PricingInformation", "priceType", "type");

    for (var j = 0; j < productJson['prd:PricingInformation']['prc:Price'].length; j++) {
        jsonUtils.removeId(productJson['prd:PricingInformation']['prc:Price'][j], 'prc:Commentary');
    }
    jsonUtils.updateJSONElementString(productJson, "prd:PricingInformation", "commentaryType", "type");
    
    jsonUtils.removeId(productJson['prd:AssociatedMedia'], 'prd:Content');
    jsonUtils.updateJSONElementString(productJson, "prd:AssociatedMedia", "contentType", "type");
    
    for (var j = 0; j < productJson['prd:AssociatedMedia']['prd:Content'].length; j++) {
        jsonUtils.removeId(productJson['prd:AssociatedMedia']['prd:Content'][j], 'prd:SubContent');
    }
    jsonUtils.updateJSONElementString(productJson, "prd:AssociatedMedia", "subContentType", "type");

    jsonUtils.removeId(productJson['prd:RelatedProducts'], 'prd:Product');
    jsonUtils.updateJSONElementString(productJson, "prd:RelatedProducts", "relatedType", "type");

    jsonUtils.removeId(productJson['prm:RelatedPromotions'], 'prm:Promotion');
    if (jsonUtils.isArray(productJson['prm:RelatedPromotions']['prm:Promotion'])) {
        for (var j = 0; j < productJson['prm:RelatedPromotions']['prm:Promotion'].length; j++) {
            jsonUtils.removeId(productJson['prm:RelatedPromotions']['prm:Promotion'][j], 'prm:DescriptionList');
        }
    }
}


function cleanUpProductJson(sourceJson) {
    var localProds = JSON.parse(JSON.stringify(sourceJson));
    
    if (localProds.length != undefined) {
        var myJsonString = {"prd:Product" : [] };
        for (var i = 0; i < localProds.length; i++) {
            productJsonUpdate(localProds[i]);
            myJsonString["prd:Product"].push(localProds[i])
        }
    } else {
        productJsonUpdate(localProds);
        var myJsonString = {"prd:Product" : [localProds]};
    }
    return myJsonString;
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


function createProductGetResponse (request, response, pageSize, pageNumber, products) {
    if (products.length != 0) {
        var pagedProducts = jsonUtils.pageResults(products, pageSize, pageNumber);
        var cleanedUpJson = cleanUpProductJson(pagedProducts);
        response.send(getProductXML(cleanedUpJson, products.length, pageSize > cleanedUpJson['prd:Product'].length? cleanedUpJson['prd:Product'].length : pageSize, Math.ceil(products.length/pageSize),((pageNumber-1)*pageSize) + 1));
    } else {
        var messageStr = "Products not found";
        res.status(404).send(jsonUtils.createErrorMessage (messageStr, "404"));
    }
}


function shortenProductResponse(fullProductJson) {
    
    var shortenLoop;
    var descriptionLoop;

    if (fullProductJson['prd:Product'].length != undefined) {
        for (var shortenLoop = 0; shortenLoop < fullProductJson['prd:Product'].length; shortenLoop++) {
            removeProductArrayElements(fullProductJson['prd:Product'][shortenLoop])
        }
    } else {
        removeProductArrayElements(fullProductJson['prd:Product'])
    }
}

module.exports = router;