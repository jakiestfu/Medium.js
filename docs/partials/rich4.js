var article4 = document.getElementById('article4'),
    article4Medium = new Medium({
        element: article4,
        mode: Medium.richMode,
        placeholder: 'Your Article 4',
        attributes: null,
        tags: null,
	    pasteAsText: false
    });

article4.highlight = function() {
	if (document.activeElement !== article4) {
		article4Medium.select();
	}
};

document.getElementById('rich4-bold').onmousedown = function() {
	article4.highlight();
    article4Medium.invokeElement('b', {
	    title: "I'm bold!",
	    style: "color: #66d9ef"
    });
	return false;
};

document.getElementById('rich4-underline').onmousedown = function() {
	article4.highlight();
	article4Medium.invokeElement('u', {
		title: "I'm underlined!",
		style: "color: #a6e22e"
	});
	return false;
};

document.getElementById('rich4-italic').onmousedown = function() {
	article4.highlight();
	article4Medium.invokeElement('i', {
		title: "I'm italics!",
		style: "color: #f92672"
	});
	return false;
};

document.getElementById('rich4-strike').onmousedown = function() {
	article4.highlight();
	article4Medium.invokeElement('strike', {
		title: "I've been struck!",
		style: "color: #e6db74"
	});
	return false;
};