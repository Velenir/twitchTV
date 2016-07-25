const defaultChannels = ["freecodecamp", "storbeck", "terakilobyte", "habathcx","RobotCaleb","thomasballinger","noobs2ninjas","beohoff","brunofin","comster404","test_channel","cretetion","sheevergaming","TR7K","OgamingSC2","ESL_SC2"];

const $streams = $(".streams");

function constructStreamItem({display_name, game, logo, url}) {
	// console.log("CONSTRUCTING ITEM FROM", {display_name, game, logo, url});
	const $item = $(`<a class='collection-item stream-item row center-align'>
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

	$item.append(`<p class="playing col s12 m8 l9">${game}</p>`);

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

function getStreams(channels, beforeAddCback) {
	for(let i = 0, len = channels.length; i < len; ++i) {
		const channel = channels[i];
		// console.log("*=========*");
		// console.log("st CHANNEL", channel);
		getStream(channel).then(data => {
			// console.log("1. GOT STREAM:", data.stream);
			if(data.stream) {
				const {game, channel: {display_name, logo, url}} = data.stream;
				// return constructStreamItem(display_name, game, logo, url);
				return {game, display_name, logo, url};
			} else {
				return getChannel(channel).then(data => {
					// console.log("1.5 GOT CHANNEL:", data);
					const {display_name, logo, url} = data;
					// return constructStreamItem(display_name, "Offline", logo, url).then($item => $item.addClass("offline"));
					return {game: "Offline", display_name, logo, url};
				});
			}
		}).catch((jqXHR, status, err) => {
			// console.log("2X Failure", jqXHR, "status:", status, "error:", err);
			if(jqXHR.status === 422) {
				// console.log("Channel Unavailable");
				// constructStreamItem(channel, "Unavailable").then($item => $streams.prepend($item.addClass("unavailable")));
				return {game: "Unavailable", display_name: channel};
			} else {
				// console.log("Error. jqXHR:",jqXHR);
				throw new Error(err);
			}
		}).then(streamStats => {
			// console.log("2 GOT STREAM STATS:", streamStats);
			return constructStreamItem(streamStats).then($item => {
				if(typeof beforeAddCback === "function") beforeAddCback();
				if(streamStats.game === "Offline" || streamStats.game === "Unavailable") {
					$item.addClass(streamStats.game.toLowerCase()).appendTo($streams);
				} else $streams.prepend($item.addClass("online"));
				// console.log("2.5 FINAL ITEM:", $item[0]);
				// console.log("CHANNEL", channel);
			});
		}).catch(err => console.log("Error:", err));

		// console.log("en CHANNEL", channel);
	}
}


$(document).ready(function() {
	getStreams(defaultChannels);
});
