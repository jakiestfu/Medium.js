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


(function(undefined){

    'use strict';
    
    var Medium = Medium || (function (w, d) {

        var settings = {
            debug: true,
            element: null,
            modifier: 'auto',
            keys: {
                66: 'bold',
                73: 'italicize',
                85: 'underline',
                86: 'paste'
            },
            tags: {
                paragraph: 'p',
                outerLevel: ['pre','blockquote', 'figure', 'hr'],
                innerLevel: ['a', 'b', 'u', 'i', 'img']
            },
            cssClasses: {
                editor: 'Medium',
                pasteHook: 'Medium-paste-hook',
            }
        },
        cache = {
            cmd: false,
            focusedElement: null
        },
        _log = function (w) {
            if (settings.debug) {
                console.log(w);
            }
        },
        utils = {
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
            isModifier: function(e, fn){
                var w = e.which,
                    cmd = settings.keys[w];
                if(cmd){
                    return fn.call(null, cmd);
                }
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
            cursor: {
                set: function (pos, el) {
                    var range = d.createRange(),
                        selection = w.getSelection(),
                        lastChild = utils.html.lastChild(),
                        length =  lastChild.innerText.length-1,
                        toModify = el ? el : lastChild,
                        theLength = typeof pos !== 'undefined' ? pos : length;
                    _log(['Element: ',toModify]);
                    _log(['Len: ',theLength]);
                    range.setStart(toModify, theLength);
                    selection.removeAllRanges();
                    selection.addRange(range);
                },
                get: function() {
                    var element = settings.element,
                        caretOffset = 0,
                        doc = element.ownerDocument || element.document,
                        win = doc.defaultView || doc.parentWindow,
                        sel;
                    if (typeof win.getSelection != "undefined") {
                        var range = win.getSelection().getRangeAt(0),
                            preCaretRange = range.cloneRange();
                        preCaretRange.selectNodeContents(element);
                        preCaretRange.setEnd(range.endContainer, range.endOffset);
                        caretOffset = preCaretRange.toString().length;
                    } else if ( (sel = doc.selection) && sel.type != "Control") {
                        var textRange = sel.createRange(),
                            preCaretTextRange = doc.body.createTextRange();
                        preCaretTextRange.moveToElementText(element);
                        preCaretTextRange.setEndPoint("EndToEnd", textRange);
                        caretOffset = preCaretTextRange.text.length;
                    }
                    return caretOffset;
                }
            },
            html: {
                changeTag: function(oldNode, newTag) {
                    var newNode = document.createElement(newTag),
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
                clean: function () {
                    
                    /*
                     * Insert nodes if necessary
                     */
                    if( settings.element.innerHTML.trim() === "" ){
                        utils.html.addTag(settings.tags.paragraph, true);
                    }
                    
                    /*
                     * Deletes invalid nodes
                     * Removes Attributes
                     */
                    var attsToRemove = ['style','class'],
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
                                child.removeAttribute( attsToRemove[k] );
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
                            //utils.cursor.set();
                        }
                    }
                },
                lastChild: function () {
                    return settings.element.lastChild;
                },
                addTag: function (tag, shouldFocus, isEditable) {
                    var newEl = d.createElement(tag);

                    if( typeof isEditable !== "undefined" && isEditable === false ){
                        newEl.contentEditable = false;
                    }
                    settings.element.appendChild(newEl);
                    
                    var lastChild = utils.html.lastChild();
                    
                    if( shouldFocus ){
                        utils.cursor.set( 0, lastChild );
                    }
                    
                }
            },
            pasteHook: function(fn){
                var input = d.createElement('textarea');
                input.className = settings.cssClasses.pasteHook;
                settings.element.appendChild(input);
                var pasteHookNode = d.getElementsByClassName( settings.cssClasses.pasteHook )[0];
                pasteHookNode.focus();
                setTimeout(function(){
                    var v = pasteHookNode.value;
                    fn.call(null, v);
                    utils.html.deleteNode( pasteHookNode );
                }, 1);
            },
        },
        intercept = {
            down: function(e){
                utils.isCommand(e, function(){
                    cache.cmd = true;
                }, function(){
                    cache.cmd = false;
                });
                utils.isModifier(e, function(cmd){
                    if( cache.cmd ){
                        intercept.command[cmd].call(null, e);
                    }
                });
                if( e.which==13 ){
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
                var children = settings.element.children,
                    lastChild = children[ children.length-1 ],
                    makeHR = (lastChild.innerText.trim() ==="") && (lastChild.nodeName.toLowerCase() === "p");
                
                if( makeHR && children.length >=2 ){
                    var secondToLast = children[ children.length-2 ];
                    
                    if( secondToLast.nodeName.toLowerCase() === "hr" ){
                        makeHR = false;
                    }
                }

                if( makeHR ){
                    utils.preventDefaultEvent(e);
                    _log('Replacing with HR');
                    utils.html.deleteNode( lastChild );
                    utils.html.addTag('hr', false, false);
                    utils.html.addTag(settings.tags.paragraph, true);
                }
            },
            
        },
        action = {
            listen: function () {
                utils.addEvent(settings.element, 'keyup', intercept.up);
                utils.addEvent(settings.element, 'keydown', intercept.down);
            },
            preserveElementFocus: function(){
                var cur = window.getSelection().anchorNode.parentNode,
                    children = settings.element.children,
                    diff = cur !== cache.focusedElement,
                    elementIndex = 0,
                    i;
                
                for(i=0;i<children.length;i++){
                    if(cur==children[i]){
                        elementIndex = i;
                        break;
                    }
                }
                if( diff ){
                    _log('Changing Element Focus');
                    cache.focusedElement = cur;
                    cache.focusedElementIndex = elementIndex;
                }
            }
        },
        initialize = function (opts) {
            utils.deepExtend(settings, opts);
    
            settings.element.contentEditable = true;
            settings.element.className = settings.cssClasses.editor;
            utils.html.clean();
            action.preserveElementFocus();
            
            action.listen();
        };
    
        return {
            init: initialize
        };
    
    }).call(this, window, document);

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

}).call(this);
