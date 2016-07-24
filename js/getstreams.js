const defaultChannels = ["freecodecamp", "storbeck", "terakilobyte", "habathcx","RobotCaleb","thomasballinger","noobs2ninjas","beohoff","brunofin","comster404","test_channel","cretetion","sheevergaming","TR7K","OgamingSC2","ESL_SC2"];

const $streams = $(".streams");

function getStreamItem(channelName, game, logo) {
	const $item = $(`<div class='stream-item'>
										<h2 class='channel_name'>${channelName}</h2>
									</div>`);

	let promise;
	if(logo) {
		const img = new Image();
		img.className = "thumbnail";
		img.alt = channelName;
		promise = new Promise(function (resolve) {
			// resolve only, don't reject anything
			img.onload = resolve;
		});
		img.src = logo;

		$item.prepend(img);
	}

	$item.append(`<p class="playing">${game}</p>`);

	// ultimately resolves with a fully loaded $item
	return Promise.resolve(promise).then(() => $item);
}

function processStreamData({stream}, channelName) {
	console.log("stream:", stream);
	let game, name, logo;

	// Online
	if(stream) {
		({game, channel: {name, logo}} = stream);
		console.log("game:", game);
		console.log("channel name:", name);
		console.log("channel logo:", logo);
	} else {
		name = channelName;
		game = "Offline";
	}

	getStreamItem(channelName, game, logo).then($item => {
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
				getStreamItem(channel, "Channel Unavailable").then($item => $streams.prepend($item.addClass("deleted")));
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
