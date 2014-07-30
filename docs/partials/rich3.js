var article3 = document.getElementById('article3'),
    article3Button = document.getElementById('article3Button'),
    article3Medium = new Medium({
        element: article3,
        mode: Medium.richMode,
        placeholder: 'Your Article 3',
	    tags: null,
        attributes: {
            remove: []
        },
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

article3Button.onmousedown = function() {
	var ul = document.createElement('ul'),
		li = document.createElement('li');

	ul.style.border = 'dashed 5px #F92672';
	ul.className = 'ul-special';
	ul.appendChild(li);

	li.innerHTML = 'I came from an Object!';
	li.style.color = 'blue';
	li.className = 'li-special';

    article3Medium.focus();
    article3Medium.insertHtml(ul);
	article3Medium.cursor.caretToBeginning(li);

    return false;
};