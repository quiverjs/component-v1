
'use strict'

var async = require('async')
var middlewareLib = require('quiver-middleware')

var param = require('./extension/param')
var handleable = require('./extension/handleable')
var middleware = require('./extension/middleware')
var contentType = require('./extension/content-type')

var combineComponentExtension = function(componentExtensions) {
  var combinedExtension = function(componentSpec, callback) {
    var resultMiddlewares = []
    
    async.each(componentExtensions, 
    function(componentExtension, callback) {
      componentExtension(componentSpec, function(err, middlewares) {
        if(err) return callback(err)

        resultMiddlewares = resultMiddlewares.concat(middlewares)
        callback()
      })
    }, function(err) {
      if(err) return callback(err)

      callback(null, resultMiddlewares)
    })
  }

  return combinedExtension
}

var createCommonComponentMiddlewares = combineComponentExtension([
    param.configOverrideComponentExtension,
    param.configAliasComponentExtension,
    param.configParamComponentExtension,
    param.handlerAliasComponentExtension,
    middleware.middlewareSpecsComponentExtension,
    handleable.handlerSpecsComponentExtension,
    param.argsParamComponentExtension,
    contentType.resultContentTypeComponentExtension
  ])

module.exports = {
  combineComponentExtension: combineComponentExtension,
  createCommonComponentMiddlewares: createCommonComponentMiddlewares
}