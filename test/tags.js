(function(tf) {
	var body = document.body,
		originalAddEvent = Medium.Utilities.addEvent,
		overrideAddEvent = function(element, eventName, func) {
			element['on' + eventName] = func;

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

	tf.test('ctrl + b null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var result;

			result = '<b>' + (el.innerHTML = 'Lorem ipsum dolor sit amet.') + '</b>';

			medium.select();
			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			tf.assertEquals(el.innerHTML, result, "Bold remains");
		});
	});

	tf.test('ctrl + b default on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		},function(medium, el) {
			var result = el.innerHTML = 'Lorem ipsum dolor sit amet.';

			medium.select();

			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			tf.assertNotEquals(el.innerHTML, result, "Bold removed");
		});
	});
})(tf);