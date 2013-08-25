
'use strict'

var common = require('./common')
var handleable = require('./handleable')
var middlewareLib = require('quiver-middleware')
var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject

var createInstallOnceMiddleware = function(middlewareName, middleware) {
  var managedMiddleware = function(config, handlerBuilder, callback) {
    config.quiverInstalledMiddlewares = 
      config.quiverInstalledMiddlewares || { }

    if(config.quiverInstalledMiddlewares[middlewareName]) {
      return handlerBuilder(config, callback)
    }

    config.quiverInstalledMiddlewares[middlewareName] = true
    middleware(config, handlerBuilder, callback)
  }

  return managedMiddleware
}

var createCyclicPreventionMiddleware = function(middlewareName, middleware) {
  var managedMiddleware = function(config, handlerBuilder, callback) {
    config.quiverInstallingMiddlewares = 
      config.quiverInstallingMiddlewares || { }

    if(config.quiverInstallingMiddlewares[middlewareName]) {
      return callback(error(500, 'cyclic middleware dependency error'))
    }

    config.quiverInstallingMiddlewares[middlewareName] = true
    var innerHandlerBuilder = function(config, callback) {
      config.quiverInstallingMiddlewares[middlewareName] = false

      handlerBuilder(config, callback)
    }

    middleware(config, innerHandlerBuilder, callback)
  }

  return managedMiddleware
}

var metaHandleableToHandlerMilddeware = function(handleableConvert) {
  var createHandleableToHandlerMiddleware = function(middleware) {
    var managedMiddleware = function(config, handleableBuilder, callback) {
      var innerHandlerBuilder = function(config, callback) {
        handleableBuilder(config, function(err, handleable) {
          if(err) return callback(err)

          var handler = handleableConvert.handleableToHandler(handleable)
          if(!handler) return callback(
            error(500, 'mismatch handler type with middleware'))

          callback(null, handler)
        })
      }

      middleware(config, innerHandlerBuilder, function(err, handler) {
        if(err) return callback(err)

        var handleable = handleableConvert.handlerToHandleable(handler)

        callback(null, handleable)
      })
    }

    return managedMiddleware
  }

  return createHandleableToHandlerMiddleware
}

var createHandleableToStreamHandlerMiddleware = 
  metaHandleableToHandlerMilddeware(handleable.streamHandlerConvert)

var createHandleableToHttpHandlerMiddleware = 
  metaHandleableToHandlerMilddeware(handleable.httpHandlerConvert)

var metaMiddlewareInstaller = function(handleableToHandlerMiddleware) {
  var installMiddlewareComponent = function(componentSpec, callback) {
    var middlewareName = componentSpec.name
    var middleware = componentSpec.middleware
    middleware = handleableToHandlerMiddleware(middleware)
    
    var componentMiddleware = 
      common.createComponentManagedMiddleware(componentSpec)

    if(!componentSpec.allowRepeat) {
      middleware = createInstallOnceMiddleware(middlewareName, middleware)
    }

    middleware = createCyclicPreventionMiddleware(middlewareName, middleware)
    middleware = middlewareLib.combineMiddlewares([componentMiddleware, middleware])

    var componentConfig = {
      quiverMiddlewares: { }
    }

    componentConfig.quiverMiddlewares[middlewareName] = middleware

    callback(null, componentConfig)
  }

  return installMiddlewareComponent
}

var installStreamMiddlewareComponent = 
  metaMiddlewareInstaller(createHandleableToStreamHandlerMiddleware)

var installHttpMiddlewareComponent = 
  metaMiddlewareInstaller(createHandleableToHttpHandlerMiddleware)

var installHandleableMiddlewareComponent =
  metaMiddlewareInstaller(function(middleware) { return middleware })

var metaFilterInstaller = function(installMiddlewareComponent) {
  var installFilterComponent = function(component, callback) {
    var filterName = component.name

    var filter = component.filter

    var convertedMiddleware = function(config, handlerBuilder, callback) {
      var filterConfig = copyObject(config)

      handlerBuilder(config, function(err, handler) {
        if(err) return callback(err)

        filter(filterConfig, handler, callback)
      })
    }

    component.middleware = convertedMiddleware

    installMiddlewareComponent(component, callback)
  }

  return installFilterComponent
}

var installStreamFilterComponent =
  metaFilterInstaller(installStreamMiddlewareComponent)

var installHttpFilterComponent = 
  metaFilterInstaller(installHttpMiddlewareComponent)

var installHandleableFilterComponent =
  metaFilterInstaller(installHandleableMiddlewareComponent)

module.exports = {
  installStreamMiddlewareComponent: installStreamMiddlewareComponent,
  installHttpMiddlewareComponent: installHttpMiddlewareComponent,
  installHandleableMiddlewareComponent: installHandleableMiddlewareComponent,
  installStreamFilterComponent: installStreamFilterComponent,
  installHttpFilterComponent: installHttpFilterComponent,
  installHandleableFilterComponent: installHandleableFilterComponent
}