var article2Medium = new Medium({
    element: document.getElementById('article2'),
    mode: 'rich',
    placeholder: 'Your Article 2',
    attributes: {
        remove: []
    }
});

document.getElementById('article2Button').onclick = function() {
    document.execCommand('insertHTML', false, '<p id="justInserted" style="background-color: rgba(255, 255, 0, 0.3);">Happy day!  I can work with buttons too!</p>');
    var m = article2Medium,
        justInserted = document.getElementById('justInserted');
    justInserted.removeAttribute('id');
    m.utils.html.clean();
    m.utils.html.placeholders();
};