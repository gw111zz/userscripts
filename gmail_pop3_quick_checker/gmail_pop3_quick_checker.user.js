// ==UserScript==
// @name           GMail POP3 Quick Checker
// @namespace      http://userscripts.org/users/tim
// @description    Add's a link next to 'Refresh' to quickly check all POP3 Accounts
// @include        http://mail.google.com*
// @include        https://mail.google.com*
// @require        http://updater.usotools.co.cc/51516.js
// @require        http://userscripts.org/scripts/source/56812.user.js
// ==/UserScript==

function clickElement( element ) {
	var clickEvent = document.createEvent("MouseEvents");
	clickEvent.initMouseEvent( "click", true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null );
	element.dispatchEvent( clickEvent );
}

var navigating = false;

GMailAPI({
	onViewChange: function() {
		if ( this.viewType === 'tl' ) {
			var divs = this.viewElement.ownerDocument.evaluate( ".//div[contains(.,'Refresh') and @act='20']", this.viewElement, null, 7, null );
			for ( var i = 0, div, refreshCont, refreshLink; div = divs.snapshotItem( i++ ); ) {
				if ( div.added === true )
					return;

				refreshCont = document.createElement('div');
				refreshLink = document.createElement('div');
				refreshCont.className = 'goog-inline-block';
				refreshLink.className = 'AP';
				refreshLink.appendChild( document.createTextNode('Refresh POP3 Accounts') );
				refreshCont.appendChild( refreshLink );

				refreshCont.addEventListener( 'click', function() {
					navigating = top.location.href.split('#');
					if ( navigating.length === 2 )
						navigating = './#' + navigating[1];
					else
						navigating = true;

					top.location.href = './#settings/accounts';
				}, false );

				div.parentNode.parentNode.appendChild( refreshCont );
				div.added = true;
				refreshLink = refreshCont = null;
			}
			divs = null;
		}
		else if ( this.viewType === 's' ) {
			if ( navigating === false )
				return;

			var links = this.viewElement.ownerDocument.evaluate( ".//span[contains(.,'Check mail now')]", this.viewElement, null, 4, null );
			for ( var link; link = links.iterateNext(); )
				clickElement( link );

			top.location.href = navigating === true ? './#inbox' : navigating;
			navigating = false;
		}
	}
});
