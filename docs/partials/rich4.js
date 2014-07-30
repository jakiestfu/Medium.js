var article4 = document.getElementById('article4'),
    article4Button = document.getElementById('article4Button'),
    article4Medium = new Medium({
        element: article4,
        mode: Medium.richMode,
        placeholder: 'Your Article 4',
        attributes: null,
        tags: null
    });

article4Button.onmousedown = function() {
    if (document.activeElement !== article4) {
        article4Medium.select();
    }

    article4Medium.invokeElement('b', {
	    title: "I'm an invoked element",
	    style: "background-color: #66D9EF; color: #272B2F"
    });

    return false;
};