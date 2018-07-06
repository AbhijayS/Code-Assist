// --------------------------------------------------------------------------------------------------------------------

// npm
var express = require('express')
var test = require('tape')
var request = require('request')
var toSlash = require('./')

// --------------------------------------------------------------------------------------------------------------------

var url = 'http://localhost:3000'

var app = express()

app.all('/admin', toSlash()) // 302 - Found
app.all('/my', toSlash(302)) // 302 - Found
app.all('/blog', toSlash(301)) // 301 - Moved Permanently

var server = app.listen(3000, function(err) {

  test('plain redirect', function(t) {
    t.plan(3)

    request({ followRedirect : false, url : url + '/admin' }, function (err, resp, body) {
      if (err) {
        return t.fail('Error - ' + err)
      }

      t.equal(resp.statusCode, 302, 'Status Code is correct')
      t.equal(resp.headers.location, '/admin/', 'Location header is correct')
      t.equal(body, 'Moved Temporarily. Redirecting to 302', 'Body is correct')
      t.end()
    })
  })

  test('redirect with params', function(t) {
    t.plan(3)

    request({ followRedirect : false, url : url + '/admin?this=that' }, function (err, resp, body) {
      if (err) {
        return t.fail('Error - ' + err)
      }

      t.equal(resp.statusCode, 302, 'Status Code is correct')
      t.equal(resp.headers.location, '/admin/?this=that', 'Location header is correct')
      t.equal(body, 'Moved Temporarily. Redirecting to 302', 'Body is correct')
      t.end()
    })
  })

  test('plain post', function(t) {
    t.plan(3)

    request.post({ followRedirect : false, url : url + '/admin?this=that' }, function (err, resp, body) {
      if (err) {
        return t.fail('Error - ' + err)
      }

      t.equal(resp.statusCode, 302, 'Status Code is correct')
      t.equal(resp.headers.location, '/admin/?this=that', 'Location header is correct')
      t.equal(body, 'Moved Temporarily. Redirecting to 302', 'Body is correct')
      t.end()
    })
  })

  test('plain put', function(t) {
    t.plan(3)

    request.put({ followRedirect : false, url : url + '/admin?this=that' }, function (err, resp, body) {
      if (err) {
        return t.fail('Error - ' + err)
      }

      t.equal(resp.statusCode, 302, 'Status Code is correct')
      t.equal(resp.headers.location, '/admin/?this=that', 'Location header is correct')
      t.equal(body, 'Moved Temporarily. Redirecting to 302', 'Body is correct')
      t.end()
    })
  })

  test('head', function(t) {
    t.plan(3)

    request.head({ followRedirect : false, url : url + '/admin?this=that' }, function (err, resp, body) {
      if (err) {
        return t.fail('Error - ' + err)
      }

      t.equal(resp.statusCode, 302, 'Status Code is correct')
      t.equal(resp.headers.location, '/admin/?this=that', 'Location header is correct')
      t.equal(body, '', 'No body body for a head request')
      t.end()
    })
  })

  test(function(t) {
    server.close()
    t.end()
  })

})

// --------------------------------------------------------------------------------------------------------------------
