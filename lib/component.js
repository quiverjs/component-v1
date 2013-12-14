
'use strict'

var install = require('./install')
var loader = require('./loader')
var mergeObjects = require('quiver-merge').mergeObjects

module.exports = mergeObjects([
  install, loader
])