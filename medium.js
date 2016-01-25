/*
 * Medium.js - Taking control of content editable
 * Copyright 2013-2015, Jacob Kelley - http://jakiestfu.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/jakiestfu/Medium.js/
 * Version: master
 */

(function (w, d) {
	'use strict';

	var rangy = w['rangy'] || null,
		undo = w['Undo'] || null,
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
			'closeBracket': 221,
			'singleQuote': 222
		},
		Medium = (function () {

			/**
 * Medium.js - Taking control of content editable
 * @constructor
 * @param {Object} [userSettings] user options
 */
var Medium = function (userSettings) {
	"use strict";

	var medium = this,
		defaultSettings = utils.deepExtend({}, Medium.defaultSettings),
		settings = this.settings = utils.deepExtend(defaultSettings, userSettings),
		cache = new Medium.Cache(),
		selection = new Medium.Selection(),
		action = new Medium.Action(this),
		cursor = new Medium.Cursor(this),
		undoable = new Medium.Undoable(this),
		el,
		newVal,
		i;

	for (i in defaultSettings) if (defaultSettings.hasOwnProperty(i)) {
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
		for (i in settings.modifiers) if (settings.modifiers.hasOwnProperty(i)) {
			if (typeof(key[i]) !== 'undefined') {
				settings.modifiers[key[i]] = settings.modifiers[i];
			}
		}
	}

	if (settings.keyContext) {
		for (i in settings.keyContext) if (settings.keyContext.hasOwnProperty(i)) {
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
	el.medium = this;

	this.action = action;
	this.cache = cache;
	this.cursor = cursor;
	this.utils = utils;
	this.selection = selection;

	// Initialize editor
	medium.clean();
	medium.placeholders();
	action.preserveElementFocus();

	this.dirty = false;
	this.undoable = undoable;
	this.makeUndoable = undoable.makeUndoable;

	if (settings.drag) {
		medium.drag = new Medium.Drag(medium);
		medium.drag.setup();
	}

	action.setup();

	// Set as initialized
	cache.initialized = true;

	this.makeUndoable(true);
};

Medium.prototype = {
	placeholders: function () {
		//in IE8, just gracefully degrade to no placeholders
		if (!w.getComputedStyle) return;

		var s = this.settings,
			placeholder = this.placeholder || (this.placeholder = d.createElement('div')),
			el = this.element,
			style = placeholder.style,
			elStyle = w.getComputedStyle(el, null),
			qStyle = function (prop) {
				return elStyle.getPropertyValue(prop)
			},
			text = utils.text(el),
			cursor = this.cursor,
			childCount = el.children.length,
			hasFocus = Medium.activeElement === el;

		el.placeholder = placeholder;

		// Empty Editor
		if (
			!hasFocus
			&& text.length < 1
			&& childCount < 2
		) {
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
					this.setupContents();

					if (childCount === 0 && el.firstChild) {
						cursor.set(this, 0, el.firstChild);
					}
				}
			}
			el.placeHolderActive = true;
		} else if (el.placeHolderActive) {
			el.placeHolderActive = false;
			style.display = 'none';
			el.className = utils.trim(el.className.replace(s.cssClasses.clear, ''));
			this.setupContents();
		}
	},

	/**
	 * Cleans element
	 * @param {HtmlElement} [el] default is settings.element
	 */
	clean: function (el) {

		/*
		 * Deletes invalid nodes
		 * Removes Attributes
		 */
		var s = this.settings,
			placeholderClass = s.cssClasses.placeholder,
			attributesToRemove = (s.attributes || {}).remove || [],
			tags = s.tags || {},
			onlyOuter = tags.outerLevel || null,
			onlyInner = tags.innerLevel || null,
			outerSwitch = {},
			innerSwitch = {},
			paragraphTag = (tags.paragraph || '').toUpperCase(),
			html = this.html,
			attr,
			text,
			j;

		el = el || s.element;

		if (s.mode === Medium.inlineRichMode) {
			onlyOuter = s.tags.innerLevel;
		}

		if (onlyOuter !== null) {
			for (j = 0; j < onlyOuter.length; j++) {
				outerSwitch[onlyOuter[j].toUpperCase()] = true;
			}
		}

		if (onlyInner !== null) {
			for (j = 0; j < onlyInner.length; j++) {
				innerSwitch[onlyInner[j].toUpperCase()] = true;
			}
		}

		utils.traverseAll(el, {
			element: function(child, i, depth, parent) {
				var nodeName = child.nodeName,
					shouldDelete = true,
					attrValue;

				// Remove attributes
				for (j = 0; j < attributesToRemove.length; j++) {
					attr = attributesToRemove[j];
					if (child.hasAttribute(attr)) {
						attrValue = child.getAttribute(attr);
						if (attrValue !== placeholderClass && (!attrValue.match('medium-') && attr === 'class')) {
							child.removeAttribute(attr);
						}
					}
				}

				if ( onlyOuter === null && onlyInner === null ) {
					return;
				}

				if (depth  === 1 && outerSwitch[nodeName] !== undefined) {
					shouldDelete = false;
				} else if (depth > 1 && innerSwitch[nodeName] !== undefined) {
					shouldDelete = false;
				}

				// Convert tags or delete
				if (shouldDelete) {
					if (w.getComputedStyle(child, null).getPropertyValue('display') === 'block') {
						if (paragraphTag.length > 0 && paragraphTag !== nodeName) {
							utils.changeTag(child, paragraphTag);
						}

						if (depth > 1) {
							while (parent.childNodes.length > i) {
								parent.parentNode.insertBefore(parent.lastChild, parent.nextSibling);
							}
						}
					} else {
						switch (nodeName) {
							case 'BR':
								if (child === child.parentNode.lastChild) {
									if (child === child.parentNode.firstChild) {
										break;
									}
									text = d.createTextNode("");
									text.innerHTML = '&nbsp';
									child.parentNode.insertBefore(text, child);
									break;
								}
							default:
								while (child.firstChild !== null) {
									child.parentNode.insertBefore(child.firstChild, child);
								}
								utils.detachNode(child);
								break;
						}
					}
				}
			}
		});
	},
	/**
	 *
	 * @param {String|Object} html
	 * @param {Function} [callback]
	 * @param {Boolean} [skipChangeEvent]
	 * @returns {Medium}
	 */
	insertHtml: function (html, callback, skipChangeEvent) {
		var result = (new Medium.Html(this, html))
			.insert(this.settings.beforeInsertHtml),
			lastElement = result[result.length - 1];

		if (skipChangeEvent === true) {
			utils.triggerEvent(this.element, "change");
		}

		if (callback) {
			callback.apply(result);
		}

		switch (lastElement.nodeName) {
			//lists need their last child selected if it exists
			case 'UL':
			case 'OL':
			case 'DL':
				if (lastElement.lastChild !== null) {
					this.cursor.moveCursorToEnd(lastElement.lastChild);
					break;
				}
			default:
				this.cursor.moveCursorToEnd(lastElement);
		}

		return this;
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
				this.element.appendChild(newEl);
				toFocus = this.lastChild();
			}

			if (shouldFocus) {
				this.cache.focusedElement = toFocus;
				this.cursor.set(this, 0, toFocus);
			}
			return newEl;
		}
		return null;
	},

	/**
	 *
	 * @param {String} tagName
	 * @param {Object} [attributes]
	 * @param {Boolean} [skipChangeEvent]
	 * @returns {Medium}
	 */
	invokeElement: function (tagName, attributes, skipChangeEvent) {
		var settings = this.settings,
			remove = attributes.remove || [];

		attributes = attributes || {};

		switch (settings.mode) {
			case Medium.inlineMode:
			case Medium.partialMode:
				return this;
			default:
		}

		//invoke works off class, so if it isn't there, we just add it
		if (remove.length > 0) {
			if (!utils.arrayContains(settings, 'class')) {
				remove.push('class');
			}
		}

		(new Medium.Element(this, tagName, attributes))
			.invoke(this.settings.beforeInvokeElement);

		if (skipChangeEvent === true) {
			utils.triggerEvent(this.element, "change");
		}

		return this;
	},

	/**
	 *
	 * @param {String} [value]
	 * @returns {Medium}
	 */
	value: function (value) {
		if (typeof value !== 'undefined') {
			this.element.innerHTML = value;

			this.clean();
			this.placeholders();

			this.makeUndoable();
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
		utils.selectNode(Medium.activeElement = this.element);
		return this;
	},

	isActive: function () {
		return (Medium.activeElement === this.element);
	},

	setupContents: function () {
		var el = this.element,
			children = el.children,
			childNodes = el.childNodes,
			initialParagraph,
			s = this.settings;

		if (
			!s.tags.paragraph
			|| children.length > 0
			|| s.mode === Medium.inlineMode
			|| s.mode === Medium.inlineRichMode
		) {
			return Medium.Utilities;
		}

		//has content, but no children
		if (childNodes.length > 0) {
			initialParagraph = d.createElement(s.tags.paragraph);
			if (el.innerHTML.match('^[&]nbsp[;]')) {
				el.innerHTML = el.innerHTML.substring(6, el.innerHTML.length - 1);
			}
			initialParagraph.innerHTML = el.innerHTML;
			el.innerHTML = '';
			el.appendChild(initialParagraph);
			//this.cursor.set(this, initialParagraph.innerHTML.length, initialParagraph);
		} else {
			initialParagraph = d.createElement(s.tags.paragraph);
			initialParagraph.innerHTML = '&nbsp;';
			el.appendChild(initialParagraph);
			this.cursor.set(this, 0, el.firstChild);
		}

		return this;
	},

	destroy: function () {
		var el = this.element,
			settings = this.settings,
			placeholder = this.placeholder || null;

		if (placeholder !== null && placeholder.setup && placeholder.parentNode !== null) {
			//remove placeholder
			placeholder.parentNode.removeChild(placeholder);
			delete el.placeHolderActive;
		}

		//remove contenteditable
		el.removeAttribute('contenteditable');

		//remove classes
		el.className = utils.trim(el.className
			.replace(settings.cssClasses.editor, '')
			.replace(settings.cssClasses.clear, '')
			.replace(settings.cssClasses.editor + '-' + settings.mode, ''));

		//remove events
		this.action.destroy();

		if (this.settings.drag) {
			this.drag.destroy();
		}
	},

	// Clears the element and restores the placeholder
	clear: function () {
		this.element.innerHTML = '';
		this.placeholders();
	},

	/**
	 * Splits content in medium element at cursor
	 * @returns {DocumentFragment|null}
	 */
	splitAtCaret: function() {
		if (!this.isActive()) return null;

		var selector = (w.getSelection || d.selection),
			sel = selector(),
			offset = sel.focusOffset,
			node = sel.focusNode,
			el = this.element,
			range = d.createRange(),
			endRange = d.createRange(),
			contents;

		range.setStart(node, offset);
		endRange.selectNodeContents(el);
		range.setEnd(endRange.endContainer, endRange.endOffset);

		contents = range.extractContents();

		return contents;
	},

	/**
	 * Deletes selection
	 */
	deleteSelection: function() {
		if (!this.isActive()) return;

		var sel = rangy.getSelection(),
			range;

		if (sel.rangeCount > 0) {
			range = sel.getRangeAt(0);
			range.deleteContents();
		}
	},

	lastChild: function () {
		return this.element.lastChild;
	},

	bold: function () {

		switch (this.settings.mode) {
			case Medium.partialMode:
			case Medium.inlineMode:
				return this;
		}

		(new Medium.Element(this, 'bold'))
			.setClean(false)
			.invoke(this.settings.beforeInvokeElement);

		return this;
	},
	underline: function () {
		switch (this.settings.mode) {
			case Medium.partialMode:
			case Medium.inlineMode:
				return this;
		}

		(new Medium.Element(this, 'underline'))
			.setClean(false)
			.invoke(this.settings.beforeInvokeElement);

		return this;
	},
	italicize: function () {
		switch (this.settings.mode) {
			case Medium.partialMode:
			case Medium.inlineMode:
				return this;
		}

		(new Medium.Element(this, 'italic'))
			.setClean(false)
			.invoke(this.settings.beforeInvokeElement);

		return this;
	},
	quote: function () {

		return this;
	},
	/**
	 *
	 * @param {String} [text]
	 * @returns {boolean}
	 */
	paste: function (text) {
		var value = this.value(),
			length = value.length,
			totalLength,
			settings = this.settings,
			selection = this.selection,
			el = this.element,
			medium = this,
			postPaste = function(text) {
				text = text || '';
				if (text.length > 0) {
					el.focus();
					Medium.activeElement = el;
					selection.restoreSelection(sel);

					//encode the text first
					text = utils.encodeHtml(text);

					//cut down it's length
					totalLength = text.length + length;
					if (settings.maxLength > 0 && totalLength > settings.maxLength) {
						text = text.substring(0, settings.maxLength - length);
					}

					if (settings.mode !== Medium.inlineMode) {
						text = text.replace(/\n/g, '<br>');
					}

					(new Medium.Html(medium, text))
						.setClean(false)
						.insert(settings.beforeInsertHtml, true);

					medium.clean();
					medium.placeholders();
				}
			};

		medium.makeUndoable();

		if (text !== undefined) {
			postPaste(text);
		} else if (settings.pasteAsText) {
			var sel = selection.saveSelection();

			utils.pasteHook(this, postPaste);
		} else {
			setTimeout(function() {
				medium.clean();
				medium.placeholders();
			}, 20);
		}
		return true;
	},
	undo: function() {
		var undoable = this.undoable,
			stack = undoable.stack,
			can = stack.canUndo();

		if (can) {
			stack.undo();
		}

		return this;
	},
	redo: function() {
		var undoable = this.undoable,
			stack = undoable.stack,
			can = stack.canRedo();

		if (can) {
			stack.redo();
		}

		return this;
	}
};

//Modes
Medium.inlineMode = 'inline';
Medium.partialMode = 'partial';
Medium.richMode = 'rich';
Medium.inlineRichMode = 'inlineRich';
Medium.Messages = {
	pastHere: 'Paste Here'
};

Medium.defaultSettings = {
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
		'u': 'underline'
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
	maxLengthReached: function (element) {
		//element
	},
	beforeAddTag: function (tag, shouldFocus, isEditable, afterElement) {
	},
        onBlur: function() {},
        onFocus: function() {},
	keyContext: null,
	drag: false
};
(function(Medium, w, d) {
	"use strict";

	function isEditable(e) {
		if (e.hasOwnProperty('target') && e.target.getAttribute('contenteditable') === 'false') {
			utils.preventDefaultEvent(e);
			return false;
		}
		return true;
	}

	Medium.Action = function (medium) {
		this.medium = medium;

		this.handledEvents = {
			keydown: null,
			keyup: null,
			blur: null,
			focus: null,
			paste: null,
			click: null
		};

	};
	Medium.Action.prototype = {
		setup: function () {
			this
				.handleFocus()
				.handleBlur()
				.handleKeyDown()
				.handleKeyUp()
				.handlePaste()
				.handleClick();
		},
		destroy: function() {
			var el = this.medium.element;

			utils
				.removeEvent(el, 'focus', this.handledEvents.focus)
				.removeEvent(el, 'blur', this.handledEvents.blur)
				.removeEvent(el, 'keydown', this.handledEvents.keydown)
				.removeEvent(el, 'keyup', this.handledEvents.keyup)
				.removeEvent(el, 'paste', this.handledEvents.paste)
				.removeEvent(el, 'click', this.handledEvents.click);
		},
		handleFocus: function () {

			var medium = this.medium,
				el = medium.element;

			utils.addEvent(el, 'focus', this.handledEvents.focus = function(e) {
				e = e || w.event;

				if (!isEditable(e)) {
					return false;
				}

				Medium.activeElement = el;
                                medium.cache.originalVal = e.target.textContent;
                                medium.settings.onFocus(e);

				medium.placeholders();
			});

			return this;
		},
		handleBlur: function () {

			var medium = this.medium,
				el = medium.element;

			utils.addEvent(el, 'blur', this.handledEvents.blur = function(e) {
				e = e || w.event;

				if (Medium.activeElement === el) {
					Medium.activeElement = null;
				}
				
				medium.settings.onBlur(e);
				medium.placeholders();
			});

			return this;
		},
		handleKeyDown: function () {

			var action = this,
				medium = this.medium,
				settings = medium.settings,
				cache = medium.cache,
				el = medium.element;

			utils.addEvent(el, 'keydown', this.handledEvents.keydown = function(e) {
				e = e || w.event;

				if (!isEditable(e)) {
					return false;
				}

				var keepEvent = true;

				//in Chrome it sends out this event before every regular event, not sure why
				if (e.keyCode === 229) return;

				utils.isCommand(settings, e, function () {
					cache.cmd = true;
				}, function () {
					cache.cmd = false;
				});

				utils.isShift(e, function () {
					cache.shift = true;
				}, function () {
					cache.shift = false;
				});

				utils.isModifier(settings, e, function (cmd) {
					if (cache.cmd) {

						if ( (settings.mode === Medium.inlineMode) || (settings.mode === Medium.partialMode) ) {
							utils.preventDefaultEvent(e);
							return false;
						}

						var cmdType = typeof cmd;
						var fn = null;
						if (cmdType === "function") {
							fn = cmd;
						} else {
							fn = medium[cmd];
						}

						keepEvent = fn.call(medium, e);

						if (keepEvent === false || keepEvent === medium) {
							utils.preventDefaultEvent(e);
							utils.stopPropagation(e);
						}
						return true;
					}
					return false;
				});

				if (settings.maxLength !== -1) {
					var len = utils.text(el).length,
						hasSelection = false,
						selection = w.getSelection(),
						isSpecial = utils.isSpecial(e),
						isNavigational = utils.isNavigational(e);

					if (selection) {
						hasSelection = !selection.isCollapsed;
					}

					if (isSpecial || isNavigational) {
						return true;
					}

					if (len >= settings.maxLength && !hasSelection) {
						settings.maxLengthReached(el);
						utils.preventDefaultEvent(e);
						return false;
					}
				}

				switch (e.keyCode) {
                                        case key['enter']:
                                                if (action.enterKey(e) === false) {
                                                        utils.preventDefaultEvent(e);
                                                }
                                                break;
                                        case key['escape']:
                                                if (action.escKey(e) === false) {
							utils.preventDefaultEvent(e);
						}
						break;
					case key['backspace']:
					case key['delete']:
						action.backspaceOrDeleteKey(e);
						break;
				}

				return keepEvent;
			});

			return this;
		},
		handleKeyUp: function () {

			var action = this,
				medium = this.medium,
				settings = medium.settings,
				cache = medium.cache,
				cursor = medium.cursor,
				el = medium.element;

			utils.addEvent(el, 'keyup', this.handledEvents.keyup = function(e) {
				e = e || w.event;

				if (!isEditable(e)) {
					return false;
				}

				utils.isCommand(settings, e, function () {
					cache.cmd = false;
				}, function () {
					cache.cmd = true;
				});
				medium.clean();
				medium.placeholders();

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
			});

			return this;
		},
		handlePaste: function() {
			var medium = this.medium,
				el = medium.element,
				text,
				i,
				max,
				data,
				cD,
				type,
				types;

			utils.addEvent(el, 'paste', this.handledEvents.paste = function(e) {
				e = e || w.event;

				if (!isEditable(e)) {
					return false;
				}

				i = 0;
				utils.preventDefaultEvent(e);
				text = '';
				cD = e.clipboardData;

				if (cD && (data = cD.getData)) {
					types = cD.types;
					max = types.length;
					for (i = 0; i < max; i++) {
						type = types[i];
						switch (type) {
							//case 'text/html':
							//	return medium.paste(cD.getData('text/html'));
							case 'text/plain':
								return medium.paste(cD.getData('text/plain'));
						}
					}
				}

				medium.paste();
			});

			return this;
		},
		handleClick: function() {
			var medium = this.medium,
				el = medium.element,
				cursor = medium.cursor;

			utils.addEvent(el, 'click', this.handledEvents.click = function(e) {
				if (!isEditable(e)) {
					cursor.caretToAfter(e.target);
				}

			});

			return this;
		},
                escKey: function (e) {
                    var medium = this.medium,
                        el = medium.element,
                        settings = medium.settings,
                        cache = medium.cache;

                    if( settings.mode === Medium.inlineMode || settings.mode === Medium.inlineRichMode ){
                        e.target.textContent = cache.originalVal;
                        
                        if (settings.element.blur) {
                            settings.element.blur();
                        } else if (settings.element.onblur) {
                            settings.element.onblur();
                        }   
                        return false;
                    }
                },
		enterKey: function (e) {
			var medium = this.medium,
				el = medium.element,
				settings = medium.settings,
				cache = medium.cache,
				cursor = medium.cursor;

			if( settings.mode === Medium.inlineMode || settings.mode === Medium.inlineRichMode ){
                            if (settings.element.blur) {
                                settings.element.blur();
                            } else if (settings.element.onblur) {
                                settings.element.onblur();
                            }	
                            return false;
			}

			if (cache.shift) {
				if (settings.tags['break']) {
					medium.addTag(settings.tags['break'], true);
					return false;
				}

			} else {

				var focusedElement = utils.atCaret(medium) || {},
					children = el.children,
					lastChild = focusedElement === el.lastChild ? el.lastChild : null,
					makeHR,
					secondToLast,
					paragraph;

				if (
					lastChild
					&& lastChild !== el.firstChild
					&& settings.autoHR
					&& settings.mode !== Medium.partialMode
					&& settings.tags.horizontalRule
				) {

					utils.preventDefaultEvent(e);

					makeHR =
						utils.text(lastChild) === ""
						&& lastChild.nodeName.toLowerCase() === settings.tags.paragraph;

					if (makeHR && children.length >= 2) {
						secondToLast = children[ children.length - 2 ];

						if (secondToLast.nodeName.toLowerCase() === settings.tags.horizontalRule) {
							makeHR = false;
						}
					}

					if (makeHR) {
						medium.addTag(settings.tags.horizontalRule, false, true, focusedElement);
						focusedElement = focusedElement.nextSibling;
					}

					if ((paragraph = medium.addTag(settings.tags.paragraph, true, null, focusedElement)) !== null) {
						paragraph.innerHTML = '';
						cursor.set(medium, 0, paragraph);
					}
				}
			}

			return true;
		},
		backspaceOrDeleteKey: function (e) {
			var medium = this.medium,
				cursor = medium.cursor,
				settings = medium.settings,
				el = medium.element;

			if (settings.onBackspaceOrDelete !== undefined) {
				var result = settings.onBackspaceOrDelete.call(medium, e, el);

				if (result) {
					return;
				}
			}

			if (el.lastChild === null) return;

			var lastChild = el.lastChild,
				beforeLastChild = lastChild.previousSibling,
				anchorNode = rangy.getSelection().anchorNode;

			if (
				lastChild
				&& settings.tags.horizontalRule
				&& lastChild.nodeName.toLocaleLowerCase() === settings.tags.horizontalRule
			) {
				el.removeChild(lastChild);
			} else if (
				lastChild
				&& beforeLastChild
				&& utils.text(lastChild).length < 1

				&& beforeLastChild.nodeName.toLowerCase() === settings.tags.horizontalRule
				&& lastChild.nodeName.toLowerCase() === settings.tags.paragraph
			) {
				el.removeChild(lastChild);
				el.removeChild(beforeLastChild);
			} else if (
				el.childNodes.length === 1
				&& lastChild
				&& !utils.text(lastChild).length
			) {
				utils.preventDefaultEvent(e);
				medium.setupContents();
			}
			else if ( anchorNode && anchorNode === el ) {
				medium.deleteSelection();
				medium.setupContents();
				cursor.set(medium, 0, el.firstChild);
			}
		},
		preserveElementFocus: function () {
			// Fetch node that has focus
			var anchorNode = w.getSelection ? w.getSelection().anchorNode : document.activeElement;
			if (anchorNode) {
				var medium = this.medium,
					cache = medium.cache,
					el = medium.element,
					s = medium.settings,
					cur = anchorNode.parentNode,
					children = el.children,
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

})(Medium, w, d);
(function(Medium) {
	"use strict";

	Medium.Cache = function () {
		this.initialized = false;
		this.cmd = false;
		this.focusedElement = null;
                this.originalVal = null;
	};

})(Medium);
(function(Medium) {
	"use strict";
	/*
	 * Handle Cursor Logic
	 */
	Medium.Cursor = function (medium) {
		this.medium = medium;
	};
	Medium.Cursor.prototype = {
		set: function (pos, el) {
			var range;

			if (d.createRange) {
				var selection = w.getSelection(),
					lastChild = this.medium.lastChild(),
					length = utils.text(lastChild).length - 1,
					toModify = el ? el : lastChild,
					theLength = ((typeof pos !== 'undefined') && (pos !== null) ? pos : length);

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
		//http://davidwalsh.name/caret-end
		moveCursorToEnd: function (el) {
			//get the browser selection object - it may or may not have a selected range
			var selection = rangy.getSelection(),

				//create a range object to set the caret positioning for
				range = rangy.createRange();


			//set the caret after the start node and at the end of the end node
			//Note: the end is set using endNode.length when the node is of the text type
			//and it is set using childNodes.length when the end node is of the element type
			range.setStartAfter(el);
			range.setEnd(el, el.length || el.childNodes.length);

			//apply this range to the selection object
			selection.removeAllRanges();
			selection.addRange(range);
		},
		moveCursorToAfter: function (el) {
			var sel = rangy.getSelection();
			if (sel.rangeCount) {
				var range = sel.getRangeAt(0);
				range.collapse(false);
				range.collapseAfter(el);
				sel.setSingleRange(range);
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
			this.moveCursorToEnd(el);
		},
		caretToAfter: function (el) {
			this.moveCursorToAfter(el);
		}
	};
})(Medium);
(function(Medium) {
	"use strict";
	Medium.Drag = function(medium) {
		this.medium = medium;

		var that = this,
			iconSrc = this.iconSrc.replace(/[{][{]([a-zA-Z]+)[}][}]/g, function(ignore, match) {
				if (that.hasOwnProperty(match)) {
					return that[match];
				}

				return ignore;
			}),
			icon = this.icon = d.createElement('img');

		icon.className = this.buttonClass;
		icon.setAttribute('contenteditable', 'false');
		icon.setAttribute('src', iconSrc);

		this.hide();
		this.element = null;
		this.protectedElement = null;
		this.handledEvents = {
			dragstart: null,
			dragend: null,
			mouseover: null,
			mouseout: null,
			mousemove: null
		};
	};
	Medium.Drag.prototype = {
		elementClass: 'Medium-focused',
		buttonClass: 'Medium-drag',

		//thank you ascii for not including a directional icon (boo!)
		//http://www.flaticon.com/free-icon/pointer-crosstree_10119
		iconSrc: 'data:image/svg+xml;utf8,\
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="21.424px" height="21.424px" viewBox="0 0 21.424 21.424" style="enable-background:new 0 0 21.424 21.424;" xml:space="preserve">\
	<g>\
		<g>\
			<path style="fill:{{iconColor}};" d="M13.616,17.709L13.616,17.709h0.781l-3.686,3.715l-3.685-3.715h0.781l0,0H13.616z M13.616,17.709 M14.007,17.709 M12.555,19.566 M8.87,19.566 M7.418,17.709 M7.809,17.709 M10.712,17.709"/>\
			<path style="fill:{{iconColor}};" d="M13.616,3.715L13.616,3.715h0.781L10.712,0L7.027,3.715h0.781l0,0H13.616z M13.616,3.715 M14.007,3.715 M12.555,1.858 M8.87,1.858 M7.418,3.715 M7.809,3.715 M10.712,3.715"/>\
			<path style="fill:{{iconColor}};" d="M3.716,13.616L3.716,13.616v0.781L0,10.712l3.716-3.685v0.781l0,0V13.616z M3.716,13.616 M3.716,14.007 M1.858,12.555 M1.858,8.87 M3.716,7.417 M3.716,7.808 M3.716,10.712"/>\
			<path style="fill:{{iconColor}};" d="M17.709,13.616L17.709,13.616v0.781l3.715-3.685l-3.715-3.685v0.781l0,0V13.616z M17.709,13.616 M17.709,14.007 M19.566,12.555 M19.566,8.87 M17.709,7.417 M17.709,7.808 M17.709,10.712"/>\
		</g>\
		<path style="fill-rule:evenodd;clip-rule:evenodd;fill:{{iconColor}};" d="M10.712,6.608c2.267,0,4.104,1.838,4.104,4.104 c0,2.266-1.837,4.104-4.104,4.104c-2.266,0-4.104-1.837-4.104-4.104C6.608,8.446,8.446,6.608,10.712,6.608L10.712,6.608z M10.712,7.515c-1.765,0-3.196,1.432-3.196,3.197s1.432,3.197,3.196,3.197c1.766,0,3.197-1.432,3.197-3.197 S12.478,7.515,10.712,7.515z"/>\
	</g>\
</svg>',
		iconColor: '#231F20',
		setup: function() {
			this
				.handleDragstart()
				.handleDragend()
				.handleMouseover()
				.handleMouseout()
				.handleMousemove();
      return this;
		},
		destroy: function() {
			utils
				.removeEvent(this.icon, 'dragstart', this.handledEvents.dragstart)
				.removeEvent(this.icon, 'dragend', this.handledEvents.dragend)
				.removeEvent(this.icon, 'mouseover', this.handledEvents.mouseover)
				.removeEvent(this.icon, 'mouseout', this.handledEvents.mouseout)
				.removeEvent(this.medium.element, 'mousemove', this.handledEvents.mousemove);
      return this;
		},
		hide: function() {
			utils.hide(this.icon);
      return this;
		},
		handleDragstart: function() {

			var me = this;

			utils.addEvent(this.icon, 'dragstart', this.handledEvents.dragstart = function(e) {
				if (me.protectedElement !== null) return;

				e = e || w.event;

				me.protectedElement = utils.detachNode(me.element);

				me.icon.style.opacity = 0.00;
			});

			return this;
		},
		handleDragend: function() {
			var me = this;

			utils.addEvent(this.icon, 'dragend',  this.handledEvents.dragend = d.body.ondragend = function(e) {
				if (me.protectedElement === null) return;

				setTimeout(function() {
					me.cleanCanvas();
					me.protectedElement = null;
				}, 1);
			});

			return this;
		},
		handleMouseover: function() {
			var me = this;

			utils.addEvent(this.icon, 'mouseover', this.handledEvents.mouseover = function(e) {
				if (me.protectedElement !== null) return;

				utils
					.stopPropagation(e)
					.addClass(me.element, me.elementClass);

			});

			return this;
		},
		handleMouseout: function() {
			var me = this;

			utils.addEvent(this.icon, 'mouseout', this.handledEvents.mouseout = function(e) {
				if (me.protectedElement !== null) return;

				utils
					.stopPropagation(e)
					.removeClass(me.element, me.elementClass);
			});
			return this;
		},
		handleMousemove: function() {
			var me = this;

			utils.addEvent(this.medium.element, 'mousemove', this.handledEvents.mousemove = function(e) {
				e = e || w.event;
				var target = e.target || {};

				if (target.getAttribute('contenteditable') === 'false') {
					me.show(target);
				}
			});

			return this;
		},
		show: function(el) {
			if (el === this.icon && this.protectedElement === null) return;

			this.element = el;

			var style = this.icon.style,
				left = el.offsetLeft,
				top = el.offsetTop;

			el.dragIcon = this.icon;
			el.parentNode.appendChild(this.icon);

			style.opacity = 1;
			style.left = left + 'px';
			style.top = top + 'px';

			utils.show(this.icon);
      return this;
		},
		cleanCanvas: function() {
			var target,
				inserted = false,
				buttons = d.getElementsByClassName(this.buttonClass);

			this.icon.style.opacity = 1;

			while (buttons.length > 0) {
				if (utils.isVisible(target = buttons[0])) {
					if (!inserted) {
						target.parentNode.insertBefore(this.element, target);
						inserted = true;
					}
					utils.detachNode(target);
				}
			}
			utils.detachNode(this.icon);
      return this;
		}
	};
})(Medium);
(function(Medium) {
	"use strict";

	/**
	 * @param {Medium} medium
	 * @param {String} tagName
	 * @param {Object} [attributes]
	 * @constructor
	 */
	Medium.Element = function (medium, tagName, attributes) {
		this.medium = medium;
		this.element = medium.element;

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

		this.attributes = attributes || {};
		this.clean = true;
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
					applier,
					cl;

				if (attr.className !== undefined) {
					cl = (attr.className.split[' '] || [attr.className]).shift();
					delete attr.className;
				} else {
					cl = 'medium-' + tagName;
				}

				applier = rangy.createClassApplier(cl, {
					elementTagName: tagName,
					elementAttributes: this.attributes
				});

				this.medium.makeUndoable();

				applier.toggleSelection(w);

				if (this.clean) {
					//cleanup
					this.medium.clean();
					this.medium.placeholders();
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
})(Medium);
(function(Medium) {
	"use strict";

	/**
	 * @constructor
	 * @param {Medium} medium
	 * @param {String|HtmlElement} html
	 */
	Medium.Html = function (medium, html) {
		this.html = html;
		this.medium = medium;
		this.clean = true;
		this.injector = new Medium.Injector();
	};

	Medium.Html.prototype = {
		/**
		 * @methodOf Medium.Html
		 * @param {Function} [fn]
		 * @param {Boolean} [selectInserted]
		 * @returns {HtmlElement}
		 */
		insert: function (fn, selectInserted) {
			if (Medium.activeElement === this.medium.element) {
				if (fn) {
					fn.apply(this);
				}

				var inserted = this.injector.inject(this.html, selectInserted);

				if (this.clean) {
					//cleanup
					this.medium.clean();
					this.medium.placeholders();
				}

				this.medium.makeUndoable();

				return inserted;
			} else {
				return null;
			}
		},

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

})(Medium);
(function(Medium) {
	"use strict";

	/**
	 *
	 * @constructor
	 */
	Medium.Injector = function () {
	};

	Medium.Injector.prototype = {
		/**
		 * @methodOf Medium.Injector
		 * @param {String|HtmlElement} htmlRaw
		 * @returns {[HtmlElement|Node]}
		 */
		inject: function (htmlRaw) {
			var nodes = [],
				html,
				isConverted = false;

			if (typeof htmlRaw === 'string') {
				var htmlConverter = d.createElement('div');
				htmlConverter.innerHTML = htmlRaw;
				html = htmlConverter.childNodes;
				isConverted = true;
			} else {
				html = htmlRaw;
			}

			this.insertHTML('<span id="Medium-wedge"></span>');

			var wedge = d.getElementById('Medium-wedge'),
				parent = wedge.parentNode,
				i = 0;

			wedge.removeAttribute('id');

			if (isConverted) {
				//make an array of elements that are about to be inserted, can't use html because they will
				while (i < html.length) {
					nodes.push(html[i]);
					i++;
				}

				while (html.length > 0) {
          parent.insertBefore(html[0], wedge);
				}
			} else {
				nodes.push(html);
				parent.insertBefore(html, wedge);
			}
			parent.removeChild(wedge);
			wedge = null;

			return nodes;
		},

		//Thank you Tim Down (super uber genius): http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div/6691294#6691294
		insertHTML: function (html, selectPastedContent) {
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
		}
	};
})(Medium);
(function(Medium) {
	"use strict";

	/*
	 * Handle Selection Logic
	 */
	Medium.Selection = function () {
	};
	Medium.Selection.prototype = {
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
})(Medium);(function(Medium) {
	"use strict";
	Medium.Toolbar = function(medium, buttons) {
		this.medium = medium;

		var elementCreator = d.createElement('div');

		elementCreator.innerHTML = this.html;

		this.buttons = buttons;
		this.element = elementCreator.children[0];
		d.body.appendChild(this.element);
		this.active = false;
		this.busy = true;

		this.handledEvents = {
			scroll: null,
			mouseup: null,
			keyup: null
		};
	};

	Medium.Toolbar.prototype = {
		fixedClass: 'Medium-toolbar-fixed',
		showClass: 'Medium-toolbar-show',
		hideClass: 'Medium-toolbar-hide',

		html:
			'<div class="Medium-toolbar">\
				<div class="Medium-tail-outer">\
					<div class="Medium-tail-inner"></div>\
				</div>\
				<div id="Medium-buttons"></div>\
				<table id="Medium-options">\
					<tbody>\
						<tr>\
						</tr>\
					</tbody>\
				</table>\
			</div>',

		setup: function() {
			this
				.handleScroll()
				.handleMouseup()
				.handleKeyup();

		},
		destroy: function() {
			utils
				.removeEvent(w, 'scroll', this.handledEvents.scroll)
				.removeEvent(d, 'mouseup', this.handledEvents.mouseup)
				.removeEvent(d, 'keyup', this.handledEvents.keyup);
		},
		handleScroll: function() {
			var me = this;

			utils.addEvent(w, 'scroll', this.handledEvents.scroll = function() {
				if (me.active) {
					me.goToSelection();
				}
			});

			return this;
		},
		handleMouseup: function() {
			var me = this;

			utils.addEvent(d, 'mouseup', this.handledEvents.mouseup = function() {
				if (Medium.activeElement === me.medium.element && !me.busy) {
					me.goToSelection();
				}
			});

			return this;
		},
		handleKeyup: function() {
			var me = this;

			utils.addEvent(d, 'keyup', this.handledEvents.keyup = function() {
				if (Medium.activeElement === me.medium.element && !me.busy) {
					me.goToSelection();
				}
			});

			return this;
		},
		goToSelection: function() {
			var high = this.getHighlighted(),
				y = high.boundary.top - 5,
				el = this.element,
				style = el.style;

			if (w.scrollTop > 0) {
				utils.addClass(el, this.fixedClass);
			} else {
				utils.removeClass(el, this.fixedClass);
			}

			if (high !== null) {
				if (high.range.startOffset === high.range.endOffset && !high.text) {
					utils
						.removeClass(el, this.showClass)
						.addClass(el, this.hideClass);

					this.active = false;
				} else {
					utils
						.removeClass(el, this.hideClass)
						.removeClass(el, this.showClass);

					style.opacity = 0.01;
					utils.addClass(el, this.showClass);
					style.opacity = 1;
					style.top = (y - 65) + "px";
					style.left = (
					(
					high.boundary.left + (high.boundary.width / 2)
					)
					- (el.clientWidth / 2)
					) + "px";

					this.active = true;
				}
			}
		},

		getHighlighted: function() {
			var selection = w.getSelection(),
				range = (selection.anchorNode ? selection.getRangeAt(0) : false);

			if (!range) {
				return null;
			}

			return {
				selection : selection,
				range : range,
				text : utils.trim(range.toString()),
				boundary : range.getBoundingClientRect()
			};
		}
	};
})(Medium);
(function(Medium) {
	"use strict";

	/**
	 * @param {Medium} medium
	 * @constructor
	 */
	Medium.Undoable = function (medium) {
		var me = this,
			element = medium.settings.element,
			timer,
			startValue,
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
			makeUndoable = function (isInit) {
				var newValue = element.innerHTML;

				if (isInit) {
					startValue = element.innerHTML;
					stack.execute(new EditCommand(startValue, startValue));
				}

				// ignore meta key presses
				else if (newValue != startValue) {

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

		utils
			.addEvent(element, 'keyup', function (e) {
				if (e.ctrlKey || e.keyCode === key.z) {
					utils.preventDefaultEvent(e);
					return;
				}

				// a way too simple algorithm in place of single-character undo
				clearTimeout(timer);
				timer = setTimeout(function () {
					makeUndoable();
				}, 250);
			})

			.addEvent(element, 'keydown', function (e) {
				if (!e.ctrlKey || e.keyCode !== key.z) {
					me.movingThroughStack = false;
					return;
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
})(Medium);Medium.Utilities = {
  /*
   * Keyboard Interface events
   */
  isCommand: function (s, e, fnTrue, fnFalse) {
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
  isModifier: function (settings, e, fn) {
    var cmd = settings.modifiers[e.keyCode];
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
    return typeof Medium.Utilities.special[e.keyCode] !== 'undefined';
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
    return typeof Medium.Utilities.navigational[e.keyCode] !== 'undefined';
  },

  /**
   * @param element
   * @param eventNamesString
   * @param func
   * @returns Medium.Utilities
   */
  addEvents: function(element, eventNamesString, func) {
    var i = 0,
      eventName,
      eventNames = eventNamesString.split(' '),
      max = eventNames.length,
      utils = Medium.Utilities;

    for(;i < max; i++) {
      eventName = eventNames[i];
      if (eventName.length > 0) {
        utils.addEvent(element, eventName, func);
      }
    }

    return Medium.Utilities;
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

    return Medium.Utilities;
  },
  removeEvent: function removeEvent(element, eventName, func) {
    if (element.removeEventListener) {
      element.removeEventListener(eventName, func, false);
    } else if (element.detachEvent) {
      element.detachEvent("on" + eventName, func);
    } else {
      element['on' + eventName] = null;
    }

    return Medium.Utilities;
  },
  preventDefaultEvent: function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }

    return Medium.Utilities;
  },
  stopPropagation: function(e) {
    e = e || w.event;
    e.cancelBubble = true;

    if (e.stopPropagation !== undefined) {
      e.stopPropagation();
    }

    return Medium.Utilities;
  },
  isEventSupported: function (element, eventName) {
    eventName = 'on' + eventName;
    var el = d.createElement(element.tagName),
      isSupported = (eventName in el);

    if (!isSupported) {
      el.setAttribute(eventName, 'return;');
      isSupported = typeof el[eventName] == 'function';
    }
    el = null;
    return isSupported;
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

    return Medium.Utilities;
  },

  deepExtend: function (destination, source) {
    var property,
      propertyValue;

    for (property in source) if (source.hasOwnProperty(property)) {
      propertyValue = source[property];
      if (
        propertyValue !== undefined
        && propertyValue !== null
        && propertyValue.constructor !== undefined
        && propertyValue.constructor === Object
      ) {
        destination[property] = destination[property] || {};
        Medium.Utilities.deepExtend(destination[property], propertyValue);
      } else {
        destination[property] = propertyValue;
      }
    }
    return destination;
  },
  /*
   * This is a Paste Hook. When the user pastes
   * content, this ultimately converts it into
   * plain text before inserting the data.
   */
  pasteHook: function (medium, fn) {
    medium.makeUndoable();

    var tempEditable = d.createElement('div'),
      el = medium.element,
      existingValue,
      existingLength,
      overallLength,
      s = medium.settings,
      value,
      body = d.body,
      bodyParent = body.parentNode,
      scrollTop = bodyParent.scrollTop,
      scrollLeft = bodyParent.scrollLeft;

    tempEditable.className = s.cssClasses.pasteHook;
    tempEditable.setAttribute('contenteditable', true);

    body.appendChild(tempEditable);
    utils.selectNode(tempEditable);

    bodyParent.scrollTop = scrollTop;
    bodyParent.scrollLeft = scrollLeft;

    setTimeout(function () {
      value = utils.text(tempEditable);
      el.focus();
      if (s.maxLength > 0) {
        existingValue = utils.text(el);
        existingLength = existingValue.length;
        overallLength = existingLength + value.length;
        if (overallLength > existingLength) {
          value = value.substring(0, s.maxLength - existingLength);
        }
      }
      utils.detachNode( tempEditable );
      bodyParent.scrollTop = scrollTop;
      bodyParent.scrollLeft = scrollLeft;
      fn(value);
    }, 0);

    return Medium.Utilities;
  },
  traverseAll: function(element, options, depth) {
    var children = element.childNodes,
      length = children.length,
      i = 0,
      node;

    depth = depth || 1;

    options = options || {};

    if (length > 0) {
      for(;i < length;i++) {
        node = children[i];
        switch (node.nodeType) {
          case 1:
            Medium.Utilities.traverseAll(node, options, depth + 1);
            if (options.element !== undefined) options.element(node, i, depth, element);
            break;
          case 3:
            if (options.fragment !== undefined) options.fragment(node, i, depth, element);
        }

        //length may change
        length = children.length;
        //if length did change, and we are at the last item, this causes infinite recursion, so if we are at the last item, then stop to prevent this
        if (node === element.lastChild) {
          i = length;
        }
      }
    }
    return Medium.Utilities;
  },
  trim: function (string) {
    return string.replace(/^[\s]+|\s+$/g, '');
  },
  arrayContains: function(array, variable) {
    var i = array.length;
    while (i--) {
      if (array[i] === variable) {
        return true;
      }
    }
    return false;
  },
  addClass: function(el, className) {
    if (el.classList)
      el.classList.add(className);
    else
      el.className += ' ' + className;

    return Medium.Utilities;
  },
  removeClass: function(el, className) {
    if (el.classList)
      el.classList.remove(className);
    else
      el.className = el.className.replace(new RegExp('(^|\b)' + className.split(' ').join('|') + '(\b|$)', 'gi'), ' ');
    return Medium.Utilities;
  },
  hasClass: function(el, className) {
    if (el.classList)
      return el.classList.contains(className);
    else
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  },
  isHidden: function(el) {
    return el.offsetWidth === 0 || el.offsetHeight === 0;
  },
  isVisible: function(el) {
    return el.offsetWidth !== 0 || el.offsetHeight !== 0;
  },
  encodeHtml: function ( html ) {
    return d.createElement( 'a' ).appendChild(
      d.createTextNode( html ) ).parentNode.innerHTML;
  },
  text: function (node, val) {
    if (val !== undefined) {
      if (node === null) {
        return this;
      }
      if (node.textContent !== undefined) {
        node.textContent = val;
      } else {
        node.innerText = val;
      }

      return this;
    }
    else if (node === null) {
      return this;
    }
    else if (node.innerText !== undefined) {
      return utils.trim(node.innerText);
    }

    else if (node.textContent !== undefined) {
      return utils.trim(node.textContent);
    }
    //document fragment
    else if (node.data !== undefined) {
      return utils.trim(node.data);
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

    return newNode;
  },
  detachNode: function (el) {
    if (el.parentNode !== null) {
      el.parentNode.removeChild(el);
    }

    return this;
  },
  selectNode: function(el) {
    var range,
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
  baseAtCaret: function (medium) {
    if (!medium.isActive()) return null;

    var sel = w.getSelection ? w.getSelection() : document.selection;

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
  atCaret: function (medium) {
    var container = this.baseAtCaret(medium) || {},
      el = medium.element;

    if (container === false) return null;

    while (container && container.parentNode !== el) {
      container = container.parentNode;
    }

    if (container && container.nodeType == 1) {
      return container;
    }

    return null;
  },
  hide: function(el) {
    el.style.display = 'none';
    return Medium.Utilities;
  },
  show: function(el) {
    el.style.display = '';
    return Medium.Utilities;
  },
  hideAnim: function(el) {
    el.style.opacity = 1;
    return Medium.Utilities;
  },
  showAnim: function(el) {
    el.style.opacity = 0.01;
    el.style.display = '';
    return Medium.Utilities;
  },

  /**
   *
   * @param _window
   * @returns {Medium.Utilities}
   */
  setWindow: function(_window) {
    w = _window;

    return Medium.Utilities;
  },

  /**
   *
   * @param _document
   * @returns {Medium.Utilities}
   */
  setDocument: function(_document) {
    d = _document;

    return Medium.Utilities;
  }
};
rangy.rangePrototype.insertNodeAtEnd = function (node) {
	var range = this.cloneRange();
	range.collapse(false);
	range.insertNode(node);
	range.detach();
	this.setEndAfter(node);
};

			return Medium;
		}()),
		utils = Medium.Utilities;

	if (typeof define === 'function' && define['amd']) {
		define(function () { return Medium; });
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = Medium;
	} else if (typeof this !== 'undefined') {
		this.Medium = Medium;
	}

}).call(this, window, document);
