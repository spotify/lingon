// This code was copied from https://github.com/jergason/recursive-readdir/
// in accordance with the MIT license.
//
// We need to vendor this code because it uses minimatch and we need to use a RegExp
// object because of legacy reasons. We intend to suggest an upstream change in recursive-readdir
// to allow usage of RegExp objects as well as glob patterns. If merged we will remove this vendored
// code and depend on the upstream project.


var fs = require('fs')
var p = require('path')

// how to know when you are done?
function readdir(path, ignores, callback) {
  if (typeof ignores == 'function') {
    callback = ignores
    ignores  = []
  }
  var list = []

  fs.readdir(path, function (err, files) {
    if (err) {
      return callback(err)
    }

    var pending = files.length
    if (!pending) {
      // we are done, woop woop
      return callback(null, list)
    }

    var ignoreOpts = {matchBase: true}
    files.forEach(function (file) {
      for (var i = 0; i < ignores.length; i++) {
        if(ignores[i].test(p.join(path, file))) {
          pending -= 1
          if (pending <= 0) {
            callback(null, list)
          }
          return
        }
      }

      fs.stat(p.join(path, file), function (err, stats) {
        if (err) {
          return callback(err)
        }

        if (stats.isDirectory()) {
          files = readdir(p.join(path, file), ignores, function (err, res) {
            if (err) {
              return callback(err)
            }

            list = list.concat(res)
            pending -= 1
            if (!pending) {
              callback(null, list)
            }
          })
        }
        else {
          list.push(p.join(path, file))
          pending -= 1
          if (!pending) {
            callback(null, list)
          }
        }
      })
    })
  })
}

module.exports = readdir
