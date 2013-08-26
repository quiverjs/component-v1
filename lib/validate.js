
'use strict'

var param = require('quiver-param')
var error = require('quiver-error').error

var createComponentSpecValidator = function(paramSpec) {
  var paramValidator = param.createParamValidator(paramSpec)

  var validator = function(componentSpec) {
    var err = paramValidator(componentSpec)
    if(err) return error(500, 'invalid component spec ' + componentSpec.name, err)
  }

  return validator
}

var componentSpecParam = [
  {
    key: 'name',
    required: true,
    valueType: 'string'
  },
  {
    key: 'type',
    required: true,
    valueType: 'string'
  }
]

var validateComponentSpec = 
  createComponentSpecValidator(componentSpecParam)


var commonSpecParam = [
  {
    key: 'middlewares',
    required: false,
    valueType: 'array'
  },
  {
    key: 'handleables',
    required: false,
    valueType: 'array'
  },
  {
    key: 'configParam',
    required: false,
    valueType: 'array'
  },
  {
    key: 'argsParam',
    required: false,
    valueType: 'array'
  },
]

var handlerComponentSpecParam = [
  {
    key: 'handlerBuilder',
    required: true,
    type: 'function'
  }

].concat(commonSpecParam)

var validateHandlerComponentSpec = 
  createComponentSpecValidator(handlerComponentSpecParam)


var filterComponentSpecParam = [
  {
    key: 'filter',
    required: true,
    type: 'function'
  }

].concat(commonSpecParam)

var validateFilterComponentSpec = 
  createComponentSpecValidator(filterComponentSpecParam)


var middlewareComponentSpecParam = [
  {
    key: 'middleware',
    required: true,
    type: 'function'
  }

].concat(commonSpecParam)

var validateMiddlewareComponentSpec = 
  createComponentSpecValidator(middlewareComponentSpecParam)


var pipelineComponentSpecParam = [
  {
    key: 'pipeline',
    required: true,
    type: 'array'
  }

].concat(commonSpecParam)

var validatePipelineComponentSpec = 
  createComponentSpecValidator(pipelineComponentSpecParam)


var routeListComponentSpecParam = [
  {
    key: 'routeList',
    required: true,
    type: 'array'
  }
]

var validateRouteListComponentSpec = 
  createComponentSpecValidator(routeListComponentSpecParam)


var routerComponentSpecParam = [
  {
    key: 'routeLists',
    required: true,
    type: 'array'
  }
].concat(commonSpecParam)

var validateRouterComponentSpec =
  createComponentSpecValidator(routerComponentSpecParam)
  

module.exports = {
  validateComponentSpec: validateComponentSpec,
  validateHandlerComponentSpec: validateHandlerComponentSpec,
  validateFilterComponentSpec: validateFilterComponentSpec,
  validateMiddlewareComponentSpec: validateMiddlewareComponentSpec,
  validatePipelineComponentSpec: validatePipelineComponentSpec,
  validateRouteListComponentSpec: validateRouteListComponentSpec,
  validateRouterComponentSpec: validateRouterComponentSpec
}