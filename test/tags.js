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

	tf.test('ctrl + b null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'B', "Bold tag added");
			tf.assertEquals(el.firstChild.className, 'medium-b', "Bold class added");
			tf.assertEquals(el.firstChild.innerText || el.textContent, content, "Content intact");
		});
	});

	tf.test('ctrl + b default on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		},function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'P', "Wrapped in paragraph");
			tf.assertEquals(el.firstChild.firstChild.nodeName, 'B', "Bold tag added");
			tf.assertEquals(el.firstChild.firstChild.className, 'medium-b', "Bold class added");
			tf.assertEquals(el.firstChild.firstChild.innerText || el.textContent, content, "Content intact");
		});
	});

	tf.test('ctrl + b twice with null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'B', "Bold tag added");
			tf.assertEquals(el.firstChild.className, 'medium-b', "Bold class added");
			tf.assertEquals(el.firstChild.innerText || el.textContent, content, "Content intact");

			el.onkeydown({
				keyCode: Key.b,
				ctrlKey: true
			});

			tf.assertEquals(medium.value(), content, "Bold removed");
		});
	});

	tf.test('ctrl + i null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.i,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'I', "Italic tag added");
			tf.assertEquals(el.firstChild.className, 'medium-i', "Italic class added");
			tf.assertEquals(el.firstChild.innerText || el.textContent, content, "Content intact");
		});
	});

	tf.test('ctrl + i default on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		},function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.i,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'P', "Wrapped in paragraph");
			tf.assertEquals(el.firstChild.firstChild.nodeName, 'I', "Italic tag added");
			tf.assertEquals(el.firstChild.firstChild.className, 'medium-i', "Italic class added");
			tf.assertEquals(el.firstChild.firstChild.innerText || el.textContent, content, "Content intact");
		});
	});

	tf.test('ctrl + i twice with null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.i,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'I', "Italic tag added");
			tf.assertEquals(el.firstChild.className, 'medium-i', "Italic class added");
			tf.assertEquals(el.firstChild.innerText || el.textContent, content, "Content intact");

			el.onkeydown({
				keyCode: Key.i,
				ctrlKey: true
			});

			tf.assertEquals(medium.value(), content, "Italic removed");
		});
	});

	tf.test('ctrl + u null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.u,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'U', "Underline tag added");
			tf.assertEquals(el.firstChild.className, 'medium-u', "Underline class added");
			tf.assertEquals(el.firstChild.innerText || el.textContent, content, "Content intact");
		});
	});

	tf.test('ctrl + u default on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		},function(medium, el) {
			var content  = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.u,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'P', "Wrapped in paragraph");
			tf.assertEquals(el.firstChild.firstChild.nodeName, 'U', "Underline tag added");
			tf.assertEquals(el.firstChild.firstChild.className, 'medium-u', "Underline class added");
			tf.assertEquals(el.firstChild.firstChild.innerText || el.textContent, content, "Content intact");
		});
	});

	tf.test('ctrl + u twice with null tags on rich mode', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text',
			tags: null
		}, function(medium, el) {
			var content = 'Lorem ipsum dolor sit amet.';

			medium.value(content);

			medium.select();

			el.onkeydown({
				keyCode: Key.u,
				ctrlKey: true
			});

			tf.assertEquals(el.firstChild.nodeName, 'U', "Underline tag added");
			tf.assertEquals(el.firstChild.className, 'medium-u', "Underline class added");
			tf.assertEquals(el.firstChild.innerText || el.textContent, content, "Content intact");

			el.onkeydown({
				keyCode: Key.u,
				ctrlKey: true
			});

			tf.assertEquals(medium.value(), content, "Underline removed");
		});
	});
})(tf);