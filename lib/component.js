
'use strict'

var async = require('async')
var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject
var mergeObjects = require('quiver-merge').mergeObjects
var safeCallback = require('quiver-safe-callback').safeCallback

var handler = require('./handler')
var middleware = require('./middleware')
var pipeline = require('./pipeline')
var router = require('./router')

var componentInstallers = { }

componentInstallers['stream handler'] = handler.installStreamHandlerComponent
componentInstallers['http handler'] = handler.installHttpHandlerComponent

componentInstallers['stream middleware'] = middleware.installStreamMiddlewareComponent
componentInstallers['http middleware'] = middleware.installHttpMiddlewareComponent

componentInstallers['stream filter'] = middleware.installStreamFilterComponent
componentInstallers['http filter'] = middleware.installHttpFilterComponent

componentInstallers['stream pipeline'] = pipeline.installPipelineComponent

componentInstallers['route list'] = router.installRouteListComponent
componentInstallers['router'] = router.installRouterHandlerComponent

var mergeConfig = function(componentConfig, resultConfig) {
  for(var key in componentConfig) {
    resultConfig[key] = resultConfig[key] || { }
    resultConfig[key] = mergeObjects([resultConfig[key], componentConfig[key]])
  }

  return resultConfig
}

var installComponent = function(componentSpec, callback) {
  callback = safeCallback(callback)

  var componentType = componentSpec.type

  if(!componentInstallers[componentType]) {
    return callback(error(500, 'invalid component type'))
  }

  componentInstallers[componentType](copyObject(componentSpec), callback)
}

var installComponents = function(componentSpecs, callback) {
  callback = safeCallback(callback)

  var resultConfig = { 
    quiverComponents: { }
  }

  async.each(componentSpecs, 
    function(componentSpec, callback) {
      installComponent(componentSpec, function(err, componentConfig) {
        if(err) return callback(err)

        mergeConfig(componentConfig, resultConfig)
      
        resultConfig.quiverComponents[componentSpec.name] = 
          copyObject(componentSpec)

        callback(null)
      })
    },
    function(err) {
      if(err) return callback(err)

      callback(null, resultConfig)
    })
}

module.exports = {
  installComponent: installComponent,
  installComponents: installComponents
}