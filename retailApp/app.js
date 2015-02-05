var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var product = require('./routes/product');

var mongoose = require('mongoose');

var db;

var config = {
    "USER"    : "",
    "PASS"    : "",
    "HOST"    : "ec2-54-186-25-151.us-west-2.compute.amazonaws.com",
    "PORT"    : "27017",
    "DATABASE" : "my_example"
};

var dbPath  =   "mongodb://"+config.USER + ":"+
config.PASS + "@"+
config.HOST + ":"+
config.PORT + "/"+
config.DATABASE;


db = mongoose.connect(dbPath, function(err) {
                 if(err) {
                 console.log('connection error', err);
                 } else {
                 console.log('connection successful');
                 }
                 });

var app = express();
app.listen(8080);


/*
var xml2js = require('xml2js');
var options = {
    charkey : "#",
    attrkey : "@",
    explicitArray: false
};

var parser = xml2js.Parser(options);

var js2xmlparser = require("js2xmlparser");


parser.parseString("<prd:Product brand='argos' uri='testuri' id='123456'><prd:Brand>Breville</prd:Brand><prd:DescriptionList><prd:Description type='short'>Breville IKG832 Stainless Steel Illuminating Jug Kettle.</prd:Description></prd:DescriptionList></prd:Product>", function (err, data) {
                   console.log(data);
                   console.log("URI = ", data['prd:Product']['@']['uri']);
                   console.log("Description = ", data['prd:Product']['prd:DescriptionList']);
                   var xmlData = js2xmlparser("prd:ProductList", data);
                   console.log("XML = ", xmlData);
                   }, options);
*/
/*

 {"prd:Product":
    {   "@":
            {   "id":"9097588",
                "brand":"argos",
                "version":"2",
                "uri":"http://api.homeretailgroup.com:1210/product/argos/9097588"
            },
        "prd:Brand":"Breville",
        "prd:DescriptionList":  {
                                    "prd:Description":  {
                                                            "#":    "Breville IKG832 Stainless Steel Illuminating Jug Kettle.",
                                                            "@":    {
                                                                        "type":"short"
                                                                    }
                                                        }
        }
    }
 }
 
 Getting back:
 
 {
    "__v": 0,
    "prd:Brand": "Breville",
    "_id": "54c9082178e34b1513f044a6",
    "@":    {
                "id": "9097588",
                "brand": "argos",
                "version": "2",
                "uri": "http://api.homeretailgroup.com:1210/product/argos/9097588"
            }
 }
 
*/

// if the request's mime type is text/plain, read it as raw data
var myRawParser = function(req, res, next){
    req.rawData = '';
    if(req.header('content-type') == 'application/xml'){
        req.on('data', function(chunk){
               req.rawData += chunk;
               })
        req.on('end', function(){
               next();
               })
    } else {
        next();
    }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(myRawParser);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/product', product);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

//module.exports = app;
console.log('starting Express (NodeJS) Web server');
app.listen(8080);
console.log('Webserverlistening on port 8080');


/*

//var productData = "<ProductList><Product><name>TestName</name><BrandList><Brand>Breville</Brand><Brand>TestBreville</Brand></BrandList></Product></ProductList>";
var productData = "<BrandList><Brand>Breville</Brand><Brand>TestBreville</Brand></BrandList>";
var xmlTest1 = "<someArray><item><some>data</some></item><item><some>data</some></item></someArray>";

var js2xmlparser = require("js2xmlparser");

var xml2js = require('xml2js');
var options = {
    charkey : "#",
    attrkey : "@",
    explicitArray: false
};

var myJson =    {
                name: 'TestName',
                __v: 0,
                'prd:BrandList': { 'prd:Brand': [ 'Breville', 'Test2Breville' ]}
                }

var xmlParser = xml2js.Parser(options);

var inspect = require('eyes').inspector({maxLength: false})

xmlParser.parseString(productData, function (err, result) {
                      //inspect(result);
                      //console.log(js2xmlparser("root", myJson));
                      //delete myJson['__v']
                      //console.log(js2xmlparser("root", myJson));
                      });

var testProductJson = {"@":   {
    "id":"123456",
    "uri":"testuri",
    "brand":"argos",
    "version":"2"
},
    "prd:Brand":    "TestName3",
    "prd:DescriptionList":
    
    {"prd:Description": [
                         {  "@" : { "description_type" : "123456"}, "#" : "Test Description"},
                         {  "@" : { "description_type" : "1234567"}, "#" : "Test Description 2"}
                         ]
    }
};

function replaceText(findText, replacementText, sourceString) {
    var re = new RegExp(findText,"g");
    return sourceString.replace(re, replacementText);
}

function updateJSONElementString(fullJson, jsonElementToUpdate, findText, replacementText) {
    
    var stringJson = JSON.stringify(fullJson[jsonElementToUpdate]);
    var editedJson =  fullJson[jsonElementToUpdate];
    
    stringJson = replaceText(findText, replacementText, stringJson);
    delete editedJson [jsonElementToUpdate];
    editedJson[jsonElementToUpdate] = JSON.parse(stringJson);
    
    return editedJson;
}

var myLongHtmlXML = "<prd:ProductList><prd:Product><prd:Brand>Breville></prd:Brand><prd:DescriptionList><prd:Description type=\"short\"><Breville IKG832 Stainless Steel Illuminating Jug Kettle.</prd:Description><prd:Description type=\"long\">A+stylish+polished+stainless+steel+finish+with+high+performing+features+makes+the+IKG832+an+ideal+Breville+kettle+for+any+family.+With+a+1.5+litre+capacity%2C+dual+water+windows+for+accurate+filling+and+a+360+degree+base%2C+this+kettle+boils+fast+and+is+easy+to+clean.+3+kW.+1.5+litre+capacity.+Rapid+boil.+Boil+dry+protection+-+automatically+switches+off+when+the+kettle+is+empty.+Illuminated+water+window.+Blue+illumination+on+boiling.+Push+button+operated+lid.+360+degree+base.+EAN%3A+5011773053419.</prd:Description></prd:DescriptionList></prd:Product></prd:ProductList>"

var myLongHtmlJSON = {
    '#': '\n                %3Cp%3EA+stylish+polished+stainless+steel+finish+with+high+performing+features+makes+the+IKG832+an+ideal+Breville+kettle+for+any+family.+With+a+1.5+litre+capacity%2C+dual+water+windows+for+accurate+filling+and+a+360+degree+base%2C+this+kettle+boils+fast+and+is+easy+to+clean.%3C%2Fp%3E%3Cul%3E%3Cli%3E3+kW.%3C%2Fli%3E%3Cli%3E1.5+litre+capacity.%3C%2Fli%3E%3Cli%3ERapid+boil.%3C%2Fli%3E%3Cli%3EBoil+dry+protection+-+automatically+switches+off+when+the+kettle+is+empty.%3C%2Fli%3E%3Cli%3EIlluminated+water+window.%3C%2Fli%3E%3Cli%3EBlue+illumination+on+boiling.%3C%2Fli%3E%3Cli%3EPush+button+operated+lid.%3C%2Fli%3E%3Cli%3E360+degree+base.%3C%2Fli%3E%3Cli%3EEAN%3A+5011773053419.%3C%2Fli%3E%3C%2Ful%3E\n            ',
    '@': { descriptiontype: 'longHtml' }
};

var options = { useCDATA: true };
console.log("CDATA LONG HTML XML");
console.log(js2xmlparser("prd:Description", myLongHtmlJSON, options));


// Take the longhtml remove it then convert it to XML using CDATA and insert it back in


var localString = JSON.stringify(testProductJson);
var originalJson = JSON.parse(localString);
*/

