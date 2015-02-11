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

	tf.test('click contenteditable="false" behaviour', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet <span contenteditable="false">, consectetur</span><span contenteditable="false"> adipiscing.</span>',
				spans,
				elementBeforeCursor,
				elementAfterCursor,
				inserted = document.createElement('b');

			medium.value(content);

			spans = medium.element.children;
			elementBeforeCursor = spans[0];
			elementAfterCursor = spans[1];

			medium.focus();

			el.onclick({
				target: spans[0]
			});

			medium.insertHtml(inserted);

			tf.assertEquals(inserted.previousSibling, elementBeforeCursor, "Caret is after clicked element");
			tf.assertEquals(inserted.nextSibling, elementAfterCursor, "Caret is before clicked element's sibling");

			inserted.parentNode.removeChild(inserted);
		});
	});
})(tf);