
'use strict'

var error = require('quiver-error').error
var routerLib = require('quiver-router')
var copyObject = require('quiver-copy').copyObject
var handleable = require('quiver-handleable')
var middlewareLib = require('quiver-middleware')

var validate = require('./validate')
var extension = require('./extension')

var createLoaderHandlerBuilder = function(handlerName) {
  var handlerBuilder = function(config, callback) {
    var handlerTable = config.quiverStreamHandlers || { }

    var handler = handlerTable[handlerName]
    if(!handler) return callback(error(404, 'stream handler not found: ' + handlerName))

    callback(null, handler)
  }

  var middleware = middlewareLib.createInputHandlerMiddleware(handlerName, handleable.streamHandlerConvert)
  handlerBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(middleware, handlerBuilder)

  return handlerBuilder
}

var addLoaderHandlerBuilderToRouteList = function(routeList) {
  routeList.forEach(function(routeSpec) {
    routeSpec.handlerBuilder = 
      createLoaderHandlerBuilder(routeSpec.handler)
  })
}

var loadRouteListFromConfig = function(config, routeListNames, callback) {
  var routeLists = config.quiverRouteLists || { }
  var resultRouteList = [ ]

  for(var i=0; i<routeListNames.length; i++) {
    var routeListName = routeListNames[i]
    var routeList = routeLists[routeListName]
    
    if(!routeList) return callback(
      error(500, 'route list not found: ' + routeListName))

    resultRouteList = resultRouteList.concat(copyObject(routeList))
  }

  addLoaderHandlerBuilderToRouteList(resultRouteList)
  callback(null, resultRouteList)
}

var createRouterHandlerBuilder = function(routeListNames) {
  var handlerBuilder = function(config, callback) {
    loadRouteListFromConfig(config, routeListNames, function(err, routeList) {
      if(err) return callback(err)

      routerLib.createRouterHandlerFromRouteList(config, routeList, callback)
    })
  }

  return handlerBuilder
}

var installRouterHandlerComponent = function(componentSpec, callback) {
  var err = validate.validateRouterComponentSpec(componentSpec)
  if(err) return callback(err)

  var routerName = componentSpec.name
  var routeListNames = componentSpec.routeLists

  var handlerBuilder = createRouterHandlerBuilder(routeListNames)
  
  var handleableBuilder = handleable.handlerBuilderToHandleableBuilder(
    handlerBuilder, handleable.streamHandlerConvert)

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
  var routeList = copyObject(componentSpec.routeList)

  var componentConfig = {
    quiverRouteLists: { }
  }

  componentConfig.quiverRouteLists[listName] = routeList

  callback(null, componentConfig)
}

module.exports = {
  installRouterHandlerComponent: installRouterHandlerComponent,
  installRouteListComponent: installRouteListComponent
}