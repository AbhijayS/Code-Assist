var url = require('url')

var MOVED_PERMANENTLY = 301
var FOUND = 302

module.exports = function(opts) {
  opts = opts || {}
  var statusCode = opts.statusCode || FOUND

  return function expressToSlashfunction(req, res) {
    var u = url.parse(req.originalUrl)
    res.redirect(statusCode, u.pathname + '/' + (u.search || ''))
  }
}
