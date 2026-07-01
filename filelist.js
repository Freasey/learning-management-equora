$(document).ready(function() {	

	// $(document).on("click", ".ic-share", function(e) {
	// 	e.preventDefault();
    //     $(".filac-wrapper .sharebox").fadeOut(100);
    //     $(".filac-wrapper .ic-share").removeClass("copied");
	// 	if($(this).hasClass("active")) {
	// 		$(this).parent().parent().find(".sharebox").fadeOut(100);
	// 		$(this).removeClass("active");
	// 	} else {
	// 		$(this).parent().parent().find(".sharebox").fadeIn(100);
	// 		$(this).parent().parent().find(".sharebox").css("display", "flex");
	// 		$(this).addClass("active");
	// 	}
	// });
	$(document).on("click", ".ic-share", function(e) {
	    e.stopPropagation();
	    e.preventDefault();

	    const $btn   = $(this);
	    const $group = $btn.closest(".filac-wrapper");   // selalu ambil wrapper masing-masing
	    const $box   = $group.find(".sharebox");
	    const active = $btn.hasClass("active");

	    // tutup semua sharebox lain
	    $(".filac-wrapper .sharebox").fadeOut(100);
	    $(".filac-wrapper .ic-share").removeClass("active copied");

	    if (!active) {
	        $box.fadeIn(100).css("display","flex");
	        $btn.addClass("active");
	    }
	});

	$(document).mouseup(function(e) {
		closeSharebox($(".filac-wrapper .ic-share"), e);
	});
	$(document).on("click", ".sharebox-copylink", function(e) {
        e.preventDefault();
        $(this).parent().parent().parent().find(".ic-share").removeClass("copied");
        const url = $(this).attr("data-url");
        const $temp = $("<textarea>");
        $("body").append($temp);
        $temp.val(url).select();
        navigator.clipboard.writeText(url);
        $temp.remove();
        $(this).parent().parent().parent().find(".ic-share").addClass("copied");
    });
    function closeSharebox(container, e) {
	    if (!container.is(e.target) && container.has(e.target).length === 0) {
	        $(".filac-wrapper .sharebox").fadeOut(100);
			$(".filac-wrapper .ic-share").removeClass("active");
	        $(".filac-wrapper .ic-share").removeClass("copied");
	    }
	};

});