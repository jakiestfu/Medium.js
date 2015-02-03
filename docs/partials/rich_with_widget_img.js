(function() {
	var article = document.getElementById('rich_with_widget_img');

	new Medium({
        element: article,
        mode: Medium.richMode,
        placeholder: 'Your Article',
        attributes: null,
        tags: null,
	    drag: true
    });
})();