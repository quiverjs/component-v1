
'use strict'

var error = require('quiver-error').error
var routerLib = require('quiver-router')
var copyObject = require('quiver-copy').copyObject
var handleable = require('quiver-handleable')
var middlewareLib = require('quiver-middleware')

var validate = require('../validate')
var extension = require('../extension')

var installRouterHandlerComponent = function(componentSpec, callback) {
  var err = validate.validateRouterComponentSpec(componentSpec)
  if(err) return callback(err)

  var routerName = componentSpec.name
  var routeListNames = componentSpec.routeLists

  var handleableBuilder = routerLib.createRouterHandleableBuilderFromRouteListNames(
    routeListNames)
  
  extension.createCommonComponentMiddlewares(componentSpec, function(err, middlewares) {
    if(err) return callback(err)

    var middleware = middlewareLib.safeCombineMiddlewares(middlewares)

    handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
      middleware, handleableBuilder)

    var config = {
      quiverHandleableBuilders: { }
    }

    config.quiverHandleableBuilders[routerName] = handleableBuilder
    callback(null, config)
  })
}

var installRouteListComponent = function(componentSpec, callback) {
  var err = validate.validateRouteListComponentSpec(componentSpec)
  if(err) return callback(err)

  var listName = componentSpec.name
  var routeBuildSpecs = routerLib.routeListComponentToRouteBuildSpecs(componentSpec)

  var componentConfig = {
    quiverRouteBuildSpecs: {}
  }

  componentConfig.quiverRouteBuildSpecs[listName] = routeBuildSpecs

  callback(null, componentConfig)
}

module.exports = {
  installRouterHandlerComponent: installRouterHandlerComponent,
  installRouteListComponent: installRouteListComponent
}