var mongoose = require('mongoose');

// To do
// Split out the schemas
// Add the correct types
// Add appropriate indexes for searching

var OrderSchema = new mongoose.Schema(
                                        
    {
        "@" :   {
                    "id": String, // This needs to be removed
                    "uri" : String,
                },
        "ord:OrderId" : String, // Utility for searching comes from the URI
        "ord:LifeCycleDate" : {
                                "#" : String,
                                "@" : { "lifeCycleDateType" : String}
                              },
        "ord:OrderStatus" : String,
        "ord:EmailAddress" : String,  // Utility for searching
        "cmn:Telephone" : String, // Utility for searching
        "cst:Customer" :    {
                                      "cst:ContactDetails" : {
                                                                "cmn:Telephone" :   {
                                                                                    "@" : { "telephoneType" : String},
                                                                                    "#" : String
                                                                                    },
                                                                "cmn:Email" :  {
                                                                                    "@" : { "emailType" : String},
                                                                                    "#" : String
                                                                                }
                                                              },
                            },
        "bsk:Basket" : {
                            "bsk:ItemList" : {
                                                    "cmn:Item" : [{
                                                                    "@" : {
                                                                            "collectionId" : String,
                                                                            "itemType" : String,
                                                                            "uri" : String
                                                                            },
                                                                    "cmn:Value" : { "#" : String, "@" : { "currency" : String}},
                                                                    "cmn:Quantity" : { "@" : {"quantityType" : String}, "#" : String},
                                                                    "cmn:EarliestCollectionDate" : String,
                                                                    "cmn:LatestCollectionDate" : String,
                                                                    "cmn:Description" : String,
                                                                 }]
                                                },
                            "bsk:Value" : { "#" : String, "@" : { "currency" : String}},
                        },
        "ord:Fulfilment" : {    "@" : {
                                      "fulfilmentType" : String,
                                      "collectionId" : String
                                      },
                                "loc:Store" : { "@" :  {
                                                        "uri" : String,
                                                        "version" : String,
                                                        "brand" : String
                                                    }
                                            },
                                "cmn:EarliestCollectionDate" : String,
                                "cmn:LatestCollectionDate" : String,
                                "dlv:Delivery" : {
                                      "dlv:DeliveryDetails" : {
                                            "dlv:DeliveryAddress" : {
                                                        "dlv:DeliveryPostCode" : String,
                                                        "dlv:DeliveryGroup" : {
                                                            "dlv:DeliverySlot" : {
                                                                "dlv:DeliveryDate" : String,
                                                                "dlv:DeliveryTime" : {
                                                                    "dlv:Start" : String,
                                                                    "dlv:End" : String
                                                                }
                                                            }
                                                        }
                                            }
                                      }
                                }
                        }
    });


OrderSchema.static('findByBrand', function (searchBrand, callback) {
    return this.find({ "prd:Brand": searchBrand }, callback);
});

OrderSchema.static('findByEmailAddress', function (searchEmailAddress, callback) {
                   console.log("\n\nsearchEmailAddress");
                   console.log(searchEmailAddress);
    return this.find( { "ord:EmailAddress" : { $in : searchEmailAddress}}, callback);
});

OrderSchema.static('findByEmailAddressAndTelephoneNumber', function (searchEmailAddress, telephoneNumber, callback) {
    return this.find( { $and: [ { "ord:EmailAddress" : { $in : searchEmailAddress} }, { "cmn:Telephone" : { $in: telephoneNumber } } ] }, callback);
});


OrderSchema.static('findByOrderId', function (searchIds, callback) {
    return this.find( { "ord:OrderId" : { $in : searchIds}}, callback);
});

OrderSchema.static('findAndRemoveByOrderId', function (orderId, callback) {
    var ordersToRemove = this.find( { "ord:OrderId" : orderId});
                     
    ordersToRemove.remove({ "ord:OrderId" : orderId}, callback);
});

module.exports = mongoose.model('Order', OrderSchema);
