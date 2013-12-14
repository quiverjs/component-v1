
'use strict'

var fs = require('fs')
var path = require('path')
var async = require('async')
var error = require('quiver-error').error

var loadComponentsFromDirectory = function(dirPath, callback) {
  fs.readdir(dirPath, function(err, sourceFiles) {
    if(err) return callback(error(500, 
      'error loading source files in directory ' + dirPath, err))

    async.map(sourceFiles, function(sourceFile, callback) {
      var sourcePath = path.join(dirPath, sourceFile)

      fs.stat(sourcePath, function(err, stats) {
        if(err) return callback(error(500, 
          'error loading source file ' + sourcePath, err))

        if(stats.isDirectory()) {
          return loadComponentsFromDirectory(sourcePath, callback)
        }

        if(!/\.js$/.test(sourceFile)) return callback(null, [])

        try {
          var module = require(sourcePath)

          var quiverComponents = module.quiverComponents || []
          callback(null, quiverComponents)

        } catch(err) {
          return callback(error(500, 
          'error loading source file ' + sourcePath, err))
        }
      })
    }, function(err, componentListList) {
      if(err) return callback(err)

      var quiverComponents = Array.prototype.concat.apply([], componentListList)
      callback(null, quiverComponents)
    })
  })
}

module.exports = {
  loadComponentsFromDirectory: loadComponentsFromDirectory
}