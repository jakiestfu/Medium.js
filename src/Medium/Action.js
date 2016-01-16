
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
