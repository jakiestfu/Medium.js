
(function(Medium, w, d) {
	"use strict";

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

})(Medium, w, d);
