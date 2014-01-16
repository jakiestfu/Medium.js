var article2 = document.getElementById('article2'),
    article2Button = document.getElementById('article2Button'),
    article2Medium = new Medium({
        element: article2,
        mode: 'rich',
        placeholder: 'Your Article 2',
        attributes: {
            remove: []
        }
    });

article2Button.onmousedown = function() {
    (new Medium.Html(article2Medium, '<p style="background-color: rgba(255, 255, 0, 0.3);">Happy day!  I can work with buttons too!</p>'))
        .insert();
};