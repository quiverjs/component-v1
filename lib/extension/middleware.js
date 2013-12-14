
'use strict'

var async = require('async')
var error = require('quiver-error').error
var middlewareLib = require('quiver-middleware')

var createMiddlewareFromMiddlewareSpec = function(middlewareSpec, callback) {
  if(typeof(middlewareSpec) == 'function') return callback(null, middlewareSpec)
  
  if(typeof(middlewareSpec) == 'string') {
    middlewareSpec = {
      name: middlewareSpec
    }
  }

  var middlewareName = middlewareSpec.name
  if(!middlewareName || typeof(middlewareName) != 'string' || middlewareName.length == 0) {
    return callback(error(500, 'invalid middleware name'))
  }

  var managedMiddleware = middlewareLib.createMiddlewareFromMiddlewareSpec(middlewareSpec)
  callback(null, managedMiddleware)
}

var middlewareSpecsComponentExtension = function(componentSpec, callback) {
  var middlewareSpecs = componentSpec.middlewares
  if(!middlewareSpecs) return callback(null, [])

  if(!Array.isArray(middlewareSpecs)) return callback(500, 
    error(500, 'middlewares specs must be in array'))

  async.map(middlewareSpecs, createMiddlewareFromMiddlewareSpec, 
    function(err, resultMiddlewares) {
      if(err) return callback(err)

      callback(null, resultMiddlewares)
    })
}

module.exports = {
  middlewareSpecsComponentExtension: middlewareSpecsComponentExtension
}