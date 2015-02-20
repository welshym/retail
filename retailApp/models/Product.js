var mongoose = require('mongoose');

var DescriptionSchema = new mongoose.Schema(
    {
        "@": {"descriptionType": String},
        "#": String,
    }
);

var PriceCommentarySchema = new mongoose.Schema(
    {
        "@" : {"commentaryType" : String},
        "#" : String,
    }
);

var PriceSchema = new mongoose.Schema(
    {
        "@": {"priceType": String},
        "prc:Commentary" : [PriceCommentarySchema],
        "prc:Amount" : {    "@": {
                                      "currency": String,
                                      "inclusiveOfTax": String,
                                },
                            "#" : String,
                        }
    }
);

var PurchasingOptionsOptionSchema = new mongoose.Schema(
    {
        "@": {"optionType": String},
        "prd:Commentary" : String,
        "prd:MaximumQuantity" : String,
        "prd:Cost" : { "@": {
                                "currency": String,
                            },
                        "#" : String
                    }
    }
);

var AssociatedMediaSubContentSchema = new mongoose.Schema(
    {
        "@" : {
                "index" : String,
                "subContentType" : String,
                "href" : String,
                "usage" : String,
                "provider" : String,
                }
    }
);

var AssociatedMediaContentSchema = new mongoose.Schema(
    {
        "@" : {
                "index" : String,
                "contentType" : String,
                "href" : String,
                "usage" : String,
                "provider" : String,
            },
        "prd:SubContent" : [AssociatedMediaSubContentSchema],
        "prd:Description" : String,
        "prd:Size" : {"prd:Duration" : String}
    }
);

var RelatedProductsProductSchema = new mongoose.Schema(
    {
        "@": {
                "uri": String,
                "relatedType" : String,
                "brand" : String,
                "index" : String,
                "id" : String,
                "version" : String
            },
        "#" : String
    }
);

var RelatedPromotionsPromotionSchema = new mongoose.Schema(
    {
        "@" : {
                "uri" : String,
                "brand" : String,
                "index" : String,
                "id" : String,
                "version" : String
            },
        "prm:DescriptionList" : [{ "prm:Description" : String }]
    }
);

var ProductSchema = new mongoose.Schema(
                                        
    {
        "@" :   {
                    "id": String,
                    "brand": String,
                    "uri": String,
                    "version": String
                },
        "prd:Brand" : String,
        "prd:ProductId" : String,
        "prd:FalconEligible" : String,
        "prd:DescriptionList" : { "prd:Description" : [DescriptionSchema]},
        "prd:ReturnsPolicy" : String,
        "prd:PurchasingOptions" : { "prd:Option" : [PurchasingOptionsOptionSchema]},
        "prd:PricingInformation" : { "prc:Price" : [PriceSchema]},
                                        
        "prd:Rating" : {
                            "prd:AverageRating" : String,
                            "prd:NumberReviews" : String
                        },
                                        
        "prd:AssociatedMedia" : { "prd:Content" : [AssociatedMediaContentSchema]},
        "prd:RelatedProducts" : { "prd:Product" : [RelatedProductsProductSchema]},
        "prm:RelatedPromotions" : { "prm:Promotion" : [RelatedPromotionsPromotionSchema] }
    });


ProductSchema.static('findByBrand', function (searchBrand, callback) {
              return this.find({ "prd:Brand": searchBrand }, callback);
              });

ProductSchema.static('findByProductId', function (searchIds, callback) {
                     return this.find( { "prd:ProductId" : { $in : searchIds}}, callback);
                     });

ProductSchema.static('findAndRemoveByProductId', function (searchId, callback) {
                     
                     var productsToRemove = this.find( { "prd:ProductId" : searchId});
                     
                     productsToRemove.remove({ "prd:ProductId" : searchId}, callback);
                     });

module.exports = mongoose.model('Product', ProductSchema);
