
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
