/*
 * Medium.js
 *
 * Copyright 2013-2014, Jacob Kelley - http://jakiestfu.com/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/jakiestfu/Medium.js/
 * Version: master
 */

(function (w, d) {

	'use strict';

	var Medium = (function () {

		var //two modes, wild (native) or domesticated (rangy + undo.js)
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
					selection = new Medium.Selection(),
					intercept = {
						focus: function (e) {
							e = e || w.event;
							Medium.activeElement = el;
							medium.placeholders();
						},
						blur: function (e) {
							e = e || w.event;
							if (Medium.activeElement === el) {
								Medium.activeElement = null;
							}

							medium.placeholders();
						},
						down: function (e) {
							e = e || w.event;

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

									if (( (settings.mode === Medium.inlineMode) || (settings.mode === Medium.partialMode) ) && cmd !== "paste") {
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

									keepEvent = fn.call(medium, e);

									if (keepEvent === false) {
										utils.preventDefaultEvent(e);
										utils.stopPropagation(e);
									}
								}
							});

							if (settings.maxLength !== -1) {
								var len = utils.text().length,
									hasSelection = false,
									selection = w.getSelection();

								if (selection) {
									hasSelection = !selection.isCollapsed;
								}

								if (len >= settings.maxLength && !utils.isSpecial(e) && !utils.isNavigational(e) && !hasSelection) {
									settings.maxLengthReached(settings.element)
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

							return keepEvent;
						},
						up: function (e) {
							e = e || w.event;
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
						},
						command: {
							bold: function (e) {
								utils.preventDefaultEvent(e);
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
								medium.makeUndoable();
								if (settings.pasteAsText) {
									var sel = utils.selection.saveSelection();
									utils.pasteHook(function (text) {
										utils.selection.restoreSelection(sel);

										text = text.replace(/\n/g, '<br>');

										(new Medium.Html(medium, text))
											.setClean(false)
											.insert(settings.beforeInsertHtml, true);

										medium.clean();
										medium.placeholders();
									});
								} else {
									medium.clean();
									medium.placeholders();
								}
							}
						},
						enterKey: function (e) {
							if( settings.mode === Medium.inlineMode || settings.mode === Medium.inlineRichMode ){
								return utils.preventDefaultEvent(e);
							}

							if (cache.shift) {
								if (settings.tags['break']) {
									utils.preventDefaultEvent(e);
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
										&& settings.mode !== 'partial'
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
							if (settings.onBackspaceOrDelete !== undefined) {
								var result = settings.onBackspaceOrDelete.call(medium, e, el);

								if (result) {
									return;
								}
							}

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
									&& utils.text(lastChild).length < 1

									&& beforeLastChild.nodeName.toLowerCase() === settings.tags.horizontalRule
									&& lastChild.nodeName.toLowerCase() === settings.tags.paragraph
								) {
								el.removeChild(lastChild);
								el.removeChild(beforeLastChild);
							}
						}
					},
					defaultSettings = {
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
							'v': 'paste'
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
						keyContext: null,
						pasteEventHandler: function(e) {
							e = e || w.event;
							medium.makeUndoable();
							var length = medium.value().length,
								totalLength;

							if (settings.pasteAsText) {
								utils.preventDefaultEvent(e);
								var
									sel = utils.selection.saveSelection(),
									text = prompt(Medium.Messages.pastHere) || '';

								if (text.length > 0) {
									el.focus();
									Medium.activeElement = el;
									utils.selection.restoreSelection(sel);

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

									return false;
								}
							} else {
								setTimeout(function() {
									medium.clean();
									medium.placeholders();
								}, 20);
							}
						},
						drag: false
					},
					settings = utils.deepExtend(defaultSettings, userSettings),
					el,
					newVal,
					i,
					bridge = {},
					drag;

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
				this.utils = utils;
				this.selection = selection;

				bridge.element = el;
				bridge.medium = this;
				bridge.settings = settings;

				bridge.action = action;
				bridge.cache = cache;
				bridge.cursor = cursor;
				bridge.intercept = intercept;
				bridge.utils = utils;
				bridge.selection = selection;

				action.setBridge(bridge);
				cache.setBridge(bridge);
				cursor.setBridge(bridge);
				selection.setBridge(bridge);

				// Initialize editor
				medium.clean();
				medium.placeholders();
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

				if (settings.drag) {
					drag = medium.drag = new Medium.Drag(medium);

					utils.addEvent(el, 'mousemove', function(e) {
						e = e || w.event;
						var target = e.target || {};

						if (target.getAttribute('contenteditable') === 'false') {
							drag.show(target);
						}
					});
				}

				el.medium = this;

				// Set as initialized
				cache.initialized = true;
			},
			utils;

		Medium.prototype = {
			placeholders: function () {
				//in IE8, just gracefully degrade to no placeholders
				if (!w.getComputedStyle) return;

				var that = this,
					s = this.settings,
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
							shouldDelete = true;

						// Remove attributes
						for (j = 0; j < attributesToRemove.length; j++) {
							attr = attributesToRemove[j];
							if (child.hasAttribute(attr)) {
								if (child.getAttribute(attr) !== placeholderClass) {
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
											text = document.createTextNode("");
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
					.insert(this.settings.beforeInsertHtml);

				if (skipChangeEvent === true) {
					utils.triggerEvent(this.element, "change");
				}

				if (callback) {
					callback.apply(result);
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
					attributes = attributes || {},
					remove = attributes.remove || [];

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
			 * @returns {string}
			 */
			behavior: function () {
				return (wild ? Medium.wildBehavior : Medium.domesticatedBehavior);
			},

			/**
			 *
			 * @param value
			 * @returns {Medium}
			 */
			value: function (value) {
				if (typeof value !== 'undefined') {
					this.element.innerHTML = value;

					this.clean();
					this.placeholders();
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
					this.cursor.set(this, initialParagraph.innerHTML.length, initialParagraph);
				} else {
					initialParagraph = d.createElement(s.tags.paragraph);
					initialParagraph.innerHTML = '&nbsp;';
					el.appendChild(initialParagraph);
				}

				return this;
			},

			destroy: function () {
				var el = this.element,
					intercept = this.intercept,
					settings = this.settings,
					placeholder = this.placeholder || null;

				if (placeholder !== null && placeholder.setup) {
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
				utils
					.removeEvent(el, 'keyup', intercept.up)
					.removeEvent(el, 'keydown', intercept.down)
					.removeEvent(el, 'focus', intercept.focus)
					.removeEvent(el, 'blur', intercept.focus)
					.removeEvent(el, 'paste', settings.pasteEventHandler);
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
				 * @param {Boolean} [selectInserted]
				 * @returns {null}
				 */
				inject: function (htmlRaw, selectInserted) {
					this.insertHTML(htmlRaw, selectInserted);
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
			/**
			 * @methodOf Medium.Html
			 * @param {Function} [fn]
			 * @param {Boolean} [selectInserted]
			 * @returns {HtmlElement}
			 */
			insert: function (fn, selectInserted) {
				if (Medium.activeElement === this.element) {
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

		Medium.Utilities = utils = {
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
			isSpecial: function (cacheCmd, e) {

				if (cacheCmd) {
					return true;
				}

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
				e = e || window.event;
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
				for (var property in source) if (source.hasOwnProperty(property)) {
					if (
						source[property]
							&& source[property].constructor
							&& source[property].constructor === Object
						) {
						destination[property] = destination[property] || {};
						Medium.Utilities.deepExtend(destination[property], source[property]);
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
			pasteHook: function (medium, fn) {
				var textarea = d.createElement('textarea'),
					el = medium.element,
					existingValue,
					existingLength,
					overallLength,
					s = medium.settings,
					html = medium.html;

				textarea.className = s.cssClasses.pasteHook;

				el.parentNode.appendChild(textarea);

				textarea.focus();

				if (!wild) {
					medium.makeUndoable();
				}
				setTimeout(function () {
					el.focus();
					if (s.maxLength > 0) {
						existingValue = utils.text(el);
						existingLength = existingValue.length;
						overallLength = existingLength + textarea.value.length;
						if (overallLength > existingLength) {
							textarea.value = textarea.value.substring(0, s.maxLength - existingLength);
						}
					}
					fn(textarea.value);
					utils.detachNode( textarea );
				}, 2);

				return Medium.Utilities;
			},
			traverseAll: function(element, options, depth) {
				var children = element.childNodes,
					length = children.length,
					i = 0,
					node,
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
					el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
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
				if (val) {
					if ((node.textContent) && (typeof (node.textContent) != "undefined")) {
						node.textContent = val;
					} else {
						node.innerText = val;
					}
				}

				else if (node.innerText) {
					return utils.trim(node.innerText);
				}

				else if (node.textContent) {
					return utils.trim(node.textContent);
				}
				//document fragment
				else if (node.data) {
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
				return el;
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
			},
			show: function(el) {
				el.style.display = '';
			},
			hideAnim: function(el) {
				el.style.opacity = 1;
			},
			showAnim: function(el) {
				el.style.opacity = 0.01;
				el.style.display = '';
			}
		};

		/*
		 * Handle Selection Logic
		 */
		Medium.Selection = function () {
		};
		Medium.Selection.prototype = {
			setBridge: function (bridge) {
				for (var i in bridge) if (bridge.hasOwnProperty(i)) {
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
				for (var i in bridge) if (bridge.hasOwnProperty(i)) {
					this[i] = bridge[i];
				}
			},
			set: function (medium, pos, el) {
				var range,
					html = this.html;

				if (d.createRange) {
					var selection = w.getSelection(),
						lastChild = medium.lastChild(),
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
				this.set(this, 0, el);
			},
			caretToEnd: function (el) {
				this.set(this, utils.text(el).length, el);
			}
		};

		Medium.Toolbar = function(medium, buttons) {
			var elementCreator = d.createElement('div'),
				that = this;

			elementCreator.innerHTML = this.html;

			this.buttons = buttons;
			this.element = elementCreator.children[0];
			d.body.appendChild(this.element);
			this.active = false;
			this.busy = true;

			utils
				.addEvents(document, 'mouseup keyup', function(e) {
					if (Medium.activeElement === medium.element && !that.busy) {
						that.goToSelection();
					}
				})
				.addEvent(w, 'scroll', function() {
					if (that.active) {
						that.goToSelection();
					}
				});
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

			utils
				.addEvent(icon, 'dragstart', function(e) {
					if (that.protectedElement !== null) return;

					e = e || w.event;

					that.protectedElement = utils.detachNode(that.element);

					that.icon.style.opacity = 0.00;
				})
				.addEvent(icon, 'mouseover', function(e) {
					if (that.protectedElement !== null) return;

					utils
						.stopPropagation(e)
						.addClass(that.element, that.elementClass);

				})
				.addEvent(icon, 'mouseout', function(e) {
					if (that.protectedElement !== null) return;

					utils
						.stopPropagation(e)
						.removeClass(that.element, that.elementClass);

				})
				.addEvent(icon, 'dragend', d.body.ondragend = function(e) {
					if (that.protectedElement === null) return;

					setTimeout(function() {
						that.cleanCanvas();
						that.protectedElement = null;
					}, 1);
				});
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
			hide: function() {
				utils.hide(this.icon);
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
			}
		};

		Medium.Action = function () {
		};
		Medium.Action.prototype = {
			setBridge: function (bridge) {
				for (var i in bridge) if (bridge.hasOwnProperty(i)) {
					this[i] = bridge[i];
				}
			},
			listen: function () {
				var el = this.element,
					intercept = this.intercept;

				utils
					.addEvent(el, 'keyup', intercept.up)
					.addEvent(el, 'keydown', intercept.down)
					.addEvent(el, 'focus', intercept.focus)
					.addEvent(el, 'blur', intercept.blur)
					.addEvent(el, 'paste', this.settings.pasteEventHandler);
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
				for (var i in bridge) if (bridge.hasOwnProperty(i)) {
					this[i] = bridge[i];
				}
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

		//Behaviours
		Medium.domesticatedBehavior = 'domesticated';
		Medium.wildBehavior = 'wild';

		return Medium;
	}());

	if (typeof define === 'function' && define['amd']) {
		define(function () { return Medium; });
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = Medium;
	} else if (typeof this !== 'undefined') {
		this.Medium = Medium;
	}

}).call(this, window, document);