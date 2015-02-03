(function() {
	var article = document.getElementById('rich_with_insert_html_object'),
		container = article.parentNode,
	    medium = new Medium({
	        element: article,
	        mode: Medium.richMode,
	        placeholder: 'Your Article',
		    tags: null,
	        attributes: null,
		    keyContext: {
			    'enter': function(e, element) {
				    var sib = element.previousSibling;

				    if (sib && sib.tagName == 'LI') {
					    element.style.color = sib.style.color;
					    element.className = sib.className;
					    this.cursor.caretToBeginning(element);
				    }
			    }
		    }
	    });

	container.querySelector('.li').onmousedown = function() {
		var ul = document.createElement('ul'),
			li = document.createElement('li');

		ul.style.border = 'dashed 5px #F92672';
		ul.className = 'ul-special';
		ul.appendChild(li);

		li.innerHTML = 'I came from an Object!';
		li.style.color = '#57ad68';
		li.className = 'li-special';

	    medium.focus();
	    medium.insertHtml(ul);

	    return false;
	};
})();