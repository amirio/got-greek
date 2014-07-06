/*globals jQuery, rangy, yepnope, navigator, console, document, window*/
var gotGreek = function () {
    var config,
        resources,
        load,
        loaded = false,
        running = false,
        initialized = false,
        currentRange,
        cache,
        cssApplier,
        init,
        translateListener,
        jsonCallback,
        showTooltip,
        pushToLimits,
        extractWordAt;

    config = {
        boundaryPattern: /[\s:!.,\"\(\)«»%$]/,
        nonBoundaryPattern: /[^\s:!.,\"\(\)«»%$]/,
        googleApiKey: 'AIzaSyAICISSmAHfsclKJ4eu5UtbhhtWMLUqxcY',
        googleTranslateUrl: 'https://www.googleapis.com/language/translate/v2',
        source: '',
        target: '',
        usePowerTip: false
    };

    //external resources that GotGreek has to load
    resources = {
        jQuery: {
            url: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.0/jquery.min.js',
            loaded: typeof jQuery !== 'undefined'
        },
        powerTip: {
            url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/jquery.powertip.min.js',
            loaded: !config.usePowerTip || ((jQuery !== undefined) ? (typeof jQuery.fn.powerTip !== 'undefined') : false)
        },
        powerTipCss: {
            url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/css/jquery.powertip.min.css',
            loaded: !config.usePowerTip || ((jQuery !== undefined) ? (typeof jQuery.fn.powerTip !== 'undefined') : false)
        },
        rangyCore: {
            url: '//rangy.googlecode.com/svn/trunk/dev/rangy-core.js',
            loaded: (typeof rangy !== 'undefined')
        },
        rangyCssApplier: {
            url: '//rangy.googlecode.com/svn/trunk/dev/rangy-cssclassapplier.js',
            loaded: !config.usePowerTip || ((typeof rangy !== 'undefined') ? (typeof rangy.modules.CssClassApplier !== 'undefined') : false)
        }
    };

    // loads all external libraries
    load = function () {
        var yepnopeCallback = function (url) {
            var resource_names = Object.keys(resources),
                check_all_loaded,
                resource_by_url;
            check_all_loaded = function () {
                var and_reduce = function (prev, cur) {
                    return prev && resources[cur].loaded;
                };
                return resource_names.reduce(and_reduce, true);
            };
            resource_by_url = function (matching_url) {
                var matches_url = function (r) {
                    return resources[r].url === matching_url;
                };
                return resource_names.filter(matches_url);
            };
            resources[resource_by_url(url)].loaded = true;
            if (check_all_loaded()) {
                loaded = true;
                jQuery('#gotGreek-menu').text('GotGreek is Ready!');
                jQuery('#gotGreek-menu').fadeOut(2000, function () {
                    jQuery('#gotGreek-menu').remove();
                });
                gotGreek.boot();
            }
        };
        yepnope([{
            test: resources.jQuery.loaded,
            nope: resources.jQuery.url,
            callback: yepnopeCallback
        }, {
            test: resources.powerTip.loaded,
            nope: [resources.powerTip.url, resources.powerTipCss.url],
            callback: yepnopeCallback
        }, {
            test: resources.rangyCore.loaded,
            nope: resources.rangyCore.url,
            callback: yepnopeCallback
        }, {
            test: resources.rangyCssApplier.loaded,
            nope: resources.rangyCssApplier.url,
            callback: yepnopeCallback
        }]);
    };

    // initalizes config.source, config.target, and all the state variables
    init = function () {
        //TODO handle the case where html lang is set to an ISO 639-1 non-compliant value
        config.source = (jQuery('html').attr('lang') ||
                         jQuery('html').attr('xml:lang') ||
                         'fr'
                        ).toLowerCase();
        config.target = (navigator.language.substring(0, 2) ||
                         navigator.userLanguage.substring(0, 2) ||
                         'en'
                        ).toLowerCase();
        cache = {};
        rangy.init();
        currentRange = null;
        if (config.usePowerTip) {
            cssApplier = rangy.createCssClassApplier('gotGreek-selected',
                                                     {normalize: true});
        }
        initialized = true;
        gotGreek.boot();
    };

    translateListener = function (e) {
        // remove all existing tooltips
        var text, x, y;
        if (config.usePowerTip) {
            jQuery('#powerTip').remove();
            if (currentRange !== null) {
                cssApplier.undoToRange(currentRange);
            }
        } else {
            jQuery('#gotGreek-box').remove();
        }
        if (e.button !== 0 || !running) {
            return;
        }
        // if there is no selection try to wrap a word around click point
        if (rangy.getSelection().isCollapsed) {
            currentRange = extractWordAt(e.target,
                                         e.clientX,
                                         e.clientY);
        } else {
            // if there is a selection, push it to its bounding limits
            currentRange = rangy.getSelection().getRangeAt(0);
            pushToLimits(currentRange);
        }
        if (currentRange === null) {
            rangy.getSelection().removeAllRanges();
            return;
        }
        //TODO instead of toString, go through the range and jump over script
        //     tags if what you found is not garbage translate it
        text = currentRange.toString();
        if (/\S/.test(text) && /\D/.test(text)) {
            text = text.replace(/\s/g, ' ');
            x = jQuery(document).scrollLeft() + e.clientX + 10;
            y = jQuery(document).scrollTop() + e.clientY + 10;
            if (config.usePowerTip) {
                cssApplier.applyToRange(currentRange);
            }
            rangy.getSelection().setSingleRange(currentRange);
            if (cache[text]) {
                return showTooltip(x, y, text, cache[text]);
            }
            //send request to Google
            jQuery.ajax({
                url: config.googleTranslateUrl,
                type: 'GET',
                dataType: 'jsonp',
                success: jsonCallback(x, y, text),
                error: function (xhr, status) {
                    console.log(xhr);
                    console.log(status);
                },
                data: {
                    key: config.googleApiKey,
                    source: config.source,
                    target: config.target,
                    q: text
                }
            });
        }
    };

    jsonCallback = function (x, y, text) {
        return function (response) {
            if (typeof response.data === 'undefined') {
                if (typeof response.error === 'undefined') {
                    showTooltip(x, y, text, 'An unexpected error occured');
                } else {
                    showTooltip(x, y, text, response.error.message);
                }
            } else {
                cache[text] = response.data.translations[0].translatedText;
                showTooltip(x, y, text, cache[text]);
            }
        };
    };

    showTooltip = function (x, y, text, translation) {
        var html;
        if (config.usePowerTip) {
            html = '<p><b>' + config.target + '</b>: ' + translation +
                   '</p><hr><p><b>' + config.source + '</b>: ' + text + '</p>';
            jQuery('.gotGreek-selected').data('powertip', html);
            jQuery('.gotGreek-selected').powerTip({placement: 'se',
                                                   smartPlacement: true,
                                                   manual: true});
            jQuery.powerTip.show(jQuery('.gotGreek-selected'));
        } else {
            html = '<p><b>' + config.target + '</b>: ' + translation +
                   '</p><hr><p><b>' + config.source + '</b>: ' + text + '</p>';
            jQuery('body').append(
                jQuery(document.createElement('div'))
                    .attr('id', 'gotGreek-box')
                    .html(html)
                    .css('top', y + 'px')
                    .css('left', x + 'px')
            );
        }
    };

    // helper function for translateListener, pushes a range to its boundaries
    pushToLimits = function (range) {
        var startNodeValue = range.startContainer.nodeValue,
            endNodeValue = range.endContainer.nodeValue,
            start = range.startOffset,
            end = range.endOffset;
        if (startNodeValue) {
            while (start > 0 &&
                    config.nonBoundaryPattern.test(startNodeValue[start - 1])) {
                start -= 1;
            }
        }
        if (endNodeValue) {
            while (end < endNodeValue.length &&
                    config.nonBoundaryPattern.test(endNodeValue[end])) {
                end += 1;
            }
        }
        range.setStart(range.startContainer, start);
        range.setEnd(range.endContainer, end);
        return range;
    };

    // helper function for translateListener, recursively traverses the DOM in
    // search of the word that contains (x,y)
    extractWordAt = function (node, x, y) {
        var range,
            boxContainsPoint,
            currentText = node.nodeValue,
            start,
            end,
            cnt,
            tmp,
            len;
        boxContainsPoint = function (box, x, y) {
            return box.bottom > y &&
                    box.top < y &&
                    box.left < x &&
                    box.right > x;
        };
        if (node.nodeType === node.TEXT_NODE && /\S/.test(currentText)) {
            // if node is a text node, start digging the word out: slide the
            // range (start,end) along node.nodeValue until the corresponding
            // range contains (x,y) the sliding window (start,end) jumps over
            // non bounding characters.
            start = 0;
            while (start < currentText.length) {
                range = rangy.createRange();

                tmp = currentText.substring(start)
                        .search(config.nonBoundaryPattern);
                if (tmp === -1) {
                    break;
                }
                start += tmp;
                range.setStart(node, start);

                tmp = currentText.substring(start)
                        .search(config.boundaryPattern);
                if (tmp === -1) {
                    end = currentText.length;
                } else {
                    end = start + tmp;
                }
                range.setEnd(node, end);
                if (boxContainsPoint(range.nativeRange
                                        .getBoundingClientRect(), x, y)) {
                    //found the word
                    rangy.getSelection().setSingleRange(range);
                    return range;
                }
                start = end;
                range.detach();
            }
        } else if (node.nodeType === node.ELEMENT_NODE) {
            // if node is an element, go through its children
            if (!boxContainsPoint(node.getBoundingClientRect(), x, y)) {
                // don't bother if (x,y) falls outside of containing rectangle
                return null;
            }
            for (cnt = 0, len = node.childNodes.length; cnt < len; cnt++) {
                tmp = extractWordAt(node.childNodes[cnt], x, y);
                if (tmp && /\S/.test(tmp.toString())) {
                    return tmp;
                }
            }
        }
        return null;
    };

    /**
     * the public interface of gotGreek:
     */
    return {
        //this function is the only function that is called from the bookmarklet
        boot: function () {
            if (!loaded) {
                load();
            } else if (!initialized) {
                init();
            } else if (!running) {
                jQuery(window).mouseup(translateListener);
                running = true;
            } else if (running) {
                var m = jQuery(document.createElement('div'))
                            .attr('id', 'gotGreek-menu')
                            .text('GotGreek is Stopping...');
                jQuery('body').append(m);
                jQuery(window).unbind('mouseup', translateListener);
                running = false;
                m.fadeOut(1000, function () {
                    if (config.usePowerTip) {
                        jQuery('#powerTip').remove();
                        if (currentRange !== null) {
                            cssApplier.undoToRange(currentRange);
                        }
                    } else {
                        jQuery('#gotGreek-box').remove();
                    }
                    m.remove();
                });
            }
        }
    };
}();
