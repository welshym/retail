var replaceText = function (findText, replacementText, sourceString) {
    var re = new RegExp(findText,"g");
    
    return sourceString.replace(re, replacementText);
}

var updateJSONElementString = function (fullJson, jsonElementToUpdate, findText, replacementText) {
    
    if (typeof fullJson[jsonElementToUpdate] == 'undefined') {
        return
    }
    
    var stringJson = JSON.stringify(fullJson[jsonElementToUpdate]);
    
    stringJson = replaceText(findText, replacementText, stringJson);
    delete fullJson[jsonElementToUpdate];
    fullJson[jsonElementToUpdate] = JSON.parse(stringJson);
}

var isArray = function (what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

var makeIntoArray = function (fullJsonToModify, rootElement, changeElement) {
    
    if ((typeof fullJsonToModify == 'undefined') ||
        (typeof fullJsonToModify[rootElement] == 'undefined') ||
        (typeof fullJsonToModify[rootElement][changeElement] == 'undefined')){
        return
    }
    
    if (!isArray(fullJsonToModify[rootElement][changeElement])) {
        
        var myString = "[" + JSON.stringify(fullJsonToModify[rootElement][changeElement]) + "]";
        var myJsonString = JSON.parse(myString);
                
        delete fullJsonToModify [rootElement][changeElement];
        
        fullJsonToModify[rootElement][changeElement] = myJsonString;
    }
}

var makeIntoArrayUsingValueOnly = function (fullJsonToModify, rootElement, changeElement) {
    
    if ((typeof fullJsonToModify == 'undefined') ||
        (typeof fullJsonToModify[rootElement] == 'undefined') ||
        (typeof fullJsonToModify[rootElement][changeElement] == 'undefined')){
        return
    }

    var myString = "[";
    var first = true;
    for (var arrayIterator = 0; arrayIterator < fullJsonToModify[rootElement][changeElement].length; arrayIterator++) {
        if (first != true) {
            myString += ",";
        }
        first = false;
        myString += "{ \"#\": " + JSON.stringify(fullJsonToModify[rootElement][changeElement][arrayIterator]) + "}";
    }
    myString += "]";
    
    var myJsonString = JSON.parse(myString);
        
    delete fullJsonToModify [rootElement][changeElement];
        
    fullJsonToModify[rootElement][changeElement] = myJsonString;
}

var removeId = function (jsonElement, rootElement, contentElement) {
    if (typeof jsonElement[rootElement][contentElement] != 'undefined') {
        if (isArray(jsonElement[rootElement][contentElement])) {
            for (var removeCount = 0; removeCount < jsonElement[rootElement][contentElement].length; removeCount++) {
                delete jsonElement[rootElement][contentElement][removeCount]["_id"];
            }
        } else {
            delete jsonElement[rootElement][contentElement]["_id"];
        }
    }
    
    return jsonElement;
}

var createErrorMessage = function (messageString, errorCode) {
    
    var errorString = "<rsp:Error xmlns:rsp=\"http://schemas.homeretailgroup.com/response\" xsi:schemaLocation=\"http://schemas.homeretailgroup.com/response group-response-v1.xsd\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n";
    
    errorString += "<rsp:Code>" + errorCode + "</rsp:Code>";
    errorString += "<rsp:Message>" + messageString + "</rsp:Message>";
    errorString += "</rsp:Error>";
    
    return errorString;
}

var pageResults = function (results, pageSize, pageNumber) {
    var pagedResults = [];
    
    if (results.length > ((pageNumber - 1) * pageSize)) {
        var pageLimit = results.length < (pageNumber * pageSize) ? results.length: (pageNumber * pageSize);
        
        for (var pageElement = (pageNumber - 1) * pageSize; pageElement < pageLimit; pageElement++) {
            pagedResults.push(results[pageElement]);
        }
    }
    
    return pagedResults;
}

var convertIDToUri = function (requestJsonElement, uriPathElement, req) {
    var elementId = '';
    if (typeof requestJsonElement['@'] != 'undefined') {
        if (typeof requestJsonElement['@']['uri'] != 'undefined') {
            var uri = requestJsonElement['@']['uri'];
            elementId = uri.match(/(\d*$)/m)[0];
        } else if (typeof requestJsonElement['@']['id'] != 'undefined') {
            elementId = requestJsonElement['@']['id'];
            origEnvironment = req.get('X-original-environment');
            if (origEnvironment == undefined) {
                origEnvironment = "http://api.homeretailgroup.com";
            }
            requestJsonElement['@']['uri'] = origEnvironment + uriPathElement + "/" + elementId;
        }
    }
    
    return elementId;
}


module.exports = {
    replaceText: replaceText,
    updateJSONElementString: updateJSONElementString,
    isArray: isArray,
    makeIntoArray: makeIntoArray,
    makeIntoArrayUsingValueOnly: makeIntoArrayUsingValueOnly,
    removeId: removeId,
    pageResults: pageResults,
    convertIDToUri: convertIDToUri,
    createErrorMessage: createErrorMessage
}
