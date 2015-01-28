
(function(Medium) {
	"use strict";

	Medium.Cache = function () {
		this.initialized = false;
		this.cmd = false;
		this.focusedElement = null
	};

	Medium.Cache.prototype = {
		setBridge: function (bridge) {
			for (var i in bridge) if (bridge.hasOwnProperty(i)) {
				this[i] = bridge[i];
			}
		}
	};

})(Medium);
