// ==UserScript==
// @name           GMail Auto "Show Details"
// @namespace      http://userscripts.org/users/tim
// @description    Automatically shows the details of a message.
// @include        http://mail.google.com/*
// @include        https://mail.google.com/*
// @require        https://userscripts.org/scripts/source/56812.user.js
// @require        http://updater.usotools.co.cc/57495.js
// ==/UserScript==

// Initialise the GMailAPI
GMailAPI({
  // Set the onViewChange handler
  onViewChange: function() {
    // If the viewtype is conversation, then click on all show details links
    if ( this.viewType === 'cv' ) {
      var viewElement = this.viewElement,
        links = viewElement.ownerDocument.evaluate( './/span[contains(., "show details")]', viewElement, null, 7, null );

      for ( var i = 0, link; link = links.snapshotItem( i++ ); )
        this.clickElement( link );
    }
  }
});
