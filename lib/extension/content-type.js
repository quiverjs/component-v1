'use strict'

var error = require('quiver-error').error
var middlewareLib = require('quiver-middleware')
var handleableLib = require('quiver-handleable')

var createResultContentTypeFilter = function(contentType) {
  var filter = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      handler(args, inputStreamable, function(err, resultStreamable) {
        if(err) return callback(err)
        
        resultStreamable.contentType = contentType
        callback(null, resultStreamable)
      })
    }

    callback(null, filteredHandler)
  }

  return filter
}

var createResultContentTypeMiddleware = function(contentType) {
  var filter = createResultContentTypeFilter(contentType)
  var middleware = middlewareLib.createHandleableMiddlewareFromFilter(
    filter, handleableLib.streamHandlerConvert)

  return middleware
}

var resultContentTypeComponentExtension = function(componentSpec, callback) {
  var resultContentType = componentSpec.resultContentType

  if(!resultContentType) return callback(null, [])
  if(typeof(resultContentType) != 'string') return callback(
    error(400, 'result content type must be string'))

  var middleware = createResultContentTypeMiddleware(resultContentType)
  callback(null, [middleware])
}

module.exports = {
  resultContentTypeComponentExtension: resultContentTypeComponentExtension
}