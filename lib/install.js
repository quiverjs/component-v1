
'use strict'

var async = require('async')
var error = require('quiver-error').error
var copyLib = require('quiver-copy')
var mergeObjects = require('quiver-merge').mergeObjects
var safeCallback = require('quiver-safe-callback').safeCallback

var router = require('./component/router')
var handler = require('./component/handler')
var pipeline = require('./component/pipeline')
var middleware = require('./component/middleware')

var componentInstallerTable = {
  'stream handler': handler.handlerComponentInstaller,
  'http handler': handler.handlerComponentInstaller,
  'handleable': handler.handlerComponentInstaller,
  'simple handler': handler.handlerComponentInstaller,
  'stream filter': middleware.middlewareComponentInstaller,
  'http filter': middleware.middlewareComponentInstaller,
  'handleable filter': middleware.middlewareComponentInstaller,
  'stream middleware': middleware.middlewareComponentInstaller,
  'http middleware': middleware.middlewareComponentInstaller,
  'handleable middleware': middleware.middlewareComponentInstaller,
  'router': router.installRouterHandlerComponent,
  'route list': router.installRouteListComponent,
  'stream pipeline': pipeline.installPipelineComponent
}

var noCopyFields = [
  'quiverComponents',
  'quiverHandleableBuilders',
  'quiverMiddlewares'
]

var noCopyConfig = function(config) {
  noCopyFields.forEach(function(key) {
    copyLib.noCopy(config[key])
  })
}

var mergeConfig = function(componentConfig, resultConfig) {
  for(var key in componentConfig) {
    resultConfig[key] = resultConfig[key] || { }
    resultConfig[key] = mergeObjects([resultConfig[key], componentConfig[key]])
  }

  return resultConfig
}

var invalidNameRegex = /[^a-zA-Z0-9\.\-\_\ ]/

var installComponent = function(componentSpec, callback) {
  callback = safeCallback(callback)

  var componentName = componentSpec.name
  if(!componentName) return callback(
    error(400, 'component spec do not have a name:' + componentSpec))

  if(invalidNameRegex.test(componentName)) return callback(error(400,
    'component name contain invalid characters'))

  var componentType = componentSpec.type

  var componentInstaller = componentInstallerTable[componentType]
  if(!componentInstaller) {
    return callback(error(400, 'invalid component type ' + componentType))
  }

  componentInstaller(copyLib.copyObject(componentSpec), callback)
}

var installComponents = function(quiverComponents, callback) {
  var resultConfig = { 
    quiverComponents: { }
  }

  async.each(quiverComponents, function(componentSpec, callback) {
    installComponent(componentSpec, function(err, componentConfig) {
      if(err) return callback(err)

      resultConfig.quiverComponents[componentSpec.name] = copyLib.copyObject(componentSpec)
      mergeConfig(componentConfig, resultConfig)
      
      callback()
    })
  }, function(err) {
    if(err) return callback(err)

    noCopyConfig(resultConfig)
    return callback(null, resultConfig)
  })
}

module.exports = {
  installComponent: installComponent,
  installComponents: installComponents
}