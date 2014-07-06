AJAX translation bookmarklet
=========
_Note_: The majority of GotGreek's code, with some bug fixes, have been merged
into [BabelFrog](http://github.com/dergachev/babelfrog).

Upon activation, __GotGreek__ monitors user behavior and provides word or phrase
translations (powered by [Google Translate API](https://developers.google.com/translate/)
in the following fashion:

1. If user clicks on the screen, GotGreek tries to find a word (bounded by
   non-word characters) that contains the coordinates the user clicked at.
2. If user makes a selection, upon release of the mouse, selection is pushed to
   its non-word boundares and translation is provided.
3. Translations are provided as persistent tooltips that are dismissed by
   further user clicks.
3. Upon initial loading of GotGreek, subsequent invokations of the bookmarklet
   script will pause/start GotGreek.

Languages:
=========
All language codes must be in compliance with [ISO 639-1](//en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
for Google Translate to respond correctly. Currently, GotGreek tries to detect
source language from attributes of `html` element (`lang` or `xml:lang`) with
French as default fallback. Similarly, target language is detected from
`navigator` settings with English as default fallback.

Known Issues
=========

1. If the subject page is served by a server with certain
   [Content Security Policy](//developer.mozilla.org/en-US/docs/Security/CSP/Introducing_Content_Security_Policy)
   directives, the bookmarklet might break since it might not be able to inject
   the libraries it needs to operate in the page (for example look at
   [Facebook](//www.facebook.com) or [GitHub](//www.github.com)).
2. If the HTML element in the page on which GotGreek is being activated has
   its `lang` attribute set to a non-standard value, Google would respond with
   an error.
3. `Yepnope.js` does not set the `type` attribute in the `script` tags it injects.
   Depending on the user browser this *might* cause some errors, since a
   `script` tag must have its type attribute set appropriately in HTML versions
   upto 4 and in XHTML.
4. If the page has any global variable named `jQuery` which is not actually
   jQuery, the script will fail.
5. If `usePowerTip` is enabled, in some pages (potentially due to similar
   reasons as in [3]) where `$` is assigned something but its conventional
   jQuery, the `jquery.powertip.js` script will not bind `powerTip()` to
   `jQuery.prototype` (for example look at [LeMonde](http://www.lemonde.fr)).
6. If `config.usePowerTip` is set to `true`, GotGreek will not work on pages
   that already have loaded a version of jQuery prior to `1.7.0` (for example
   see [LaPresse](http://www.lapresse.ca)).
7. If there happens to be a `script` element in the DOM between the beginning
   and end nodes of user selection, the text that GotGreek translates will
   include the JavaScript code inside the `script`.
