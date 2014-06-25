var article2 = document.getElementById('article2'),
    article2Button = document.getElementById('article2Button'),
    article2Medium = new Medium({
        element: article2,
        mode: Medium.richMode,
        placeholder: 'Your Article 2',
        attributes: {
            remove: []
        }
    });

article2Button.onmousedown = function(e) {
	e.preventDefault();
    article2Medium.focus();
    article2Medium.insertHtml(
'<p style="background-color: rgba(255, 255, 0, 0.3);">\
	Happy day!  I can work with buttons too!\
</p>');
};