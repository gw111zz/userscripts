// ==UserScript==
// @name           Download YouTube Captions
// @namespace      http://userscripts.org/users/tim
// @include        http://*youtube.com/watch*
// @include        https://*youtube.com/watch*
// @require        http://updater.usotools.co.cc/50003.js
// @require        http://translate.usotools.co.cc/3.jsonp?var=uso_translate
// @author         Tim Smart
// @copyright      2009 Tim Smart
// @license        GNU GPL v3.0 or later. http://www.gnu.org/copyleft/gpl.html
// ==/UserScript==

const PLAYER = unsafeWindow.document.getElementById('movie_player');
const VIDEO_ID = unsafeWindow.yt.getConfig('VIDEO_ID');
var caption_array = [];

function make_timeline( time ) {
  var time_array = [],
    milliseconds = Math.round( time % 1 * 1000 ).toString();

  while( 3 > milliseconds.length )
    milliseconds = '0' + milliseconds;

  time_array.push( Math.floor( time / (60 * 60) ) );
  time_array.push( Math.floor( ( time - ( time_array[0] * 60 * 60 ) ) / 60 ) );
  time_array.push( Math.floor( time - ( ( time_array[1] * 60 ) + ( time_array[0] * 60 * 60 ) ) ) );

  Array.forEach(time_array, function(string, i) {
    string = string.toString();

    if ( 1 === string.length )
      time_array[i] = "0" + string;
  });

  return time_array.join(":") + "," + milliseconds;
}

function load_caption( selector ) {
  var caption = caption_array[ selector.selectedIndex - 1 ];
  if ( !caption )
    return;

  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://video.google.com/timedtext?hl=' + caption.lang_code + '&lang=' + caption.lang_code + '&name=' + caption.name + '&v=' + VIDEO_ID,
    onload:function(xhr) {
      if ( xhr.responseText !== "" ) {
        var captions = new DOMParser().parseFromString( xhr.responseText, "text/xml" ).getElementsByTagName('text'),
          textarea = document.createElement("textarea"),
          srt_output = '',
          lookback = [ false, 0, 0 ];

        Array.forEach(captions, function( caption, i ) {
          if ( lookback[0] === true ) {
            lookback[2] = parseFloat( caption.getAttribute('start'), 10 );
            lookback[0] = false;

            textarea.innerHTML = captions[ i - 1 ].textContent.replace( /</g, "&lt;" ).replace( />/g, "&gt;" );
            srt_output += i + "\n" + make_timeline( lookback[1] ) + ' --> ' + make_timeline( lookback[2] ) + "\n" + textarea.value + "\n\n";
          }

          lookback[1] = parseFloat( caption.getAttribute('start'), 10 );
          if ( caption.getAttribute('dur') )
            lookback[2] = lookback[1] + parseFloat( caption.getAttribute('dur'), 10 );
          else {
            if ( captions[ i + 1 ] ) {
              lookback[0] = true;
              return;
            }
            lookback[2] = make_timeline( PLAYER.getDuration() );
          }

          textarea.innerHTML = caption.textContent.replace( /</g, "&lt;" ).replace( />/g, "&gt;" );
          srt_output += i + "\n" + make_timeline( lookback[1] ) + ' --> ' + make_timeline( lookback[2] ) + "\n" + textarea.value + "\n\n";
        });
        textarea = null;

        GM_openInTab( "data:text/plain;charset=utf-8," + encodeURIComponent( srt_output ) );
      }
      else
        alert("Error: No response from server.");

      selector.options[0].selected = true;
    }
  });
}

function load_captions( select ) {
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://video.google.com/timedtext?hl=en&v=' + VIDEO_ID + '&type=list',
    onload: function( xhr ) {
      if ( xhr.responseText === "" ) {
        select.options[0].textContent = uso_translate['no_captions'];
        return;
      }

      var captions = new DOMParser().parseFromString( xhr.responseText, "text/xml" ).getElementsByTagName('track');
      Array.forEach( captions, function( caption ) {
        var option = document.createElement('option'),
          caption_info = {
            name: caption.getAttribute('name'),
            lang_code: caption.getAttribute('lang_code'),
            lang_name: caption.getAttribute('lang_translated')
          };

        caption_array.push( caption_info );
        option.innerHTML = caption_info.lang_name;
        select.appendChild( option );
      } );

      captions = null;

      select.options[0].textContent = uso_translate['download'];
      select.disabled = false;
    }
  });
}

(function() {
  var div = document.createElement('div'),
    select = document.createElement('select'),
    option = document.createElement('option'),
    controls = document.getElementById('watch-headline-user-info');

  div.setAttribute( 'style', 'display: inline-block;' );

  select.id = 'captions_selector';
  select.disabled = true;

  option.textContent = uso_translate['loading'];
  option.selected = true;

  select.appendChild( option );
  select.addEventListener('change', function() {
    load_caption(this);
  }, false);

  div.appendChild( select );
  controls.appendChild(div);

  load_captions( select );
})();
