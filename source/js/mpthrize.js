// modifies a dom element by adding a button as child
// which does play/stop. This function returns an audio
// stop function so the caller can issue a stop.
function mpthrize(div, path) {
	mp3     = new air.Sound(new air.URLRequest(path));
	channel = null;
	btn     = $('<input type="button" value="Play" />');
	toggleSound = function() {
		if(channel) {
			channel.stop();
			channel = null;
		} else {
			channel = mp3.play();
			channel.addEventListener(air.Event.SOUND_COMPLETE,
			function(e) { channel = null; btn.attr('value', 'Play'); }); 
		}
		btn.attr('value', channel ? 'Stop' : 'Play');
	}
	btn.click('click', toggleSound);
	div.append(btn);
	// return a STOP function
	return function() {
		if(channel) {
			channel.stop();
			channel = null;
		}
	}
}
