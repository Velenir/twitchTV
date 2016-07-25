const $buttons = $(".controls > button");

$buttons.on('click', function(e) {
	// console.log(e.target);
	// console.log(this);
	$buttons.removeClass("on");
	$(this).addClass("on");

	$streams.removeClass("show-all show-online show-offline show-available");
	$streams.addClass("show-" + this.value);
});
