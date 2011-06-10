// ==UserScript==
// @name           GMail 'Archive' and 'Delete' next conversation.
// @namespace      http://userscripts.org/users/tim
// @description    Instead of returning to the Inbox after archiving or deleting a conversation, you switch to the next one in line.
// @include        http://mail.google.com*
// @include        https://mail.google.com*
// @require        http://updater.usotools.co.cc/37986.js
// @require        http://userscripts.org/scripts/source/56812.user.js
// ==/UserScript==

var api = new USO.Gmail()

api.on('view:cv', function () {
  var view  = this.active_view
    , older = view.ownerDocument.evaluate
      ( ".//span[contains(., 'Older') and @role='link']"
      , view
      , null
      , XPathResult.FIRST_ORDERED_NODE_TYPE
      , null
      )
      .singleNodeValue
    , buttons = view.ownerDocument.evaluate
      ( ".//div[(contains(., 'Archive') or contains(., 'Delete')) and @role='button']"
      , view
      , null
      , XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE
      , null
      )
    , button

  if (!older || 4 !== buttons.snapshotLength) {
    return
  }

  for (var i = 0; i < buttons.snapshotLength; i++) {
    button = buttons.snapshotItem(i)
    button.addEventListener('mouseup', function () {
      unsafeWindow.console.log('MOUSEUP')
      if (!older) {
        return
      }
      api.click(older)
    }, false)
  }
})
