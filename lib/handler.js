
'use strict'

var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject
var middleware = require('quiver-middleware')
var common = require('./common')

var metaHandlerComponent = function(toHandlerMethod, configKey) {
  var installHandlerComponent = function(componentSpec, callback) {
    var handlerName = componentSpec.name
    var handlerBuilder = componentSpec.handlerBuilder

    var componentMiddleware = common.createComponentManagedMiddleware(componentSpec)

    var handleableBuilder = function(config, callback) {
      handlerBuilder(config, function(err, handler) {
        if(err) return callback(err)

        var handleable = { }
        handleable[toHandlerMethod] = function() {
          return handler
        }

        callback(null, handleable)
      })
    }

    handleableBuilder = middleware.createMiddlewareManagedHandlerBuilder(
      handleableBuilder, [componentMiddleware])

    var componentConfig = {
      quiverHandleableBuilders: { }
    }

    componentConfig.quiverHandleableBuilders[handlerName] = handleableBuilder

    callback(null, componentConfig)
  }

  return installHandlerComponent
}

var installStreamHandlerComponent = 
  metaHandlerComponent('toStreamHandler', 'quiverStreamHandlerBuilders')

var installHttpHandlerComponent =
  metaHandlerComponent('toHttpHandler', 'quiverHttpHandlerBuilders')

module.exports = {
  installStreamHandlerComponent: installStreamHandlerComponent,
  installHttpHandlerComponent: installHttpHandlerComponent
}
