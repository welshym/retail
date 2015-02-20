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
    for (arrayIterator = 0; arrayIterator < fullJsonToModify[rootElement][changeElement].length; arrayIterator++) {
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
            for (removeCount = 0; removeCount < jsonElement[rootElement][contentElement].length; removeCount++) {
                delete jsonElement[rootElement][contentElement][removeCount]["_id"];
            }
        } else {
            delete jsonElement[rootElement][contentElement]["_id"];
        }
    }
    
    return jsonElement;
}

module.exports = {
    replaceText: replaceText,
    updateJSONElementString: updateJSONElementString,
    isArray: isArray,
    makeIntoArray: makeIntoArray,
    makeIntoArrayUsingValueOnly: makeIntoArrayUsingValueOnly,
    removeId: removeId
}