(function(Medium) {
	"use strict";
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
})(Medium);