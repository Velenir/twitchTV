const defaultChannels = ["freecodecamp", "storbeck", "terakilobyte", "habathcx","RobotCaleb","thomasballinger","noobs2ninjas","beohoff","brunofin","comster404","test_channel","cretetion","sheevergaming","TR7K","OgamingSC2","ESL_SC2"];

const $streams = $(".streams");

function getStreamItem(channelName, game, logo, url) {
	const $item = $(`<a class='collection-item stream-item row center-align'>
										<p class='channel-name col s12 m2 l2'>${channelName}</p>
									</a>`);

	if(url) {
		$item.prop({
			href: url,
			target: '_blank'
		});
	}

	let promise;
	if(logo) {
		const img = new Image();
		// img.className = "thumbnail col s12 m2 l1";
		img.alt = channelName;
		promise = new Promise(function (resolve) {
			// resolve only, don't reject anything
			img.onload = resolve;
		});
		img.src = logo;

		$("<div class='thumbnail col s12 m2 l2'></div").append(img).prependTo($item);
		// $item.prepend(img);
	} else {
		$item.children(".channel-name").addClass("offset-m2 offset-l2");
	}

	$item.append(`<p class="playing col s12 m8 l8">${game}</p>`);

	// ultimately resolves with a fully loaded $item
	return Promise.resolve(promise).then(() => $item);
}

function processStreamData({stream}, channelName) {
	console.log("stream:", stream);
	let game, name, logo, url;

	// Online
	if(stream) {
		({game, channel: {name, logo, url}} = stream);
		console.log("game:", game);
		console.log("channel name:", name);
		console.log("channel logo:", logo);
	} else {
		name = channelName;
		game = "Offline";
		url = "https://www.twitch.tv/" + name;
	}

	getStreamItem(channelName, game, logo, url).then($item => {
		if(!stream) $item.addClass("offline");
		$streams.prepend($item);
	});
}

function getChannels(channels) {
	for(let channel of channels) {
		$.ajax({
			url: 'https://api.twitch.tv/kraken/streams/' + channel,
			type: 'GET',
			dataType: 'json',
			headers: {Accept : 'application/vnd.twitchtv.v3+json'}
		})
		.done(function(data) {
			// console.log("success");
			// console.log(data);
			processStreamData(data, channel);
		})
		.fail(function(jqXHR) {
			if(jqXHR.status === 422) {
				console.log("Channel Unavailable");
				getStreamItem(channel, "Unavailable").then($item => $streams.prepend($item.addClass("unavailable")));
			} else {
				console.log("ERROR. jqXHR:",jqXHR);
			}
		})
		.always(function() {
			// console.log("complete");
		});
	}
}

$(document).ready(function() {
	getChannels(defaultChannels);
});
