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
						events[eventName][i].apply(this, arguments);
					}
				};
			}

			return this;
		},
		originalMediumPrompt = Medium.prototype.prompt,
		overrideMediumPrompt = function(callback) {
			callback('');
		},
		run = function(options, fn) {
			Medium.Utilities.addEvent = overrideAddEvent;
			Medium.prototype.prompt = overrideMediumPrompt;

			var el = document.createElement('div'),
				medium;

			body.appendChild(el);

			options.element = el;

			medium = new Medium(options);

			fn(medium, el);

			medium.destroy();
			el.parentNode.removeChild(el);
			Medium.Utilities.addEvent = originalAddEvent;
			Medium.prototype.prompt = originalMediumPrompt;
		};

	tf.test('ctrl + p ordering', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		}, function(medium, el) {
			var result = 'top<br><br>bottom',
				clipboard = 'top\n\n\n\nbottom';

			el.innerHTML = '';

			el.onpaste({
				keyCode: Key.p,
				ctrlKey: true,
				clipboardData: {
					types: ['text/plain'],
					getData: function () {
						return clipboard;
					}
				}
			});

			// in some browsers whitespace is added to the text on paste,
			// so we just test to see if the innerHTML matches result
			tf.assertEquals((new RegExp(result)).test(el.innerHTML), true, "Paste ordering");
		});
	});

	tf.test('ctrl + p plain to beginning', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		}, function(medium, el) {
			var result = ', consecteturLorem ipsum dolor sit amet.',
				clipboard = ', consectetur';

			el.innerHTML = 'Lorem ipsum dolor sit amet.';

			medium.focus();

			el.onpaste({
				keyCode: Key.p,
				ctrlKey: true
			});

			tf.assertNotEquals(el.innerHTML, result, "Pasted at beginning");
		});
	});

	tf.test('ctrl + p plain to ending', function() {
		run({
			mode: Medium.richMode,
			placeholder: 'Your text'
		}, function(medium, el) {
			var result = 'Lorem ipsum dolor sit amet., consectetur',
				clipboard = ', consectetur';

			el.innerHTML = 'Lorem ipsum dolor sit amet.';

			medium.focus();
			medium.cursor.caretToEnd(el);
			el.onpaste({
				keyCode: Key.p,
				ctrlKey: true
			});

			tf.assertNotEquals(el.innerHTML, result, "Pasted at ending");
		});
	});
})(tf);
