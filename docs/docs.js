var applyPrism = function(){
    var jsPattern = /[.](js)$/i;
	$('[data-src]').each(function(){
		var that = $(this),
            src = this.getAttribute('src') || this.getAttribute('data-src'),
			isJS = jsPattern.test(src);

		$.ajax({
			url: 'partials/' + src + '?' + new Date().getTime(),
			dataType:'text',
			success: function(d){
				if(isJS){
                    that.html('<code class="language-javascript"></code>');
				} else {
                    that.html('<code class="language-markup"></code>');
				}

                that.find('code').text(d);
				Prism.highlightElement(that.find('code')[0]);
				var r = that.html();
				r = r.replace(/_FOLD_/g, '<div class="fold"></div>');
                that.html(r);
			}
		});
	});
};

$(function(){
	if (Medium.prototype.behavior() == 'wild') {
		$('div.domesticated').hide();
	}

	//Make menu toggle-able, so it doesn't hog all the realestate
	var menu = $('#menu'),
		links = menu.find('ul'),
		viewPort = $('html,body');

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

	links.find('a').click(function(e) {
		e.preventDefault();
		var target = $(this.getAttribute('href').valueOf());
		viewPort.animate({
			'scrollTop': target.offset().top
		}, 1000, function() {
			target.animate({
				'padding-left': '10%'
			},500, function() {
				target.animate({
					'padding-left': '0px'
				}, 2000);
			});
		});
	});

	menu.up();

	menu.find('.actuator')
		.click(function(e) {
			e.preventDefault();
			menu.toggleUpDown();
		});

    applyPrism();
});