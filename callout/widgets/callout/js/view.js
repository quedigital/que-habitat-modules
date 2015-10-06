$(function () {
	function getSearchParameter (search) {
		return search.slice(1).split("&").reduce(function(t, e) {
			var i = e.split("="),
				n = decodeURIComponent(i[0]),
				s = i.length > 1 ? decodeURIComponent(i[1]) : null;
			return n && (t[n] = s), t
		}, {});
	}

	var configFile = getSearchParameter(window.location.search)["configFile"];
	console.log("config = " + configFile);

	$.getJSON(configFile, onConfigFile);

	function onConfigFile (data) {
		initialize(data);
	}

	function initialize (data) {
		console.log(data);

		_settings = data;

		if (_settings.img) {
			$("img").attr("src", _settings.img).on("load", sizeToFit);
			$(".viewer_pane p").css("display", "none");
			$(".viewer_pane").removeClass("no-image");
		} else {
			$(".viewer_pane p").css("display", "block");
			$(".viewer_pane").addClass("no-image");
		}
	}

	function sizeToFit () {
		// wait a frame for the image to have a size before calculating the new scale
		setTimeout(findImageScale, 0);
	}

	function findImageScale () {
		var img = $("img");

		scale = img.height() / img[0].naturalHeight;

		positionCallout();
	}

	function getDocHeight() {
		var D = document;
		return Math.max(
			D.body.scrollHeight, D.documentElement.scrollHeight,
			D.body.offsetHeight, D.documentElement.offsetHeight,
			D.body.clientHeight, D.documentElement.clientHeight
		);
	}

	function positionCallout () {
		var el = $(".callout");

		var rect = [_settings.rect[0] * scale, _settings.rect[1] * scale, _settings.rect[2] * scale, _settings.rect[3] * scale];

		el.css({
			left: rect[0],
			top: rect[1],
			width: rect[2],
			height: rect[3],
			display: _settings.showRect ? "block" : "none",
			position: "absolute"
		});

		setWidgetHeight();
	}

	function setWidgetHeight () {
		window.parent.postMessage({
			"type": "view",
			"method": "set",
			"payload": {
				"height": getDocHeight(),
			}
		}, "*");
	}
});