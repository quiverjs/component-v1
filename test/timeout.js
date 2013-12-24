
'use strict'

var should = require('should')
var componentLib = require('../lib/component')
var safeCallbackLib = require('quiver-safe-callback')
var streamChannel  = require('quiver-stream-channel')
safeCallbackLib.setCallbackTimeout(500)

describe('timeout test', function() {
  it('handler builder timeout test', function(callback) {
    this.timeout(5000)

    var handlerBuilder = function(config, callback) {
      // pretend forget callback
    }

    var quiverComponents = [
      {
        name: 'test handler',
        type: 'stream handler',
        handlerBuilder: handlerBuilder
      }
    ]

    componentLib.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      handleableBuilder({}, function(err, handler) {
        should.exists(err)
        //console.log(err)

        callback()
      })
    })
  })

  it('handler timeout test', function(callback) {
    this.timeout(5000)

    var handlerBuilder = function(config, callback) {
      var handler = function(args, inputStreamable, callback) {
        // pretend forget callback
      }

      callback(null, handler)
    }

    var quiverComponents = [
      {
        name: 'test handler',
        type: 'stream handler',
        handlerBuilder: handlerBuilder
      }
    ]

    componentLib.installComponents(quiverComponents, function(err, config) {
      if(err) return callback(err)

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      handleableBuilder({}, function(err, handleable) {
        if(err) return callback(err)

        var handler = handleable.toStreamHandler()

        handler({}, streamChannel.createEmptyStreamable(), function(err, resultStreamable) {
          should.exists(err)
          // console.log(err)

          callback()
        })
      })
    })
  })
})
