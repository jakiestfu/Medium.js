
(function(Medium) {
	"use strict";

	Medium.Utilities = {
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
})(Medium);
