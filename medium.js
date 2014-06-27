/*
 * Medium.js
 *
 * Copyright 2013, Jacob Kelley - http://jakiestfu.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/jakiestfu/Medium.js/
 * Version: 1.0
 */


(function(w, d, Math){

    'use strict';
    
    /*
     * Fix IE
     */
    if( typeof String.prototype.trim !== 'function' ){
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        }
    }


    var
        //two modes, wild (native) or domesticated (rangy + undo.js)
        rangy = w['rangy'] || null,
        undo = w['Undo'] || null,
	    wild = (!rangy || !undo),
	    domesticated = (!wild),

        /**
         * Medium.js - Taking control of content editable
         * @constructor
         * @param {Object} [userOpts] user options
         */
	    Medium = Medium || function (userOpts) {
            var
                me = this,
                settings = {
                    debug: true,
                    element: null,
                    modifier: 'auto',
                    placeholder: "",
                    autofocus: false,
                    autoHR: true,
                    mode: 'rich', // inline, partial, rich
                    maxLength: -1,
                    modifiers: {
                        66: 'bold',
                        73: 'italicize',
                        85: 'underline',
                        86: 'paste'
                    },
                    tags: {
                        paragraph: 'p',
                        outerLevel: ['pre','blockquote', 'figure', 'hr'],
                        innerLevel: ['a', 'b', 'u', 'i', 'img', 'strong'] // Todo: Convert strong to b (IE)
                    },
                    cssClasses: {
                        editor: 'Medium',
                        pasteHook: 'Medium-paste-hook',
                        placeholder: 'Medium-placeholder'
                    },
                    attributes: {
                        remove: ['style','class']
                    },
                    pasteAsText: true,
                    beforeInvokeElement: function() {},
                    beforeInsertHtml: function() {},
                    beforeAddTag: function(tag, shouldFocus, isEditable, afterElement) {}
                },
                cache = {
                    initialized: false,
                    cmd: false,
                    focusedElement: null
                },
                _log = function (w) {
                    if (settings.debug) {
                        console.log(w);
                    }
                },
                utils = {
                    /*
                     * Keyboard Interface events
                     */
                    isCommand: function(e, fnTrue, fnFalse){
                        if((settings.modifier==='ctrl' && e.ctrlKey ) ||
                           (settings.modifier==='cmd' && e.metaKey ) ||
                           (settings.modifier==='auto' && (e.ctrlKey || e.metaKey) )
                        ){
                            return fnTrue.call();
                        } else {
                            return fnFalse.call();
                        }
                    },
                    isShift: function(e, fnTrue, fnFalse){
                        if(e.shiftKey){
                            return fnTrue.call();
                        } else {
                            return fnFalse.call();
                        }
                    },
                    isModifier: function(e, fn){
                        var w = e.keyCode,
                            cmd = settings.modifiers[w];
                        if(cmd){
                            return fn.call(null, cmd);
                        }
                        return false;
                    },
                    isSpecial: function(e){
                        var special = {
                            16: 'shift',
                            17: 'ctrl',
                            18: 'alt',
                            91: 'cmd',
                            8: 'backspace',
                            46: 'delete'
                        };
                        if(cache.cmd){ return true; }
                        return (e.keyCode in special);
                    },
                    isNavigational: function(e) {
                        var navigational = {
                            37: 'right-arrow',
                            38: 'up-arrow',
                            39: 'left-arrow',
                            40: 'down-arrow'
                        };
                        return (e.keyCode in navigational);
                    },

                    /*
                     * Handle Events
                     */
                    addEvent: function addEvent(element, eventName, func) {
                        if (element.addEventListener) {
                            element.addEventListener(eventName, func, false);
                        } else if (element.attachEvent) {
                            element.attachEvent("on" + eventName, func);
                        } else {
                            element['on' + eventName] = func;
                        }

                        return this;
                    },
                    removeEvent: function removeEvent(element, eventName, func) {
                        if (element.removeEventListener) {
                            element.removeEventListener(eventName, func, false);
                        } else if (element.detachEvent) {
                            element.detachEvent("on" + eventName, func);
                        } else {
                            element['on' + eventName] = null;
                        }

                        return this;
                    },
                    preventDefaultEvent: function (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;
                        }

                        return this;
                    },
                    triggerEvent: function(element, eventName) {
                        var event;
                        if (d.createEvent) {
                            event = d.createEvent("HTMLEvents");
                            event.initEvent(eventName, true, true);
                            event.eventName = eventName;
                            element.dispatchEvent(event);
                        } else {
                            event = d.createEventObject();
                            event.eventType = eventName;
                            event.eventName = eventName;
                            element.fireEvent("on" + event.eventType, event);
                        }

                        return this;
                    },

                    deepExtend: function (destination, source) {
                        for (var property in source) {
                            if (
                                source[property]
                                && source[property].constructor
                                && source[property].constructor === Object
                            ) {
                                destination[property] = destination[property] || {};
                                utils.deepExtend(destination[property], source[property]);
                            } else {
                                destination[property] = source[property];
                            }
                        }
                        return destination;
                    },

                    /*
                     * Handle Selection Logic
                     */
                    selection: {
                        saveSelection: function() {
                            if (w.getSelection) {
                                var sel = w.getSelection();
                                if (sel.rangeCount > 0) {
                                      return sel.getRangeAt(0);
                                }
                            } else if (d.selection && d.selection.createRange) { // IE
                                return d.selection.createRange();
                            }
                            return null;
                        },

                        restoreSelection: function(range) {
                            if (range) {
                                if (w.getSelection) {
                                    var sel = w.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                } else if (d.selection && range.select) { // IE
                                    range.select();
                                }
                            }
                        }
                    },

                    /*
                     * Handle Cursor Logic
                     */
                    cursor: {
                        set: function (pos, el) {
                            var range;
                            if( d.createRange ){
                                var selection = w.getSelection(),
                                    lastChild = utils.html.lastChild(),
                                    length =  utils.html.text(lastChild).length-1,
                                    toModify = el ? el : lastChild,
                                    theLength = typeof pos !== 'undefined' ? pos : length;

                                range = d.createRange();
                                range.setStart(toModify, theLength);
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            } else {
                                range = d.body.createTextRange();
                                range.moveToElementText(el);
                                range.collapse(false);
                                range.select();
                            }
                        }
                    },

                    /*
                     * HTML Abstractions
                     */
                    html: {
                        text: function(node, val){
                            node = node || settings.element;
                            if(val){
                                if ((node.textContent) && (typeof (node.textContent) != "undefined")) {
                                    node.textContent = val;
                                } else {
                                    node.innerText = val;
                                }
                            }

                            else if (node.innerText) {
                                return node.innerText.trim();
                            }
                            else if (node.textContent) {
                                return node.textContent.trim();
                            }
                            //document fragment
                            else if (node.data) {
                                return node.data.trim();
                            }

                            //for good measure
                            return '';
                        },
                        changeTag: function(oldNode, newTag) {
                            var newNode = d.createElement(newTag),
                                node,
                                nextNode;

                            node = oldNode.firstChild;
                            while (node) {
                                nextNode = node.nextSibling;
                                newNode.appendChild(node);
                                node = nextNode;
                            }

                            oldNode.parentNode.insertBefore(newNode, oldNode);
                            oldNode.parentNode.removeChild(oldNode);
                        },
                        deleteNode: function(el){
                            el.parentNode.removeChild(el);
                        },
                        placeholders: function(){
                            var that = this,
                                placeholder = me._placeholder || (me._placeholder = d.createElement('div')),
                                el = settings.element,
                                style = placeholder.style,
                                elStyle = w.getComputedStyle(el, null),
                                qStyle = function(prop) {
                                    return elStyle.getPropertyValue(prop)
                                },
                                text = utils.html.text(el);

                            el.placeholder = placeholder;

                            // Empty Editor
                            if( text.length < 1 ){
                                settings.element.innerHTML = '';

                                // We need to add placeholders
                                if(settings.placeholder.length > 0){
                                    if (!placeholder.setup) {
                                        placeholder.setup = true;
                                        utils
                                            .addEvent(el, 'blur', function() {
                                                that.placeholders();
                                            });


                                        //background & background color
                                        style.background = qStyle('background');
                                        style.backgroundColor = qStyle('background-color');

                                        //text size & text color
                                        style.fontSize = qStyle('font-size');
                                        style.color = elStyle.color;

                                        //begin box-model
                                        //margin
                                        style.marginTop = qStyle('margin-top');
                                        style.marginBottom = qStyle('margin-bottom');
                                        style.marginLeft = qStyle('margin-left');
                                        style.marginRight = qStyle('margin-right');

                                        //padding
                                        style.paddingTop = qStyle('padding-top');
                                        style.paddingBottom = qStyle('padding-bottom');
                                        style.paddingLeft = qStyle('padding-left');
                                        style.paddingRight = qStyle('padding-right');

                                        //border
                                        style.borderStyle = qStyle('border-top-width');
                                        style.borderTopColor = qStyle('border-top-color');
                                        style.borderTopStyle = qStyle('border-top-style');
                                        style.borderBottomWidth = qStyle('border-bottom-width');
                                        style.borderBottomColor = qStyle('border-bottom-color');
                                        style.borderBottomStyle = qStyle('border-bottom-style');
                                        style.borderLeftWidth = qStyle('border-left-width');
                                        style.borderLeftColor = qStyle('border-left-color');
                                        style.borderLeftStyle = qStyle('border-left-style');
                                        style.borderRightWidth = qStyle('border-right-width');
                                        style.borderRightColor = qStyle('border-right-color');
                                        style.borderRightStyle = qStyle('border-right-style');
                                        //end box model

                                        //element setup
                                        placeholder.className = settings.cssClasses.placeholder + ' ' + settings.cssClasses.placeholder + "-" + settings.mode;
                                        placeholder.innerHTML = '<div>' + settings.placeholder + '</div>';
                                        el.parentNode.insertBefore(placeholder, el);
                                    }
                                    el.style.background = 'transparent';
                                    el.style.backgroundColor = 'transparent';
                                    el.style.borderColor = 'transparent';
                                    style.display = '';
                                    // Add base P tag and do auto focus, give it a min height if el has one
                                    style.minHeight = el.clientHeight + 'px';
                                    style.minWidth = el.clientWidth + 'px';
                                }
                            } else {
                                style.display = 'none';
                                el.style.background = style.background;
                                el.style.backgroundColor = style.backgroundColor;
                                el.style.borderColor = style.borderColor;
                            }
                        },
                        clean: function () {

                            /*
                             * Deletes invalid nodes
                             * Removes Attributes
                             */
                            var attsToRemove = settings.attributes.remove,
                                only = settings.tags.outerLevel,
                                el = settings.element,
                                children = el.children,
                                i,
                                j,
                                k;

                            // Go through top level children
                            for(i=0; i<children.length; i++){
                                var child = children[i],
                                    nodeName = child.nodeName,
                                    shouldDelete = true;

                                // Remove attributes
                                for(k=0; k<attsToRemove.length; k++){
                                    if( child.hasAttribute( attsToRemove[k] ) ){
                                        if( child.getAttribute( attsToRemove[k] ) !== settings.cssClasses.placeholder ){
                                            child.removeAttribute( attsToRemove[k] );
                                        }
                                    }
                                }

                                if (only === null) {
                                    return;
                                }

                                // Determine if we should modify node
                                for(j=0; j<only.length;j++){
                                    if( only[j] === nodeName.toLowerCase() ){
                                        shouldDelete = false;
                                    }
                                }

                                // Convert tags or delete
                                if(shouldDelete){
                                    switch( nodeName.toLowerCase() ){
                                        case 'div':
                                            utils.html.changeTag(child, settings.tags.paragraph);
                                            break;
                                        case 'br':
                                            if (child === child.parentNode.lastChild) {
                                                if (child === child.parentNode.firstChild) {
                                                    break;
                                                }
                                                var text = document.createTextNode("");
                                                text.innerHTML = '&nbsp';
                                                child.parentNode.insertBefore(text, child);
                                                break;
                                            }
                                        default:
                                            utils.html.deleteNode(child);
                                            break;
                                    }
                                }
                            }
                        },
                        lastChild: function () {
                            return settings.element.lastChild;
                        },
                        addTag: function (tag, shouldFocus, isEditable, afterElement) {
                            if (!settings.beforeAddTag(tag, shouldFocus, isEditable, afterElement)) {
                                var newEl = d.createElement(tag),
                                    toFocus;

                                if( typeof isEditable !== "undefined" && isEditable === false ){
                                    newEl.contentEditable = false;
                                }
                                if (newEl.innerHTML.length == 0) {
                                    newEl.innerHTML = ' ';
                                }
                                if( afterElement && afterElement.nextSibling ){
                                    afterElement.parentNode.insertBefore( newEl, afterElement.nextSibling );
                                    toFocus = afterElement.nextSibling;

                                } else {
                                    settings.element.appendChild(newEl);
                                    toFocus = utils.html.lastChild();
                                }

                                if( shouldFocus ){
                                    cache.focusedElement = toFocus;
                                    utils.cursor.set( 0, toFocus );
                                }
                                return newEl;
                            }
                            return null;
                        }
                    },

                    /*
                     * This is a Paste Hook. When the user pastes
                     * content, this ultimately converts it into
                     * plain text before inserting the data.
                     */
                    pasteHook: function(fn){
                        var textarea = d.createElement('textarea'),
                            el = settings.element,
                            existingValue,
                            existingLength,
                            overallLength;

                        textarea.className = settings.cssClasses.pasteHook;

                        el.parentNode.appendChild(textarea);

                        textarea.focus();

                        if (!wild) {
                            me.makeUndoable();
                        }
                        setTimeout(function(){
                            el.focus();
                            if (settings.maxLength > 0) {
                                existingValue = utils.html.text(el);
                                existingLength = existingValue.length;
                                overallLength = existingLength + textarea.value.length;
                                if (overallLength > existingLength) {
                                    textarea.value = textarea.value.substring(0, settings.maxLength - existingLength);
                                }
                            }
                            fn(textarea.value);
                            //utils.html.deleteNode( textarea );
                        }, 2);
                    },
                    setupContents: function() {
                        var el = settings.element,
                            children = el.children,
                            childNodes = el.childNodes,
                            initialParagraph;

                        if (
                            children.length > 0
                            || settings.mode === Medium.inlineMode
                        ) {
                            return;
                        }

                        //has content, but no children
                        if (childNodes.length > 0) {
                            initialParagraph = d.createElement(settings.tags.paragraph);
                            initialParagraph.innerHTML = el.innerHTML + '&nbsp;';
                            el.innerHTML = '';
                            el.appendChild(initialParagraph);
                        } else {
                            initialParagraph = d.createElement(settings.tags.paragraph);
                            initialParagraph.innerHTML = '&nbsp;';
                            el.appendChild(initialParagraph);
                        }
                    }
                },
                intercept = {
                    focus: function(e){
                        e = e || w.event;
                        //_log('FOCUSED');
                    },
                    down: function(e){
                        e = e || w.event;

                        utils.isCommand(e, function(){
                            cache.cmd = true;
                        }, function(){
                            cache.cmd = false;
                        });

                        utils.isShift(e, function(){
                            cache.shift = true;
                        }, function(){
                            cache.shift = false;
                        });

                        utils.isModifier(e, function(cmd){
                            if( cache.cmd ){

                                if( ( (settings.mode === "inline") || (settings.mode === "partial") ) && cmd !== "paste" ){
                                    utils.preventDefaultEvent(e);
                                    return;
                                }

                                var cmdType = typeof cmd;
                                var fn = null;
                                if (cmdType === "function") {
                                    fn = cmd;
                                } else {
                                    fn = intercept.command[cmd];
                                }

                                fn.call(null, e);
                            }
                        });

                        if( settings.maxLength !== -1 ){
                            var len = utils.html.text().length,
                                hasSelection = false,
                                selection = w.getSelection();

                            if(selection) {
                                hasSelection = !selection.isCollapsed;
                            }

                            if( len >= settings.maxLength && !utils.isSpecial(e) && !utils.isNavigational(e) && !hasSelection ){
                                return utils.preventDefaultEvent(e);
                            }
                            _log(len+'/'+settings.maxLength);
                        }

                        if( e.keyCode === 13 ){
                            intercept.enterKey.call(null, e);
                        }

                        return true;
                    },
                    up: function(e){
                        e = e || w.event;
                        utils.isCommand(e, function(){
                            cache.cmd = false;
                        }, function(){
                            cache.cmd = true;
                        });
                        utils.html.clean();
                        utils.html.placeholders();
                        action.preserveElementFocus();
                    },
                    command: {
                        bold: function(e){
                            utils.preventDefaultEvent(e);
                            // IE uses strong instead of b
                            (new Medium.Element(me, 'bold'))
                                .setClean(false)
                                .invoke(settings.beforeInvokeElement);
                            _log('Bold');
                        },
                        underline: function(e){
                            utils.preventDefaultEvent(e);
                            (new Medium.Element(me, 'underline'))
                                .setClean(false)
                                .invoke(settings.beforeInvokeElement);
                            _log('Underline');
                        },
                        italicize: function(e){
                            utils.preventDefaultEvent(e);
                            (new Medium.Element(me, 'italic'))
                                .setClean(false)
                                .invoke(settings.beforeInvokeElement);
                            _log('Italic');
                        },
                        quote: function(e){},
                        paste: function(e){
                            if (settings.pasteAsText) {
                                var sel = utils.selection.saveSelection();
                                utils.pasteHook(function(text){
                                    utils.selection.restoreSelection( sel );

                                    (new Medium.Html(me, text.replace(/\n/g, '<br>')))
                                        .setClean(false)
                                        .insert(settings.beforeInsertHtml);

                                    _log('Html');
                                });
                            }
                        }
                    },
                    enterKey: function (e) {
                        if( settings.mode === "inline" ){
                            return utils.preventDefaultEvent(e);
                        }

                        if( !cache.shift ){

                            var focusedElement = cache.focusedElement,
                                el = settings.element,
                                children = el.children,
                                lastChild = children[ Math.max(0, children.length - 1) ],
                                makeHR,
                                secondToLast;

                            if( lastChild && settings.autoHR && settings.mode !== 'partial' ){

                                utils.preventDefaultEvent(e);

                                makeHR =
                                    ( utils.html.text(lastChild) === "" )
                                    && ( lastChild.nodeName.toLowerCase() === settings.tags.paragraph );

                                if( makeHR && children.length >=2 ){
                                    secondToLast = children[ children.length-2 ];

                                    if( secondToLast.nodeName.toLowerCase() === "hr" ){
                                        makeHR = false;
                                    }
                                }

                                if( makeHR ){
                                    utils.preventDefaultEvent(e);
                                    utils.html.deleteNode( lastChild );
                                    utils.html.addTag('hr', false, false, focusedElement);
                                    focusedElement = focusedElement.nextSibling;
                                }
                                utils.html.addTag(settings.tags.paragraph, true, null, focusedElement);
                            } else {
                                utils.html.addTag(settings.tags.paragraph, true, null, focusedElement);
                            }
                        }

                        return true;
                    }
                },
                action = {
                    listen: function () {
                        var el = settings.element;
                        utils
                            .addEvent(el, 'keyup', intercept.up)
                            .addEvent(el, 'keydown', intercept.down)
                            .addEvent(el, 'focus', intercept.focus);
                    },
                    preserveElementFocus: function(){
                        // Fetch node that has focus
                        var anchorNode = w.getSelection ? w.getSelection().anchorNode : d.activeElement;
                        if(anchorNode){
                            var cur = anchorNode.parentNode,
                                children = settings.element.children,
                                diff = cur !== cache.focusedElement,
                                elementIndex = 0,
                                i;

                            // anchorNode is our target if element is empty
                            if (cur===settings.element){
                                cur = anchorNode;
                            }

                            // Find our child index
                            for(i=0;i<children.length;i++){
                                if(cur === children[i]){
                                    elementIndex = i;
                                    break;
                                }
                            }

                            // Focused element is different
                            if( diff ){
                                cache.focusedElement = cur;
                                cache.focusedElementIndex = elementIndex;
                            }
                        }
                    }
                },
                init = function (opts) {
                    var key, el, newVal;

                    for(key in settings){

                        // Override defaults with data-attributes
                        if(
                            typeof settings[key] !== 'object'
                            && settings.hasOwnProperty(key)
                            && opts.element.getAttribute('data-medium-'+key)
                        ){
                            newVal = opts.element.getAttribute('data-medium-'+key);

                            if( newVal.toLowerCase()==="false" || newVal.toLowerCase()==="true" ){
                                newVal = newVal.toLowerCase()==="true";
                            }
                            settings[key] = newVal;
                        }
                    }

                    // Extend Settings
                    utils.deepExtend(settings, opts);
                    el = settings.element;

                    // Editable
                    el.contentEditable = true;
                    el.className
                        += (" " + settings.cssClasses.editor)
                        + (" " + settings.cssClasses.editor + "-" + settings.mode);

                    if (settings.tags.outerLevel !== null) {
                        settings.tags.outerLevel = (settings.tags.outerLevel).concat([settings.tags.paragraph]);
                    }

                    // Initialize editor
                    utils.html.clean();
                    utils.html.placeholders();
                    action.preserveElementFocus();

                    // Capture Events
                    action.listen();

                    utils.setupContents();

                    // Set as initialized
                    cache.initialized = true;
                };

            this.destroy = function(){
                var el = settings.element;
                utils
                    .removeEvent(el, 'keyup', intercept.up)
                    .removeEvent(el, 'keydown', intercept.down)
                    .removeEvent(el, 'focus', intercept.focus)
                    .removeEvent(el, 'blur')
                    .removeEvent(el, 'mouseout');
            };

            // Sets or returns the content of element
            this.val = function(content){
                // Set content if content is provided
                if( typeof (content) != "undefined") {
                    settings.element.innerHTML = content;
                    utils.html.placeholders();
                    return content;
                }

                return settings.element.innerHTML;
            };

            // Clears the element and restores the placeholder
            this.clear = function(){
                settings.element.innerHTML = '';
                utils.html.placeholders();
            };

            init(userOpts);

            this.settings = settings;
            this.utils = utils;
            this.cache = cache;
            this.intercept = intercept;

            if (wild) {
                this.makeUndoable = function() {};
            } else {
                this.dirty = false;
                this.undoable = new Medium.Undoable(this);
                this.undo = this.undoable.undo;
                this.redo = this.undoable.redo;
                this.makeUndoable = this.undoable.makeUndoable;
            }
        };

    Medium.prototype = {
        /**
         *
         * @param {String|Object} htmlRaw
         * @param {Function} [callback]
         * @returns {Medium}
         */
        insertHtml: function(htmlRaw, callback) {
            var result = (new Medium.Html(this, htmlRaw))
                .insert(this.settings.beforeInsertHtml);

            this.utils.triggerEvent(this.settings.element, "change");

            if (callback) {
                callback.apply(result);
            }

            return this;
        },

        /**
         *
         * @param {String} tagName
         * @param {Object} [attributes]
         * @returns {Medium}
         */
        invokeElement: function(tagName, attributes) {
            (new Medium.Element(this, tagName, attributes))
                .invoke(this.settings.beforeInvokeElement);

            this.utils.triggerEvent(this.settings.element, "change");

            return this;
        },

        /**
         * @returns {string}
         */
        behavior: function() {
            return (wild ? 'wild' : 'domesticated');
        },

        /**
         *
         * @param value
         * @returns {Medium}
         */
        value: function(value) {
            if (typeof value !== 'undefined') {
                this.settings.element.innerHTML = value;
            } else {
                return this.settings.element.innerHTML;
            }

            return this;
        },

        /**
         * Focus on element
         * @returns {Medium}
         */
        focus: function() {
            var el = this.settings.element;
            el.focus();
            return this;
        },

        /**
         * Select all text
         * @returns {Medium}
         */
        select: function() {
            var el = this.settings.element,
                range,
                selection;

            el.focus();

            if (d.body.createTextRange) {
                range = d.body.createTextRange();
                range.moveToElementText(el);
                range.select();
            } else if (w.getSelection) {
                selection = w.getSelection();
                range = d.createRange();
                range.selectNodeContents(el);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            return this;
        }
    };

    /**
     * @param {Medium} medium
     * @param {String} tagName
     * @param {Object} [attributes]
     * @constructor
     */
    Medium.Element = function(medium, tagName, attributes) {
        this.medium = medium;
        this.element = medium.settings.element;
        if (wild) {
            this.tagName = tagName;
        } else {
            switch (tagName.toLowerCase()) {
                case 'bold': this.tagName = 'b';
                    break;
                case 'italic': this.tagName = 'i';
                    break;
                case 'underline': this.tagName = 'u';
                    break;
                default:
                    this.tagName = tagName;
            }
        }
        this.attributes = attributes || {};
        this.clean = true;
    };


    /**
     * @constructor
     * @param {Medium} medium
     * @param {String|HtmlElement} html
     */
    Medium.Html = function(medium, html) {
        this.medium = medium;
        this.element = medium.settings.element;
        this.html = html;
        this.clean = true;
    };

    /**
     *
     * @constructor
     */
    Medium.Injector = function() {};

    if (wild) {
        Medium.Element.prototype = {
            /**
             * @methodOf Medium.Element
             * @param {Function} [fn]
             */
            invoke: function(fn) {
                if (d.activeElement === this.element) {
                    if (fn) {
                        fn.apply(this);
                    }
                    d.execCommand(this.tagName, false);
                }
            },
            setClean: function() {
                return this;
            }
        };

        Medium.Injector.prototype = {
            /**
             * @methodOf Medium.Injector
             * @param {String|HtmlElement} htmlRaw
             * @returns {null}
             */
            inject: function(htmlRaw) {
                this.insertHTML(htmlRaw);
                //d.execCommand('insertHtml', false, htmlRaw);
                return null;
            }
        };

        /**
         *
         * @constructor
         */
        Medium.Undoable = function() {};
    }

    //if medium is domesticated (ie, not wild)
    else {
        rangy.rangePrototype.insertNodeAtEnd = function(node) {
            var range = this.cloneRange();
            range.collapse(false);
            range.insertNode(node);
            range.detach();
            this.setEndAfter(node);
        };

        Medium.Element.prototype = {
            /**
             * @methodOf Medium.Element
             * @param {Function} [fn]
             */
            invoke: function(fn) {
                if (d.activeElement === this.element) {
                    if (fn) {
                        fn.apply(this);
                    }

                    var
                        attr = this.attributes,
                        tagName = this.tagName.toLowerCase(),
                        cl = (attr.className ? attr.className.split[' '].shift() : 'medium-' + tagName),
                        applier;

                    applier = rangy.createCssClassApplier(cl, {
                        elementTagName: tagName,
                        elementAttributes: this.attributes
                    });

                    this.medium.makeUndoable();

                    applier.toggleSelection(w);

                    if (this.clean) {
                        //cleanup
                        this.medium.utils.html.clean();
                        this.medium.utils.html.placeholders();
                    }


                }
            },

            /**
             *
             * @param {Boolean} clean
             * @returns {Medium.Element}
             */
            setClean: function(clean) {
                this.clean = clean;
                return this;
            }
        };

        Medium.Injector.prototype = {
            /**
             * @methodOf Medium.Injector
             * @param {String|HtmlElement} htmlRaw
             * @returns {HtmlElement}
             */
            inject: function(htmlRaw) {
                var html;
                if (typeof htmlRaw === 'string') {
                    var htmlConverter = d.createElement('div');
                    htmlConverter.innerHTML = htmlRaw;
                    html = htmlConverter.childNodes;
                    html.isConverted = true;
                } else {
                    html = htmlRaw;
                }

               this.insertHTML('<span id="wedge"></span>');
                //d.execCommand('insertHtml', false, );

                var wedge = d.getElementById('wedge'),
                    parent = wedge.parentNode,
                    i = 0;
                wedge.removeAttribute('id');

                if (html.isConverted) {
                    while (i < html.length) {
                        parent.insertBefore(html[i], wedge);
                    }
                } else {
                    parent.insertBefore(html, wedge);
                }
                parent.removeChild(wedge);
                wedge = null;

                return html;
            }
        };

        /**
         * @param {Medium} medium
         * @constructor
         */
        Medium.Undoable = function(medium) {
            var me = this,
                element = medium.settings.element,
                utils = medium.utils,
                addEvent = utils.addEvent,
                startValue = element.innerHTML,
                timer,
                stack = new Undo.Stack(),
                EditCommand = Undo.Command.extend({
                    constructor: function(oldValue, newValue) {
                        this.oldValue = oldValue;
                        this.newValue = newValue;
                    },
                    execute: function() {},
                    undo: function() {
                        element.innerHTML = this.oldValue;
                        medium.canUndo = stack.canUndo();
                        medium.canRedo = stack.canRedo();
                        medium.dirty = stack.dirty();
                    },
                    redo: function() {
                        element.innerHTML = this.newValue;
                        medium.canUndo = stack.canUndo();
                        medium.canRedo = stack.canRedo();
                        medium.dirty = stack.dirty();
                    }
                }),
                makeUndoable = function() {
                    var newValue = element.innerHTML;
                    // ignore meta key presses
                    if (newValue != startValue) {

                        if (!me.movingThroughStack) {
                            // this could try and make a diff instead of storing snapshots
                            stack.execute(new EditCommand(startValue, newValue));
                            startValue = newValue;
                            medium.dirty = stack.dirty();
                        }

                        medium.utils.triggerEvent(medium.settings.element, "change");
                    }
                };

            this.medium = medium;
            this.timer = timer;
            this.stack = stack;
            this.makeUndoable = makeUndoable;
            this.EditCommand = EditCommand;
            this.movingThroughStack = false;

            addEvent(element, 'keyup', function(e) {
                if (e.ctrlKey || e.keyCode === 90) {
                    utils.preventDefaultEvent(e);
                    return;
                }

                // a way too simple algorithm in place of single-character undo
                clearTimeout(timer);
                timer = setTimeout(function() {
                    makeUndoable();
                }, 250);
            });

            addEvent(element, 'keydown', function(e) {
                if (!e.ctrlKey || e.keyCode !== 90) {
                    me.movingThroughStack = false;
                    return true;
                }

                utils.preventDefaultEvent(e);

                me.movingThroughStack = true;

                if (e.shiftKey) {
                    stack.canRedo() && stack.redo()
                } else {
                    stack.canUndo() && stack.undo();
                }
            });
        };
    }

    //Thank you Tim Down (super uber genius): http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div/6691294#6691294
    Medium.Injector.prototype.insertHTML = function(html,selectPastedContent) {
        var sel, range;
        if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                var el = document.createElement("div");
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while ( (node = el.firstChild) ) {
                    lastNode = frag.appendChild(node);
                }
                var firstNode = frag.firstChild;
                range.insertNode(frag);

                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    if (selectPastedContent) {
                        range.setStartBefore(firstNode);
                    } else {
                        range.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if ( (sel = document.selection) && sel.type != "Control") {
            // IE < 9
            var originalRange = sel.createRange();
            originalRange.collapse(true);
            sel.createRange().pasteHTML(html);
            if (selectPastedContent) {
                range = sel.createRange();
                range.setEndPoint("StartToStart", originalRange);
                range.select();
            }
        }
    };

    Medium.Html.prototype = {
        /**
         * @methodOf Medium.Html
         * @param {Function} [fn]
         * @returns {HtmlElement}
         */
        insert: function(fn) {
            if (d.activeElement === this.element) {
                if (fn) {
                    fn.apply(this);
                }

                var inserted = this.injector.inject(this.html);

                if (this.clean) {
                    //cleanup
                    this.medium.utils.html.clean();
                    this.medium.utils.html.placeholders();
                }

                this.medium.makeUndoable();

                return inserted;
            } else {
                return null;
            }
        },

        /**
         * @attributeOf {Medium.Injector} Medium.Html
         */
        injector: new Medium.Injector(),

        /**
         * @methodOf Medium.Html
         * @param clean
         * @returns {Medium.Html}
         */
        setClean: function(clean) {
            this.clean = clean;
            return this;
        }
    };

    // Exports and modularity
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Medium;
    }

    if (typeof ender === 'undefined') {
        this.Medium = Medium;
    }

    if (typeof define === "function" && define.amd) {
        define('Medium', [], function () { 
            return Medium; 
        });
    }

	//Modes;
	Medium.inlineMode = 'inline';
	Medium.partialMode = 'partial';
	Medium.richMode = 'rich';

}).call(this, window, document, Math);
