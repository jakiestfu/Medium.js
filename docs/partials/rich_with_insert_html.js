(function() {
    var article = document.getElementById('rich_with_insert_html'),
        container = article.parentNode,
        medium = new Medium({
            element: article,
            mode: Medium.richMode,
            placeholder: 'Your Article',
            attributes: null,
            tags: null
        });

    container.querySelector('.insert').onmousedown = function() {
        medium.focus();
        medium.insertHtml(
'<p style="background-color: yellow;">\
	Happy day!  I can work with buttons too!\
</p>'
        );

        return false;
    };
})();