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



var myLongHtmlXML = "<prd:ProductList><prd:Product><prd:Brand>Breville></prd:Brand><prd:DescriptionList><prd:Description type=\"short\"><Breville IKG832 Stainless Steel Illuminating Jug Kettle.</prd:Description><prd:Description type=\"long\">A+stylish+polished+stainless+steel+finish+with+high+performing+features+makes+the+IKG832+an+ideal+Breville+kettle+for+any+family.+With+a+1.5+litre+capacity%2C+dual+water+windows+for+accurate+filling+and+a+360+degree+base%2C+this+kettle+boils+fast+and+is+easy+to+clean.+3+kW.+1.5+litre+capacity.+Rapid+boil.+Boil+dry+protection+-+automatically+switches+off+when+the+kettle+is+empty.+Illuminated+water+window.+Blue+illumination+on+boiling.+Push+button+operated+lid.+360+degree+base.+EAN%3A+5011773053419.</prd:Description></prd:DescriptionList></prd:Product></prd:ProductList>"

var myLongHtmlJSON = {
    '#': '\n                %3Cp%3EA+stylish+polished+stainless+steel+finish+with+high+performing+features+makes+the+IKG832+an+ideal+Breville+kettle+for+any+family.+With+a+1.5+litre+capacity%2C+dual+water+windows+for+accurate+filling+and+a+360+degree+base%2C+this+kettle+boils+fast+and+is+easy+to+clean.%3C%2Fp%3E%3Cul%3E%3Cli%3E3+kW.%3C%2Fli%3E%3Cli%3E1.5+litre+capacity.%3C%2Fli%3E%3Cli%3ERapid+boil.%3C%2Fli%3E%3Cli%3EBoil+dry+protection+-+automatically+switches+off+when+the+kettle+is+empty.%3C%2Fli%3E%3Cli%3EIlluminated+water+window.%3C%2Fli%3E%3Cli%3EBlue+illumination+on+boiling.%3C%2Fli%3E%3Cli%3EPush+button+operated+lid.%3C%2Fli%3E%3Cli%3E360+degree+base.%3C%2Fli%3E%3Cli%3EEAN%3A+5011773053419.%3C%2Fli%3E%3C%2Ful%3E\n            ',
    '@': { descriptiontype: 'longHtml' }
};

var options = { useCDATA: true };
console.log("CDATA LONG HTML XML");
console.log(js2xmlparser("prd:Description", myLongHtmlJSON, options));
