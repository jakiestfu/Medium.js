(function(tf) {
var body = document.body,
	events = {},
	originalAddEvent = Medium.Utilities.addEvent,
	overrideAddEvent = function(element, eventName, func) {
		if (!events[eventName]) {
			events[eventName] = [];
		}
		events[eventName].push(func);

		if (!element['on' + eventName]) {
			element['on' + eventName] = function() {
				var i = 0;
				for (;i < events[eventName].length; i++) {
					events[eventName][i].apply(element, arguments);
				}
			};
		}

		return this;
	},
	run = function(options, fn) {
		Medium.Utilities.addEvent = overrideAddEvent;

		var el = document.createElement('div'),
			medium;

		body.appendChild(el);

		options.element = el;

		medium = new Medium(options);

		fn(medium, el);

		medium.destroy();
		el.parentNode.removeChild(el);
		Medium.Utilities.addEvent = originalAddEvent;
	};

	tf.test('retain contenteditable attributes on undo', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet <span contenteditable="false">, consectetur.</span>',
				spans,
				valueInserted,
				valueUndone;

			medium.value(content);

			spans = medium.element.children;

			medium.focus();

			el.onclick({
				target: spans[0]
			});

			medium.insertHtml("did");
			valueInserted = medium.value();
			medium.undo();
			valueUndone = medium.value();

			tf.assertEquals(valueInserted, content + 'did', 'Added text');
			tf.assertEquals(valueUndone, content, "Undid adding of text");
		});
	});
})(tf);