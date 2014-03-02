
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

  handlerBuilder(config, function(err, handler) {
    if(err) return callback(err)

    callback(null, handler)
  })
}

var quiverComponents = [
  {
    name: 'foo handler',
    type: 'stream handler',
    middlewares: [
      'foo middleware',
      'foo filter'
    ],
    handleables: ['bar handler'],
    handlerBuilder: fooHandlerBuilder
  },
  {
    name: 'bar handler',
    type: 'stream handler',
    configOverride: {
      barConfig: 'bar config'
    },
    handlerBuilder: barHandlerBuilder
  },
  {
    name: 'foo bar pipeline handler',
    type: 'stream pipeline',
    pipeline: [
      'foo handler',
      'bar handler'
    ]
  },
  {
    name: 'foo filter',
    type: 'stream filter',
    filter: fooFilter
  },
  {
    name: 'foo middleware',
    type: 'stream middleware',
    middleware: fooMiddleware
  },
  {
    name: 'foo bar route list',
    type: 'route list',
    routeList: [
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
  },
  {
    name: 'foo bar router handler',
    type: 'router',
    routeLists: [
      'foo bar route list'
    ]
  }
]

var testComponentConfig = function(config) {
  //console.log(config)
  should.exist(config.quiverComponents['foo handler'])
}

var testFooHandler = function(fooHandleableBuilder, config, callback) {
  fooHandleableBuilder(config, function(err, fooHandleable) {
    if(err) return callback(err)

    var fooHandler = fooHandleable.toStreamHandler()
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

var testPipelineHandler = function(pipelineHandleableBuilder, config, callback) {
  pipelineHandleableBuilder(config, function(err, pipelineHandleable) {
    if(err) return callback(err)

    var pipelineHandler = pipelineHandleable.toStreamHandler()
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

var testRouterHandlerBuilder = function(routerHandleableBuilder, config, callback) {
  routerHandleableBuilder(config, function(err, routerHandleable) {
    if(err) return callback(err)

    var routerHandler = routerHandleable.toStreamHandler()
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

describe('integrated component test', function() {
  it('overall test', function(callback) {
    component.installComponents(quiverComponents, function(err, config) {
      if(err) throw err

      testComponentConfig(config)

      async.series([
        function(callback) {
          var fooHandleableBuilder = config.quiverHandleableBuilders['foo handler']
          
          testFooHandler(fooHandleableBuilder, copyObject(config), callback)
        }, 
        function(callback) {
          var pipelineHandleableBuilder = 
            config.quiverHandleableBuilders['foo bar pipeline handler']
          
          testPipelineHandler(pipelineHandleableBuilder, copyObject(config), callback)
        }, 
        function(callback) {
          var routerHandleableBuilder = 
            config.quiverHandleableBuilders['foo bar router handler']

          testRouterHandlerBuilder(routerHandleableBuilder, copyObject(config), callback)
        }
      ], callback)
    })
  })
})
