var article3 = document.getElementById('article3'),
    article3Button = document.getElementById('article3Button'),
    article3Medium = new Medium({
        element: article3,
        mode: Medium.richMode,
        placeholder: 'Your Article 3',
        attributes: {
            remove: []
        }
    });

article3Button.onmousedown = function(e) {
	e.preventDefault();

	var p = document.createElement('p');

	p.style.border = 'dashed 5px #F92672';
	p.className = 'insertedElement';
	p.innerHTML = 'I came from an Object!';

    article3Medium.focus();
    article3Medium.insertHtml(p);
};