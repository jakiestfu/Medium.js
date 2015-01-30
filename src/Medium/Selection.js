
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
})(Medium);
