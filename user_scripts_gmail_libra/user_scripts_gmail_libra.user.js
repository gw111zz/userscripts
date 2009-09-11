// ==UserScript==
// @name           User Scripts GMail Library
// @description    A Javascript Library for User Scripts that makes it easier to script for GMail. Ideal for @require.
// @namespace      http://userscripts.org/users/tim
// @license        (cc) http://creativecommons.org/licenses/by-nc-sa/3.0/
// @copyright      Tim Smart (c) 2009
// ==/UserScript==

var GMailAPI = function( options ) {
	return new GMailAPI.prototype.construct( options );
}
GMailAPI.prototype = (function() {
	var loadAPI = function( gmailAPI ) {
		var fn = this;
		this._api = gmailAPI;

		this._api.registerViewChangeCallback( function() {
			onViewChange.apply( fn, arguments );
		} );
		setTimeout( function() {
			if ( initViewChange === false )
				onViewChange.call( fn );
		}, 100 );

		this._api.registerProfileCardCallback( function() {
			onCallback.call( fn, 'ProfileCard', arguments );
		} );
	},
	findAPI = function() {
		var fn = this;
		try {
			if ( typeof unsafeWindow.gmonkey === 'object' &&
					typeof unsafeWindow.gmonkey.load === 'function' ) {
				unsafeWindow.gmonkey.load( this.version, function() {
					loadAPI.apply( fn, arguments );
				} );
				return;
			}
		} catch ( error ) {}

		setTimeout( function() {
			findAPI.call( fn );
		}, 10 );
	},
	onViewChange = function() {
		if ( this.viewType === null )
			return;

		if ( initViewChange === false ) {
			if ( callbacks['Load'] instanceof Function )
				callbacks['Load'].call( this, this );
			initViewChange = true;
		}

		if ( callbacks['ViewChange'] instanceof Function )
			callbacks['ViewChange'].call( this, this.viewType );
	},
	onCallback = function( callbackName, args ) {
		if ( callbacks[ callbackName ] instanceof Function )
			callbacks[ callbackName ].apply( this, args );
	},
	callbacks = {
		'Load': null,
		'ViewChange': null,
		"ProfileCard": null
	},
	initViewChange = false;

	return {
	constructor: GMailAPI,
	construct: function( options ) {
		this.version = typeof options.version === 'string' ? options.version : this.version;
		for ( key in callbacks )
			callbacks[ key ] = typeof options[ 'on' + key ] === 'function' ? options[ 'on' + key ] : callbacks[ key ];

		try {
			if ( top.location.href === location.href )
				findAPI.call( this );
		} catch ( e ) {}
	},
	_api: null,
	version: '1.0',
	get info() {
		return unsafeWindow.gmonkey.info( this.version );
	},
	get viewType() {
		return this._api.getActiveViewType();
	},
	get canvasElement() {
		return this._api.getCanvasElement();
	},
	get viewElement() {
		return this._api.getActiveViewElement();
	},
	get navElement() {
		return this._api.getNavPaneElement();
	},
	get mastheadElement() {
		return this._api.getMastheadElement();
	},
	get labelsElement() {
		return this._api.getSystemLabelsElement();
	},
	get convRhsElement() {
		return this._api.getConvRhsElement();
	},
	get footerElement() {
		return this._api.getFooterElement();
	},
	addNavModule: function( title, optContent, optColor ) {
		return this._api.addNavModule( title, optContent, optColor );
	},
	clickElement: function( element ) {
		var clickEvent = document.createEvent("MouseEvents");
		clickEvent.initMouseEvent( "click", true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null );
		element.dispatchEvent( clickEvent );
	}
};})();
GMailAPI.prototype.construct.prototype = GMailAPI.prototype;
