function typeOfFile(path) {
	var temp;
	if(!(temp = path.match(/\.(\w+?)$/))) {
		return 'unknown';
	}
  	return {'png':'image', 'gif':'image', 'txt':'text', 'html':'text',
               'jpg':'image', 'swf':'video', 'mpeg':'video', 'avi':'video', 'flv':'video'}[temp[1]] || 'unknown';
}

function iconForType(type) {
	return {'image': "icons/image.png", 'text': "icons/text.png", 'video': 'icons/video.png'}[type] || 'unknown';
}
