
'use strict'

var async = require('async')
var should = require('should')
var streamChannel  = require('quiver-stream-channel')
var streamConvert = require('quiver-stream-convert')
var copyObject = require('quiver-copy').copyObject
var component = require('../lib/component')

var fooHandlerBuilder = function(config, callback) {
  config.fooConfig.should.equal('foo config')

  var handler = function(args, inputStreamable, callback) {
    args.fooArgs.should.equal('foo args')

    callback(null, streamConvert.textToStreamable('foo result'))
  }

  callback(null, handler)
}

var barHandlerBuilder = function(config, callback) {
  config.barConfig.should.equal('bar config')

  var handler = function(args, inputStreamable, callback) {
    if(args.path) {
      args.barPath.should.equal('path-to-bar')
    }

    streamConvert.streamableToText(inputStreamable, function(err, inputText) {
      if(err) return callback(err)

      inputText.should.equal('foo result')
      callback(null, streamConvert.textToStreamable('bar result'))
    })
  }

  callback(null, handler)
}

var fooFilter = function(config, handler, callback) {
  var filteredHandler = function(args, inputStreamable, callback) {
    args.fooArgs = ('foo args')

    handler(args, inputStreamable, callback)
  }

  callback(null, filteredHandler)
}

var fooMiddleware = function(config, handlerBuilder, callback) {
  config.fooConfig = 'foo config'

  handlerBuilder(config, callback)
}

var fooHandlerComponent = {
  name: 'foo handler',
  type: 'stream handler',
  middlewares: [
    'foo middleware',
    'foo filter'
  ],
  handlerBuilder: fooHandlerBuilder
}

var barHandlerComponent = {
  name: 'bar handler',
  type: 'stream handler',
  configOverride: {
    barConfig: 'bar config'
  },
  handlerBuilder: barHandlerBuilder
}

var fooBarPipelineHandlerComponent = {
  name: 'foo bar pipeline handler',
  type: 'stream pipeline',
  pipeline: [
    'foo handler',
    'bar handler'
  ]
}

var fooFilterComponent = {
  name: 'foo filter',
  type: 'stream filter',
  filter: fooFilter
}

var fooMiddlewareComponent = {
  name: 'foo middleware',
  type: 'stream middleware',
  middleware: fooMiddleware
}

var fooBarRouteList = [
  {
    routeType: 'static',
    path: '/foo',
    handler: 'foo handler'
  },
  {
    routeType: 'regex',
    regex: /^\/bar\/(.+)$/,
    matchFields: ['barPath'],
    handler: 'bar handler'
  }
]

var fooBarRouteListComponent = {
  name: 'foo bar route list',
  type: 'route list',
  routeList: fooBarRouteList
}

var fooBarRouterComponent = {
  name: 'foo bar router handler',
  type: 'router',
  routeLists: [
    'foo bar route list'
  ]
}

var quiverComponents = [
  fooHandlerComponent,
  barHandlerComponent,
  fooBarPipelineHandlerComponent,
  fooFilterComponent,
  fooMiddlewareComponent,
  fooBarRouteListComponent,
  fooBarRouterComponent
]

var testComponentConfig = function(config) {
  //console.log(config)
  should.exist(config.quiverComponents['foo handler'])
}

var testFooHandler = function(fooHandlerBuilder, config, callback) {
  fooHandlerBuilder(config, function(err, fooHandler) {
    if(err) return callback(err)

    fooHandler({}, streamChannel.createEmptyStreamable(), 
      function(err, resultStreamable){
        if(err) return callback(err)

        streamConvert.streamableToText(resultStreamable, 
          function(err, fooResult) {
            if(err) return callback(err)

            fooResult.should.equal('foo result')
            callback()
          })
      })
  })
}

var testPipelineHandler = function(pipelineHandlerBuilder, config, callback) {
  pipelineHandlerBuilder(config, function(err, pipelineHandler) {
    if(err) return callback(err)

    pipelineHandler({}, streamChannel.createEmptyStreamable(), 
      function(err, resultStreamable){
        if(err) return callback(err)

        streamConvert.streamableToText(resultStreamable, 
          function(err, fooResult) {
            if(err) return callback(err)

            fooResult.should.equal('bar result')
            callback()
          })
      })
  })
}

var testRouterHandlerBuilder = function(routerHandlerBuilder, config, callback) {
  routerHandlerBuilder(config, function(err, routerHandler) {
    if(err) return callback(err)

    var args = {
      path: '/bar/path-to-bar'
    }

    routerHandler(args, streamConvert.textToStreamable('foo result'), 
      function(err, resultStreamable){
        if(err) return callback(err)
        
        streamConvert.streamableToText(resultStreamable, 
          function(err, fooResult) {
            if(err) return callback(err)

            fooResult.should.equal('bar result')
            callback()
          })
      })
  })
}

describe('basic component test', function() {
  it('overall test', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      testComponentConfig(config)

      async.series([
        function(callback) {
          var fooHandlerBuilder = config.quiverStreamHandlerBuilders['foo handler']
          
          testFooHandler(fooHandlerBuilder, copyObject(config), callback)
        }, 
        function(callback) {
          var pipelineHandlerBuilder = 
            config.quiverStreamHandlerBuilders['foo bar pipeline handler']
          
          testPipelineHandler(pipelineHandlerBuilder, copyObject(config), callback)
        }, 
        function(callback) {
          var routerHandlerBuilder = 
            config.quiverStreamHandlerBuilders['foo bar router handler']

          testRouterHandlerBuilder(routerHandlerBuilder, copyObject(config), callback)
        }
      ], callback)
    })
  })
})
