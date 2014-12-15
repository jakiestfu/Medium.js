var applyPrism = function(){
    var jsPattern = /[.](js)$/i;
	$('[data-src]').each(function(){
		var that = this,
            src = this.getAttribute('src') || this.getAttribute('data-src'),
			htmlSource = this.innerHTML;

		$.ajax({
			url: 'partials/' + src + '?' + new Date().getTime(),
			dataType:'text',
			success: function(d){
				if (that.nodeName === 'PRE') {
					var html = $(that)
						.text(d)
						.addClass(src.match('.js') ? 'language-javascript' : 'language-markup');

					Prism.highlightElement(that);

					setTimeout(function() {
						html.attr('data-language', src.match('.js') ? 'javascript' : 'html');
					}, 1);
				} else {
					var htmlPre = $('<pre>').insertAfter(that),
						html = $('<code>')
							.text(htmlSource.replace(/\n\s{12}/g, '\n'))
							.appendTo(htmlPre),
						jsPre = $('<pre>').insertAfter(htmlPre),
						js = $('<code>')
							.text(d)
							.appendTo(jsPre);


					html.addClass('language-markup');
					js.addClass('language-javascript');

					Prism.highlightElement(html[0]);
					Prism.highlightElement(js[0]);

					setTimeout(function() {
						html.attr('data-language', 'html');
					},1);

					jsPre.hide();
					htmlPre.hide();

					$('<img class="view-source" src="img/eye.svg" alt="view source" title="view source"/>')
						.click(function() {
							if (jsPre.is(':hidden')) {
								$(that).slideUp();
								jsPre.slideDown();
								htmlPre.slideDown();
							} else {
								$(that).slideDown();
								jsPre.slideUp();
								htmlPre.slideUp();
							}
						})
						.insertBefore($(that).prev());

					if (!htmlSource.match('<')) {
						htmlPre.remove();
					}
				}
			}
		});
	});
};

//override the internal event handler to use jQuery for easy demoing
Medium.Utilities.triggerEvent = function(element, eventName) {
	$(element).trigger(eventName);
};


applyPrism();

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
});