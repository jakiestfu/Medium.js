(function(){
	var article = document.getElementById('rich_with_invoke_element'),
		container = article.parentNode,
	    medium = new Medium({
	        element: article,
	        mode: Medium.richMode,
	        placeholder: 'Your Article',
	        attributes: null,
	        tags: null,
		    pasteAsText: false
	    });

		article.highlight = function() {
		if (document.activeElement !== article) {
			medium.select();
		}
	};


	container.querySelector('.bold').onmousedown = function() {
		article.highlight();
		medium.invokeElement('b', {
		    title: "I'm bold!",
		    style: "color: #66d9ef"
	    });
		return false;
	};

	container.querySelector('.underline').onmousedown = function() {
		article.highlight();
		medium.invokeElement('u', {
			title: "I'm underlined!",
			style: "color: #a6e22e"
		});
		return false;
	};

	container.querySelector('.italic').onmousedown = function() {
		article.highlight();
		medium.invokeElement('i', {
			title: "I'm italics!",
			style: "color: #f92672"
		});
		return false;
	};

	container.querySelector('.strike').onmousedown = function() {
		article.highlight();
		medium.invokeElement('strike', {
			title: "I've been struck!",
			style: "color: #e6db74"
		});
		return false;
	};
})();