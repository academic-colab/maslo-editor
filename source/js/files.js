/**
 * Gets the path to the application
 */
function getAppPath(){
	var path = air.File.applicationStorageDirectory.nativePath +
		air.File.separator;
	return path;
}

/**
 * Open the file browser window on the local machine and filters
 * for all the acceptable file types in MASLO
 */
function chooseFile(action) {
	file = new window.runtime.flash.filesystem.File();
	file.addEventListener(air.Event.SELECT, action);
	fltr_img = new air.FileFilter("image", "*.png;*.gif;*.jpg;*.jpeg");
	fltr_aud = new air.FileFilter("audio", "*.mp3;*.wav;*.aiff");
	fltr_vid = new air.FileFilter("video", "*.mp4");
	fltr_doc = new air.FileFilter("text", "*.txt;*.html;*.htm");
	file.browseForOpen("Please select a file...",
					   [fltr_img, fltr_aud, fltr_vid, fltr_doc]);
}

/*
 * Called when we want to replace a media file. Essentially the same as chooseFile()
 * but it filters depending on the type of media.
 */
function replaceMediaFile(action, type) {
    file = new window.runtime.flash.filesystem.File();
	file.addEventListener(air.Event.SELECT, action);
    fltr = (type == "image") ? new air.FileFilter("image", "*.png;*.gif;*.jpg;*.jpeg") :  
           (type == "video") ? new air.FileFilter("video", "*.mp4") : 
    	   (type == "audio") ? new air.FileFilter("audio", "*.mp3;*.wav;*.aiff") :
    						   new air.FileFilter("text", "*.txt;*.html;*.htm");
	file.browseForOpen("Please select a file...", [fltr]);
}

/*
 * Clean up leftover zip files from upload process. In theory they should never be left, but
 * in practice we've seen one case where it happened. Just clean up on startup! 
 */
function clearZipsFromAppDir(){
	var contents = air.File.applicationStorageDirectory.getDirectoryListing();  
	var c = "contents.zip";
	for (var i = 0; i < contents.length; i++)  { 
		if (!(contents[i].isDirectory) && contents[i].name.length >= c.length) {
			var c2 = contents[i].name.substr(0,c.length);
			if (c2 == c)
				contents[i].deleteFile(); 
		}
	}
}
    
/**
 * 
 * @param path
 * @return 
 */
function relativize(path) {
	// regex to match final /(project/file)
	// using an absolute url would prevent exporting projects to another computer
	var s = air.File.separator;
	return path.split(s).slice(-2).join(s);
}

function recursiveSize(folder) {
	var files = new air.File(folder).getDirectoryListing();
	var s = 0;
	$(files).each(function() {
		s += this.isDirectory ? recursiveSize(this.nativePath) : this.size;
	});
	return s;
}

function recursiveModified(folder) {
	var files = new air.File(folder).getDirectoryListing();
	var mod = 0;
	$(files).each(function() {
		mod = Math.max(mod,
			this.isDirectory
				? recursiveModified(this.nativePath) : this.modificationDate.time
		);
	});
	return mod;
}

// this code is nice
function bytes2human(n) {
	if(n < 1024) return n + 'B';
	var exp = Math.floor(Math.log(n) / Math.log(1024));
	var pre = 'KMGTPE'.charAt(exp-1);
	return Math.round((n / Math.pow(1024, exp))*10)/10 + pre;
}

