// ==UserScript==
// @name           User Scripts GMail Library
// @description    A @require Library for UserScript's that offers a clean api to GMail.
// @namespace      http://userscripts.org/users/tim
// @license        MIT (See top of file)
// @copyright      Tim Smart (c) 2011
// ==/UserScript==

// The MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

if (typeof USO !== 'object') {
  var USO = {}
}

(function (USO) {
  var G = USO.Gmail = function Gmail (options) {
    options || (options = {})

    this.window  = unsafeWindow || window
    this.api     = null
    this.version = options.version || 2
    this._events = {}
    this.loaded  = false

    var gmail = this

    try {
      if (  this.window.gmonkey
         && 'function' === typeof this.window.gmonkey.load) {
        var gmonkey = this.window.gmonkey

        gmonkey.load(this.version, function (api) {
          gmail.api = api
          gmail.emit('loaded:api', api)
        })
      }
    } catch (err) {
      this.emit('error', err)
    }

    this.on('loaded:api', function () {
      this.api.registerViewChangeCallback(function () {
        var view = gmail.view_type

        if (!view) {
          return
        } else if (!gmail.loaded) {
          gmail.loaded = true
          gmail.emit('loaded', gmail.api)
        }

        gmail.emit('view', view)
        gmail.emit('view:' + view)
      })

      this.api.registerProfileCardCallback(function (e) {
        gmail.emit('profilecard', e)
      })

      this.api.registerButterbarCallback(function () {
        gmail.emit('butterbar')
      })

      this.api.registerMessageStateChangeCallback(function (message, state) {
        gmail.emit('message:state', message, state)
        // TODO : If start is always a string, message:state:{{state}}
      })

      this.api.registerMessageViewChangeCallback(function (message) {
        gmail.emit('message:view', message)
      })

      this.api.registerThreadStateChangeCallback(function (thread, state) {
        gmail.emit('thread:state', thread, state)
      })

      this.api.registerThreadViewChangeCallback(function (thread) {
        gmail.emit('thread:view', thread)
      })
    })
  }

  var convertToArray = function (thing) {
    var arr = []

    for (var i = 0, il = thing.length; i < il; i++) {
      arr.push(thing[i])
    }

    return arr
  }

  G.prototype.on = function (event, cb) {
    this._events[event] || (this._events[event] = [])
    this._events[event].push(cb)

    return this
  }

  G.prototype.removeListener = function (event, fn) {
    if (!this._events[event]) {
      return this
    }

    var index = this._events[event].indexOf(fn)

    if (-1 === index) {
      return this
    }

    this._events[event].splice(index, 1)

    return this
  }

  G.prototype.emit = function () {
    var args  = convertToArray(arguments)
      , event = args.shift()

    if (!this._events[event]) {
      return this
    }

    for (var i = 0, il = this._events[event].length; i < il; i++) {
      this._events[event][i].apply(this, args)
    }

    return this
  }

  G.prototype.__defineGetter__('info', function () {
    return this.window.gmonkey.info(this.version)
  })

  G.prototype.__defineGetter__('view_type', function () {
    return this.api.getActiveViewType()
  })

  G.prototype.__defineGetter__('canvas', function () {
    return this.api.getCanvasElement()
  })

  G.prototype.__defineGetter__('view', function () {
    return this.api.getActiveViewElement()
  })

  G.prototype.__defineGetter__('nav_pane', function () {
    return this.api.getNavPaneElement()
  })

  G.prototype.__defineGetter__('masthead', function () {
    return this.api.getMastheadElement()
  })

  G.prototype.__defineGetter__('labels', function () {
    return this.api.getSystemLabelsElement()
  })

  G.prototype.__defineGetter__('conv_rhs', function () {
    return this.api.getConvRhsElement()
  })

  G.prototype.__defineGetter__('footer', function () {
    return this.api.getFooterElement()
  })

  G.prototype.__defineGetter__('thread', function () {
    return this.api.getCurrentThread()
  })

  G.prototype.__defineGetter__('message', function () {
    return this.api.getCurrentMessage()
  })

  G.prototype.__defineGetter__('actions', function () {
    return this.api.getActionElements()
  })

  G.prototype.__defineGetter__('converstation_diabled', function () {
    return this.api.isConversationViewDisabled()
  })

  G.prototype.addNavModule = function (title, content, color) {
    return this.api.addNavModule(title, content, color)
  }

  G.prototype.click = function (element) {
    var click = document.createEvent('MouseEvents')

    click.initMouseEvent
      ( 'click', true, true
      , document.defaultView
      , 1, 0, 0, 0, 0
      , false, false, false, false
      , 0, null
      )
    element.dispatchEvent(click)

    return this
  }
})(USO);
