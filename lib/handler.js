
'use strict'

var error = require('quiver-error').error
var handleable = require('quiver-handleable')
var middlewareLib = require('quiver-middleware')
var extension = require('./extension')

var createHandlerBuilderLoadingHandlerBuilder = function(handlerName) {
  var loaderHandlerBuilder = function(config, callback) {
    var handlerBuilder = config.quiverHandleableBuilders[handlerName]
    if(!handlerBuilder) return callback(error(404, 'handler builder not found: ' + handlerName))

    handlerBuilder(config, callback)
  }

  return loaderHandlerBuilder
}

var createHandleableBuilderFromComponentSpec = function(componentSpec, callback) {
  if(componentSpec.handler && componentSpec.handlerBuilder) {
    return callback(error(400, 'must not provide both handler and handler builder'))
  }

  if(!componentSpec.handler && !componentSpec.handlerBuilder) {
    return callback(error(400, 'must provide either handler or handler builder'))
  }

  if(componentSpec.handler) {
    handlerBuilder = createHandlerBuilderLoadingHandlerBuilder(componentSpec.handler)
    return callback(null, handlerBuilder)
  }

  var handlerType = componentSpec.type
  var handlerConvert = handleable.handlerConvertTable[handlerType]

  if(!handlerConvert) return callback(error(500, 'invalid handler type'))

  var handlerBuilder = componentSpec.handlerBuilder
  
  var handleableBuilder = function(config, callback) {
    handlerBuilder(config, function(err, handler) {
      if(err) return callback(err)

      var handleable = handlerConvert.handlerToHandleable(handler)
      callback(null, handleable)
    })
  }

  callback(null, handleableBuilder)
}

var handlerComponentInstaller = function(componentSpec, callback) {
  var handlerName = componentSpec.name

  createHandleableBuilderFromComponentSpec(componentSpec, function(err, handleableBuilder) {
    if(err) return callback(err)

    extension.createCommonComponentMiddlewares(componentSpec, function(err, middlewares) {
      if(err) return callback(err)

      var middleware = middlewareLib.safeCombineMiddlewares(middlewares)

      handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
        middleware, handleableBuilder)

      var config = {
        quiverHandleableBuilders: { }
      }

      config.quiverHandleableBuilders[handlerName] = handleableBuilder
      callback(null, config)
    })
  })
}

module.exports = {
  createHandleableBuilderFromComponentSpec: createHandleableBuilderFromComponentSpec,
  handlerComponentInstaller: handlerComponentInstaller
}