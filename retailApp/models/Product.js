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
        "prd:DescriptionList" : { "prd:Description" : [{
                                                        "@": {"descriptiontype": String},
                                                        "#": String
                                                       } ]}
 
    });

ProductSchema.static('findByBrand', function (searchBrand, callback) {
              return this.find({ "prd:Brand": searchBrand }, callback);
              });

ProductSchema.static('findByProductId', function (searchIds, callback) {
                     console.log("searchIDs");
                     console.log(searchIds);
                     return this.find( { "prd:ProductId" : { $in : searchIds}}, callback);
                     });

ProductSchema.static('findAndRemoveByProductId', function (searchId, callback) {
                     var productsToRemove = this.find( { "prd:ProductId" : searchId});
                     
                     productsToRemove.remove({ "prd:ProductId" : searchId}, callback);
                     });
/*
<prd:ProductList>
<prd:Product id="9097588" brand="argos" version="2" uri="http://api.homeretailgroup.com:1210/product/argos/9097588">
<prd:Brand>Breville</prd:Brand>
<prd:DescriptionList>
<prd:Description type="short">Breville IKG832 Stainless Steel Illuminating Jug Kettle.</prd:Description>
</prd:DescriptionList>
</prd:Product>
</prd:ProductList>
*/

module.exports = mongoose.model('Product', ProductSchema);