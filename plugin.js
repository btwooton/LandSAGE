// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2016

"use strict";

// built-in path module
var path    = require('path');
// load modules from the server's folder
var request = require(path.join(module.parent.exports.dirname, 'request'));  // HTTP client request


function processRequest(wsio, data, config) {
    var aURLs = data.query.urls;
    
    for (let url of aURLs) {
        request({url: url}, function(err, resp, body) {
        console.log(body);
        console.log(resp);

        if (data.broadcast === true) {
            // get the broadcast function from main module
            // send the data to all display nodes
            module.parent.exports.broadcast('broadcast', {
                app: data.app, func: data.func, data: {data: body, resp: resp}
            });
        } else {
            // send data to the master display node
            wsio.emit('broadcast', {app: data.app, func: data.func,
                data: {data: body, resp: resp}});
        }
        });
    }
}

module.exports = processRequest;