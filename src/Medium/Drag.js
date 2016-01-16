
(function(Medium) {
	"use strict";
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
		this.handledEvents = {
			dragstart: null,
			dragend: null,
			mouseover: null,
			mouseout: null,
			mousemove: null
		};
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
		setup: function() {
			this
				.handleDragstart()
				.handleDragend()
				.handleMouseover()
				.handleMouseout()
				.handleMousemove();
      return this;
		},
		destroy: function() {
			utils
				.removeEvent(this.icon, 'dragstart', this.handledEvents.dragstart)
				.removeEvent(this.icon, 'dragend', this.handledEvents.dragend)
				.removeEvent(this.icon, 'mouseover', this.handledEvents.mouseover)
				.removeEvent(this.icon, 'mouseout', this.handledEvents.mouseout)
				.removeEvent(this.medium.element, 'mousemove', this.handledEvents.mousemove);
      return this;
		},
		hide: function() {
			utils.hide(this.icon);
      return this;
		},
		handleDragstart: function() {

			var me = this;

			utils.addEvent(this.icon, 'dragstart', this.handledEvents.dragstart = function(e) {
				if (me.protectedElement !== null) return;

				e = e || w.event;

				me.protectedElement = utils.detachNode(me.element);

				me.icon.style.opacity = 0.00;
			});

			return this;
		},
		handleDragend: function() {
			var me = this;

			utils.addEvent(this.icon, 'dragend',  this.handledEvents.dragend = d.body.ondragend = function(e) {
				if (me.protectedElement === null) return;

				setTimeout(function() {
					me.cleanCanvas();
					me.protectedElement = null;
				}, 1);
			});

			return this;
		},
		handleMouseover: function() {
			var me = this;

			utils.addEvent(this.icon, 'mouseover', this.handledEvents.mouseover = function(e) {
				if (me.protectedElement !== null) return;

				utils
					.stopPropagation(e)
					.addClass(me.element, me.elementClass);

			});

			return this;
		},
		handleMouseout: function() {
			var me = this;

			utils.addEvent(this.icon, 'mouseout', this.handledEvents.mouseout = function(e) {
				if (me.protectedElement !== null) return;

				utils
					.stopPropagation(e)
					.removeClass(me.element, me.elementClass);
			});
			return this;
		},
		handleMousemove: function() {
			var me = this;

			utils.addEvent(this.medium.element, 'mousemove', this.handledEvents.mousemove = function(e) {
				e = e || w.event;
				var target = e.target || {};

				if (target.getAttribute('contenteditable') === 'false') {
					me.show(target);
				}
			});

			return this;
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
      return this;
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
      return this;
		}
	};
})(Medium);
