
'use strict'

var handler = require('./handler')
var common = require('./common')
var routerLib = require('quiver-router')
var copyObject = require('quiver-copy').copyObject

var installRouteListComponent = function(componentSpec, callback) {
  var listName = componentSpec.name
  var routeList = copyObject(componentSpec.routeList)

  var componentConfig = {
    quiverRouteLists: { }
  }

  componentConfig.quiverRouteLists[listName] = routeList

  callback(null, componentConfig)
}

var createLoaderHandlerBuilder = function(handleableName) {
  var handlerBuilder = function(config, callback) {
    common.loadHandleableFromConfig(config, handleableName, function(err, handleable) {
      if(err) return callback(err)

      if(!handleable.toStreamHandler) return callback(
        error(500, 'handleable is not stream handler'))
      
      var handler = handleable.toStreamHandler()
      callback(null, handler)
    })
  }

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
    if(!routeList) return callback(error(500, 'route list not found'))

    resultRouteList = resultRouteList.concat(copyObject(routeList))
  }

  addLoaderHandlerBuilderToRouteList(resultRouteList)
  callback(null, resultRouteList)
}

var installRouterHandlerComponent = function(componentSpec, callback) {
  var routeListNames = componentSpec.routeLists

  var handlerBuilder = function(config, callback) {
    loadRouteListFromConfig(config, routeListNames, function(err, routeList) {
      if(err) return callback(err)

      routerLib.createRouterHandlerFromRouteList(config, routeList, callback)
    })
  }

  componentSpec.handlerBuilder = handlerBuilder

  handler.installStreamHandlerComponent(componentSpec, callback)
}

module.exports = {
  installRouteListComponent: installRouteListComponent,
  installRouterHandlerComponent: installRouterHandlerComponent
}