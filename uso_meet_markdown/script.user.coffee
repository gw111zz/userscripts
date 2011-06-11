# USO, meet Markdown. One day Userscripts.org used plain HTML for writing comments and guides,
# little did he know about a young lass that called herself Markdown.
# Userscripts.org fell madly in love.

# ==UserScript==  
# @name           USO, meet Markdown.  
# @namespace      http://userscripts.org/users/tim  
# @description    Markdown gets married to Userscript.org  
# @include        http://userscripts.org/topics/*  
# @require        http://updater.usotools.co.cc/70901.js  
# @require        http://userscripts.org/scripts/source/70908.user.js  
# @require        http://userscripts.org/scripts/source/104570.user.js  
# ==/UserScript==

# Some ideas in this script originated from SizzleMcTwizzle's comment fix script: 
# http://userscripts.org/scripts/show/24464
#
# Kudos to him!


#### Post class
# This class represents a post on Userscripts.org, usually found in a topic
class Post
  constructor: (page, element) ->
    @page    = page
    @element = element

    if 'TR' is @element.nodeName
      @initFromTopic()
    else if 'DIV' is @element.nodeName
      @initFromGuide()

  element: null

  # We are currently in a guide, attach listeners, grab post info etc
  # and populate the Post instance with data
  initFromTopic: ->
    authorCont = @element.getElementsByClassName('author')[0]
    nameLink   = authorCont.getElementsByClassName('fn')[0]
                           .getElementsByTagName('a')[0]
    linkCont   = authorCont.getElementsByTagName('p')[0]

    if not linkCont
      linkCont = document.createElement 'p'
      authorCont.insertBefore linkCont,
                              authorCont.getElementsByClassName('useragent')[0]

    @id       = /\d+$/.exec(@element.id)[0]
    @userId   = nameLink.getAttribute 'user_id'
    @userName = nameLink.textContent
    @userHref = nameLink.href
    @body     = @element.getElementsByClassName('body')[0].
                    innerHTML

    @belongsToUser = if authorCont.getElementsByClassName('edit')[0]
      true
    else false

    # Insert the quote link
    @insertUtility 'Quote', linkCont, =>
      @quote()

    # Insert the Report link, depending if the post
    # belongs to the current user or not
    if not @belongsToUser
      @insertUtility 'Report', linkCont, (event) =>
        @report event

  # Shortcut for inserting a utility link into the post
  # author section. cont is an optional container, to save
  # looking for it again
  insertUtility: (name, cont, callback) ->
    if 'function' is typeof cont
      callback = cont
      cont     = null

    span               = document.createElement 'span'
    span.style.display = 'block'
    span.className     = 'edit'

    link                = document.createElement 'a'
    link.style.fontSize = '12px'
    link.textContent    = name
    link.href           = '#'
    link.className      = 'utility'

    link.addEventListener('click', (event) ->
      event.preventDefault()
      callback event
    , false)
    span.appendChild link

    if not cont
      @element.getElementsByClassName('author')[0].
               getElementsByTagName('p')[0].
               appendChild span
    else
      cont.appendChild span

  # This post function takes either a selection, or the entire post body,
  # then passes it to the editor 'insertQuote' function
  quote: ->
    selection = window.getSelection()
    html      = ''

    if '' is selection.toString()
      html = @body
    else
      range   = selection.getRangeAt(0)
      element = range.commonAncestorContainer
      while element
        if 'TD' is element.nodeName and 0 is element.id.indexOf 'post-body-'
          if 'post-body-' + @id is element.id
            properSelection = true
          break
        element = element.parentNode

      if properSelection
        fragment = range.cloneContents()
        holder   = document.createElement 'div'
        holder.appendChild fragment

        html = holder.innerHTML
        range.detach()

        holder = range = fragment = null
      else html = @body
    page.editor.insertQuote html, @userName, @userId, @id

  # This function will report the post as spam, to the USO spam topic
  report: (event) ->
    comments   = prompt 'Do you want to mention any specific details about the offender?',
                        'This post contained spam.'

    reportHtml = "<p>I believe the user <a href='/users/#{@userId}'>#{@userName}</a> has
                made an inappropiate <a href='#{location.pathname + location.search}#post-body-#{@id}'>post</a>
                in the topic <a href='#{location.pathname}'>#{page.title}</a>.</p>"

    if not comments
      return
    else if '' isnt comments
      reportHtml += "<p>#{comments}</p>"

    GM_xmlhttpRequest
      url:    "http://#{location.host}/topics/9/posts"
      method: 'POST'
      headers:
        'Content-Type': 'application/x-www-form-urlencoded'
      data:   "authenticity_token=#{encodeURIComponent unsafeWindow.auth_token}&post%5Bbody%5D=" +
              "#{encodeURIComponent reportHtml}&commit=Post+reply"
      onload: ->
        event.target.textContent = 'Reported!'

#### Guide class
# Represents a guide on Userscripts.org
class Guide
  constructor: (page, element) ->
    @page = page

#### Editor class
# Represents the current editor in the page
class Editor
  constructor: (page, element) ->
    @page = page
    @element = element

    if 'DIV' is element.nodeName
      @initFromReply()

  element: null

  # Here we modify the reply box, and over-ride a function on the USO
  # page that gets called on a edit operation
  initFromReply: ->
    oldSetReplyId = unsafeWindow.EditForm.setReplyId

    # Practically this is the 'onPostEdit' listener
    unsafeWindow.EditForm.setReplyId = =>
      oldSetReplyId.apply unsafeWindow.EditForm, arguments

      @element = document.getElementById 'edit'
      @modifyEntryContainer @element

      @textarea = document.getElementById 'edit_post_body'
      textarea  = @textarea
      @addShortcuts @textarea

      # Modify the submit button to convert the textarea
      # content before sending it off to USO
      @element.getElementsByTagName('form')[0].
               elements[3].
               addEventListener('click', ->
         textarea.value = markdownToHtml textarea.value
      , false)
      @textarea.value = htmlToMarkdown @textarea.value

    # For the normal reply box
    @modifyEntryContainer @element

    form     = @element.getElementsByTagName('form')[0]
    textarea = document.getElementById 'post_body'

    @element.getElementsByTagName('form')[0].
             elements[2].
             addEventListener('click', =>
       textarea.value = markdownToHtml textarea.value
    , false)
    @addShortcuts textarea

    oldReplyInit = unsafeWindow.ReplyForm.init
    unsafeWindow.ReplyForm.init = =>
      oldReplyInit.call unsafeWindow.ReplyForm
      @element  = document.getElementById 'reply'
      @textarea = document.getElementById 'post_body'

    @element = null

  # This function takes a reply 'containter' div, and chops and changes
  # it to our liking
  modifyEntryContainer: (element) ->
    element.getElementsByTagName('h5')[1]
           .textContent = 'Use Markdown to format your reply.'

  # This function takes html, the User-Name, a User ID and a post ID,
  # converts it to markdown, then inserts the
  # resulting quote into the current textarea
  insertQuote: (html, username, userId, postId) ->
    if @ensureElement()
      previous = markdownToHtml @textarea.value
      modify   = (html) ->
        previous + html

    html = html.replace(/<!--.+-->/, '').trim()
    html = "<blockquote><strong><a href='/users/#{userId}'>#{username}</a></strong>" +
           "&nbsp;<a href='#posts-#{postId}'>wrote</a>:<br />#{html}</blockquote>"

    html = modify html if modify
    textarea.value = htmlToMarkdown html

  # This is used by the insertQuote function to see whether we are currently
  # in a reply or not. If we are not in a reply, it will open a reply box. If
  # we are in a edit or reply, it just returns true
  ensureElement: ->
    if not @element
      @openReply()
      false
    else if 'none' is @element.style.display
      @openReply()
      false
    else
      true

  # Opens the reply box, simple.
  openReply: ->
    unsafeWindow.ReplyForm.init()

  # Adds the follow keyboard shortcuts
  #
  # * Nothing yet!
  addShortcuts: (textarea) ->

#### Page class
# Represents a page on USO, depending on the URI. It will add all
# the necessary listeners, insert all the elements, construct all the posts,
# the guide if necessary, and generally all the other stuff I missed
class Page
  init: ->
    path = location.pathname

    if 0 is path.indexOf '/topics'
      @initFromTopic()

  comments: []
  editor:   null
  title:    document.title

  # Set-up page from a standard topic.
  initFromTopic: ->
    postElements = document.getElementsByClassName 'post'

    @editor = new Editor @, document.getElementById 'reply'

    for post in postElements
      @comments.push new Post @, post

    @title = document.getElementById('topic-title').firstChild.
                      textContent.trim().replace /\s+/g, ' '


#### Parsing functions

# A instance of showdown
showdown = new Showdown.converter()

# Takes a string of html, and parses it to markdown using
# dom2markdown
htmlToMarkdown = (html, callback) ->
  div           = document.createElement 'div'
  div.innerHTML = html
  USO.dom2markdown div

# Takes a string of markdown, and parses it to html
markdownToHtml = (markdown) ->
  showdown.makeHtml markdown

# Finally start setting up page
page = new Page()
page.init()

