
'use strict'

var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject
var handleable = require('quiver-handleable')
var middlewareLib = require('quiver-middleware')

var validate = require('./validate')
var extension = require('./extension')

var pipeHandlers = function(args, inputStreamable, handlers, callback) {
  if(handlers.length == 0) return callback(null, inputStreamable)

  var currentHandler = handlers[0]
  var restHandlers = handlers.slice(1)
  var handlerArgs = copyObject(args)

  currentHandler(handlerArgs, inputStreamable, function(err, resultStreamable) {
    if(err) return callback(err)

    pipeHandlers(args, resultStreamable, restHandlers, callback)
  })
}

var installPipelineComponent = function(componentSpec, callback) {
  var err = validate.validatePipelineComponentSpec(componentSpec)
  if(err) return callback(err)

  var handlerName = componentSpec.name
  var pipelineHandlerNames = componentSpec.pipeline
  
  var pipelineMiddlewares = pipelineHandlerNames.map(
    function(handlerName) {
      return middlewareLib.createInputHandlerMiddleware(
        handlerName, handleable.streamHandlerConvert)
    })

  var handlerBuilder = function(config, callback) {
    var pipelineHandlers = pipelineHandlerNames.map(
      function(handlerName) {
        return config.quiverStreamHandlers[handlerName]
      })

    var handler = function(args, inputStreamable, callback) {
      pipeHandlers(args, inputStreamable, pipelineHandlers, callback)
    }

    callback(null, handler)
  }

  var handleableBuilder = handleable.handlerBuilderToHandleableBuilder(
    handlerBuilder, handleable.streamHandlerConvert)
  
  extension.createCommonComponentMiddlewares(componentSpec, function(err, middlewares) {
    if(err) return callback(err)

    var middleware = middlewareLib.safeCombineMiddlewares(middlewares.concat(pipelineMiddlewares))

    handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
      middleware, handleableBuilder)

    var config = {
      quiverHandleableBuilders: { }
    }

    config.quiverHandleableBuilders[handlerName] = handleableBuilder
    callback(null, config)
  })
}

module.exports = {
  installPipelineComponent: installPipelineComponent
}