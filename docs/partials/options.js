new Medium({
	element: null,
	modifier: 'auto',
	placeholder: "",
	autofocus: false,
	autoHR: true,
	mode: Medium.richMode,
	maxLength: -1,
	modifiers: {
		'b': 'bold',
		'i': 'italicize',
		'u': 'underline',
		'v': 'paste'
	},
	tags: {
		'break': 'br',
		'horizontalRule': 'hr',
		'paragraph': 'p',
		'outerLevel': ['pre', 'blockquote', 'figure'],
		'innerLevel': ['a', 'b', 'u', 'i', 'img', 'strong']
	},
	cssClasses: {
		editor: 'Medium',
		pasteHook: 'Medium-paste-hook',
		placeholder: 'Medium-placeholder',
		clear: 'Medium-clear'
	},
	attributes: {
		remove: ['style', 'class']
	},
	pasteAsText: true,
	beforeInvokeElement: function () {
		//this = Medium.Element
	},
	beforeInsertHtml: function () {
		//this = Medium.Html
	},
	beforeAddTag: function (tag, shouldFocus, isEditable, afterElement) {
	},
	keyContext: null,
	pasteEventHandler: function(e) {
		/*default paste event handler*/
	}
});