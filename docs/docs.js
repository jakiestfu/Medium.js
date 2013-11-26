var applyPrism = function(){
	$('[data-src]').each(function(){
		var _this = $(this),
			isJS = (_this[0].dataset.src).indexOf('.js')!=-1 || (_this[0].dataset.src).indexOf('.php')!=-1;
		$.ajax({
			url: 'partials/'+_this[0].dataset.src+'?'+ new Date().getTime(),
			dataType:'text',
			success: function(d){
				if(isJS){
					_this.html('<code class="language-javascript"></code>');
				} else {
					_this.html('<code class="language-markup"></code>');
				}
				
				_this.find('code').text(d);
				Prism.highlightElement(_this.find('code')[0]);
				var r = _this.html();
				r = r.replace(/_FOLD_/g, '<div class="fold"></div>');
				_this.html(r);
			}
		});
	});
	$('.span4 pre').each(function(){
		Prism.highlightElement($(this).find('code')[0]);
	});
},

applyMedium = function(){
    new Medium({
        element: document.getElementById('title'),
        mode: 'inline',
        maxLength: 25,
        placeholder: 'Your Title'
    });
    
    new Medium({
        element: document.getElementById('article'),
        mode: 'rich',
        placeholder: 'Your Article'
    });

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


    new Medium({
        element: document.getElementById('comment'),
        mode: 'partial',
        placeholder: 'Your Comment'
    });
};


$(document).ready(function(){
    
    applyMedium();
    applyPrism();
});