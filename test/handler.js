
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

  it('extend handler test', function(callback) {
    var extendComponent = {
      name: 'extend handler',
      type: 'stream handler',
      configOverride: {
        value: 'config value'
      },
      handler: 'test handler'
    }

    quiverComponents.push(extendComponent)

    component.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)

      var handleableBuilder = config.quiverHandleableBuilders['extend handler']
      should.exist(handleableBuilder)

      handleableBuilder(config, callback)
    })
  })

  it('handler instance test', function(callback) {
    var echoHandler = function(args, inputStreamable, callback) {
      callback(null, inputStreamable)
    }

    var handlerComponent = {
      name: 'test handler instance',
      type: 'stream handler',
      handler: echoHandler
    }

    var quiverComponents = [handlerComponent]
    component.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)

      var handleableBuilder = config.quiverHandleableBuilders['test handler instance']
      handleableBuilder({}, function(err, handleable) {
        if(err) return callback(err)

        var handler = handleable.toStreamHandler()
        var inputStreamable = streamChannel.createEmptyStreamable()
        handler({}, inputStreamable, function(err, resultStreamable) {
          if(err) return callback(err)
          
          should.equal(inputStreamable, resultStreamable)
          callback()
        })
      })
    })
  })
})
