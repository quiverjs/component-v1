
'use strict'

var async = require('async')
var paramLib = require('quiver-param')
var middlewareLib = require('quiver-middleware')
var copyObject = require('quiver-copy').copyObject
var mergeObjects = require('quiver-merge').mergeObjects
var error = require('quiver-error').error

var createConfigOverrideMiddleware = function(configOverride) {
  var middleware = function(config, handlerBuilder, callback) {
    var newConfig = mergeObjects([config, configOverride])

    handlerBuilder(newConfig, callback)
  }

  return middleware
}

var createConfigParamMiddleware = function(configParam) {
  var validator = paramLib.createParamValidator(configParam)

  var middleware = function(config, handlerBuilder, callback) {
    var err = validator(config)

    if(err) return callback(err)

    handlerBuilder(config, callback)
  }

  return middleware
}

var createArgsParamMiddleware = function(argsParam) {
  var validator = paramLib.createParamValidator(argsParam)

  var filter = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      var err = validator(args)
      if(err) return callback(err)

      handler(args, inputStreamable, callback)
    }

    callback(null, handler)
  }

  return middlewareLib.createMiddlewareFromFilter(filter)
}

var getMiddlewareFromConfig = function(config, middlewareName) {
  config.quiverMiddlewares = config.quiverMiddlewares || { }

  return config.quiverMiddlewares[middlewareName]
}

var middlewareIsInstalled = function(config, middlewareName) {
  config.quiverInstalledMiddlewares = config.quiverInstalledMiddlewares || { }

  return config.quiverInstalledMiddlewares[middlewareName]
}

var setMiddlewareInstalled = function(config, middlewareName) {
  config.quiverInstalledMiddlewares = config.quiverInstalledMiddlewares || { }
  
  config.quiverInstalledMiddlewares[middlewareName] = true
}

var createLoaderMiddlewareFromSpec = function(middlewareSpec) {
  if(typeof(middlewareSpec) == 'string') {
    middlewareSpec = {
      middlewareName: middlewareSpec
    }
  }

  var middlewareName = middlewareSpec.middlewareName
  var optional = middlewareSpec.optional

  var managedMiddleware = function(config, handlerBuilder, callback) {
    var middleware = getMiddlewareFromConfig(config, middlewareName)

    if(!middleware && optional) return handlerBuilder(config, callback)
    if(!middleware) return callback(
      error(500, 'middleware not found: ' + middlewareName))

    middleware(config, handlerBuilder, callback)
  }

  return managedMiddleware
}

var createLoaderMiddlewareFromSpecs = function(middlewareSpecs) {
  if(middlewareSpecs.length == 0) return middlewareLib.emptyMiddleware

  var middlewares = [ ]

  for(var i=0; i<middlewareSpecs.length; i++) {
    middlewares.push(createLoaderMiddlewareFromSpec(middlewareSpecs[i]))
  }

  return middlewareLib.combineMiddlewares(middlewares)
}

var getHandleableName = function(handleableSpec) {
  if(typeof(handleableSpec) == 'string') return handleableSpec

  return handleableSpec.handleableName
}

var loadHandleableFromConfig = function(config, handleableSpec, callback) {
  var handleableName = getHandleableName(handleableSpec)
  var optional = handleableSpec.optional

  config.quiverHandleables = config.quiverHandleables || { }
  config.quiverHandleableBuilders = config.quiverHandleableBuilders || { }

  if(config.quiverHandleables[handleableName]) {
    return callback(null, config.quiverHandleables[handleableName])
  }

  var handleableBuilder = config.quiverHandleableBuilders[handleableName]

  if(!handleableBuilder && optional) return callback(null)
  if(!handleableBuilder) return callback(error(500, 'handleable not found: ' + handleableName))

  var handleableConfig = copyObject(config)
  handleableConfig.quiverInstalledMiddlewares = { }
  handleableConfig.quiverInstallingMiddlewares = { }

  handleableBuilder(handleableConfig, function(err, handleable) {
    if(err) return callback(err)

    config.quiverHandleables[handleableName] = handleable
    callback(null, handleable)
  })
}

var loadHandleablesFromConfig = function(config, handleableSpecs, callback) {
  async.eachSeries(handleableSpecs, 
    function(handleableSpec, callback) {
      loadHandleableFromConfig(config, handleableSpec, callback)
    },
    function(err) {
      if(err) return callback(err)

      callback(null, config)
    })
}

var createHandleableMiddlewareFromSpecs = function(handleableSpecs) {
  var middleware = function(config, handlerBuilder, callback) {
    loadHandleablesFromConfig(config, handleableSpecs, function(err, config) {
      if(err) return callback(err)

      handlerBuilder(config, callback)
    })
  }

  return middleware
}

var createComponentManagedMiddleware = function(componentSpec) {
  var middlewares = [ ]

  if(componentSpec.middlewares) {
    middlewares.push(
      createLoaderMiddlewareFromSpecs(
        componentSpec.middlewares))
  }

  if(componentSpec.handleables) {
    middlewares.push(
      createHandleableMiddlewareFromSpecs(
        componentSpec.handleables))
  }

  if(componentSpec.configOverride) {
    middlewares.push(
      createConfigOverrideMiddleware(
        componentSpec.configOverride))
  }

  if(componentSpec.configParam) {
    middlewares.push(
      createConfigParamMiddleware(
        componentSpec.configParam))
  }

  if(componentSpec.argsParam) {
    middlewares.push(
      createArgsParamMiddleware(
        componentSpec.argsParam))
  }

  return middlewareLib.combineMiddlewares(middlewares)
}

module.exports = {
  createConfigOverrideMiddleware: createConfigOverrideMiddleware,
  createConfigParamMiddleware: createConfigParamMiddleware,
  createArgsParamMiddleware: createArgsParamMiddleware,
  getMiddlewareFromConfig: getMiddlewareFromConfig,
  middlewareIsInstalled: middlewareIsInstalled,
  setMiddlewareInstalled: setMiddlewareInstalled,
  createLoaderMiddlewareFromSpec: createLoaderMiddlewareFromSpec,
  loadHandleableFromConfig: loadHandleableFromConfig,
  createHandleableMiddlewareFromSpecs: createHandleableMiddlewareFromSpecs,
  createComponentManagedMiddleware: createComponentManagedMiddleware
}