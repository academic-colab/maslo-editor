function typeOfFile(path) {
	var temp;
	if(!(temp = path.match(/\.(\w+?)$/))) {
		return 'unknown';
	}
  	return {'png':'image', 'gif':'image', 'txt':'text', 'html':'text',
                'jpg':'image', 'swf':'video', 'mpeg':'video', 'mpg':'video', 'avi':'video',
	        'flv':'video', 'mp3':'audio', 'wav':'audio', 'aiff':'audio'}[temp[1]] || 'unknown';
}

function iconForType(type) {
	return {'image': "icons/image.png", 'text': "icons/text.png",
	        'video': 'icons/video.png', 'audio': "icons/audio.png"}[type] || 'unknown';
}
