
'use strict'

var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject
var middleware = require('quiver-middleware')
var safeCallback = require('quiver-safe-callback').safeCallback

var common = require('./common')
var validate = require('./validate')
var handleable = require('./handleable')

var metaHandlerComponent = function(handleableConvert) {
  var installHandlerComponent = function(componentSpec, callback) {
    var err = validate.validateHandlerComponentSpec(componentSpec)
    if(err) return callback(err)

    var handlerName = componentSpec.name
    var handlerBuilder = componentSpec.handlerBuilder

    var componentMiddleware = common.createComponentManagedMiddleware(componentSpec)

    var handleableBuilder = function(config, callback) {
      callback = safeCallback(callback)

      handlerBuilder(config, function(err, handler) {
        if(err) return callback(err)

        var handleable = handleableConvert.handlerToHandleable(handler)

        callback(null, handleable)
      })
    }

    handleableBuilder = middleware.createSingleMiddlewareManagedHandlerBuilder(
      handleableBuilder, componentMiddleware)

    var componentConfig = {
      quiverHandleableBuilders: { }
    }

    componentConfig.quiverHandleableBuilders[handlerName] = handleableBuilder

    callback(null, componentConfig)
  }

  return installHandlerComponent
}

var installStreamHandlerComponent = 
  metaHandlerComponent(handleable.streamHandlerConvert)

var installHttpHandlerComponent =
  metaHandlerComponent(handleable.httpHandlerConvert)

module.exports = {
  installStreamHandlerComponent: installStreamHandlerComponent,
  installHttpHandlerComponent: installHttpHandlerComponent
}
