tf.test('ctrl + b default on rich mode', function() {
	Medium.Utilities.addEvent = function(element, eventName, func) {
		element['on' + eventName] = func;

		return this;
	};

	var body = document.body,
		el = document.createElement('div'),
		medium,
		result;

	el.innerHTML = 'Swag gentrify leggings umami roof party, Pitchfork Vice fap readymade Marfa Austin Tonx.';
	body.appendChild(el);

	medium = new Medium({
		element: el,
		mode: Medium.richMode,
		placeholder: 'Your text'
	});

	medium.select();
	el.onkeydown({
		keyCode: Key.b,
		ctrlKey: true
	});

	result = el.innerHTML;

	el.onkeyup({
		keyCode: Key.b,
		ctrlKey: true
	});

	tf.assertNotEquals(el.innerHTML, result, "Bold removed");
});

tf.test('ctrl + b null tags on rich mode', function() {
	Medium.Utilities.addEvent = function(element, eventName, func) {
		element['on' + eventName] = func;

		return this;
	};

	var body = document.body,
		el = document.createElement('div'),
		medium,
		result;

	el.innerHTML = 'Swag gentrify leggings umami roof party, Pitchfork Vice fap readymade Marfa Austin Tonx.';
	body.appendChild(el);

	medium = new Medium({
		element: el,
		mode: Medium.richMode,
		placeholder: 'Your text',
		tags: null
	});

	medium.select();
	el.onkeydown({
		keyCode: Key.b,
		ctrlKey: true
	});

	result = el.innerHTML;

	el.onkeyup({
		keyCode: Key.b,
		ctrlKey: true
	});

	tf.assertEquals(el.innerHTML, result, "Bold remains");
});