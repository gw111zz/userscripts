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

var makeTimeline = function (time) {
  var string,
      time_array   = [],
      milliseconds = Math.round(time % 1 * 1000).toString();

  while (3 > milliseconds.length) {
    milliseconds = '0' + milliseconds;
  }

  time_array.push(Math.floor(time / (60 * 60)));
  time_array.push(Math.floor((time - (time_array[0] * 60 * 60)) / 60));
  time_array.push(Math.floor(time - ((time_array[1] * 60) + (time_array[0] * 60 * 60))));

  for (var i = 0, il = time_array.length; i < il; i++) {
    string = '' + time_array[i];

    if (1 === string.length) {
      time_array[i] = '0' + string;
    }
  }

  return time_array.join(":") + "," + milliseconds;
};

function loadCaption (selector) {
  var caption = caption_array[selector.selectedIndex - 1];

  if (!caption) return;

  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://video.google.com/timedtext?hl=' + caption.lang_code +
         '&lang=' + caption.lang_code + '&name=' + caption.name + '&v=' + VIDEO_ID,
    onload:function(xhr) {
      if (xhr.responseText !== "") {
        var caption, previous_start, start, end,
            captions   = new DOMParser().parseFromString(xhr.responseText, "text/xml").getElementsByTagName('text'),
            textarea   = document.createElement("textarea"),
            srt_output = '';

        for (var i = 0, il = captions.length; i < il; i++) {
          caption = captions[i];
          start   = +caption.getAttribute('start');

          if (0 <= previous_start) {
            textarea.innerHTML = captions[i - 1].textContent.replace(/</g, "&lt;").
                                                             replace( />/g, "&gt;" );
            srt_output += i + "\n" + makeTimeline(previous_start) + ' --> ' +
                          makeTimeline(start) + "\n" + textarea.value + "\n\n";
            previous_start = null;
          }

          if (end = +caption.getAttribute('dur')) {
            end = start + end;
          } else {
            if (captions[i + 1]) {
              previous_start = start;
              continue;
            }
            end = PLAYER.getDuration();
          }

          textarea.innerHTML = caption.textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          srt_output        += i + "\n" + makeTimeline(start) + ' --> ' +
                               makeTimeline(end) + "\n" + textarea.value + "\n\n";
        };
        textarea = null;

        GM_openInTab("data:text/plain;charset=utf-8," + encodeURIComponent(srt_output));
      } else {
        alert("Error: No response from server.");
      }

      selector.options[0].selected = true;
    }
  });
}

function loadCaptions (select) {
  GM_xmlhttpRequest({
    method: 'GET',
    url:    'http://video.google.com/timedtext?hl=en&v=' + VIDEO_ID + '&type=list',
    onload: function( xhr ) {
      if (xhr.responseText === "") {
        return select.options[0].textContent = uso_translate['no_captions'];
      }

      var caption, option, caption_info,
          captions = new DOMParser().parseFromString(xhr.responseText, "text/xml").
                                     getElementsByTagName('track');

      for (var i = 0, il = captions.length; i < il; i++) {
        caption      = captions[i];
        option       = document.createElement('option');
        caption_info = {
          name:      caption.getAttribute('name'),
          lang_code: caption.getAttribute('lang_code'),
          lang_name: caption.getAttribute('lang_translated')
        };

        caption_array.push(caption_info);
        option.textContent = caption_info.lang_name;

        select.appendChild(option);
      };

      select.options[0].textContent = uso_translate['download'];
      select.disabled               = false;
    }
  });
}

(function () {
  var div      = document.createElement('div'),
      select   = document.createElement('select'),
      option   = document.createElement('option'),
      controls = document.getElementById('watch-headline-user-info');

  div.setAttribute( 'style', 'display: inline-block;' );

  select.id       = 'captions_selector';
  select.disabled = true;

  option.textContent = uso_translate['loading'];
  option.selected    = true;

  select.appendChild(option);
  select.addEventListener('change', function() {
    loadCaption(this);
  }, false);

  div.appendChild(select);
  controls.appendChild(div);

  loadCaptions(select);
})();
