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


var Medium = (function (w, d) {

    'use strict';

    var trim = function (string) {
            return string.replace(/^\s+|\s+$/g, '');
        },
    //two modes, wild (native) or domesticated (rangy + undo.js)
        rangy = w['rangy'] || null,
        undo = w['Undo'] || null,
        wild = (!rangy || !undo),
        domesticated = (!wild),
        key = w.Key = {
            'backspace': 8,
            'tab': 9,
            'enter': 13,
            'shift': 16,
            'ctrl': 17,
            'alt': 18,
            'pause': 19,
            'capsLock': 20,
            'escape': 27,
            'pageUp': 33,
            'pageDown': 34,
            'end': 35,
            'home': 36,
            'leftArrow': 37,
            'upArrow': 38,
            'rightArrow': 39,
            'downArrow': 40,
            'insert': 45,
            'delete': 46,
            '0': 48,
            '1': 49,
            '2': 50,
            '3': 51,
            '4': 52,
            '5': 53,
            '6': 54,
            '7': 55,
            '8': 56,
            '9': 57,
            'a': 65,
            'b': 66,
            'c': 67,
            'd': 68,
            'e': 69,
            'f': 70,
            'g': 71,
            'h': 72,
            'i': 73,
            'j': 74,
            'k': 75,
            'l': 76,
            'm': 77,
            'n': 78,
            'o': 79,
            'p': 80,
            'q': 81,
            'r': 82,
            's': 83,
            't': 84,
            'u': 85,
            'v': 86,
            'w': 87,
            'x': 88,
            'y': 89,
            'z': 90,
            'leftWindow': 91,
            'rightWindowKey': 92,
            'select': 93,
            'numpad0': 96,
            'numpad1': 97,
            'numpad2': 98,
            'numpad3': 99,
            'numpad4': 100,
            'numpad5': 101,
            'numpad6': 102,
            'numpad7': 103,
            'numpad8': 104,
            'numpad9': 105,
            'multiply': 106,
            'add': 107,
            'subtract': 109,
            'decimalPoint': 110,
            'divide': 111,
            'f1': 112,
            'f2': 113,
            'f3': 114,
            'f4': 115,
            'f5': 116,
            'f6': 117,
            'f7': 118,
            'f8': 119,
            'f9': 120,
            'f10': 121,
            'f11': 122,
            'f12': 123,
            'numLock': 144,
            'scrollLock': 145,
            'semiColon': 186,
            'equalSign': 187,
            'comma': 188,
            'dash': 189,
            'period': 190,
            'forwardSlash': 191,
            'graveAccent': 192,
            'openBracket': 219,
            'backSlash': 220,
            'closeBraket': 221,
            'singleQuote': 222
        },

        /**
         * Medium.js - Taking control of content editable
         * @constructor
         * @param {Object} [userSettings] user options
         */
         Medium = function (userSettings) {
            var medium = this,
                action = new Medium.Action(),
                cache = new Medium.Cache(),
                cursor = new Medium.Cursor(),
                html = new Medium.HtmlAssistant(),
                utils = new Medium.Utilities(),
                selection = new Medium.Selection(),
                intercept = {
                    focus: function (e) {
                        e = e || w.event;
                        Medium.activeElement = el;
                    },
                    blur: function (e) {
                        e = e || w.event;
                        if (Medium.activeElement === el) {
                            Medium.activeElement = null;
                        }

                        html.placeholders();
                    },
                    down: function (e) {
                        e = e || w.event;

                        utils.isCommand(e, function () {
                            cache.cmd = true;
                        }, function () {
                            cache.cmd = false;
                        });

                        utils.isShift(e, function () {
                            cache.shift = true;
                        }, function () {
                            cache.shift = false;
                        });

                        utils.isModifier(e, function (cmd) {
                            if (cache.cmd) {

                                if (( (settings.mode === "inline") || (settings.mode === "partial") ) && cmd !== "paste") {
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

                                fn.call(intercept, e);
                            }
                        });

                        if (settings.maxLength !== -1) {
                            var len = html.text().length,
                                hasSelection = false,
                                selection = w.getSelection();

                            if (selection) {
                                hasSelection = !selection.isCollapsed;
                            }

                            if (len >= settings.maxLength && !utils.isSpecial(e) && !utils.isNavigational(e) && !hasSelection) {
                                return utils.preventDefaultEvent(e);
                            }
                        }

                        switch (e.keyCode) {
                            case key['enter']:
                                intercept.enterKey(e);
                                break;
                            case key['backspace']:
                            case key['delete']:
                                intercept.backspaceOrDeleteKey(e);
                                break;
                        }

                        return true;
                    },
                    up: function (e) {
                        e = e || w.event;
                        utils.isCommand(e, function () {
                            cache.cmd = false;
                        }, function () {
                            cache.cmd = true;
                        });
                        html.clean();
                        html.placeholders();

                        //here we have a key context, so if you need to create your own object within a specific context it is doable
                        var keyContext;
                        if (
                            settings.keyContext !== null
                                && ( keyContext = settings.keyContext[e.keyCode] )
                            ) {
                            var el = cursor.parent();

                            if (el) {
                                keyContext.call(medium, e, el);
                            }
                        }

                        action.preserveElementFocus();
                    },
                    command: {
                        bold: function (e) {
                            utils.preventDefaultEvent(e);
                            // IE uses strong instead of b
                            (new Medium.Element(medium, 'bold'))
                                .setClean(false)
                                .invoke(settings.beforeInvokeElement);
                        },
                        underline: function (e) {
                            utils.preventDefaultEvent(e);
                            (new Medium.Element(medium, 'underline'))
                                .setClean(false)
                                .invoke(settings.beforeInvokeElement);
                        },
                        italicize: function (e) {
                            utils.preventDefaultEvent(e);
                            (new Medium.Element(medium, 'italic'))
                                .setClean(false)
                                .invoke(settings.beforeInvokeElement);
                        },
                        quote: function (e) {
                        },
                        paste: function (e) {
                            if (settings.pasteAsText) {
                                var sel = utils.selection.saveSelection();
                                utils.pasteHook(function (text) {
                                    utils.selection.restoreSelection(sel);

                                    (new Medium.Html(medium, text.replace(/\n/g, '<br>')))
                                        .setClean(false)
                                        .insert(settings.beforeInsertHtml);

                                });
                            }
                        }
                    },
                    enterKey: function (e) {
                        if( settings.mode === "inline" || settings.mode === Medium.inlineRichMode ){
                            return utils.preventDefaultEvent(e);
                        }

                        if (!cache.shift) {

                            var focusedElement = html.atCaret() || {},
                                children = el.children,
                                lastChild = focusedElement === el.lastChild ? el.lastChild : null,
                                makeHR,
                                secondToLast;

                            if (
                                lastChild
                                    && lastChild !== el.firstChild
                                    && settings.autoHR
                                    && settings.mode !== 'partial'
                                    && settings.tags.horizontalRule
                                ) {

                                utils.preventDefaultEvent(e);

                                makeHR =
                                    html.text(lastChild) === ""
                                        && lastChild.nodeName.toLowerCase() === settings.tags.paragraph;

                                if (makeHR && children.length >= 2) {
                                    secondToLast = children[ children.length - 2 ];

                                    if (secondToLast.nodeName.toLowerCase() === settings.tags.horizontalRule) {
                                        makeHR = false;
                                    }
                                }

                                if (makeHR) {
                                    html.deleteNode(lastChild);
                                    html.addTag(settings.tags.horizontalRule, false, false, focusedElement);
                                    focusedElement = focusedElement.nextSibling;
                                }
                                html.addTag(settings.tags.paragraph, true, null, focusedElement);
                            }
                        }

                        return true;
                    },
                    backspaceOrDeleteKey: function (e) {
                        if (el.lastChild === null) return;

                        var lastChild = el.lastChild,
                            beforeLastChild = lastChild.previousSibling;

                        if (
                            lastChild
                                && settings.tags.horizontalRule
                                && lastChild.nodeName.toLocaleLowerCase() === settings.tags.horizontalRule
                            ) {
                            el.removeChild(lastChild);
                        } else if (
                            lastChild
                                && beforeLastChild
                                && utils.html.text(lastChild).length < 1

                                && beforeLastChild.nodeName.toLowerCase() === settings.tags.horizontalRule
                                && lastChild.nodeName.toLowerCase() === settings.tags.paragraph
                            ) {
                            el.removeChild(lastChild);
                            el.removeChild(beforeLastChild);
                        }
                    }
                },
                defaultSettings = {
                    debug: true,
                    element: null,
                    modifier: 'auto',
                    placeholder: "",
                    autofocus: false,
                    autoHR: true,
                    mode: Medium.richMode,
                    maxLength: -1,
                    modifiers: {
                        'b': 'bold',
                        'i': 'italicize',
                        'u': 'underline',
                        'p': 'paste'
                    },
                    tags: {
                        'break': 'br',
                        'horizontalRule': 'hr',
                        'paragraph': 'p',
                        'outerLevel': ['pre', 'blockquote', 'figure'],
                        'innerLevel': ['a', 'b', 'u', 'i', 'img', 'strong']
                    },
                    cssClasses: {
                        editor: 'Medium',
                        pasteHook: 'Medium-paste-hook',
                        placeholder: 'Medium-placeholder',
                        clear: 'Medium-clear'
                    },
                    attributes: {
                        remove: ['style', 'class']
                    },
                    pasteAsText: true,
                    beforeInvokeElement: function () {
                        //this = Medium.Element
                    },
                    beforeInsertHtml: function () {
                        //this = Medium.Html
                    },
                    beforeAddTag: function (tag, shouldFocus, isEditable, afterElement) {
                    },
                    keyContext: null
                },
                settings = utils.deepExtend(defaultSettings, userSettings),
                el,
                newVal,
                i,
                bridge = {};

            for (i in defaultSettings) {
                // Override defaults with data-attributes
                if (
                    typeof defaultSettings[i] !== 'object'
                        && defaultSettings.hasOwnProperty(i)
                        && settings.element.getAttribute('data-medium-' + key)
                    ) {
                    newVal = settings.element.getAttribute('data-medium-' + key);

                    if (newVal.toLowerCase() === "false" || newVal.toLowerCase() === "true") {
                        newVal = newVal.toLowerCase() === "true";
                    }
                    settings[i] = newVal;
                }
            }

            if (settings.modifiers) {
                for (i in settings.modifiers) {
                    if (typeof(key[i]) !== 'undefined') {
                        settings.modifiers[key[i]] = settings.modifiers[i];
                    }
                }
            }

            if (settings.keyContext) {
                for (i in settings.keyContext) {
                    if (typeof(key[i]) !== 'undefined') {
                        settings.keyContext[key[i]] = settings.keyContext[i];
                    }
                }
            }

            // Extend Settings
            el = settings.element;

            // Editable
            el.contentEditable = true;
            el.className
                += (' ' + settings.cssClasses.editor)
                + (' ' + settings.cssClasses.editor + '-' + settings.mode);

            settings.tags = (settings.tags || {});
            if (settings.tags.outerLevel) {
                settings.tags.outerLevel = settings.tags.outerLevel.concat([settings.tags.paragraph, settings.tags.horizontalRule]);
            }

            this.settings = settings;
            this.element = el;
            this.intercept = intercept;

            this.action = action;
            this.cache = cache;
            this.cursor = cursor;
            this.html = html;
            this.utils = utils;
            this.selection = selection;

            bridge.element = el;
            bridge.medium = this;
            bridge.settings = settings;

            bridge.action = action;
            bridge.cache = cache;
            bridge.cursor = cursor;
            bridge.html = html;
            bridge.intercept = intercept;
            bridge.utils = utils;
            bridge.selection = selection;

            action.setBridge(bridge);
            cache.setBridge(bridge);
            cursor.setBridge(bridge);
            html.setBridge(bridge);
            utils.setBridge(bridge);
            selection.setBridge(bridge);

            // Initialize editor
            html.clean();
            html.placeholders();
            action.preserveElementFocus();

            // Capture Events
            action.listen();

            if (wild) {
                this.makeUndoable = function () {
                };
            } else {
                this.dirty = false;
                this.undoable = new Medium.Undoable(this);
                this.undo = this.undoable.undo;
                this.redo = this.undoable.redo;
                this.makeUndoable = this.undoable.makeUndoable;
            }

            el.medium = this;

            // Set as initialized
            cache.initialized = true;
        };

    Medium.prototype = {
        /**
         *
         * @param {String|Object} html
         * @param {Function} [callback]
         * @returns {Medium}
         */
        insertHtml: function (html, callback) {
            var result = (new Medium.Html(this, html))
                .insert(this.settings.beforeInsertHtml);

            this.utils.triggerEvent(this.element, "change");

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
        invokeElement: function (tagName, attributes) {
            (new Medium.Element(this, tagName, attributes))
                .invoke(this.settings.beforeInvokeElement);

            this.utils.triggerEvent(this.element, "change");

            return this;
        },

        /**
         * @returns {string}
         */
        behavior: function () {
            return (wild ? 'wild' : 'domesticated');
        },

        /**
         *
         * @param value
         * @returns {Medium}
         */
        value: function (value) {
            if (typeof value !== 'undefined') {
                this.element.innerHTML = value;
            } else {
                return this.element.innerHTML;
            }

            return this;
        },

        /**
         * Focus on element
         * @returns {Medium}
         */
        focus: function () {
            var el = this.element;
            el.focus();
            return this;
        },

        /**
         * Select all text
         * @returns {Medium}
         */
        select: function () {
            var el = this.element,
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
        },

        isActive: function () {
            return (Medium.activeElement === this.element);
        },

        destroy: function () {
            var el = this.element,
                intercept = this.intercept,
                settings = this.settings,
                placeholder = this.placeholder || null;

            if (placeholder !== null && placeholder.setup) {
                //remove placeholder
                placeholder.parentNode.removeChild(placeholder);
            }

            //remove contenteditable
            el.removeAttribute('contenteditable');

            //remove classes
            el.className = trim(el.className
                .replace(settings.cssClasses.editor, '')
                .replace(settings.cssClasses.clear, '')
                .replace(settings.cssClasses.editor + '-' + settings.mode, ''));

            //remove events
            this.utils
                .removeEvent(el, 'keyup', intercept.up)
                .removeEvent(el, 'keydown', intercept.down)
                .removeEvent(el, 'focus', intercept.focus)
                .removeEvent(el, 'blur', intercept.focus);
        },

        // Clears the element and restores the placeholder
        clear: function () {
            this.element.innerHTML = '';
            this.html.placeholders();
        }
    };

    /**
     * @param {Medium} medium
     * @param {String} tagName
     * @param {Object} [attributes]
     * @constructor
     */
    Medium.Element = function (medium, tagName, attributes) {
        this.medium = medium;
        this.element = medium.settings.element;
        if (wild) {
            this.tagName = tagName;
        } else {
            switch (tagName.toLowerCase()) {
                case 'bold':
                    this.tagName = 'b';
                    break;
                case 'italic':
                    this.tagName = 'i';
                    break;
                case 'underline':
                    this.tagName = 'u';
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
    Medium.Html = function (medium, html) {
        this.medium = medium;
        this.element = medium.settings.element;
        this.html = html;
        this.clean = true;
    };

    /**
     *
     * @constructor
     */
    Medium.Injector = function () {
    };

    if (wild) {
        Medium.Element.prototype = {
            /**
             * @methodOf Medium.Element
             * @param {Function} [fn]
             */
            invoke: function (fn) {
                if (Medium.activeElement === this.element) {
                    if (fn) {
                        fn.apply(this);
                    }
                    d.execCommand(this.tagName, false);
                }
            },
            setClean: function () {
                return this;
            }
        };

        Medium.Injector.prototype = {
            /**
             * @methodOf Medium.Injector
             * @param {String|HtmlElement} htmlRaw
             * @returns {null}
             */
            inject: function (htmlRaw) {
                this.insertHTML(htmlRaw);
                return null;
            }
        };

        /**
         *
         * @constructor
         */
        Medium.Undoable = function () {
        };
    }

    //if medium is domesticated (ie, not wild)
    else {
        rangy.rangePrototype.insertNodeAtEnd = function (node) {
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
            invoke: function (fn) {
                if (Medium.activeElement === this.element) {
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
                        this.medium.html.clean();
                        this.medium.html.placeholders();
                    }


                }
            },

            /**
             *
             * @param {Boolean} clean
             * @returns {Medium.Element}
             */
            setClean: function (clean) {
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
            inject: function (htmlRaw) {
                var html, isConverted = false;
                if (typeof htmlRaw === 'string') {
                    var htmlConverter = d.createElement('div');
                    htmlConverter.innerHTML = htmlRaw;
                    html = htmlConverter.childNodes;
                    isConverted = true;
                } else {
                    html = htmlRaw;
                }

                this.insertHTML('<span id="wedge"></span>');

                var wedge = d.getElementById('wedge'),
                    parent = wedge.parentNode,
                    i = 0;
                wedge.removeAttribute('id');

                if (isConverted) {
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
        Medium.Undoable = function (medium) {
            var me = this,
                element = medium.settings.element,
                utils = medium.utils,
                addEvent = utils.addEvent,
                startValue = element.innerHTML,
                timer,
                stack = new Undo.Stack(),
                EditCommand = Undo.Command.extend({
                    constructor: function (oldValue, newValue) {
                        this.oldValue = oldValue;
                        this.newValue = newValue;
                    },
                    execute: function () {
                    },
                    undo: function () {
                        element.innerHTML = this.oldValue;
                        medium.canUndo = stack.canUndo();
                        medium.canRedo = stack.canRedo();
                        medium.dirty = stack.dirty();
                    },
                    redo: function () {
                        element.innerHTML = this.newValue;
                        medium.canUndo = stack.canUndo();
                        medium.canRedo = stack.canRedo();
                        medium.dirty = stack.dirty();
                    }
                }),
                makeUndoable = function () {
                    var newValue = element.innerHTML;
                    // ignore meta key presses
                    if (newValue != startValue) {

                        if (!me.movingThroughStack) {
                            // this could try and make a diff instead of storing snapshots
                            stack.execute(new EditCommand(startValue, newValue));
                            startValue = newValue;
                            medium.dirty = stack.dirty();
                        }

                        utils.triggerEvent(medium.settings.element, "change");
                    }
                };

            this.medium = medium;
            this.timer = timer;
            this.stack = stack;
            this.makeUndoable = makeUndoable;
            this.EditCommand = EditCommand;
            this.movingThroughStack = false;

            addEvent(element, 'keyup', function (e) {
                if (e.ctrlKey || e.keyCode === key.z) {
                    utils.preventDefaultEvent(e);
                    return;
                }

                // a way too simple algorithm in place of single-character undo
                clearTimeout(timer);
                timer = setTimeout(function () {
                    makeUndoable();
                }, 250);
            });

            addEvent(element, 'keydown', function (e) {
                if (!e.ctrlKey || e.keyCode !== key.z) {
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
    Medium.Injector.prototype.insertHTML = function (html, selectPastedContent) {
        var sel, range;
        if (w.getSelection) {
            // IE9 and non-IE
            sel = w.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                var el = d.createElement("div");
                el.innerHTML = html;
                var frag = d.createDocumentFragment(), node, lastNode;
                while ((node = el.firstChild)) {
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
        } else if ((sel = d.selection) && sel.type != "Control") {
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
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        },
        /**
         * @methodOf Medium.Html
         * @param {Function} [fn]
         * @returns {HtmlElement}
         */
        insert: function (fn) {
            if (Medium.activeElement === this.element) {
                if (fn) {
                    fn.apply(this);
                }

                var inserted = this.injector.inject(this.html);

                if (this.clean) {
                    //cleanup
                    this.medium.html.clean();
                    this.medium.html.placeholders();
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
        setClean: function (clean) {
            this.clean = clean;
            return this;
        }
    };

    Medium.Utilities = function () {
    };
    Medium.Utilities.prototype = {
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        },
        /*
         * Keyboard Interface events
         */
        isCommand: function (e, fnTrue, fnFalse) {
            var s = this.settings;
            if ((s.modifier === 'ctrl' && e.ctrlKey ) ||
                (s.modifier === 'cmd' && e.metaKey ) ||
                (s.modifier === 'auto' && (e.ctrlKey || e.metaKey) )
                ) {
                return fnTrue.call();
            } else {
                return fnFalse.call();
            }
        },
        isShift: function (e, fnTrue, fnFalse) {
            if (e.shiftKey) {
                return fnTrue.call();
            } else {
                return fnFalse.call();
            }
        },
        isModifier: function (e, fn) {
            var cmd = this.settings.modifiers[e.keyCode];
            if (cmd) {
                return fn.call(null, cmd);
            }
            return false;
        },
        special: (function () {
            var special = {};

            special[key['backspace']] = true;
            special[key['shift']] = true;
            special[key['ctrl']] = true;
            special[key['alt']] = true;
            special[key['delete']] = true;
            special[key['cmd']] = true;

            return special;
        })(),
        isSpecial: function (e) {

            if (this.cache.cmd) {
                return true;
            }

            return typeof this.special[e.keyCode] !== 'undefined';
        },
        navigational: (function () {
            var navigational = {};

            navigational[key['upArrow']] = true;
            navigational[key['downArrow']] = true;
            navigational[key['leftArrow']] = true;
            navigational[key['rightArrow']] = true;

            return navigational;
        })(),
        isNavigational: function (e) {
            return typeof this.navigational[e.keyCode] !== 'undefined';
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
        triggerEvent: function (element, eventName) {
            var e;
            if (d.createEvent) {
                e = d.createEvent("HTMLEvents");
                e.initEvent(eventName, true, true);
                e.eventName = eventName;
                element.dispatchEvent(e);
            } else {
                e = d.createEventObject();
                element.fireEvent("on" + eventName, e);
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
                    this.deepExtend(destination[property], source[property]);
                } else {
                    destination[property] = source[property];
                }
            }
            return destination;
        },
        /*
         * This is a Paste Hook. When the user pastes
         * content, this ultimately converts it into
         * plain text before inserting the data.
         */
        pasteHook: function (fn) {
            var textarea = d.createElement('textarea'),
                el = this.element,
                existingValue,
                existingLength,
                overallLength,
                s = this.settings,
                medium = this.medium,
                html = this.html;

            textarea.className = s.cssClasses.pasteHook;

            el.parentNode.appendChild(textarea);

            textarea.focus();

            if (!wild) {
                medium.makeUndoable();
            }
            setTimeout(function () {
                el.focus();
                if (s.maxLength > 0) {
                    existingValue = html.text(el);
                    existingLength = existingValue.length;
                    overallLength = existingLength + textarea.value.length;
                    if (overallLength > existingLength) {
                        textarea.value = textarea.value.substring(0, s.maxLength - existingLength);
                    }
                }
                fn(textarea.value);
                //utils.html.deleteNode( textarea );
            }, 2);
        },
        setupContents: function () {
            var el = this.element,
                children = el.children,
                childNodes = el.childNodes,
                initialParagraph;

            if (
	            !this.settings.tags.paragraph
                || children.length > 0
				|| this.settings.mode === Medium.inlineMode
				|| this.settings.mode === Medium.inlineRichMode
			) {
                return;
            }

            //has content, but no children
            if (childNodes.length > 0) {
                initialParagraph = d.createElement(this.settings.tags.paragraph);
                initialParagraph.innerHTML = el.innerHTML + '&nbsp;';
                el.innerHTML = '';
                el.appendChild(initialParagraph);
            } else {
                initialParagraph = d.createElement(this.settings.tags.paragraph);
                initialParagraph.innerHTML = '&nbsp;';
                el.appendChild(initialParagraph);
            }
        }
    };

    /*
     * Handle Selection Logic
     */
    Medium.Selection = function () {
    };
    Medium.Selection.prototype = {
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        },
        saveSelection: function () {
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

        restoreSelection: function (range) {
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
    };

    /*
     * Handle Cursor Logic
     */
    Medium.Cursor = function () {
    };
    Medium.Cursor.prototype = {
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        },
        set: function (pos, el) {
            var range,
                html = this.html;

            if (d.createRange) {
                var selection = w.getSelection(),
                    lastChild = html.lastChild(),
                    length = html.text(lastChild).length - 1,
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
        },
        parent: function () {
            var target = null, range;

            if (w.getSelection) {
                range = w.getSelection().getRangeAt(0);
                target = range.commonAncestorContainer;

                target = (target.nodeType === 1
                    ? target
                    : target.parentNode
                    );
            }

            else if (d.selection) {
                target = d.selection.createRange().parentElement();
            }

            if (target.tagName == 'SPAN') {
                target = target.parentNode;
            }

            return target;
        },
        caretToBeginning: function (el) {
            this.set(0, el);
        },
        caretToEnd: function (el) {
            this.set(this.html.text(el).length, el);
        }
    };

    /*
     * HTML Abstractions
     */
    Medium.HtmlAssistant = function () {
    };
    Medium.HtmlAssistant.prototype = {
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        },
        text: function (node, val) {
            node = node || this.settings.element;
            if (val) {
                if ((node.textContent) && (typeof (node.textContent) != "undefined")) {
                    node.textContent = val;
                } else {
                    node.innerText = val;
                }
            }

            else if (node.innerText) {
                return trim(node.innerText);
            }

            else if (node.textContent) {
                return trim(node.textContent);
            }
            //document fragment
            else if (node.data) {
                return trim(node.data);
            }

            //for good measure
            return '';
        },
        changeTag: function (oldNode, newTag) {
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
        deleteNode: function (el) {
            el.parentNode.removeChild(el);
        },
        placeholders: function () {
            //in IE8, just gracefully degrade to no placeholders
            if (!w.getComputedStyle) return;

            var that = this,
                s = this.settings,
                placeholder = this.medium.placeholder || (this.medium.placeholder = d.createElement('div')),
                el = s.element,
                style = placeholder.style,
                elStyle = w.getComputedStyle(el, null),
                qStyle = function (prop) {
                    return elStyle.getPropertyValue(prop)
                },
                utils = this.utils,
                text = utils.html.text(el),
                cursor = this.cursor,
                childCount = el.children.length;

            el.placeholder = placeholder;

            // Empty Editor
            if (text.length < 1 && childCount < 2) {
                if (el.placeHolderActive) return;

                if (!el.innerHTML.match('<' + s.tags.paragraph)) {
                    el.innerHTML = '';
                }

                // We need to add placeholders
                if (s.placeholder.length > 0) {
                    if (!placeholder.setup) {
                        placeholder.setup = true;

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
                        style.borderTopWidth = qStyle('border-top-width');
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
                        placeholder.className = s.cssClasses.placeholder + ' ' + s.cssClasses.placeholder + '-' + s.mode;
                        placeholder.innerHTML = '<div>' + s.placeholder + '</div>';
                        el.parentNode.insertBefore(placeholder, el);
                    }

                    el.className += ' ' + s.cssClasses.clear;

                    style.display = '';
                    // Add base P tag and do auto focus, give it a min height if el has one
                    style.minHeight = el.clientHeight + 'px';
                    style.minWidth = el.clientWidth + 'px';

                    if ( s.mode !== Medium.inlineMode && s.mode !== Medium.inlineRichMode ) {
                        utils.setupContents();

                        if (childCount === 0 && el.firstChild) {
                            cursor.set(0, el.firstChild);
                        }
                    }
                }
                el.placeHolderActive = true;
            } else if (el.placeHolderActive) {
                el.placeHolderActive = false;
                style.display = 'none';
                el.className = trim(el.className.replace(s.cssClasses.clear, ''));
                utils.setupContents();
            }
        },
        clean: function () {

            /*
             * Deletes invalid nodes
             * Removes Attributes
             */
            var s = this.settings,
                attsToRemove = s.attributes.remove,
                only = s.tags.outerLevel || null,
                el = s.element,
                children = el.children,
                i,
                j,
                k;

            if (s.mode === Medium.inlineRichMode) {
                only = s.tags.innerLevel;
            }

            // Go through top level children
            for (i = 0; i < children.length; i++) {
                var child = children[i],
                    nodeName = child.nodeName,
                    shouldDelete = true;

                // Remove attributes
                for (k = 0; k < attsToRemove.length; k++) {
                    if (child.hasAttribute(attsToRemove[k])) {
                        if (child.getAttribute(attsToRemove[k]) !== s.cssClasses.placeholder) {
                            child.removeAttribute(attsToRemove[k]);
                        }
                    }
                }

                if (only === null) {
                    return;
                }

                // Determine if we should modify node
                for (j = 0; j < only.length; j++) {
                    if (only[j] === nodeName.toLowerCase()) {
                        shouldDelete = false;
                    }
                }

                // Convert tags or delete
                if (shouldDelete) {
                    switch (nodeName.toLowerCase()) {
                        case 'div':
                            this.html.changeTag(child, s.tags.paragraph);
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
                            this.html.deleteNode(child);
                            break;
                    }
                }
            }
        },
        lastChild: function () {
            return this.element.lastChild;
        },
        addTag: function (tag, shouldFocus, isEditable, afterElement) {
            if (!this.settings.beforeAddTag(tag, shouldFocus, isEditable, afterElement)) {
                var newEl = d.createElement(tag),
                    toFocus;

                if (typeof isEditable !== "undefined" && isEditable === false) {
                    newEl.contentEditable = false;
                }
                if (newEl.innerHTML.length == 0) {
                    newEl.innerHTML = ' ';
                }
                if (afterElement && afterElement.nextSibling) {
                    afterElement.parentNode.insertBefore(newEl, afterElement.nextSibling);
                    toFocus = afterElement.nextSibling;

                } else {
                    this.settings.element.appendChild(newEl);
                    toFocus = this.html.lastChild();
                }

                if (shouldFocus) {
                    this.cache.focusedElement = toFocus;
                    this.cursor.set(0, toFocus);
                }
                return newEl;
            }
            return null;
        },
        baseAtCaret: function () {
            if (!this.medium.isActive()) return null;

            var sel = window.getSelection();

            if (sel.rangeCount) {
                var selRange = sel.getRangeAt(0),
                    container = selRange.endContainer;

                switch (container.nodeType) {
                    case 3:
                        if (container.data && container.data.length != selRange.endOffset) return false;
                        break;
                }

                return container;
            }

            return null;
        },
        atCaret: function () {
            var container = this.baseAtCaret() || {},
                el = this.element;

            if (container === false) return null;

            while (container && container.parentNode !== el) {
                container = container.parentNode;
            }

            if (container && container.nodeType == 1) {
                return container;
            }

            return null;
        }
    };

    Medium.Action = function () {
    };
    Medium.Action.prototype = {
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        },
        listen: function () {
            var el = this.element,
                intercept = this.intercept;

            this.utils
                .addEvent(el, 'keyup', intercept.up)
                .addEvent(el, 'keydown', intercept.down)
                .addEvent(el, 'focus', intercept.focus)
                .addEvent(el, 'blur', intercept.blur);
        },
        preserveElementFocus: function () {
            // Fetch node that has focus
            var anchorNode = w.getSelection ? w.getSelection().anchorNode : d.activeElement;
            if (anchorNode) {
                var cache = this.medium.cache,
                    s = this.settings,
                    cur = anchorNode.parentNode,
                    children = s.element.children,
                    diff = cur !== cache.focusedElement,
                    elementIndex = 0,
                    i;

                // anchorNode is our target if element is empty
                if (cur === s.element) {
                    cur = anchorNode;
                }

                // Find our child index
                for (i = 0; i < children.length; i++) {
                    if (cur === children[i]) {
                        elementIndex = i;
                        break;
                    }
                }

                // Focused element is different
                if (diff) {
                    cache.focusedElement = cur;
                    cache.focusedElementIndex = elementIndex;
                }
            }
        }
    };

    Medium.Cache = function () {
        this.initialized = false;
        this.cmd = false;
        this.focusedElement = null
    };
    Medium.Cache.prototype = {
        setBridge: function (bridge) {
            for (var i in bridge) {
                this[i] = bridge[i];
            }
        }
    };

	//Modes;
	Medium.inlineMode = 'inline';
	Medium.partialMode = 'partial';
	Medium.richMode = 'rich';
    Medium.inlineRichMode = 'inlineRich';

    return Medium;
}).call(this, window, document);
