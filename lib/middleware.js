
'use strict'

var common = require('./common')
var middlewareLib = require('quiver-middleware')
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

var installMiddlewareComponent = function(componentSpec, callback) {
  var middlewareName = componentSpec.name
  var middleware = componentSpec.middleware
  
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

module.exports = {
  installMiddlewareComponent: installMiddlewareComponent,
  installFilterComponent: installFilterComponent
}