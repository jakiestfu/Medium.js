
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
