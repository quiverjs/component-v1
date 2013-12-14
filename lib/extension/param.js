
'use strict'

var async = require('async')
var error = require('quiver-error').error
var middleware = require('quiver-middleware')

var createSimpleComponentExtension = function(specKey, middlewareBuilder) {
  var componentExtension = function(componentSpec, callback) {
    var spec = componentSpec[specKey]
    if(!spec) return callback(null, [])

    var managedMiddleware = middlewareBuilder(spec)
    callback(null, [managedMiddleware])
  }

  return componentExtension
}

var configParamComponentExtension = createSimpleComponentExtension(
  'configParam', middleware.createConfigParamMiddleware)

var argsParamComponentExtension = createSimpleComponentExtension(
  'argsParam', middleware.createArgsParamMiddleware)

var configOverrideComponentExtension = createSimpleComponentExtension(
  'configOverride', middleware.createConfigOverrideMiddleware)

var configAliasComponentExtension = createSimpleComponentExtension(
  'configAlias', middleware.createConfigAliasMiddleware)

var handlerAliasComponentExtension = createSimpleComponentExtension(
  'handlerAlias', middleware.createHandlerAliasMiddleware)

module.exports = {
  configParamComponentExtension: configParamComponentExtension,
  argsParamComponentExtension: argsParamComponentExtension,
  configOverrideComponentExtension: configOverrideComponentExtension,
  configAliasComponentExtension: configAliasComponentExtension,
  handlerAliasComponentExtension: handlerAliasComponentExtension
}