
'use strict'

var should = require('should')
var streamChannel  = require('quiver-stream-channel')
var component = require('../lib/component')

describe('router component test', function() {
  var handlerBuilder = function(config, callback) {
    var handler = function(args, inputStreamable, callback) {
      should.equal(args.path, '/test')

      var resultStreamable = streamChannel.createEmptyStreamable()
      resultStreamable.value = 'routing success'
      callback(null, resultStreamable)
    }

    callback(null, handler)
  }

  var filter = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      args.path = '/test'
      handler(args, inputStreamable, callback)
    }

    callback(null, filteredHandler)
  }

  var handlerComponent = {
    name: 'test handler',
    type: 'stream handler',
    handlerBuilder: handlerBuilder
  }

  var filterComponent = {
    name: 'test filter',
    type: 'stream filter',
    filter: filter
  }

  var routeList = [
    {
      routeType: 'static',
      path: '/test',
      handler: 'test handler'
    }
  ]

  var routeListComponent = {
    name: 'test route list',
    type: 'route list',
    routeList: routeList
  }

  var routerComponent = {
    name: 'test router handler',
    type: 'router',
    middlewares: [
      'test filter'
    ],
    routeLists: [
      'test route list'
    ]
  }

  var quiverComponents = [
    handlerComponent,
    filterComponent,
    routeListComponent,
    routerComponent
  ]

  it('router should work', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test router handler']
      handleableBuilder(config, function(err, handleable) {
        if(err) throw err

        var handler = handleable.toStreamHandler()
        handler({ }, streamChannel.createEmptyStreamable(), function(err, resultStreamable) {
          if(err) throw err

          should.equal(resultStreamable.value, 'routing success')
          callback(null)
        })
      })
    })
  })
})