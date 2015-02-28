var mongoose = require('mongoose');

var EmailSchema = new mongoose.Schema(
    {
        "@" : {"emailType" : String},
        "#" : String
});

var TelephoneSchema = new mongoose.Schema(
    {
        "@" : { "telephoneType" : String},
        "#" : String
});

var PreferenceSchema = new mongoose.Schema(
    {
        "@" : { "preferenceType" : String}
});

var AddressSchema = new mongoose.Schema(
    {
        "cmn:Line1" : String,
        "cmn:Line2" : String,
        "cmn:Line3" : String,
        "cmn:PostCode" : String,
        "cmn:Town" : String,
        "cmn:County" : String,
        "cmn:Country" : String,
        "cst:ContactDetails" : { "cmn:Telephone" : [TelephoneSchema] },
        "cst:Description" : String
});

var CustomerSchema = new mongoose.Schema(
                                        
    {
        "cst:CustomerId" : String,
        "cst:Name" : {
                        "cmn:Saluatation" : String,
                        "cmn:FirstName" : String,
                        "cmn:LastName" : String
                    },
        "cst:AddressList" : { "cst:Address" : [AddressSchema] },
        "cst:ContactDetails" : { "cmn:Email" : [EmailSchema] },
        "cst:PreferencesList" : { "cst:Preference" : [PreferenceSchema] }
    });


CustomerSchema.static('findByEmailAddress', function (emailAddress, callback) {
    return this.find({ "cst:ContactDetails.cmn:Email": emailAddress }, callback);
});

CustomerSchema.static('findByCustomerId', function (customerId, callback) {
    return this.find({ "cst:CustomerId": customerId }, callback);
});

CustomerSchema.static('findAndRemoveByEmailAddress', function (emailAddress, callback) {
    var customersToRemove = this.find( { "cst:ContactDetails.cmn:Email" : emailAddress});
                     
    customersToRemove.remove({ "cst:ContactDetails.cmn:Email" : emailAddress}, callback);
});

CustomerSchema.static('findAndRemoveByCustomerId', function (customerId, callback) {
    var customersToRemove = this.find( { "cst:CustomerId" : customerId});
                             
    customersToRemove.remove({ "cst:CustomerId" : customerId}, callback);
});

module.exports = mongoose.model('Customer', CustomerSchema);
