
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

describe('nested filter dependency test', function() {
  var filter1 = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      args.filter1 = 'filter 1'
      handler(args, inputStreamable, callback)
    }

    callback(null, filteredHandler)
  }

  var filter2 = function(config, handler, callback) {
    var filteredHandler = function(args, inputStreamable, callback) {
      should.equal(args.filter1, 'filter 1')
      args.filter2 = 'filter 2'
      handler(args, inputStreamable, callback)
    }

    callback(null, filteredHandler)
  }

  var handlerBuilder = function(config, callback) {
    var handler = function(args, inputStreamable, callback) {
      should.equal(args.filter1, 'filter 1')
      should.equal(args.filter2, 'filter 2')

      var resultStreamable = streamChannel.createEmptyStreamable()
      resultStreamable.value = 'filter success'

      callback(null, resultStreamable)
    }

    callback(null, handler)
  }

  var filter1Component = {
    name: 'test filter 1',
    type: 'stream filter',
    filter: filter1
  }

  var filter2Component = {
    name: 'test filter 2',
    type: 'stream filter',
    middlewares: [
      'test filter 1'
    ],
    filter: filter2
  }

  var handlerComponent = {
    name: 'test handler',
    type: 'stream handler',
    middlewares: [
      'test filter 2'
    ],
    handlerBuilder: handlerBuilder
  }

  var quiverComponents = [
    filter1Component,
    filter2Component,
    handlerComponent
  ]

  it('nested filter dependency should work', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      handleableBuilder(config, function(err, handleable) {
        if(err) throw err

        var handler = handleable.toStreamHandler()
        handler({}, streamChannel.createEmptyStreamable(), function(err, resultStreamable) {
          if(err) throw err

          should.equal(resultStreamable.value, 'filter success')
          callback()
        })
      })
    })
  })
})

describe('extend middleware test', function(callback) {
  var middleware = function(config, handlerBuilder, callback) {
    should.equal(config.middlewareConfig, 'middleware config')

    handlerBuilder(config, callback)
  }

  var handlerBuilder = function(config, callback) {
    var handler = function(args, inputStreamable, callback) {
      callback(null, inputStreamable)
    }

    callback(null, handler)
  }

  var quiverComponents = [
    {
      name: 'middleware 1',
      type: 'stream middleware',
      middleware: middleware
    },
    {
      name: 'middleware 2',
      type: 'stream middleware',
      configOverride: {
        middlewareConfig: 'middleware config'
      },
      middleware: 'middleware 1'
    },
    {
      name: 'test handler',
      type: 'stream handler',
      middlewares: [
        'middleware 2'
      ],
      handlerBuilder: handlerBuilder
    }
  ]

  it('middleware should get config', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      var handleableBuilder = config.quiverHandleableBuilders['test handler']
      handleableBuilder(config, callback)
    })
  })
})