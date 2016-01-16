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

       tf.test('Delete twice on rich mode', function() {
            run({
                mode: Medium.richMode,
                placeholder: 'Your text'
            }, function(medium, el) {
                //first delete
                el.onkeydown({
                    keyCode: Key.delete
                });

                //Second delete
                el.onkeydown({
                    keyCode: Key.delete
                });

                tf.assertEquals(el.firstChild.nodeName, 'P', "Paragraph Added");
                tf.assertEquals(el.firstChild.innerHTML, '&nbsp;', "Initial content set");
            });
        });

        tf.test('Select all and delete on rich mode', function() {
            run({
                mode: Medium.richMode,
                placeholder: 'Your text'
            }, function(medium, el) {
                var content = 'Lorem ipsum dolor sit amet.';
                medium.value(content);
                medium.select();
                el.onkeydown({
                    keyCode: Key.delete
                });
                tf.assertEquals(el.firstChild.nodeName, 'P', "Paragraph Added");
                tf.assertEquals(el.firstChild.innerHTML, '&nbsp;', "Initial content set");
            });
        });
})(tf);