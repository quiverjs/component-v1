
'use strict'

var error = require('quiver-error').error
var handleable = require('quiver-handleable')
var middlewareLib = require('quiver-middleware')
var extension = require('../extension')

var middlewarerTypeTable = {
  'stream middleware': 'stream handler',
  'http middleware': 'http handler',
  'handleable middleware': 'handleable'
}

var filterTypeTable = {
  'stream filter': 'stream handler',
  'http filter': 'http handler',
  'handleable filter': 'handleable'
}

var createMiddlewareFromComponentSpec = function(componentSpec, callback) {
  var middleware = componentSpec.middleware
  if(!middleware) return callback(error(400, 'middleware function not provided'))

  if(typeof(middleware) == 'string') {
    return callback(null, middlewareLib.createMiddlewareLoadingMiddleware(middleware))
  } else if(typeof(middleware) != 'function') {
    return callback(error(400, 'middleware is not of type function'))
  }

  var middlewareType = componentSpec.type
  var handlerType = middlewarerTypeTable[middlewareType]
  if(!handlerType) return callback(error(400, 'invalid middleware type'))

  var handlerConvert = handleable.handlerConvertTable[handlerType]
  var handleableMiddleware = middlewareLib.middlewareToHandleableMiddleware(
    handlerConvert, middleware)

  callback(null, handleableMiddleware)
}

var createFilterMiddlewareFromComponentSpec = function(componentSpec, callback) {
  var filter = componentSpec.filter

  if(!filter) return callback(error(400, 'filter function not provided'))

  if(typeof(filter) != 'function') {
    return callback(error(400, 'filter is not of type function'))
  }

  var filterType = componentSpec.type
  var handlerType = filterTypeTable[filterType]
  if(!handlerType) return callback(error(400, 'invalid filter type'))

  var middleware = middlewareLib.createMiddlewareFromFilter(filter)
  var handlerConvert = handleable.handlerConvertTable[handlerType]
  var handleableMiddleware = middlewareLib.middlewareToHandleableMiddleware(
    handlerConvert, middleware)

  callback(null, handleableMiddleware)
}

var middlewarerBuilderTable = {
  'stream middleware': createMiddlewareFromComponentSpec,
  'http middleware': createMiddlewareFromComponentSpec,
  'handleable middleware': createMiddlewareFromComponentSpec,

  'stream filter': createFilterMiddlewareFromComponentSpec,
  'http filter': createFilterMiddlewareFromComponentSpec,
  'handleable filter': createFilterMiddlewareFromComponentSpec
}

var middlewareComponentInstaller = function(componentSpec, callback) {
  var middlewareName = componentSpec.name
  var middlewareType = componentSpec.type

  var middlewareBuilder = middlewarerBuilderTable[middlewareType]
  if(!middlewareBuilder) return callback(error(400, 'invalid middleware type'))

  middlewareBuilder(componentSpec, function(err, middleware) {
    if(err) return callback(err)

    extension.createCommonComponentMiddlewares(componentSpec, function(err, middlewares) {
      if(err) return callback(err)

      var combinedMiddleware = middlewareLib.safeCombineMiddlewares(middlewares.concat(middleware))

      var config = {
        quiverMiddlewares: { }
      }

      config.quiverMiddlewares[middlewareName] = combinedMiddleware

      callback(null, config)
    })
  })
}

module.exports = {
  createMiddlewareFromComponentSpec: createMiddlewareFromComponentSpec,
  createFilterMiddlewareFromComponentSpec: createFilterMiddlewareFromComponentSpec,
  middlewareComponentInstaller: middlewareComponentInstaller
}