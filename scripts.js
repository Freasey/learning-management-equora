$(window).bind('load', function(){
	console.log('Loaded');
});

$(document).ready(function() {

  var timeout;
  var delay = 1000; 

initFunctions();

// UBAH ARGUMEN UNTUK DITAMPILKAN PADA WELCOME BAR
// COMMENT BARIS 8 - 15 JIKA TIDAK MAU MENAMPILKAN WELCOME BAR

setWelcomeBar(
	'', // Tipe Bar
	'Telah terbit kebijakan terbaru tentang <b>Kurikulum Merdeka</b>.', // Teks Bar
	'Lihat', // Tombol Bar
	'./pengembangan-kurikulum' // Link Tombol
);

showWelcomeBar();

// TRANSITION HOOKS
// CALL FUNCTIONS
function initFunctions() {
	reinitHandlers();
    menuDropDown();
	updateTitle();
	flyoutExpcol();
	checkBoldNav();
	loadSideMenu();
	loadTabsMenu();
	loadTabsVertMenu();
	loadTabsHorzMenu();
	scrollToTop();
	hideFlyout();
	searchResultModal();
	stickyHeaderCheck();
	stickyHeader();
	hamburgerOpen();
	accordionMechanism();
    checkExpandMechanism();
	// stickElements();
	openModalPopup();
    carouselMechanism();
	// fileAccordionMechanism();
	fileAccordionMechanism2();
    accordionMechanism2();
//    filter_data();
//    filter_cp();
    filter_pmp();
    cari_data();
    ajax_rujukan();
    ajax_berita();

    if($('.search_ikm').length > 0) {
        filter_ikm_kota('','');
    }

    ceknewscookie();
	PreviewModal();
    $('.selector').click(function(){ filter_data(); });

  var timeout;
  var delay = 1000; 

    $('.selector2').keyup(function(){
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            cari_data();
        }, delay);
    });
}

// REINITIALIZE HTML
function reinitHandlers() {
	$('.expcol').off();
	$('.button-cs').off();
	$('.column.side-menu-item').off();
	$('.column.tabs-menu-item').off();
	$('.flyout-cs-minimize').off();
	$('.acc-heading').off();
	$('.filac-heading').off();
	$('.header .logo .link').off();
	$('.header .hamburger').off();
	$('.header .menu-link').off();
	$('.menu-expand').off();
	$('.bar-close').off();
	$('#tb-search').off();
	$('.modal').off();
	$('.modal-close').off();
	$('.modal-content').off();
	$('a[href*="#mp"]').off();
}

// UPDATE JUDUL DI TITLE BAR
function updateTitle() {
	let pageTitle = $('main').attr('data-page-title');
	if (pageTitle != '') {
		$(document).attr('title', pageTitle + ' | Sistem Informasi Kurikulum Nasional');
	} else {
		$(document).attr('title', 'Sistem Informasi Kurikulum Nasional');
	}
}

// FLYOUT EXPAND-COLLAPSE CLICK
// function kurikulumDropDown() {
// 	if (window.matchMedia('(max-width: 544px)').matches != true) {
// 		$('.kurikulum.menu-link').hover(
// 			function() {
// 				$(this).find('.menu-drop-down-wrapper').fadeIn('fast');
// 			}, function() {
// 				$(this).find('.menu-drop-down-wrapper').fadeOut('fast');
// 			}
// 		);
// 	}
// }
// FLYOUT EXPAND-COLLAPSE CLICK
function menuDropDown() {
	if (window.matchMedia('(max-width: 544px)').matches != true) {
		$('.menu-link.menu-drop-exist').each(function(index, el) {
			$(this).hover(
				function() {
					$(this).find('.menu-drop-down-wrapper').fadeIn(100);
				}, function() {
					$(this).find('.menu-drop-down-wrapper').fadeOut(100);
				}
			);
		});
	}
}

// INITIALIZE WELCOME BAR
function setWelcomeBar() {
 var barType = document.getElementById("breaking").getAttribute("data-bartype");
 var barText = document.getElementById("breaking").getAttribute("data-bartext");
 var barBtn = document.getElementById("breaking").getAttribute("data-barbtn");
 var barLnk = document.getElementById("breaking").getAttribute("data-barlnk");

	var barTypeCheck;
	switch (barType) {
		case 'default':
			barTypeCheck = '';
			break;
		case 'success':
			barTypeCheck = ' bar-success';
			break;
		case 'error':
			barTypeCheck = ' bar-error';
			break;
		case 'warning':
			barTypeCheck = ' bar-warning';
			break;
		case 'info':
			barTypeCheck = ' bar-info';
			break;
  		default:
			barTypeCheck = '';
	};
	if (barText == '' || barText == undefined) {barText = 'Selamat datang di Sistem Informasi Kurikulum Nasional.'};
	if (barBtn == '' || barBtn == undefined) {barBtn = 'OK'};
	if (barLnk == '' || barLnk == undefined) {barLnk = '#'};
	$('body').prepend('<div class="welcome-bar align items-center content-center' + barTypeCheck + '"><div class="row align items-center content-spbw gap-24"><div class="row align items-center content-flst gap-8 welcome-bar-content"><div class="align left bar-txt">' + barText + '</div><div class="align left bar-btn"><a href="' + barLnk + '" data-barba-prevent="self" target="_blank">' + barBtn + '</a></div></div><div class="bar-close">close</div></div></div>');
}

// SHOW WELCOME BAR
function showWelcomeBar() {
    var cekbarText = document.getElementById("breaking").getAttribute("data-bartext");

	if ($('main').attr('data-barba-namespace') == 'home') {
        if (cekbarText != '' && cekbarText != undefined) {
    		$('.welcome-bar').animate({height: ($('.welcome-bar-content').height() + 32)},{duration: 250,specialEasing: {height: "swing"}});
    		$("html, body").animate({scrollTop: 0}, 50);
    		closeBtnWelcomeBar();
    		$('.welcome-bar').addClass('shown');
    		$('.header.menu').addClass('shown');
        }
        else {
    		hideWelcomeBar();
        }
	} else {
		hideWelcomeBar();
	}
}

// HIDE WELCOME BAR
function hideWelcomeBar() {
	$('.welcome-bar').animate({height: 0},{duration: 250,specialEasing: {height: "swing"}});
	$('.welcome-bar').removeClass('shown');
	$('.header.menu').removeClass('shown');
}

// WELCOME BAR CLOSE BUTTON
function closeBtnWelcomeBar() {
	$('.bar-close').on('click',function() {
		hideWelcomeBar();
	});
}

// CAROUSEL MECHANISM
function carouselMechanism() {
	var swiper = new Swiper('.swiper-container', {
		spaceBetween: 30,
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
	    navigation: {
		    nextEl: '.swiper-button-next',
		    prevEl: '.swiper-button-prev'
		},
		loop: true,
		lazy: true,
		checkInView: true,
		autoplay: {
			delay: 5000,
		    disableOnInteraction: false,
		    pauseOnMouseEnter: true,
		},
		mousewheel: {
	        forceToAxis: true,
	        invert: true,
	    },
		breakpoints: {
			544: {
				slidesPerView: 1
			},
			640: {
				slidesPerView: 3
			}
		}
	});
	var swiper_wide = new Swiper('.swiper-wide', {
		spaceBetween: 30,
		slidesPerView: 1,
		pagination: {
			el: '.swiper-wide-pagination',
			clickable: true,
		},
	    navigation: {
		    nextEl: '.swiper-wide-button-next',
		    prevEl: '.swiper-wide-button-prev'
		},
		loop: true,
		lazy: true,
		checkInView: true,
		autoplay: {
			delay: 5000,
		    disableOnInteraction: false,
		    pauseOnMouseEnter: true,
		},
		mousewheel: {
	        forceToAxis: true,
	        invert: true,
	    }
	});
}

// FLYOUT EXPAND-COLLAPSE CLICK
function flyoutExpcol() {
	$('.expcol').on('click',function() {
		flyoutToggle();
		menuClose();
	});
	$('.button-cs').on('click',function() {
		flyoutClose();
		menuClose();
	});
}

// FLYOUT TOGGLE
function flyoutToggle() {
	if (window.matchMedia('(max-width: 544px)').matches == true) {
		disableScroll();
	}
	$('.flyout-cs').toggleClass('expanded');
	$('.flyout-cs .balloon').toggleClass('expanded');
	$('.flyout-cs .expcol').toggleClass('expanded');
	if ($('html').find('.welcome-bar').length !== 0) {
		$('.welcome-bar').toggleClass('expanded');
	}
}

// FLYOUT COLLAPSE
function flyoutClose() {
	if (window.matchMedia('(max-width: 544px)').matches == true) {
		enableScroll();
	}
	$('.flyout-cs').removeClass('expanded');
	$('.flyout-cs .balloon').removeClass('expanded');
	$('.flyout-cs .expcol').removeClass('expanded');
	if ($('html').find('.welcome-bar').length !== 0) {
		$('.welcome-bar').removeClass('expanded');
	}
}

// MAKE CURRENT NAV ITEM BOLD
function checkBoldNav() {
	$('.menu-link a').each(function() {
		$(this).removeClass('active');
	});
		let checkPage = $('main').attr('class').split(/\s+/);
		checkPageClass = checkPage[0];
		$('.menu-link').each(function() {
			let checkNav = $(this).attr('class').split(/\s+/);
			checkNavClass = checkNav[0];
			if (checkPageClass == checkNavClass) {
				$(this).find('a').addClass('active');
		};
	});
}

// LOAD SIDE MENU CONTENT
function loadSideMenu() {
	$('.side-menu-item').on('click',function(e){
		e.preventDefault();
		let loc = window.location.href;
		let locpop = window.location.href.split("/").pop();
		    locpop = locpop.replace("#","");
		let linkto = "a[linkto='" + locpop + "']";
		if ($(this).attr("linkto") != null) {
            if (locpop == $("main").attr("data-barba-namespace")) {
                window.history.pushState({}, "", loc + "/" + $(this).attr("linkto"));
            } else {
                loc = window.location.href.split("/");
                loc.splice(-1);
                loc = loc.join('/');
                window.history.pushState({}, "", loc + "/" + $(this).attr("linkto"));
            }
        }
		let selectedItem = $(this).attr('id');
		let selectedItemGroup = selectedItem.split('-');
		$('.side-menu-content'+'.'+selectedItemGroup[0]).find('.side-menu-content-wrapper').each(function() {
			$(this).hide();
		});
		$('#'+ selectedItem + '-c').fadeIn('fast');
		$(this).parents().find('.side-menu'+'.'+selectedItemGroup[0]+' .side-menu-item').removeClass('active');
		$(this).addClass('active');
		$('.side-menu').sticky('update');
		return false;
	});
	$('.side-menu-content').each(function() {
		$(this).find('.side-menu-content-wrapper').hide();
		$(this).find('.active').show();
	});
	$('.side-menu-content').each(function() {
		$(this).find('.side-menu-content-wrapper').hide();
		$(this).find('.active').show();
	});
    
}

// LOAD TABS VERT MENU CONTENT
function loadTabsVertMenu() {
	$('.tabs-vert-menu-item').on('click', function(e) {
		e.preventDefault();

		const selectedItem = $(this).attr('id');
		const selectedGroup = selectedItem.split('-').slice(0, -1).join('-');

		const linkto = $(this).attr("linkto");
		if (linkto) {
			let loc = window.location.href;
			let locpop = loc.split("/").pop().replace("#", "");
			const currentNamespace = $("main").attr("data-barba-namespace");

			if (locpop === currentNamespace) {
				window.history.pushState({}, "", loc + "/" + linkto);
			} else {
				const locArr = loc.split("/");
				locArr.splice(-1);
				const newLoc = locArr.join('/');
				window.history.pushState({}, "", newLoc + "/" + linkto);
			}
		}

		$(`.tabs-vert-menu-content.${selectedGroup} .tabs-vert-menu-content-wrapper`).hide();
		$(`#${selectedItem}-c`).fadeIn('fast');

		$(this).closest(`.tabs-vert-menu.${selectedGroup}`).find('.tabs-vert-menu-item').removeClass('active');
		$(this).addClass('active');

		$('.tabs-vert-menu').sticky('update');

		return false;
	});

	$('.tabs-vert-menu-content').each(function() {
		$(this).find('.tabs-vert-menu-content-wrapper').hide();
		$(this).find('.active').show();
	});
}

// LOAD TABS HORZ MENU CONTENT
function loadTabsHorzMenu() {
	$('.tabs-horz-menu-item').on('click', function(e) {
		e.preventDefault();

		const selectedItem = $(this).attr('id');
		const selectedGroup = selectedItem.split('-').slice(0, -1).join('-');

		const linkto = $(this).attr("linkto");
		if (linkto) {
			let loc = window.location.href;
			let locpop = loc.split("/").pop().replace("#", "");
			const currentNamespace = $("main").attr("data-barba-namespace");

			if (locpop === currentNamespace) {
				window.history.pushState({}, "", loc + "/" + linkto);
			} else {
				const locArr = loc.split("/");
				locArr.splice(-1);
				const newLoc = locArr.join('/');
				window.history.pushState({}, "", newLoc + "/" + linkto);
			}
		}

		$(`.tabs-horz-menu-content.${selectedGroup} .tabs-horz-menu-content-wrapper`).hide();
		$(`#${selectedItem}-c`).fadeIn('fast');

		$(this).closest(`.tabs-horz-menu.${selectedGroup}`).find('.tabs-horz-menu-item').removeClass('active');
		$(this).addClass('active');

		$('.tabs-horz-menu').sticky('update');

		return false;
	});

	$('.tabs-horz-menu-content').each(function() {
		$(this).find('.tabs-horz-menu-content-wrapper').hide();
		$(this).find('.active').show();
	});
}

// LOAD TABS MENU CONTENT
function loadTabsMenu() {
	$('.tabs-menu-content').each(function() {
		$(this).find('.tabs-menu-content-wrapper').hide();
		$(this).find('.active').show();
	});
	$('.tabs-menu-item').on('click',function(){
		let selectedItem = $(this).attr('id');
		let selectedItemGroup = selectedItem.split('-');
		$('.tabs-menu-content'+'.'+selectedItemGroup[0]).find('.tabs-menu-content-wrapper').each(function() {
			$(this).hide();
		});
		$('#'+ selectedItem + '-c').fadeIn('fast');
		$(this).parents().find('.tabs-menu'+'.'+selectedItemGroup[0]+' .tabs-menu-item').removeClass('active');
		$(this).addClass('active');
		return false;
	});
}

// HIDE FLYOUT
function hideFlyout() {
	$('.flyout-cs-minimize').removeClass('active');
	$('.flyout-cs').removeClass('hidden');
	$('.scrl-top').removeClass('flyhid');
	$('.flyout-cs-minimize').attr('title','Sembunyikan');
	$('.flyout-cs-minimize').click(function() {
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
			$('.flyout-cs').removeClass('hidden');
			$('.scrl-top').removeClass('flyhid');
			$(this).attr('title','Sembunyikan');
		} else {
			$(this).addClass('active');
			$('.flyout-cs').addClass('hidden');
			$('.scrl-top').addClass('flyhid');
			$(this).attr('title','Tampilkan');
		}
		flyoutClose();
	});
}

// SCROLL TO TOP BUTTON
function scrollToTop() {
	$(document).on('scroll', function() {
		var scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		var rasioGulungan = 0.15;
		if ($(window).scrollTop() / scrollableHeight > rasioGulungan) {
		    $('.scrl-top').removeClass('top-hid');
		} else {
			$('.scrl-top').addClass('top-hid');
		}
	});
	$('.scrl-top').click(function() {
		window.scrollTo({
	    	top: 0,
	    	behavior: "smooth"
	  	});
	});
}

// STICKY HEADER CHECK
function stickyHeaderCheck() {
	let sticky = $('.header.wrapper'), scroll = $(window).scrollTop();
	if (scroll > 0) sticky.addClass('sticky');
	else sticky.removeClass('sticky');
}

// STICKY HEADER
function stickyHeader() {
	$(window).scroll(function(){
		let sticky = $('.header.wrapper'), scroll = $(window).scrollTop();
		if (scroll > 0) sticky.addClass('sticky');
		else sticky.removeClass('sticky');
	});
}

// CHECK EXPAND MECHANISM
function checkExpandMechanism() {
	$('.identlv').slideUp();
	$('.checkitem.expandable .expcol').click(function() {
		$(this).toggleClass('expanded');
		$(this).parent().next().slideToggle();
	});
	// $('.checkitem.expandable .stycheckbox').click(function() {
	// 	$(this).parent().find('.expcol').toggleClass('expanded');
	// 	$(this).parent().next('.identlv').slideToggle();
	// });
	$('.checkitem.expandable').click(function() {
		if ($(this).find('input[type="checkbox"]').is(':checked')) {
			$(this).next().find('input[type="checkbox"]').prop('checked', true);
			$(this).next().find('input[type="checkbox"]').removeClass('indeterminate');
			$(this).next().find('.stycheckbox').removeClass('indeterminate');
		} else {
			$(this).next().find('input[type="checkbox"]').prop('checked', false);
		}
	});
	$('.checkitem').click(function() {
		console.log($(this).parent().find('> .checkitem input[type="checkbox"]:checked').length + " of " + $(this).parent().find('> .checkitem input[type="checkbox"]').length);
		if ($(this).parent().find('> .checkitem input[type="checkbox"]:checked').length == $(this).parent().find('> .checkitem input[type="checkbox"]').length) {
			$(this).parent().prev().find('input[type="checkbox"]').prop('checked', true);
			$(this).parent().prev().find('input[type="checkbox"]').removeClass('indeterminate');
			$(this).parent().prev().find('.stycheckbox').removeClass('indeterminate');
		} else if ($(this).parent().find('> .checkitem input[type="checkbox"]:checked').length == 0) {
			$(this).parent().prev().find('input[type="checkbox"]').prop('checked', false);
			$(this).parent().prev().find('input[type="checkbox"]').removeClass('indeterminate');
			$(this).parent().prev().find('.stycheckbox').removeClass('indeterminate');
		} else {
			$(this).parent().prev().find('input[type="checkbox"]').prop('checked', false);
			$(this).parent().prev().find('input[type="checkbox"]').addClass('indeterminate');
			$(this).parent().prev().find('.stycheckbox').addClass('indeterminate');
		}
	});
	$('.modal-result-close').click(function() {
		$('.modal-result').fadeOut('fast');
	});
}

// FLYOUT HASIL PENCARIAN
function searchResultModal() {
	$('#myText').on('input', function() {
		if ($('#myText').val().length >= 3) {
			event.preventDefault();
			$('.modal-result').fadeIn('fast');
		} else {
			event.preventDefault();
			$('.modal-result').fadeOut('fast');
		}
	});
	$('.modal-result').mouseenter(function() {
		if ($('.modal-result').not(':focus')) {
			$('.modal-result').focus();
		}
	});
	$('.modal-result').focusout(function() {
		$('.modal-result').fadeOut('fast');
	});
	$('.modal-result-close').click(function() {
		$('.modal-result').fadeOut('fast');
	});
	$('.rujukan .searchbtn').click(function() {
		window.location = '/hasil-pencarian/?h=rujukan&q=' + $(this).parent().find('#myText').val();
	});
	$('.rujukan #myText').on('keypress', function(e) {
	    if(e.which == 13) {
			window.location = '/hasil-pencarian/?h=rujukan&q=' + $(this).parent().find('#myText').val();
	    }
	});
	$('.faq .searchbtn').click(function() {
		window.location = '/hasil-pencarian/?h=faq&q=' + $(this).parent().find('#myText').val();
	});
	$('.faq #myText').on('keypress', function(e) {
	    if(e.which == 13) {
			window.location = '/hasil-pencarian/?h=faq&q=' + $(this).parent().find('#myText').val();
	    }
	});
}
// OPEN HAMBURGER MENU ON CLICK
function hamburgerOpen() {
	$('.header .hamburger').on('click',function() {
		menuToggle();
		flyoutClose();
	});
	$('.header .menu-link').on('click',function() {
		menuClose();
		flyoutClose();
	});
	$('.header .logo.link').on('click',function() {
		menuClose();
		flyoutClose();
	});
	$('main.wrapper').on('click',function() {
		menuClose();
		flyoutClose();
	});
}

// TOGGLE MOBILE MENU
function menuToggle() {
	$('.header.menu').toggleClass('opened');
	$('.header.menu .menu-item').toggleClass('opened');
	$('.header.menu .menu-link').toggleClass('opened');
	$('.header.logo .hamburger').toggleClass('opened');
	if ($('.header.logo .hamburger').hasClass('opened')) {
		disableScroll();
	} else {
		enableScroll();
	}
}

// MOBILE MENU EXPAND
function mobileMenuExpand() {
	if (window.matchMedia('(max-width: 544px)').matches == true) {
		$('.menu-drop-down-wrapper').slideDown('fast');
		$('.menu-expand').click(function() {
			$('.menu-drop-down-wrapper').slideToggle('fast');
			$('.menu-drop-down-wrapper').toggleClass('expanded');
			$('.menu-drop-arrow').toggleClass('expanded');
			return false;
		});
	}
}

// CLOSE MOBILE MENU
function menuClose() {
	$('.header.menu').removeClass('opened');
	$('.header.menu .menu-item').removeClass('opened');
	$('.header.menu .menu-link').removeClass('opened');
	$('.header.logo .hamburger').removeClass('opened');
	enableScroll();
}

// STICK ELEMENTS
function stickElements() {
	if ($('html').find('.welcome-bar').length !== 0) {
		welcomeBarHeight = $('.welcome-bar').height();
	} else {
		welcomeBarHeight = 0;
	}
	if ($('html').find('.side-menu').length !== 0) {
		if ($('html').find('#lebihlanjut').length !== 0) {
			$('.side-menu').sticky({
				topSpacing: ($('header').offset().top + 96 + 24 - welcomeBarHeight),
				bottomSpacing: ($('html').height() - $('#lebihlanjut').offset().top + 24),
				zIndex: 999
			});
		} else {
			$('.side-menu').sticky({
				topSpacing: ($('header').offset().top + 96 + 24 - welcomeBarHeight),
				bottomSpacing: ($('html').height() - $('footer.footer').offset().top + 24),
				zIndex: 999
			});
		}
	}
	if ($('html').find('.dropdown-banding').length !== 0) {
		$('.dropdown-banding').sticky({
			topSpacing: ($('header').offset().top + 96 + 24 - welcomeBarHeight),
			bottomSpacing: ($('html').height() - $('#lebihlanjut').offset().top + 24 + 24),
			wrapperClassName: 'banding-pin',
			zIndex: 987
		});
	}
}

// OPEN MODAL POPUP
function openModalPopup(e) {
	if ($('.modal-content').find('#videoyoutube').length !== 0) {
		origLink = $('.modal-content').find('#videoyoutube').attr('src');
		$('.modal-content').find('#videoyoutube').wrap('<div class="youtube-container"></div>')
	}
	$('.modal-content .button').each(function() {
		if ($(this).attr('href') !== '#') {
			$(this).click(function(e) {
				e.preventDefault();
				window.open($(this).attr('href'));
			});
		}
	});
	$('.modal-content .link').each(function() {
		if ($(this).attr('href') !== '#') {
			$(this).click(function(e) {
				e.preventDefault();``
				window.open($(this).attr('href'));
			});
		}
	});
	$('a[href*="#mp"]').each(function() {
		$(this).click(function(e) {
			e.preventDefault();
			modalName = $(this).attr('href');
			modalName = modalName.substring(0, modalName.length - 2);
			modalName = modalName.substring(4, modalName.length);
			$('#mp-' + modalName).fadeIn('fast');
			$('#mp-' + modalName).removeClass('modal-closed');
			$('#mp-' + modalName).addClass('modal-opened');
			if ($('#mp-' + modalName).find('video').length !== 0) {
				$('#mp-' + modalName).parents().find('.modal-content').addClass('video-content');
				$('#mp-' + modalName).find('video').get(0).currentTime = 0;
				$('#mp-' + modalName).find('video').get(0).play();
				// $('html').find('.video-preview').get(0).pause();
			}
			if ($('#mp-' + modalName).find('#videoyoutube').length !== 0) {
				$('#mp-' + modalName).parents().find('.modal-content').addClass('video-content');
				$('#mp-' + modalName).find('#videoyoutube').attr('src', origLink + '&autoplay=1');
				// $('html').find('.video-preview').get(0).pause();
			}
			$('body').css('overflow-y', 'hidden');
			disableScroll();
		});
		modalName = $(this).attr('href');
		modalName = modalName.substring(0, modalName.length - 2);
		modalName = modalName.substring(4, modalName.length);
		$('.cl-' + modalName).click(function(e) {
			e.preventDefault();
			$('#mp-' + modalName).fadeOut('fast', function() {
				if ($('#mp-' + modalName).find('video').length !== 0) {
					$('#mp-' + modalName).find('video').get(0).pause();
					$('#mp-' + modalName).find('video').get(0).currentTime = 0;
					// $('html').find('.video-preview').get(0).play();
				}
				if ($('#mp-' + modalName).find('#videoyoutube').length !== 0) {
				    $('#mp-' + modalName).find('#videoyoutube').attr('src','');
					// $('html').find('.video-preview').get(0).play();
				}
				$('#mp-' + modalName).removeClass('modal-opened');
				$('#mp-' + modalName).addClass('modal-closed');
				$('#mp-' + modalName).parents().find('.modal-content').removeClass('video-content');
			});
			$('body').css('overflow-y', 'auto');
			enableScroll();
		});
		$('.modal-close-dis').click(function(e) {
			e.preventDefault();
			$('#mp-' + modalName).fadeOut('fast', function() {
				if ($('#mp-' + modalName).find('video').length !== 0) {
					$('#mp-' + modalName).find('video').get(0).pause();
					$('#mp-' + modalName).find('video').get(0).currentTime = 0;
					// $('html').find('.video-preview').get(0).play();
				}
				if ($('#mp-' + modalName).find('#videoyoutube').length !== 0) {
				    $('#mp-' + modalName).find('#videoyoutube').attr('src','');
					// $('html').find('.video-preview').get(0).play();
				}
				$('#mp-' + modalName).removeClass('modal-opened');
				$('#mp-' + modalName).addClass('modal-closed');
				$('#mp-' + modalName).parents().find('.modal-content').removeClass('video-content');
			});
			$('body').css('overflow-y', 'auto');
			enableScroll();
		});
		$('#mp-' + modalName + '.overlay-close').click(function(e) {
			e.preventDefault();
			$('#mp-' + modalName).fadeOut('fast', function() {
				if ($('#mp-' + modalName).find('video').length !== 0) {
					$('#mp-' + modalName).find('video').get(0).pause();
					$('#mp-' + modalName).find('video').get(0).currentTime = 0;
					// $('html').find('.video-preview').get(0).play();
				}
				if ($('#mp-' + modalName).find('#videoyoutube').length !== 0) {
				    $('#mp-' + modalName).find('#videoyoutube').attr('src','');
					// $('html').find('.video-preview').get(0).play();
				}
				$('#mp-' + modalName).removeClass('modal-opened');
				$('#mp-' + modalName).addClass('modal-closed');
				$('#mp-' + modalName).parents().find('.modal-content').removeClass('video-content');
			});
			$('body').css('overflow-y', 'auto');
			enableScroll();
		});
		$('.modal-content').click(function(e) {
			e.preventDefault();
			return false;
		});
	});
}

// AUTOPLAY VIDEO
function autoplayVideo() {
	if ($('html').find('.video-preview').length !== 0) {
		// $('html').find('.video-preview').get(0).play();
	}
}

// scrlTop.addEventListener("click", doScrlTop);

// function doScrlTop() {
//   window.scrollTo({
//     top: 0,
//     behavior: "smooth"
//   });
// }

// ACCORDION MECHANISM
function accordionMechanism() {
	$('.acc-heading').click(function(){
	    $('.acc-heading').not(this).removeClass('active');
		$(this).toggleClass('active');
		$('.acc-heading .acc-content').not($(this).find('.acc-content')).slideUp();
		$(this).find('.acc-content').slideToggle();
	});
	$('.acc-heading').first().click();
}

// FILE ACCORDION MECHANISM
function fileAccordionMechanism() {
	$('.viewoption.itemicon .ic-grid').click(function() {
		$(this).toggleClass('active');
		$('.viewoption.itemicon .ic-list').toggleClass('active');
		$('.file-gridview').addClass('active');
		$('.file-listview').removeClass('active');
	});
	$('.viewoption.itemicon .ic-list').click(function() {
		$(this).toggleClass('active');
		$('.viewoption.itemicon .ic-grid').toggleClass('active');
		$('.file-listview').addClass('active');
		$('.file-gridview').removeClass('active');
	});
	$('.file-listview .filac-wrapper').click(function() {
		$(this).find('.filac-heading').toggleClass('active');
		$(this).find('.filac-content').slideToggle();
	});
	$('.file-listview .op-icon.ic-info').click(function() {
		$(this).find('.filac-heading').toggleClass('active');
		$(this).find('.filac-content').slideToggle();
	});
	$('.file-listview .filac-content').click(function() {return false;});
	$('.file-listview .op-icon.ic-download').click(function() {return false;});
	$('.file-listview .op-icon.ic-view').click(function() {return false;});
	$('.file-listview .op-icon.ic-share').click(function(e) {e.preventDefault();});

	$('.image-holder img').each(function() {
		if ($(this).attr('src') == undefined || $(this).attr('src') == '') {
			$(this).attr('src','./images/placeholder-not-available.svg');
		}
	});
	if (window.matchMedia('(max-width: 544px)').matches != true) {
		$('.file-listview .filac-wrapper').first().click();
	}
}

// CANCEL DEFAULT ACTION
function preventDefault(e) {
	e.preventDefault();
}

// SCROLL DISABLE
var keys = {37: 1, 38: 1, 39: 1, 40: 1}; // left: 37, up: 38, right: 39, down: 40, spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
function preventDefaultForScrollKeys(e) {
	if (keys[e.keyCode]) {
		preventDefault(e);
		return false;
	}
}
var supportsPassive = false;
try {
	window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
		get: function () { supportsPassive = true; } 
}));
} catch(e) {}
var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

// CALL TO DISABLE SCROLL
function disableScroll() {
	window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
	window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
	window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
	window.addEventListener('keydown', preventDefaultForScrollKeys, false);

	if ($('html').find('.modal-content').length !== 0) {
		$('html').find('.modal-content').on('DOMMouseScroll', preventDefault, false); // older FF
		$('html').find('.modal-content').on('scroll', preventDefault, wheelOpt); // modern desktop
		$('html').find('.modal-content').on('touchmove', preventDefault, wheelOpt); // mobile
		$('html').find('.modal-content').on('keydown', preventDefaultForScrollKeys, false);
	}
}

// CALL TO ENABLE SCROLL
function enableScroll() {
	window.removeEventListener('DOMMouseScroll', preventDefault, false);
	window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
	window.removeEventListener('touchmove', preventDefault, wheelOpt);
	window.removeEventListener('keydown', preventDefaultForScrollKeys, false);

	if ($('html').find('.modal-content').length !== 0) {
		$('html').find('.modal-content').on('DOMMouseScroll', preventDefault, false); // older FF
		$('html').find('.modal-content').on('scroll', preventDefault, wheelOpt); // modern desktop
		$('html').find('.modal-content').on('touchmove', preventDefault, wheelOpt); // mobile
		$('html').find('.modal-content').on('keydown', preventDefaultForScrollKeys, false);
	}
}


//// ADDITIONAL ////


// PERBANDINGAN KURIKULUM
    function filter_data() {
      if(document.getElementById("filter_data") !== null && document.getElementById("filter_data") !== 'undefined' ) {
        $('.filter_data').html('<div id="loading"></div>');
        var action = 'fetch_data';
        var jenjang = '51';
                    var x = document.getElementsByName("bd-perbandingan-left");
                	var i = x[0].selectedIndex;
                	var kurikulum = x[0].options[i].value;

                    var x = document.getElementsByName("bd-perbandingan-right");
                	var i = x[0].selectedIndex;
                	var kurikulum2 = x[0].options[i].value;
        
        $.ajax({
            url:"fetch_data.php",
            method:"POST",
            data:{action:action, kurikulum:kurikulum, kurikulum2:kurikulum2, jenjang:jenjang},
            success:function(data){
                $('.filter_data').html(data);
            }
        });

    	$('.dataperbandingan').on(
    	    {
    	        click:function(){
                    $('.filter_data').html('<div id="loading"></div>');
                    var action = 'fetch_data';
            	    var jenjang = $(this).attr('data-bandingan');
                    var x = document.getElementsByName("bd-perbandingan-left");
                	var i = x[0].selectedIndex;
                	var kurikulum = x[0].options[i].value;

                    var x = document.getElementsByName("bd-perbandingan-right");
                	var i = x[0].selectedIndex;
                	var kurikulum2 = x[0].options[i].value;

                    $.ajax({
                        url:"fetch_data.php",
                        method:"POST",
                        data:{action:action, kurikulum:kurikulum, kurikulum2:kurikulum2, jenjang:jenjang},
                        success:function(data){
                            $('.filter_data').html(data);
                            document.getElementById("tb-perbandingan-left").setAttribute("data-jenjang", jenjangsaatini);
                        }
                    });
    	        }
    	    }
    	);
    	$('#tb-perbandingan-left').on(
    	    {
    	        change:function(){
                    $('.filter_data').html('<div id="loading"></div>');
                    var action = 'fetch_data';
            	    var jenjang = document.getElementById("tb-perbandingan-left").getAttribute("data-jenjang");

                    var x = document.getElementsByName("bd-perbandingan-left");
                	var i = x[0].selectedIndex;
                	var kurikulum = x[0].options[i].value;

                    var x = document.getElementsByName("bd-perbandingan-right");
                	var i = x[0].selectedIndex;
                	var kurikulum2 = x[0].options[i].value;


                    $.ajax({
                        url:"fetch_data.php",
                        method:"POST",
                        data:{action:action, kurikulum:kurikulum, kurikulum2:kurikulum2, jenjang:jenjang},
                        success:function(data){
                            $('.filter_data').html(data);
                        }
                    });
    	        }
    	    }
    	);
    	$('#tb-perbandingan-right').on(
    	    {
    	        change:function(){
                    $('.filter_data').html('<div id="loading"></div>');
                    var action = 'fetch_data';
            	    var jenjang = document.getElementById("tb-perbandingan-left").getAttribute("data-jenjang");

                    var x = document.getElementsByName("bd-perbandingan-left");
                	var i = x[0].selectedIndex;
                	var kurikulum = x[0].options[i].value;

                    var x = document.getElementsByName("bd-perbandingan-right");
                	var i = x[0].selectedIndex;
                	var kurikulum2 = x[0].options[i].value;


                    $.ajax({
                        url:"fetch_data.php",
                        method:"POST",
                        data:{action:action, kurikulum:kurikulum, kurikulum2:kurikulum2, jenjang:jenjang},
                        success:function(data){
                            $('.filter_data').html(data);
                        }
                    });
    	        }
    	    }
    	);
      }

    }

    function get_filter(class_name) {
        var filter = [];
        $('.'+class_name+':checked').each(function(){
            filter.push($(this).val());
        });
        return filter;
    }

    $('.selector').click(function(){
        filter_data();
    });





// FILTER CAPAIAN PEMBELAJARAN
/*
    function filter_cp(aksi) {
      if(document.getElementById("filter_cp") !== null && document.getElementById("filter_cp") !== 'undefined' ) {

        $('.filter_cp').html('<div id="loading"></div>');
        var action = 'fetch_data';
        var sp = get_filter('sp');
        var fase = get_filter('fase');
        var smk = get_filter('smk');
        var susun = get_filter('susun');

        if(document.getElementById("paging_data") !== null && document.getElementById("paging_data") !== 'undefined' ) {
            var hal = document.getElementById("paging_data").getAttribute("data-saatini");
        } else {
            var hal = '1';
        }
        
        if(document.getElementById("myText") !== null && document.getElementById("myText") !== 'undefined' ) {
            if(cari = document.getElementById("myText").value.length > 2) {
                var cari = document.getElementById("myText").value;
            }
            else {
                var cari = '';
            }
        } else {
            var cari = '';
        }

        var aks = aksi;

        $.ajax({
            url:"fetch_cp.php",
            method:"POST",
            data:{action:action, sp:sp, fase:fase, smk:smk, susun:susun, cari:cari, aks:aks, hal:hal},
            success:function(data){
                $('.filter_cp').html(data);

                if(hasil == 'yes' ) {
                    document.getElementById("paging_data").innerHTML = ""+saatini+" / "+jp+"";
                    document.getElementById("paging_data").setAttribute("data-saatini", saatini);
    
                    if(saatini == 1) {
                        document.getElementById("awal").setAttribute("class", "row");
                    }
                    else {
                        document.getElementById("awal").setAttribute("class", "row page-prev");
                    }
    
                    if(saatini == jp) {
                        document.getElementById("akhir").setAttribute("class", "row");
                    }
                    else {
                        document.getElementById("akhir").setAttribute("class", "row page-next");
                    }

                }
                else {
                    document.getElementById("paging_data").innerHTML = "";
                    document.getElementById("akhir").setAttribute("class", "row");
                }

                  	fileAccordionMechanism();
                    openModalPopup();

                // $('html, body').animate({
                //     scrollTop: $(balik).offset().top
                // }, 'slow');
            },
            error:function(data){
            }
        });
      }
    }

    function get_filter(class_name) {
        var filter = [];
        $('.'+class_name+':checked').each(function(){
            filter.push($(this).val());
        });
        return filter;
    }

    function get_type(class_name) {
        var filter = [];
        $('.'+class_name+':checked').each(function(){
            filter.push($(this).val());
        });
        return filter;
    }

    $('.selector').click(function(){
        filter_cp();
    });



    $('.selector').keyup(function(){
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            filter_cp();
        }, delay);
    });


    $('.mundur').click(function(){
        filter_cp('mundur');
    });

    $('.maju').click(function(){
        filter_cp('maju');
    });

*/

// FILTER PMP

    function filter_pmp(aksi) {
      if(document.getElementById("filter_pmp") !== null && document.getElementById("filter_pmp") !== 'undefined' ) {

        $('.filter_pmp').html('<div id="loading"></div>');
        var action = 'fetch_data';
        var sp = get_filter('sp');
        var fase = get_filter('fase');
        var susun = get_filter('susun');

        if(document.getElementById("paging_data") !== null && document.getElementById("paging_data") !== 'undefined' ) {
            var hal = document.getElementById("paging_data").getAttribute("data-saatini");
        } else {
            var hal = '1';
        }
        
        if(document.getElementById("myText") !== null && document.getElementById("myText") !== 'undefined' ) {
            if(cari = document.getElementById("myText").value.length > 2) {
                var cari = document.getElementById("myText").value;
            }
            else {
                var cari = '';
            }
        } else {
            var cari = '';
        }

        var aks = aksi;

        $.ajax({
            url:"fetch_pmp.php",
            method:"POST",
            data:{action:action, sp:sp, fase:fase, susun:susun, cari:cari, aks:aks, hal:hal},
            success:function(data){
                $('.filter_pmp').html(data);

                if(hasil == 'yes' ) {
                    document.getElementById("paging_data").innerHTML = ""+saatini+" / "+jp+"";
                    document.getElementById("paging_data").setAttribute("data-saatini", saatini);
    
                    if(saatini == 1) {
                        document.getElementById("awal").setAttribute("class", "row");
                    }
                    else {
                        document.getElementById("awal").setAttribute("class", "row page-prev");
                    }
    
                    if(saatini == jp) {
                        document.getElementById("akhir").setAttribute("class", "row");
                    }
                    else {
                        document.getElementById("akhir").setAttribute("class", "row page-next");
                    }

                }
                else {
                    document.getElementById("paging_data").innerHTML = "";
                    document.getElementById("akhir").setAttribute("class", "row");
                }

              	fileAccordionMechanism();
                openModalPopup();

                // $('html, body').animate({
                //     scrollTop: $(balik).offset().top
                // }, 'slow');
            },
            error:function(data){
            }
        });
      }
    }

    function get_filter(class_name) {
        var filter = [];
        $('.'+class_name+':checked').each(function(){
            filter.push($(this).val());
        });
        return filter;
    }

    function get_type(class_name) {
        var filter = [];
        $('.'+class_name+':checked').each(function(){
            filter.push($(this).val());
        });
        return filter;
    }

    $('.selector').click(function(){
        filter_pmp();
    });


    $('.selector').keyup(function(){
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            filter_pmp();
        }, delay);
    });


    $('.mundur').click(function(){
        filter_pmp('mundur');
    });

    $('.maju').click(function(){
        filter_pmp('maju');
    });





// LIVE SEARCH
    function cari_data() {
      if(document.getElementById("cari_data") !== null && document.getElementById("cari_data") !== 'undefined' ) {
        var action = 'cari_data';
        if(document.getElementById("myText") !== null && document.getElementById("myText") !== 'undefined' ) {
            if(document.getElementById("myText").value.length > 2) {
                var cari = document.getElementById("myText").value;
            }
            else {
                var cari = '';
            }
        } else {
            var cari = '';
        }

        if(document.getElementById("bagian") !== null && document.getElementById("bagian") !== 'undefined' ) {
            var bagian = document.getElementById("bagian").value;
        } else {
            var bagian = '';
        }

        if(document.getElementById("halaman") !== null && document.getElementById("halaman") !== 'undefined' ) {
            var halaman = document.getElementById("halaman").value;
        } else {
            var halaman = '';
        }
        
        $('.cari_data').html('<div id="loading"></div>');
        
        $.ajax({
            url:"cari_data.php",
            method:"POST",
            data:{action:action, cari:cari, bagian:bagian, halaman:halaman},
            success:function(data){
                $('.cari_data').html(data);
                openModalPopup();
            	accordionMechanism2();
                fileAccordionMechanism2();
            },
            error:function(data){
            }
        });
      }  
    }






    $('.selector2').keyup(function(){
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            cari_data();
        }, delay);
    });

// RUJUKAN
    function ajax_rujukan() {
        if(document.getElementById("ajax_rujukan") !== null && document.getElementById("ajax_rujukan") !== 'undefined' ) {
            $('.ajax_rujukan').html('<div id="loading"></div>');
            var action = 'ajax_rujukan';
            var kat = document.getElementById("tb-sort").getAttribute("data-rujukan");
    	    var susun = 'tanggal_rilis DESC';

            $.ajax({
                url:"ajax_rujukan.php",
                method:"POST",
                data:{action:action, kat:kat, susun:susun},
                success:function(data){
                    $('.ajax_rujukan').html(data);
                	fileAccordionMechanism();
                    openModalPopup();
                },
                error:function(data){
                }
            });

        	$('.datarujukan').on(
        	    {
    	        click:function(){
                    $('.ajax_rujukan').html('<div id="loading"></div>');
                    var action = 'ajax_rujukan';
            	    var kat = $(this).attr('data-rujukan');
            	    var susun = 'tanggal_rilis DESC';
                    $.ajax({
                        url:"ajax_rujukan.php",
                        method:"POST",
                        data:{action:action, kat:kat, susun:susun},
                        success:function(data){
                            $('.ajax_rujukan').html(data);
                            document.getElementById("tb-sort").setAttribute("data-rujukan", katsaatini);
                            $('#tb-sort').prop('selectedIndex',0);
                        	fileAccordionMechanism();
                            openModalPopup();
                        },
                        error:function(data){
                        }
                    });
    	        }
        	    }
        	);

        	$('.datarujukan2').on(
        	    {
        	        change:function(){
                        $('.ajax_rujukan').html('<div id="loading"></div>');
                        var action = 'ajax_rujukan';
                        var kat = document.getElementById("tb-sort").getAttribute("data-rujukan");
                    	var x = document.getElementsByName("rj-sort");
                    	var i = x[0].selectedIndex;
                    	var susun = x[0].options[i].value;
    
                        $.ajax({
                            url:"ajax_rujukan.php",
                            method:"POST",
                            data:{action:action, kat:kat, susun:susun},
                            success:function(data){
                                $('.ajax_rujukan').html(data);
                            	fileAccordionMechanism();
                                openModalPopup();
                            },
                            error:function(data){
                            }
            
                        });
        	        }
        	    }
        	);
        }
    }


// IKM


    $('.search_ikm').keyup(function(){

        clearTimeout(timeout);

        timeout = setTimeout(function() {
            filter_ikm_kota('','');
        }, delay);

    });



	        function filter_ikm(aksi,limit){
                $('.ajax_ikm').html('<div id="loading"></div>');
                var action = 'filter';

                var aks = aksi;

                if(document.getElementById("myText") !== null && document.getElementById("myText") !== 'undefined' ) {
                        if(document.getElementById("myText").value.length > 2) {
                            var cari = document.getElementById("myText").value;
                        }
                        else {
                            var cari = '';
                        }
                } else {
                        var cari = '';
                }
    

            	var x = document.getElementsByName("id_jenjang");
            	var i = x[0].selectedIndex;
            	var jenjang = x[0].options[i].value;

            	var y = document.getElementsByName("id_kategori");
            	var i2 = y[0].selectedIndex;
            	var kategori = y[0].options[i2].value;

            	var z = document.getElementsByName("id_provinsi");
            	var i3 = z[0].selectedIndex;
            	var provinsi = z[0].options[i3].value;
    
            	var w = document.getElementsByName("id_kab_kota");
            	var i4 = w[0].selectedIndex;
            	var kab_kota = '0';

            	var v = document.getElementsByName("id_status");
            	var i5 = v[0].selectedIndex;
            	var status = v[0].options[i5].value;

                if(document.getElementById("paging_data") !== null && document.getElementById("paging_data") !== 'undefined' ) {
                    var hal = document.getElementById("paging_data").getAttribute("data-saatini");
                } else {
                    var hal = '1';
                }
                if(limit!== null && limit !=='undefined' && limit!=='' ) {
                    var lim = limit;
                }
                else {
                    var lim = document.getElementById("limitsaatini").getAttribute("data-limitsaatini");
                }



                $.ajax({
                    url:"ajax_ikm.php",
                    method:"POST",
                    data:{action:action, jenjang:jenjang, kategori:kategori, provinsi:provinsi, kab_kota:kab_kota, status:status, hal:hal,aks:aks,lim:lim,cari:cari},
                    success:function(data){
                        $('.ajax_ikm').html(data);
                        if(saatini=='1') {
                            document.getElementById("mundur").innerHTML = "";
                        	$('#mundur').removeClass('active');
                        }
                        else {
                            document.getElementById("mundur").innerHTML = "<";
                        	$('#mundur').addClass('active');
                        }
                        document.getElementById("paging_data").innerHTML = "Hal. "+saatini+"/"+jp;
                        document.getElementById("paging_data").setAttribute("data-saatini", saatini);
                        document.getElementById("limitsaatini").setAttribute("data-limitsaatini", limitsaatini);

                        if(baris>='30000') {
    						document.getElementById("export_ikm").innerHTML = "";
                        }

                    	$('html, body').animate({ scrollTop: $('#myText').offset().top - 200 }, 20);


                    },
                    error:function(data){
                    }
                });

                $.ajax({
                    url:"ajax_kab_kota.php",
                    method:"POST",
                    data:{provinsi:provinsi},
                    success:function(data2){
                        $('.id_kab_kota').html(data2);
                    },
                    error:function(data2){
                    }
                });
	        }


	        function filter_ikm_kota(aksi,limit){
                $('.ajax_ikm').html('<div id="loading"></div>');
                var action = 'filter';

                var aks = aksi;

                if(document.getElementById("myText") !== null && document.getElementById("myText") !== 'undefined' ) {
                        if(document.getElementById("myText").value.length > 2) {
                            var cari = document.getElementById("myText").value;
                        }
                        else {
                            var cari = '';
                        }
                } else {
                        var cari = '';
                }

        
            	var x = document.getElementsByName("id_jenjang");
            	var i = x[0].selectedIndex;
            	var jenjang = x[0].options[i].value;

            	var y = document.getElementsByName("id_kategori");
            	var i2 = y[0].selectedIndex;
            	var kategori = y[0].options[i2].value;

            	var z = document.getElementsByName("id_provinsi");
            	var i3 = z[0].selectedIndex;
            	var provinsi = z[0].options[i3].value;
    
            	var w = document.getElementsByName("id_kab_kota");
            	var i4 = w[0].selectedIndex;
            	var kab_kota = w[0].options[i4].value;

            	var v = document.getElementsByName("id_status");
            	var i5 = v[0].selectedIndex;
            	var status = v[0].options[i5].value;

                if(document.getElementById("paging_data") !== null && document.getElementById("paging_data") !== 'undefined' ) {
                    var hal = document.getElementById("paging_data").getAttribute("data-saatini");
                } else {
                    var hal = '1';
                }
                if(limit!== null && limit !=='undefined' && limit!=='' ) {
                    var lim = limit;
                }
                else {
                    var lim = document.getElementById("limitsaatini").getAttribute("data-limitsaatini");
                }



                $.ajax({
                    url:"ajax_ikm.php",
                    method:"POST",
                    data:{action:action, jenjang:jenjang, kategori:kategori, provinsi:provinsi, kab_kota:kab_kota, status:status, hal:hal,aks:aks,lim:lim, cari:cari},
                    success:function(data){
                        $('.ajax_ikm').html(data);
                        if(saatini=='1') {
                            document.getElementById("mundur").innerHTML = "";
                        	$('#mundur').removeClass('active');
                        }
                        else {
                            document.getElementById("mundur").innerHTML = "<";
                        	$('#mundur').addClass('active');
                        }
                        document.getElementById("paging_data").innerHTML = "Hal. "+saatini+"/"+jp;
                        document.getElementById("paging_data").setAttribute("data-saatini", saatini);
                        document.getElementById("limitsaatini").setAttribute("data-limitsaatini", limitsaatini);


                        if(baris>='30000') {
    						document.getElementById("export_ikm").innerHTML = "";
                        }



                    	$('html, body').animate({ scrollTop: $('#myText').offset().top - 200 }, 20);


                    },
                    error:function(data){
                    }
                });


	        }


	$('.id_jenjang').on(
	    {
	        change:function(){
                filter_ikm_kota('','');
	        }
	    }
	);

	$('.id_kategori').on(
	    {
	        change:function(){
                filter_ikm_kota('','');
	        }
	    }
	);

	$('.id_provinsi').on(
	    {
	        change:function(){
                filter_ikm('','');
	        }
	    }
	);

	$('.id_kab_kota').on(
	    {
	        change:function(){
                filter_ikm_kota('','');
	        }
	    }
	);

	$('.id_status').on(
	    {
	        change:function(){
                filter_ikm_kota('','');
	        }
	    }
	);

    $('.mundur').click(function(){
        filter_ikm_kota('mundur','');
    });

    $('.maju').click(function(){
        filter_ikm_kota('maju','');
    });

    $('.sepuluh').click(function(){
        filter_ikm_kota('','10');
    });

    $('.tigapuluh').click(function(){
        filter_ikm_kota('','30');
    });

    $('.enampuluh').click(function(){
        filter_ikm_kota('','60');
    });

    $('.sembilanpuluh').click(function(){
        filter_ikm_kota('','90');
    });



//BERITA
    function ajax_berita() {
            $('.ajax_berita').html('<div id="loading"></div>');
            var action = 'ajax_berita';
            var kat =   'all';

            $.ajax({
                url:"ajax_berita.php",
                method:"POST",
                data:{action:action,kat:kat},
                success:function(data){
                    $('.ajax_berita').html(data);
                },
                error:function(data){
                }
            });

        	$('.kategoriberita').on(
        	    {
    	        click:function(){
                    $('.ajax_berita').html('<div id="loading"></div>');
        			$('.kategoriberita').not($(this)).removeClass('active');
        			$(this).addClass('active');

                    var action = 'ajax_berita';
            	    var kat = $(this).attr('data-kategori');
        
                    $.ajax({
                        url:"ajax_berita.php",
                        method:"POST",
                        data:{action:action,kat:kat},
                        success:function(data){
                            $('.ajax_berita').html(data);
                            // $('html, body').animate({
                            //     scrollTop: $('.balik').offset().top
                            // }, 'slow');

                        },
                        error:function(data){
                        }
                    });

    	        }
        	    }
        	);


    }

function ceknewscookie() {
    
  let name = "tanggal" + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
       var tgl_cookie= c.substring(name.length, c.length);
    }
  }

    var tgl_berita = document.getElementById("infoterkini").getAttribute("data-lastnews");
    
    if(tgl_cookie<tgl_berita || tgl_cookie==undefined) {
        document.getElementById("linkinfo").innerHTML = 'Info Terkini<span class="badge-new"></span>';
    }
    else {
        document.getElementById("linkinfo").innerHTML = 'Info Terkini';
    }
}


//// MODAL PREVIEW
    function PreviewModal() {
    	$('#prevpdf').on('click', function() {
    		event.preventDefault();
    		$('.modal-preview').fadeIn('fast');
    	});
    }

// FILE ACCORDION MECHANISM 2
function fileAccordionMechanism2() {
	$('.viewoption2.itemicon2 .ic-grid2').click(function() {
		$(this).toggleClass('active');
		$('.viewoption2.itemicon2 .ic-list2').toggleClass('active');
		$('.file-gridview2').addClass('active');
		$('.file-listview2').removeClass('active');
	});
	$('.viewoption2.itemicon2 .ic-list2').click(function() {
		$(this).toggleClass('active');
		$('.viewoption2.itemicon2 .ic-grid2').toggleClass('active');
		$('.file-listview2').addClass('active');
		$('.file-gridview2').removeClass('active');
	});
	$('.file-listview2 .filac-wrapper2').click(function() {
		$(this).find('.filac-heading2').toggleClass('active');
		$(this).find('.filac-content2').slideToggle();
	});
	$('.file-listview2 .op-icon2.ic-info2').click(function() {
		$(this).find('.filac-heading2').toggleClass('active');
		$(this).find('.filac-content2').slideToggle();
	});
	$('.file-listview2 .filac-content2').click(function() {return false;});
	$('.file-listview2 .op-icon2.ic-download2').click(function() {return false;});
	$('.file-listview2 .op-icon2.ic-view2').click(function() {return false;});
	$('.file-listview2 .op-icon2.ic-share2').click(function() {return false;});

	$('.image-holder2 img2').each(function() {
		if ($(this).attr('src') == undefined || $(this).attr('src') == '') {
			$(this).attr('src','./images/placeholder-not-available.svg');
		}
	});
	if (window.matchMedia('(max-width: 544px)').matches != true) {
		$('.file-listview2 .filac-wrapper2').first().click();
	}
}

// ACORDION 2
function accordionMechanism2() {
	$('.acc-heading2').click(function(){
	    $('.acc-heading2').not(this).removeClass('active');
		$(this).toggleClass('active');
		$('.acc-heading2 .acc-content2').not($(this).find('.acc-content2')).slideUp();
		$(this).find('.acc-content2').slideToggle();
	});
	$('.acc-heading2').first().click();
}


//DATATABLES




	$('#filter-jenjang').on('change', function(){
		isiTabel.column(1).search(this.value).draw();
    });
	$('#filter-kategori-ikm').on('change', function(){
		isiTabel.column(3).search(this.value).draw();
    });
	$('#filter-provinsi').on('select2:select', function(){
		isiTabel.column(4).search($(this).parent().find('#select2-filter-provinsi-container').html()).draw();
    });
	$('#filter-kab-kota').on('select2:select', function(){
    	isiTabel.column(5).search($(this).parent().find('#select2-filter-kab-kota-container').html()).draw();
    });

	$('#filter-provinsi').attr('data-placeholder', '- Pilih -');
	$('#filter-kab-kota').attr('data-placeholder', '- Pilih -');

	$('#filter-provinsi').on('select2:open', function(){
		$('.select2-search__field').attr('placeholder', 'Cari Provinsi');
    });
	$('#filter-kab-kota').on('select2:open', function(){
    	$('.select2-search__field').attr('placeholder', 'Cari Kabupaten/Kota');
    });

 	// 	$('.select2-search__field').on('input', function(){
	// 		// alert($(this).val());
	// 		$(this).parents().find('.select2-results__option').first().hide();
	// 		if ($(this).val() != '') {
	// 			$(this).parents().find('.select2-results__option').first().show();
	// 		};
	// 	});

    $('.atur-ulang').click(function(){

		$('#filter-jenjang option:eq(0)').prop('selected', true);
		$('#filter-kategori-ikm option:eq(0)').prop('selected', true);
		$('#filter-provinsi option:eq(0)').prop('selected', true);
		$('#filter-kab-kota option:eq(0)').prop('selected', true);
		$('#filter-status-sp option:eq(0)').prop('selected', true);
		
		if ($('#filter-provinsi').data('select2')) {
			$('#filter-provinsi').select2("destroy").select2();
		}
		if ($('#filter-kab-kota').data('select2')) {
			$('#filter-kab-kota').select2("destroy").select2();
		}
		
        document.getElementById("myText").value = '';

		setTimeout(function() {

			isiTabel.search('').draw();
			isiTabel.columns().search('').draw();
			$('#tabel-pelaksana_filter input[type="search"]').focus();
			$('html, body').animate({ scrollTop: $('#data').offset().top - 100 }, 20);

		}, 200);

        filter_ikm_kota('','');

	});

	$('.tabel-length').click(function(){
    	$('html, body').animate({ scrollTop: $('#myText').offset().top - 200 }, 20);
		$('.tabel-length').removeClass('active');
		$(this).addClass('active');
	});


    $('.sorting').each(function() {
	    $(this).attr('title','Urutkan data berdasarkan ' + $(this).html() + '.');
    });

    $('select[name="tabel-pelaksana_length"]').change(function() {
    	$('html, body').animate({ scrollTop: $(this).offset().top - 200 }, 20);
    });


});