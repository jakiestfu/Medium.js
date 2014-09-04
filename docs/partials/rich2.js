var article2 = document.getElementById('article2'),
    article2Medium = new Medium({
        element: article2,
        mode: Medium.richMode,
        placeholder: 'Your Article 2',
        attributes: null,
		tags: null
    });

document.getElementById('rich2-insert').onmousedown = function() {
    article2Medium.focus();
    article2Medium.insertHtml(
'<p style="background-color: yellow;">\
	Happy day!  I can work with buttons too!\
</p>');

    return false;
};