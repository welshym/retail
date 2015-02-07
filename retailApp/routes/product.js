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
           Product.find(function (err, products) {
                     if (err) return next(err);
                        res.set('Content-Type', 'text/xml');
                        
                        var cleanedUpJson = cleanUpProductJson(products);
                        res.send(getProductXML(cleanedUpJson));
                     });
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
        res.send(getProductXML(cleanUpProductJson(products)));
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
              Product.findAndRemoveByProductId(req.params.id, function (err, products) {
                                      if (err) return next(err);
                                      
                                               console.log("delete");
                                               console.log(products);
                                               res.status(204).end();
                                      });
              });

/* POST /product */
router.post('/', function(req, res, next) {
            console.log("Request body is: ", req.body);
            if (JSON.stringify(req.body) == '{}')
            {
            var inspect = require('eyes').inspector({maxLength: false})
            xmlParser.parseString(req.rawData, function (err, result) {

                                  var originalJson = JSON.parse(JSON.stringify(result['prd:ProductList']['prd:Product']));
                                  var updatedJson = updateJSONElementString(originalJson, "prd:DescriptionList", "type", "descriptiontype");
                                  
                                  updatedJson['prd:ProductId'] = result['prd:ProductList']['prd:Product']['@']['id'];
                                  makeIntoArray(updatedJson, 'prd:DescriptionList', 'prd:Description');

                                  var localProd = new Product(updatedJson);
                                  localProd.save(function (err, post) {
                                                 if (err) return next(err);
                                                 
                                                 postReplyJsonString = cleanUpProductJson(post);
                                                 
                                                 res.set('Content-Type', 'text/xml');
                                                 res.send(js2xmlparser("prd:ProductList", postReplyJsonString));
//                                                 res.send(getProductXML(cleanUpProductJson(postReplyJsonString)));
                                                 });
                                  });
            
            }
            else
            {
            Product.create(req.body, function (err, post) {
                        if (err) return next(err);
                        res.json(post);
                        });
            }
            });

function replaceText(findText, replacementText, sourceString) {
    var re = new RegExp(findText,"g");
    
    return sourceString.replace(re, replacementText);
}

function updateJSONElementString(fullJson, jsonElementToUpdate, findText, replacementText) {
    
    var stringJson = JSON.stringify(fullJson[jsonElementToUpdate]);
    var editedJson =  fullJson;
    
    stringJson = replaceText(findText, replacementText, stringJson);
    delete editedJson[jsonElementToUpdate];
    editedJson[jsonElementToUpdate] = JSON.parse(stringJson);
    
    return editedJson;
}

function makeIntoArray(fullJsonToModify, rootElement, changeElement) {
    var elementToMod = fullJsonToModify[rootElement][changeElement];
    var editedJson = fullJsonToModify;
    if (typeof fullJsonToModify[rootElement][changeElement].length == 'undefined') {
        var myString = "{\"" + changeElement + "\":" + "[" + JSON.stringify(fullJsonToModify[rootElement][changeElement]) + "]}";
        var myJsonString = JSON.parse(myString);
        delete editedJson [rootElement];
        editedJson[rootElement] = myJsonString;
    }
    return editedJson

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
        console.log("\n\nreplacementText");
        console.log(replacementText);
        
        var typeString = "longHtml" + i;
        var re = new RegExp("<prd:Description type=\""+typeString+"\">[\x00-\xff]*MCWTEST" + i + "<\/prd:Description>");
        sourceProductXMLString = sourceProductXMLString.replace(re, replacementText);
        sourceProductXMLString = sourceProductXMLString.replace(typeString, "longHtml");
        sourceProductXMLString = sourceProductXMLString.replace("MCWTEST" + i, "");
    }

    return sourceProductXMLString
}



function cleanUpProductJson(sourceJson) {
    var localProds = JSON.parse(JSON.stringify(sourceJson));
    
    if (localProds.length != undefined) {
        var myJsonString = {"prd:Product" : [] };
        for (i = 0; i < localProds.length; i++) {
            delete localProds[i]["prd:ProductId"];
            delete localProds[i]["__v"];
            delete localProds[i]["_id"];
        
            for (j = 0; j < localProds[i]['prd:DescriptionList']['prd:Description'].length; j++) {
                delete localProds[i]['prd:DescriptionList']['prd:Description'][j]["_id"];
            }
            
            var updatedJson = updateJSONElementString(localProds[i], "prd:DescriptionList", "descriptiontype", "type");
            myJsonString["prd:Product"].push(updatedJson)
        }
    } else {
        delete localProds["prd:ProductId"];
        delete localProds["__v"];
        delete localProds["_id"];
        
        for (j = 0; j < localProds['prd:DescriptionList']['prd:Description'].length; j++) {
            delete localProds['prd:DescriptionList']['prd:Description'][j]["_id"];
        }
        var updatedJson = updateJSONElementString(localProds, "prd:DescriptionList", "descriptiontype", "type");
        
        var myJsonString = {"prd:Product" : updatedJson};
        
    }
    return myJsonString;
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
 {  "@" : { "descriptiontype" : "123456"}, "#" : "Test Description"},
 {  "@" : { "descriptiontype" : "1234567"}, "#" : "Test Description 2"}
 ]
 }
 };

*/