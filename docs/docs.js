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
};

$(function(){
	if (Medium.prototype.behavior() == 'wild') {
		$('div.domesticated').hide();
	}

	//Make menu toggle-able, so it doesn't hog all the realestate
	var menu = $('#menu'),
		links = menu.find('ul');

	menu.down = function() {
		this.isUp = false;
		menu.css('top', 0);
	};
	menu.up = function() {
		menu.isUp = true;
		menu.css('top', (-links.outerHeight() + 5) + 'px');
	};
	menu.toggleUpDown = function() {
		if (menu.isUp) {
			menu.down();
		} else {
			menu.up();
		}
	};

	menu.up();

	menu.find('.actuator')
		.click(function(e) {
			e.preventDefault();
			menu.toggleUpDown();
		});

    applyPrism();
});