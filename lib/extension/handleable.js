
'use strict'

var async = require('async')
var error = require('quiver-error').error
var middleware = require('quiver-middleware')

var createInputHandlerMiddlewareFromSpec = function(handlerSpec, callback) {
  if(typeof(handlerSpec) == 'string') {
    handlerSpec = {
      name: handlerSpec,
      type: 'handleable'
    }
  }

  var handlerName = handlerSpec.name

  if(typeof(handlerName) != 'string' || handlerName.length == 0) {
    return callback(error(500, 'invalid middleware name'))
  }

  var managedMiddleware = middleware.createInputHandlerMiddlewareFromSpec(handlerSpec)
  callback(null, managedMiddleware)
}

var handlerSpecsComponentExtension = function(componentSpec, callback) {
  var handlerSpecs = componentSpec.handleables
  if(!handlerSpecs) return callback(null, [])

  if(!Array.isArray(handlerSpecs)) return callback(500, 
    error(500, 'handler specs must be in array'))

  async.map(handlerSpecs, createInputHandlerMiddlewareFromSpec,
    function(err, resultMiddlewares) {
      if(err) return callback(err)

      callback(null, resultMiddlewares)
    })
}

module.exports = {
  handlerSpecsComponentExtension: handlerSpecsComponentExtension
}