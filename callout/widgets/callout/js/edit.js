$(function () {
	var _settings = {
		img: undefined,
		original_image_filename: undefined,
		rect: [0, 0, 100, 50],
		showRect: false,
		audio: undefined,
		original_audio_filename: undefined,
		trigger: "click",
		input: "",
		shortText: ""
	};

	var attempts = 0;   // waiting for image to truly load

	var scale = 1;

	window.addEventListener("message", function (evt){
		if (evt.data.type == "asset" && evt.data.method == "image"){
			var payload = evt.data.payload;
			if (payload.progress === 1){
				if (payload.path){
					// Upload succeeded
					console.log("Success");
					console.log(payload.path);

					_settings.img = payload.path;

					attempts = 0;

					saveSettings();
				} else {
					// Upload failed
					console.log("Failed");
					console.log(evt);
				}
			} else {
				// Upload progress update
				console.log("Progress " + payload.progress);
			}
		}
	});

	$("#chooseImage").click(function () {
		$("#image").click();
	});

	$("#removeImage").click(onRemoveImage);

	$("#showRect").change(onChangeRect);

	$("#chooseAudio").click(function () {
		$("#audio").click();
	});

	$("#removeAudio").click(onRemoveAudio);

	$("#triggerMenu a").click(onChooseTrigger);

	$(".callout").draggable({ stop: onDragDone }).resizable( { stop: onResizeDone });

	$("#text-input").change(onChangeText);

	$("#text-short").on("input", onChangeShortText);

	var img = $("#image");
	img.on("change", function () {
		_settings.original_image_filename = img[0].files[0].name;

		// Open the asset picker so the user may upload or choose an image.
		window.parent.postMessage({
			"type": "asset",
			"method": "image",
			"payload": {
				"data": img[0].files[0],
				"id": "background"
			}
		}, "*");
	});

	var fileInput = $("#audio");
	fileInput.on("change", function (event) {
		var f = event.target.files[0];

		var reader = new FileReader();
		reader.onload = function (fileEvent) {
			var filePayload = fileEvent.target.result;

			_settings.audio = filePayload;
			_settings.original_audio_filename = event.target.files[0].name;

			saveSettings();
		};
		reader.readAsDataURL(f);
	});

	function onRemoveImage () {
		_settings.img = undefined;
		_settings.original_image_filename = undefined;

		saveSettings();
	}

	function onChangeRect (event) {
		var val = $(event.target).prop("checked");
		_settings.showRect = val;

		saveSettings();
	}

	function onRemoveAudio () {
		_settings.audio = undefined;
		_settings.original_audio_filename = undefined;

		saveSettings();
	}

	function onChooseTrigger (event) {
		var t = $(event.target).text();
		event.preventDefault();

		if (t === "none") {
			t = undefined;
		}

		$("#text-input").css("display", t == "text" ? "inline-block" : "none");

		_settings.trigger = t;

		saveSettings();
	}

	function saveSettings () {
		window.parent.postMessage({
			"type": "configuration",
			"method": "file",
			"payload": _settings
		}, "*");

		updateControlsFromSettings();
	}

	function updateControlsFromSettings () {
		var a;

		$(".screenshot").attr("src", (a = _settings.img) ? a : "");

		var old = $("audio source").attr("src");

		$("audio source").attr("src", (a = _settings.audio) ? a : "");

		if (old !== $("audio source").attr("src")) {
			$("audio").load();
		}

		var a;

		$("#imageFilename").val((a = _settings.original_image_filename) ? a : "");
		$("#audioFilename").val((a = _settings.original_audio_filename) ? a : "");

		var arrow = ' <span class="caret"></span>';

		var html = ((a = _settings.trigger) ? "Trigger: " + a + arrow : "Trigger" + arrow);
		$("#triggerType").html(html);//.attr("disabled", !_settings.showRect);

		$("#showRect").prop("checked", _settings.showRect);

		$(".callout").css("display", _settings.showRect ? "block" : "none");

		$("#text-input").val(_settings.input).css("display", _settings.trigger == "text" ? "inline-block" : "none");

		$("#text-short").val(_settings.shortText);
	}

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

	$(".screenshot").on("load", sizeToFit);

	function onConfigFile (data) {
		initialize(data);
	}

	function initialize (data) {
		_settings = data;

		updateControlsFromSettings();
	}

	function sizeToFit () {
		var wh = $(window).height() * .75;
		$(".screenshot").css("height", wh);

		// wait a frame for the image to have a size before calculating the new scale
		setTimeout(findImageScale, 0);
	}

	function findImageScale () {
		var img = $(".screenshot");

		if (img[0].naturalHeight != 0) {
			scale = img.height() / img[0].naturalHeight;

			console.log("scale = " + scale);

			positionCallout();
		} else {
			// this shouldn't happen; but just in case the image hasn't loaded its dimensions yet
			attempts++;

			if (attempts < 10) {
				setTimeout(findImageScale, 0);
			}
		}
	}

	function saveCalloutPosition () {
		var el = $(".callout");

		var offset = $(".screenshot").position();

		var x = el.position().left - offset.left, y = el.position().top - offset.top;

		var rect = [Math.round(x / scale), Math.round(y / scale), Math.round(el.width() / scale), Math.round(el.height() / scale)];

		_settings.rect = rect;

		console.log(rect);

		saveSettings();
	}

	function onDragDone (event) {
		saveCalloutPosition();
	}

	function onResizeDone (event) {
		saveCalloutPosition();
	}

	function positionCallout () {
		var el = $(".callout");

		var rect = [_settings.rect[0] * scale, _settings.rect[1] * scale, _settings.rect[2] * scale, _settings.rect[3] * scale];

		var offset = $(".screenshot").position();

		el.css({ left: rect[0] + offset.left, top: rect[1] + offset.top, width: rect[2], height: rect[3], position: "absolute" });
	}

	function onChangeText (event) {
		_settings.input = $("#text-input").val();

		saveSettings();
	}

	function onChangeShortText (event) {
		_settings.shortText = $("#text-short").val();

		saveSettings();
	}
});