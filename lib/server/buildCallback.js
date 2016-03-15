'use strict';

var send              = require('send');

var buildCallback = function (request, response, next) {
  return function (requestFiles) {
    if (!requestFiles || !requestFiles[0]) { return next(); }

    var file = requestFiles[0];
    response.type(send.mime.lookup(file.path));
    response.body = file.contents;

    next();
  };
};

module.exports = buildCallback;
