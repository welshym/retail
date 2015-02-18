var compress = require('compression');
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
//    "HOST"    : "ec2-54-186-25-151.us-west-2.compute.amazonaws.com",
    "HOST"    : "localhost/retailApp",
    "PORT"    : "27017",
    "DATABASE" : "retailApp"
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
app.use(compress());
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



// Take the longhtml remove it then convert it to XML using CDATA and insert it back in


//var testXML = "<prd:DescriptionList>\n\t<prd:Description>Test1</prd:Description>\n</prd:DescriptionList>\n<prd:DescriptionList>\n\t<prd:Description>Test2</prd:Description>\n</prd:DescriptionList>\n\t<prd:DescriptionList>\n\t<prd:Description>Test3</prd:Description>\n</prd:DescriptionList>"

//var re = new RegExp("</prd:DescriptionList>");
//replacementText = "\t<prd:Description>Test1AddOn</prd:Description>" + "\n</prd:DescriptionList>";

/*
console.log("testXML BEFORE");
console.log(testXML);

testXML = testXML.replace(re, replacementText);
console.log("\n\n\ntestXML AFTER");
console.log(testXML);

testXML = testXML.replace(re, replacementText);
console.log("\n\n\ntestXML AFTER");
console.log(testXML);

testXML = testXML.replace(re, replacementText);
console.log("\n\n\ntestXML AFTER");
console.log(testXML);
*/