
'use strict'

var error = require('quiver-error').error
var handleableLib = require('quiver-handleable')
var middlewareLib = require('quiver-middleware')
var simpleHandlerLib = require('quiver-simple-handler')
var extension = require('../extension')

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
    var handlerName = componentSpec.handler
    if(typeof(handlerName) != 'string') return callback(error(
      400, 'extension handler name must be of type string'))

    handlerBuilder = createHandlerBuilderLoadingHandlerBuilder(handlerName)
    return callback(null, handlerBuilder)
  }

  var handlerType = componentSpec.type
  var handlerConvert = handleableLib.handlerConvertTable[handlerType]

  if(!handlerConvert) return callback(error(500, 'invalid handler type'))

  var handlerBuilder = componentSpec.handlerBuilder

  var handleableBuilder = handleableLib.handlerBuilderToHandleableBuilder(
    handlerBuilder, handlerConvert)

  callback(null, handleableBuilder)
}

var validTypes = ['void', 'text', 'json', 'stream', 'streamable']

var createSimpleHandleableBuilderFromComponentSpec = function(componentSpec, callback) {
  var inputType = componentSpec.inputType
  var outputType = componentSpec.outputType

  if(validTypes.indexOf(inputType) == -1) return callback(error(
    400, 'invalid simple input type ' + inputType))

  if(validTypes.indexOf(outputType) == -1) return callback(error(
    400, 'invalid simple output type ' + outputType))

  var simpleHandlerBuilder = componentSpec.handlerBuilder
  
  var handlerBuilder = function(config, callback) {
    simpleHandlerBuilder(config, function(err, simpleHandler) {
      if(err) return callback(err)

      var handler = simpleHandlerLib.simpleHandlerToStreamHandler(
        inputType, outputType, simpleHandler)

      callback(null, handler)
    })
  }

  var handleableBuilder = handleableLib.handlerBuilderToHandleableBuilder(
    handlerBuilder, handleableLib.streamHandlerConvert)

  callback(null, handleableBuilder)
}

var handlerBuilderBuilderTable = {
  'simple handler': createSimpleHandleableBuilderFromComponentSpec,
  'stream handler': createHandleableBuilderFromComponentSpec,
  'http handler': createHandleableBuilderFromComponentSpec,
  'handleable': createHandleableBuilderFromComponentSpec,
}

var handlerComponentInstaller = function(componentSpec, callback) {
  var handlerName = componentSpec.name

  var handlerBuilderBuilder = handlerBuilderBuilderTable[componentSpec.type]

  handlerBuilderBuilder(componentSpec, function(err, handleableBuilder) {
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