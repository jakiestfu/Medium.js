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


(function(w, d){

    'use strict';
    
    /*
     * Fix IE shit
     */
    if( typeof String.prototype.trim !== 'function' ){
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        }
    }

    var Medium = Medium || function (userOpts) {

        var 
        
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
            }
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
                var w = e.which,
                    cmd = settings.modifiers[w];
                if(cmd){
                    return fn.call(null, cmd);
                }
            },
            isNotSpecial: function(e){
                var special = {
                    16: 'shift',
                    17: 'ctrl',
                    18: 'alt',
                    91: 'cmd',
                    8: 'delete'
                };
                if(cache.cmd){ return false; }
                return !(e.which in special);
            },
            
            /*
             * Handle Events
             */
            addEvent: function addEvent(element, eventName, func) {
                if (element.addEventListener) {
                    element.addEventListener(eventName, func, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + eventName, func);
                }
            },
            removeEvent: function addEvent(element, eventName, func) {
                if (element.addEventListener) {
                    element.removeEventListener(eventName, func, false);
                } else if (element.attachEvent) {
                    element.detachEvent("on" + eventName, func);
                }
            },
            preventDefaultEvent: function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
            },
            
            /*
             * Utilities
             */
            getElementsByClassName: function(classname, el) {
                el = el ? el : document.body;
                var a = [],
                    re = new RegExp('(^| )'+classname+'( |$)'),
                    els = el.getElementsByTagName("*");
                for(var i=0,j=els.length; i<j; i++){
                    if(re.test(els[i].className)){
                        a.push(els[i]);
                    }
                }
                return a;
            },
            
            deepExtend: function (destination, source) {
                for (var property in source) {
                    if (source[property] && source[property].constructor && source[property].constructor === Object) {
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
                    if( d.createRange ){
                        var range = d.createRange(),
                            selection = w.getSelection(),
                            lastChild = utils.html.lastChild(),
                            length =  utils.html.text(lastChild).length-1,
                            toModify = el ? el : lastChild,
                            theLength = typeof pos !== 'undefined' ? pos : length;
                        range.setStart(toModify, theLength);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        var range = d.body.createTextRange();
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
                    return (node.textContent || node.innerText).trim();
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
                
                    
                    
                    var placeholders = utils.getElementsByClassName(settings.cssClasses.placeholder, settings.element),
                        innerText = utils.html.text(settings.element);
                    
                    // Empty Editer
                    if( innerText === ""  ){
                        settings.element.innerHTML = '';
                        
                        // We need to add placeholders
                        if(settings.placeholder.length > 0){ 
                            utils.html.addTag(settings.tags.paragraph, false, false);
                            var c = utils.html.lastChild();
                            c.className = settings.cssClasses.placeholder;
                            utils.html.text(c, settings.placeholder);
                        }
                        
                        // Add base P tag and do autofocus
                        utils.html.addTag(settings.tags.paragraph, cache.initialized ? true : settings.autofocus);
                    } else {
                        if(innerText !== settings.placeholder){
                            var i;
                            for(i=0; i<placeholders.length; i++){
                                utils.html.deleteNode(placeholders[i]);
                            }
                        }
                    }
                },
                clean: function () {

                    /*
                     * Deletes invalid nodes
                     * Removes Attributes
                     */
                    var attsToRemove = settings.attributes.remove,
                        only = (settings.tags.outerLevel).concat([settings.tags.paragraph]),
                        children = settings.element.children,
                        i, j, k;
                    
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
                    var newEl = d.createElement(tag),
                        toFocus;

                    if( typeof isEditable !== "undefined" && isEditable === false ){
                        newEl.contentEditable = false;
                    }
                    newEl.innerHTML = ' ';
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
                    
                }
            },
            
            /*
             * This is a Paste Hook. When the user pastes
             * content, this ultimately converts it into
             * plain text nefore inserting the data.
             */
            pasteHook: function(fn){
                var input = d.createElement('textarea');
                input.className = settings.cssClasses.pasteHook;
                settings.element.appendChild(input);
                var pasteHookNode = utils.getElementsByClassName( settings.cssClasses.pasteHook, settings.element )[0];
                pasteHookNode.focus();
                setTimeout(function(){
                    var v = pasteHookNode.value;
                    fn.call(null, v);
                    utils.html.deleteNode( pasteHookNode );
                }, 1);
            }
        },
        intercept = {
            focus: function(e){
                //_log('FOCUSED');
            },
            down: function(e){
                
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
                            return;
                        }
                        
                        intercept.command[cmd].call(null, e);
                    }
                });
                
                if( settings.maxLength !== -1 ){
                    var ph = settings.element.getElementsByClassName(settings.cssClasses.placeholder)[0],
                        len = utils.html.text().length;
                        
                    if(settings.placeholder && ph){
                        len -= settings.placeholder.length;
                    }
                    if( len >= settings.maxLength && utils.isNotSpecial(e) ){
                        return utils.preventDefaultEvent(e);
                    }
                    _log(len+'/'+settings.maxLength);
                }
                
                if( e.which === 13 ){
                    intercept.enterKey.call(null, e);
                }
            },
            up: function(e){
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
                    d.execCommand( 'bold', false ); _log('Bold');
                },
                underline: function(e){
                    utils.preventDefaultEvent(e);
                    d.execCommand( 'underline', false ); _log('Underline');                
                },
                italicize: function(e){
                    utils.preventDefaultEvent(e);
                    d.execCommand( 'italic', false ); _log('Italic');
                },
                quote: function(e){},
                paste: function(e){
                    var sel = utils.selection.saveSelection();
                    utils.pasteHook(function(text){
                        utils.selection.restoreSelection( sel );
                        d.execCommand('insertHTML', false, text.replace(/\n/g, '<br>') );
                    });
                }
            },
            enterKey: function (e) {
            
                if( settings.mode === "inline" ){
                    return utils.preventDefaultEvent(e);
                }

                if( !cache.shift ){
                    
                    utils.preventDefaultEvent(e);
                    
                    var focusedElement = cache.focusedElement;
                    
                    if( settings.autoHR && settings.mode !== 'partial' ){
                        var children = settings.element.children,
                            lastChild = children[ children.length-1 ],
                            makeHR = ( utils.html.text(lastChild) === "" ) && (lastChild.nodeName.toLowerCase() === settings.tags.paragraph );
                        
                        if( makeHR && children.length >=2 ){
                            var secondToLast = children[ children.length-2 ];
                            
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
            }
        },
        action = {
            listen: function () {
                utils.addEvent(settings.element, 'keyup', intercept.up);
                utils.addEvent(settings.element, 'keydown', intercept.down);
                utils.addEvent(settings.element, 'focus', intercept.focus);
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
        
            for(var key in settings){
                
                // Override defaults with data-attributes
                if( typeof settings[key] !== 'object' && settings.hasOwnProperty(key) && opts.element.getAttribute('data-medium-'+key) ){
                    var newVal = opts.element.getAttribute('data-medium-'+key);
                    
                    if( newVal.toLowerCase()==="false" || newVal.toLowerCase()==="true" ){
                        newVal = newVal.toLowerCase()==="true";
                    }
                    settings[key] = newVal;
                }
            }
        
            // Extend Settings
            utils.deepExtend(settings, opts);
    
            // Editable
            settings.element.contentEditable = true;
            settings.element.className += (" ")+settings.cssClasses.editor;
            settings.element.className += (" ")+settings.cssClasses.editor+"-"+settings.mode;
            
            // Initialize editor
            utils.html.clean();
            utils.html.placeholders();
            action.preserveElementFocus();
            
            // Capture Events
            action.listen();
            
            // Set as initialized
            cache.initialized = true;
        };
        
        this.destroy = function(){
            utils.removeEvent(settings.element, 'keyup', intercept.up);
            utils.removeEvent(settings.element, 'keydown', intercept.down);
            utils.removeEvent(settings.element, 'focus', intercept.focus);
        };
        
        init(userOpts);
    
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

}).call(this, window, document);
