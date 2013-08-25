
'use strict'

var should = require('should')
var streamChannel  = require('quiver-stream-channel')
var component = require('../lib/component')

describe('handleable test', function() {
  var inputHandlerBuilder = function(config, callback) {
    var handler = function(args, inputStreamable, callback) {
      callback(null, inputStreamable)
    }

    callback(null, handler)
  }

  var testHandlerBuilder = function(config, callback) {
    should.exist(config.quiverHandleables['input handler 1'])
    should.exist(config.quiverHandleables['input handler 2'])

    var handler = function(args, inputStreamable, callback) {
      callback(null, inputStreamable)
    }

    handler.loadedAllHandleables = true
    callback(null, handler)
  }

  var inputHandlerComponent1 = {
    name: 'input handler 1',
    type: 'stream handler',
    handlerBuilder: inputHandlerBuilder
  }

  var inputHandlerComponent2 = {
    name: 'input handler 2',
    type: 'stream handler',
    handlerBuilder: inputHandlerBuilder
  }

  var handlerComponent = {
    name: 'test handler',
    type: 'stream handler',
    handleables: [
      'input handler 1',
      'input handler 2',
      'input handler 1'
    ],
    handlerBuilder: testHandlerBuilder
  }

  var quiverComponents = [
    inputHandlerComponent1,
    inputHandlerComponent2,
    handlerComponent
  ]

  it('should load all handleables', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test handler']

      handleableBuilder(config, function(err, handleable) {
        if(err) throw err

        callback(null)
      })
    })
  })
})