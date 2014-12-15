var article5 = document.getElementById('article5'),
	article5Medium = new Medium({
        element: article5,
        mode: Medium.richMode,
        placeholder: 'Your Article 5',
        attributes: null,
        tags: null,
	    pasteAsText: false,
	    drag: true
    });

article5.highlight = function() {
	if (document.activeElement !== article4) {
		article5Medium.select();
	}
};

document.getElementById('rich5-bold').onmousedown = function() {
	article5.highlight();
	article5Medium.invokeElement('b', {
	    title: "I'm bold!",
	    style: "color: #66d9ef"
    });
	return false;
};

document.getElementById('rich5-underline').onmousedown = function() {
	article5.highlight();
	article5Medium.invokeElement('u', {
		title: "I'm underlined!",
		style: "color: #a6e22e"
	});
	return false;
};

document.getElementById('rich5-italic').onmousedown = function() {
	article5.highlight();
	article5Medium.invokeElement('i', {
		title: "I'm italics!",
		style: "color: #f92672"
	});
	return false;
};

document.getElementById('rich5-strike').onmousedown = function() {
	article5.highlight();
	article5Medium.invokeElement('strike', {
		title: "I've been struck!",
		style: "color: #e6db74"
	});
	return false;
};