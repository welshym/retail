var mongoose = require('mongoose');

var DescriptionSchema = new mongoose.Schema(
    {
        "@":    {
                    "type": String
                },
         "#":    String
    });

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
        "prd:DescriptionList" : { "prd:Description" : [{
                                                        "@": {"descriptionType": String},
                                                        "#": String,
                                                       } ]},
        "prd:ReturnsPolicy" : String,
        "prd:PurchasingOptions" : { "prd:Option" : [{
                                                    "@": {"optionType": String},
                                                    "prd:Commentary" : String,
                                                    "prd:MaximumQuantity" : String,
                                                    "prd:Cost" : { "@": {
                                                                            "currency": String,
                                                                        },
                                                                    "#" : String
                                                                }
                                                    }]},
        "prd:PricingInformation" : { "prc:Price" : [{
                                                        "@": {"priceType": String},
                                                        "prc:Commentary" : [{
                                                                                "@" : {
                                                                                        "commentaryType" : String,
                                                                                  },
                                                                                "#" : String,
                                                                            }],
                                                        "prc:Amount" : {        "@": {
                                                                                        "currency": String,
                                                                                        "inclusiveOfTax": String,
                                                                                    },
                                                                                "#" : String,
                                                                        }
                                                    }]},
                                        
                                        
        "prd:Rating" : {
                            "prd:AverageRating" : String,
                            "prd:NumberReviews" : String
                        },
                                        
        "prd:AssociatedMedia" : {
                                        "prd:Content" : [{
                                                            "@" : {
                                                                    "index" : String,
                                                                    "contentType" : String,
                                                                    "href" : String,
                                                                    "usage" : String,
                                                                    "provider" : String,
                                                                },
                                                            "prd:SubContent" : [{
                                                                                    "@" : {
                                                                                    "index" : String,
                                                                                    "subContentType" : String,
                                                                                    "href" : String,
                                                                                    "usage" : String,
                                                                                    "provider" : String,
                                                                                }
                                                                             }],
                                                         "prd:Description" : String,
                                                         "prd:Size" : {
                                                                        "prd:Duration" : String,
                                                         }
                                                        }],
                                },
        "prd:RelatedProducts" : { "prd:Product" : [{
                                                            "@": {
                                                                    "uri": String,
                                                                    "relatedType" : String,
                                                                    "brand" : String,
                                                                    "index" : String,
                                                                    "id" : String,
                                                                    "version" : String
                                                                 },
                                                            "#" : String
                                                        }]
                                },
        "prm:RelatedPromotions" : { "prm:Promotion" : [{
                                                            "@" : {
                                                                    "uri" : String,
                                                                    "brand" : String,
                                                                    "index" : String,
                                                                    "id" : String,
                                                                    "version" : String
                                                                },
                                                            "prm:DescriptionList" : [{ "prm:Description" : String }]
                                                       }]
                                        }
    });

/*
 
 <prm:RelatedPromotions>
 <prm:Promotion uri="http://api.homeretailgroup.com:1210/promotion/argos/E17047" brand="argos" index="0" id="E17047" version="2">
 <prm:DescriptionList>
 <prm:Description>Buy+any+selected+TV+%26+get+%C2%A310+off+Now+TV+Box.</prm:Description>
 </prm:DescriptionList>
 </prm:Promotion>
 
 */


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



/*
<?xml version="1.0" encoding="UTF-8"?>
<prd:ProductList
xmlns:prd="http://schemas.homeretailgroup.com/product-v2"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.homeretailgroup.com/product/product-v2.xsd"
xmlns:prm="http://schemas.homeretailgroup.com/promotion"
xmlns:prc="http://schemas.homeretailgroup.com/price">
<prd:Product id="9097588" brand="argos" version="2" uri="http://api.homeretailgroup.com:1210/product/argos/9097588">
<prd:Brand>Breville</prd:Brand>
<prd:DescriptionList>
<prd:Description type="short">Breville IKG832 Stainless Steel Illuminating Jug Kettle.</prd:Description>
<prd:Description type="long">A+stylish+polished+stainless+steel+finish+with+high+performing+features+makes+the+IKG832+an+ideal+Breville+kettle+for+any+family.+With+a+1.5+litre+capacity%2C+dual+water+windows+for+accurate+filling+and+a+360+degree+base%2C+this+kettle+boils+fast+and+is+easy+to+clean.+3+kW.+1.5+litre+capacity.+Rapid+boil.+Boil+dry+protection+-+automatically+switches+off+when+the+kettle+is+empty.+Illuminated+water+window.+Blue+illumination+on+boiling.+Push+button+operated+lid.+360+degree+base.+EAN%3A+5011773053419.+</prd:Description>
<prd:Description type="longHtml">
<![CDATA[%3Cp%3EA+stylish+polished+stainless+steel+finish+with+high+performing+features+makes+the+IKG832+an+ideal+Breville+kettle+for+any+family.+With+a+1.5+litre+capacity%2C+dual+water+windows+for+accurate+filling+and+a+360+degree+base%2C+this+kettle+boils+fast+and+is+easy+to+clean.%3C%2Fp%3E%3Cul%3E%3Cli%3E3+kW.%3C%2Fli%3E%3Cli%3E1.5+litre+capacity.%3C%2Fli%3E%3Cli%3ERapid+boil.%3C%2Fli%3E%3Cli%3EBoil+dry+protection+-+automatically+switches+off+when+the+kettle+is+empty.%3C%2Fli%3E%3Cli%3EIlluminated+water+window.%3C%2Fli%3E%3Cli%3EBlue+illumination+on+boiling.%3C%2Fli%3E%3Cli%3EPush+button+operated+lid.%3C%2Fli%3E%3Cli%3E360+degree+base.%3C%2Fli%3E%3Cli%3EEAN%3A+5011773053419.%3C%2Fli%3E%3C%2Ful%3E]]>
</prd:Description>
</prd:DescriptionList>
<prd:PurchasingOptions>
<prd:Option type="inStoreReservable">
<prd:Commentary>Reserve to collect in store</prd:Commentary>
<prd:MaximumQuantity>10</prd:MaximumQuantity>
</prd:Option>
<prd:Option type="homeDelivery">
<prd:MaximumQuantity>10</prd:MaximumQuantity>
<prd:Cost currency="GBP">3.95000</prd:Cost>
</prd:Option>
</prd:PurchasingOptions>
<prd:PricingInformation>
<prc:Price type="current">
<prc:Amount currency="GBP" inclusiveOfTax="true">54.99</prc:Amount>
<prc:Commentary type="footnote">Prices correct as displayed but are subject to change</prc:Commentary>
</prc:Price>
</prd:PricingInformation>
<prd:Rating>
<prd:AverageRating>4.1913</prd:AverageRating>
<prd:NumberReviews>847</prd:NumberReviews>
</prd:Rating>
<prd:AssociatedMedia>
<prd:Content index="0" type="image/jpeg" href="http://argos.scene7.com/is/image/Argos/9097588_R_SET?$Listers$" usage="thumbnail" provider="Scene7"/>
<prd:Content index="1" type="image/jpeg" href="http://argos.scene7.com/is/image/Argos/9097588_R_Z001A_UC1576473" usage="image" provider="Scene7"/>
<prd:Content index="2" type="image/jpeg" href="http://argos.scene7.com/is/image/Argos/9097588_R_Z002A_UC1576471" usage="image" provider="Scene7"/>
<prd:Content index="3" usage="document">
<prd:SubContent index="0" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-1" usage="document" provider="Scene7"/>
<prd:SubContent index="1" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-2" usage="document" provider="Scene7"/>
<prd:SubContent index="2" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-4" usage="document" provider="Scene7"/>
<prd:SubContent index="3" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-6" usage="document" provider="Scene7"/>
<prd:SubContent index="4" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-8" usage="document" provider="Scene7"/>
<prd:SubContent index="5" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-10" usage="document" provider="Scene7"/>
<prd:SubContent index="6" type="application/pdf" href="http://argos.scene7.com/is/image/Argos/9097588_R_D002-12" usage="document" provider="Scene7"/>
</prd:Content>
</prd:AssociatedMedia>
<prd:RelatedProducts>
<prd:Product uri="http://api.homeretailgroup.com:1210/product/argos/8832438" type="warranty" brand="argos" index="0" id="8832438" version="2">3 Years Replacement Product Care on this Product.</prd:Product>
</prd:RelatedProducts>
</prd:Product>
</prd:ProductList>
*/