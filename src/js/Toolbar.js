(function(Medium) {
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