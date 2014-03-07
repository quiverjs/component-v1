
'use strict'

var should = require('should')
var streamConvert = require('quiver-stream-convert')
var configLib = require('quiver-config')
var component = require('../lib/component')

describe('simple handler component test', function() {
  it('simple handler builder test', function(callback) {
    var simpleHandler = function(args, json, callback) {
      json.value.should.equal('test')

      callback(null, 'result')
    }

    var handlerBuilder = function(config, callback) {
      callback(null, simpleHandler)
    }

    var quiverComponents = [
      {
        name: 'test handler',
        type: 'simple handler',
        inputType: 'json',
        outputType: 'text',
        handlerBuilder: handlerBuilder
      }
    ]

    component.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      handleableBuilder({ }, function(err, handleable) {
        if(err) return callback(err)

        var handler = handleable.toStreamHandler()

        var inputStreamable = streamConvert.jsonToStreamable({ value: 'test' })

        handler({ }, inputStreamable, function(err, resultStreamable) {
          if(err) return callback(err)

          streamConvert.streamableToText(resultStreamable, function(err, text) {
            if(err) return callback(err)

            text.should.equal('result')
            callback()
          })
        })
      })
    })
  })

  it('simple handler component test', function(callback) {
    var simpleHandler = function(args, input, callback) {
      callback(null, input.toUpperCase())
    }

    var quiverComponents = [
      {
        name: 'test handler',
        type: 'simple handler',
        inputType: 'text',
        outputType: 'text',
        resultContentType: 'text/html',
        handler: simpleHandler
      }
    ]

    component.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)
      
      configLib.loadSimpleHandler(config, 'test handler', 'text', 'streamable', 
      function(err, handler) {
        if(err) return callback(err)
        
        handler({}, 'hello world', function(err, resultStreamable) {
          if(err) return callback(err)

          should.equal(resultStreamable.contentType, 'text/html')
          
          streamConvert.streamableToText(resultStreamable, function(err, result) {
            if(err) return callback(err)
            
            should.equal(result, 'HELLO WORLD')
            callback()
          })
        })
      })
    })
  })

  it('simple input handler test', function(callback) {
    var inputHandlerBuilder = function(config, callback) {
      var handler = function(args, inputStreamable, callback) {
        streamConvert.streamableToJson(inputStreamable, function(err, json) {
          if(err) return callback(err)

          json.value.should.equal('test')
          callback(null, streamConvert.textToStreamable('result'))
        })
      }

      callback(null, handler)
    }

    var handlerBuilder = function(config, callback) {
      var inputHandler = config.quiverSimpleHandlers['test input handler']
      var input = { value: 'test' }
      
      inputHandler({}, input, function(err, result) {
        if(err) return callback(err)

        result.should.equal('result')

        var handler = function(args, inputStreamable, callback) {
          callback(null, inputStreamable)
        }

        callback(null, handler)
      })
    }

    var quiverComponents = [
      {
        name: 'test handler',
        type: 'stream handler',
        handleables: [
          {
            handler: 'test input handler',
            type: 'simple handler',
            inputType: 'json',
            outputType: 'text'
          }
        ],
        handlerBuilder: handlerBuilder
      },
      {
        name: 'test input handler',
        type: 'stream handler',
        handlerBuilder: inputHandlerBuilder
      }
    ]

    component.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      handleableBuilder(config, callback)
    })
  })
})