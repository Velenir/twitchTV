const $streams = $(".streams");

function constructStreamItem({display_name, game, logo, url, dataChannel, channelStatus}) {
	// console.log("CONSTRUCTING ITEM FROM", {display_name, game, logo, url});
	const $item = $(`<a class='collection-item stream-item row center-align' data-channel='${dataChannel.toLowerCase()}'>
										<p class='channel-name col s12 m2 l2'>${display_name}</p>
									</a>`);

	if(url) {
		$item.prop({
			href: url,
			target: '_blank'
		});
	}

	let promise;
	const $thumb = $("<div class='thumbnail col s12 m2 l1'></div").prependTo($item);
	if(logo) {
		const img = new Image();
		img.alt = display_name;
		promise = new Promise(function (resolve) {
			// resolve only, don't reject anything
			img.onload = resolve;
		});
		img.src = logo;

		$thumb.append(img);
	} else {
		$thumb.addClass("hide-on-small-only").append("<div class='blank'></div>");
	}

	const $playing = $(`<p class="playing col s12 m8 l9">${game}</p>`);
	if(channelStatus) {
		$playing.append(`<small class="status hide-on-small-only"> ${channelStatus}</small`);
	}

	$item.append($playing).append('<a href="#!" class="corner"><i class="material-icons">close</i></a>');

	// ultimately resolves with a fully loaded $item
	return Promise.resolve(promise).then(() => $item);
}

function getStream(channelName) {
	// console.log("GETTING STREAM");
	return $.ajax({
		url: 'https://api.twitch.tv/kraken/streams/' + channelName,
		type: 'GET',
		dataType: 'json',
		headers: {Accept : 'application/vnd.twitchtv.v3+json'}
	});
}

function getChannel(channelName) {
	// console.log("GETTING CHANNEL");
	return $.ajax({
		url: 'https://api.twitch.tv/kraken/channels/' + channelName,
		type: 'GET',
		dataType: 'json',
		headers: {Accept : 'application/vnd.twitchtv.v3+json'}
	});
}

function getStreams(channels, options) {
	let {beforeCallback, beforeFirstCallback, afterCallback, afterFirstCallback, streamNotFound} = options || {};
	for(let i = 0, len = channels.length; i < len; ++i) {
		const channel = channels[i];
		// console.log("*=========*");
		// console.log("st CHANNEL", channel);
		getStream(channel).then(data => {
			// console.log("1. GOT STREAM:", data.stream);
			if(data.stream) {
				const {game, channel: {display_name, logo, url, status}} = data.stream;
				// return constructStreamItem(display_name, game, logo, url);
				return {game, display_name, logo, url, dataChannel: channel, channelStatus: status};
			} else {
				return getChannel(channel).then(data => {
					// console.log("1.5 GOT CHANNEL:", data);
					const {display_name, logo, url} = data;
					// return constructStreamItem(display_name, "Offline", logo, url).then($item => $item.addClass("offline"));
					return {game: "Offline", display_name, logo, url, dataChannel: channel};
				});
			}
		}).catch((jqXHR, status, err) => {
			// console.log("2X Failure", jqXHR, "status:", status, "error:", err);
			if(jqXHR.status === 422) {
				// console.log("Channel Unavailable");
				// constructStreamItem(channel, "Unavailable").then($item => $streams.prepend($item.addClass("unavailable")));
				return {game: "Unavailable", display_name: channel, dataChannel: channel};
			} else {
				// console.log("Error. jqXHR:",jqXHR);
				err = new Error(err);
				err.status = jqXHR.status;
				throw err;
			}
		}).then(streamStats => {
			// console.log("2 GOT STREAM STATS:", streamStats);
			return constructStreamItem(streamStats).then($item => {

				const off = streamStats.game === "Offline" || streamStats.game === "Unavailable";
				$item.addClass(off ? streamStats.game.toLowerCase() : "online");
				// console.log("2.5 FINAL ITEM:", $item[0]);
				// console.log("CHANNEL", channel);
				if(typeof beforeFirstCallback === "function") {
					beforeFirstCallback(channel, $item);
					beforeFirstCallback = null;
				}

				let $item_to_replace;
				if(typeof beforeCallback === "function") {
					$item_to_replace = beforeCallback(channel, $item);
				}
				// console.log($item_to_replace, off);
				if($item_to_replace) {
					if(!off && ($item_to_replace.hasClass('offline') || $item_to_replace.hasClass('unavailable'))) {
						// if new is online, remove old, place new on top
						$item_to_replace.remove();
						$streams.prepend($item);
					} else $item_to_replace.replaceWith($item);
				} else {
					// online on top
					if(off) $streams.append($item);
					else $streams.prepend($item);
				}

				if(typeof afterFirstCallback === "function") {
					afterFirstCallback(channel, $item);
					afterFirstCallback = null;
				}
				if(typeof afterCallback === "function") {
					afterCallback(channel, $item);
				}
			});
		}).catch(err => {
			if(err.status === 404 && typeof streamNotFound === "function") {
				streamNotFound(channel);
			} else console.log("Error", err);
		});

		// console.log("en CHANNEL", channel);
	}
}
