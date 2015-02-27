
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
