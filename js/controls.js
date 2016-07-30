const $filterButtons = $(".controls > button");
const $searchButton = $("#search");
const $addButton = $("#add");
const $searchField = $("#search-field");

let currentChannels = [];

$filterButtons.on('click', function(e) {
	// console.log(e.target);
	// console.log(this);
	$filterButtons.removeClass("on");
	$(this).addClass("on");

	$streams.removeClass("show-all show-online show-offline show-available");
	$streams.addClass("show-" + this.value);
});

$("#search-field").on('keydown', function(e) {
	// console.log(e.type, "char:", e.char, "key:", e.key, "charCode:", e.charCode, "keyCode:", e.keyCode, "which:", e.which);
	if(e.key === "Enter" || e.keyCode === 13) $searchButton.click();
});

$searchButton.on('click', searchForStreams(true));

$addButton.on('click', searchForStreams());

function searchForStreams(clearStreams) {
	function willBeDisplayed($stream) {
		if($streams.hasClass("show-all")) return true;
		else if($streams.hasClass("show-online")) return $stream.hasClass('online');
		else if($streams.hasClass("show-offline")) return $stream.hasClass('offline');
		else if($streams.hasClass("show-available")) return $stream.hasClass('online') || $stream.hasClass('offline');
	}
	return function() {
		if($searchField.val()) {
			// split on space and/or comma and filter out empty strings and duplicates
			let channels_to_add = $searchField.val().trim().split(/,\s*|\s+/).filter((el,ind,ar)=> el!=="" && ind===ar.indexOf(el));
			// if nothing left
			if(channels_to_add.length === 0) return;

			if(clearStreams) currentChannels = [];

			const options = {
				// before adding each stream
				beforeCallback : (channel) => {
					channel = channel.toLowerCase();
					console.log("adding channel", channel);
					if(currentChannels.includes(channel)) {
						// console.log("replacing");
						return $streams.children(`[data-channel=${channel}]`);
					} else currentChannels.push(channel);
				},
				// after adding each streams
				afterCallback: (_, $stream) => {
					if(channels_to_add.length > 1) $stream.addClass("flare");
				}
			};

			if(clearStreams) {
				// before adding any streams
				options.beforeFirstCallback = () => {
					console.log("EMPTYING STREAMS");
					$streams.empty();
					$filterButtons[0].click();
				};
			} else if(channels_to_add.length === 1) {
				options.beforeFirstCallback = (_, $firstStream) => {
					// if new stream wouldn't be shown on current tab change to .show-all tab
					if(!willBeDisplayed($firstStream)) $filterButtons[0].click();
				};
			} else {
				options.beforeFirstCallback = () => $filterButtons[0].click();
			}

			if(!clearStreams && channels_to_add.length === 1) {
				// once after adding first stream
				options.afterFirstCallback = (_, $firstStream) => {
					scrollToEl($firstStream, () => {console.log("after scroll");$firstStream.addClass("flare");});
				};
			}

			getStreams(channels_to_add, options);
		}
	};
}

function scrollToEl($el, cb) {
	const $body = $("body, html");
	const scrollTop = $body.scrollTop();
	const windowHeight = $(window).height();
	const streamTop = $el.offset().top;
	const streamBottom = streamTop + $el.outerHeight();

	// if stream is fully in viewport, do nothing
	if(streamTop > scrollTop && streamBottom < scrollTop + windowHeight) {
		cb();
		return;
	}

	console.log("SCROLLING to", streamBottom - windowHeight + 5);
	// $(document.body).scrollTop($el.offset().top + $el.outerHeight() - $(window).height());
	$body.animate({scrollTop: streamBottom - windowHeight + 5}, 200, cb);
}


function debouncedFunction(cb, delay=200) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		console.log("timeout cleared");
		timeoutId = setTimeout(cb.bind(this, ...args), delay);
	};
}

const $toTop = $(".toTop").on('click', () => {
	$("body, html").animate({scrollTop: 0}, 200);
});
$(document).on('scroll', debouncedFunction(function (e) {
	// console.log(e);
	// console.log("scrollTop", this.body.scrollTop);
	$toTop.toggleClass("opaque", $("body, html").toArray().some((el) => el.scrollTop > 100));
}, 200));
// $(document).on('scroll', function (e) {
// 	console.log("DIRECT SCROLL");
// 	console.log(e);
// 	console.log("scrollTop", this.scrollTop);
// });
