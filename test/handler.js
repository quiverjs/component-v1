
'use strict'

var async = require('async')
var should = require('should')
var streamChannel  = require('quiver-stream-channel')
var streamConvert = require('quiver-stream-convert')
var copyObject = require('quiver-copy').copyObject
var component = require('../lib/component')

describe('handler component test', function() {
  var handlerBuilder = function(config, callback) {
    should.equal(config.value, 'config value')

    var handler = function(args, inputStreamable, callback) {
      should.equal(args.value, 'args value')
      should.equal(inputStreamable.input, 'input stream')

      var resultStreamable = streamChannel.createEmptyStreamable()
      resultStreamable.result = 'result stream'
      callback(null, resultStreamable)
    }

    callback(null, handler)
  }

  var handlerComponent = {
    name: 'test handler',
    type: 'stream handler',
    handlerBuilder: handlerBuilder
  }

  var quiverComponents = [
    handlerComponent
  ]

  it('should create a stream handler component', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      should.exist(handleableBuilder)

      config.value = 'config value'

      handleableBuilder(config, function(err, handleable) {
        if(err) throw err

        should.exist(handleable.toStreamHandler)
        var handler = handleable.toStreamHandler()

        var inputStreamable = streamChannel.createEmptyStreamable()
        inputStreamable.input = 'input stream'

        var args = { value: 'args value' }

        handler(args, inputStreamable, function(err, resultStreamable) {
          if(err) throw err

          should.equal(resultStreamable.result, 'result stream')
          callback(null)
        })
      })
    })
  })
})
