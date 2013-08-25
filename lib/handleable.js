
'use strict'

var metaStreamHandlerConvert = function(toHandlerMethod) {
  var handleableToHandler = function(handleable) {
    var toHandler = handleable[toHandlerMethod]
    if(toHandler) return toHandler()

    return null
  }

  var handlerToHandleable = function(handler) {
    var handleable = { }
    handleable[toHandlerMethod] = function() {
      return handler
    }

    return handleable
  }

  var handlerConvert = {
    handleableToHandler: handleableToHandler,
    handlerToHandleable: handlerToHandleable
  }

  return handlerConvert
}

var streamHandlerConvert = metaStreamHandlerConvert('toStreamHandler')
var httpHandlerConvert = metaStreamHandlerConvert('toHttpHandler')

var handleableHandlerConvert = {
  handleableToHandler: function(handleable) {
    return handleable
  },

  handlerToHandleable: function(handleable) {
    return handleable
  }
}

module.exports = {
  streamHandlerConvert: streamHandlerConvert,
  httpHandlerConvert: httpHandlerConvert,
  handleableHandlerConvert: handleableHandlerConvert
}