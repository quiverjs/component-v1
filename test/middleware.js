
'use strict'

var should = require('should')
var streamChannel  = require('quiver-stream-channel')
var component = require('../lib/component')

describe('test stream middleware component', function() {
  var streamMiddleware = function(config, handlerBuilder, callback) {
    handlerBuilder(config, function(err, handler) {
      if(err) return callback(err)

      var args = { value: 'call from middleware' }
      handler(args, streamChannel.createEmptyStreamable(), 
        function(err, resultStreamable) {
          if(err) return callback(err)

          should.equal(resultStreamable.value, 'handler result')
          
          handler.modifiedByMiddleware = true

          callback(null, handler)
        })
    })
  }

  var streamHandlerBuilder = function(config, callback) {
    var handler = function(args, inputStreamable, callback) {
      should.equal(args.value, 'call from middleware')

      var resultStreamable = streamChannel.createEmptyStreamable()
      resultStreamable.value = 'handler result'

      callback(null, resultStreamable)
    }

    callback(null, handler)
  }

  var httpHandlerBuilder = function(config, callback) {
    var handler = function(requestHead, requestStreamable, callback) {
      should.equal(requestHead.method, 'POST')
      should.equal(requestStreamable.value, 'request body')

      var responseHead = {
        statusCode: 200
      }

      var responseStreamable = streamChannel.createEmptyStreamable()
      responseStreamable.value = 'response body'

      callback(null, responseHead, responseStreamable)
    }

    callback(null, handler)
  }

  var streamMiddlewareComponent = {
    name: 'test stream middleware',
    type: 'stream middleware',
    middleware: streamMiddleware
  }

  var streamHandlerComponent = {
    name: 'test stream handler',
    type: 'stream handler',
    middlewares: [
      'test stream middleware'
    ],
    handlerBuilder: streamHandlerBuilder
  }

  var httpHandlerComponent = {
    name: 'test http handler',
    type: 'http handler',
    middlewares: [
      'test stream middleware'
    ],
    handlerBuilder: httpHandlerBuilder
  }

  var quiverComponents = [
    streamMiddlewareComponent,
    streamHandlerComponent,
    httpHandlerComponent
  ]

  it('middleware should receive stream handler from handler builder', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test stream handler']
      handleableBuilder(config, function(err, handleable) {
        if(err) return callback(err)

        var handler = handleable.toStreamHandler()
        should.exist(handler.modifiedByMiddleware)

        callback(null)
      })
    })
  })

  it('http handler builder should cause middleware mismatch error', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test http handler']
      handleableBuilder(config, function(err, handleable) {
        should.exist(err)

        callback(null)
      })
    })
  })
})