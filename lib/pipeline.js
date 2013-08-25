
'use strict'

var handler = require('./handler')
var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject

var pipeHandlers = function(args, inputStreamable, handlers, callback) {
  if(handlers.length == 0) return callback(null, inputStreamable)

  var currentHandler = handlers[0]
  var restHandlers = handlers.slice(1)
  var handlerArgs = copyObject(args)

  currentHandler(handlerArgs, inputStreamable, function(err, resultStreamable) {
    if(err) return callback(err)

    pipeHandlers(args, resultStreamable, restHandlers, callback)
  })
}

var installPipelineComponent = function(componentSpec, callback) {
  var pipelineHandlerNames = componentSpec.pipeline

  componentSpec.handleables = componentSpec.handleables || [ ]
  componentSpec.handleables = componentSpec.handleables.concat(pipelineHandlerNames)

  var handlerBuilder = function(config, callback) {
    var pipelineHandlers = [ ]

    for(var i=0; i<pipelineHandlerNames.length; i++) {
      var handlerName = pipelineHandlerNames[i]
      var handleable = config.quiverHandleables[handlerName]

      if(!handleable.toStreamHandler) return callback(
        error(500, 'handleable is not stream handler'))
      
      var handlerNode = handleable.toStreamHandler()

      pipelineHandlers.push(handlerNode)
    }

    var handler = function(args, inputStreamable, callback) {
      pipeHandlers(args, inputStreamable, pipelineHandlers, callback)
    }

    callback(null, handler)
  }

  componentSpec.handlerBuilder = handlerBuilder

  handler.installStreamHandlerComponent(componentSpec, callback)
}

module.exports = {
  installPipelineComponent: installPipelineComponent
}