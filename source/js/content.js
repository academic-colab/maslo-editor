function FileCache(path) {
	this.path = path;
}

FileCache.prototype.__defineGetter__('val', function() {
	return this._val || (this._val = this._loadData(this.path));
});
FileCache.prototype.__defineSetter__('val', function(v) {
	this._val = v;
});

FileCache.prototype.flush = function() {
	this._saveData(this.path, this._val);
}

FileCache.prototype._saveData = function(path, data) {
	if(!data) {
		return false;
	}
	var f = new air.File(path);
	var fs = new air.FileStream();
	fs.open(f, air.FileMode.WRITE);
	fs.writeMultiByte(data, "utf-8");
	fs.close();
	return true;
};

FileCache.prototype._loadData = function(path) {
	var f = new air.File(path);
	var fs = new air.FileStream();
	fs.open(f, air.FileMode.READ);
	var ret = fs.readMultiByte(fs.bytesAvailable, "utf-8");
	fs.close();
	return ret;
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Content(originalPath, projectBase, title, desc) {
	originalPath = originalPath || "";
	// if the original path is outside the project base path
	if(originalPath.indexOf(projectBase) < 0) {
		this.path = [
			projectBase,
			'content-' + Math.floor(Math.random()*4000000000)
		].join(air.File.separator);
		var src = new air.File(originalPath);
		var dst = new air.File(this.path);
		src.copyTo(dst, true);
	} else {
		this.path = originalPath;
	}
	this.title = title;
	this.desc = new FileCache(this.path + '.dsc', desc);
}

Content.prototype.icon = function() {
	return this._icon || 'icon/unknown.png';
};

// return this object but without methods or "banned" members
Content.prototype.metadata = function() {
	var ret = {};
	var useless = ['desc'];
	for(var member in this) {
		// accumulate only useful non-function members
		if(typeof this[member] != 'function' && !useless.contains(member)) {
			alert(member + " is being added to metadata");
			ret[member] = this[member];
		}
	}
	return ret;
};

Content.prototype.save = function() {
	this.desc.flush();
};

Content.prototype.render = function(div) {
	var input = $('<input type="text" size="55" class="title" />');
	input.val(this.title);
	div.append(input);	
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


Image.prototype = new Content;
function Image(originalPath, projectBase, title, desc) {
	Content.call(this, originalPath, projectBase, title, desc);
	this._icon = 'icon/image.png';
}

Image.prototype.render = function(div) {
	Content.render.call(this, div);
	var img = $('<img />')
	img.attr('src', 'file://' + this.path);
	div.append(img);
	textArea.val(this.desc);
	textArea.addClass('description');
	div.append(textArea);	
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


Text.prototype = new Content;
function Text(originalPath, projectBase, title, desc) {
	Content.call(this, originalPath, projectBase, title, desc);
	this.doc = new FileCache(this.path, desc);
	this._icon = 'icon/text.png';
}

Text.prototype.render = function(div) {
	Content.render.call(this, div);
	var textArea = $('<textarea rows="3" cols="50"></textarea>');
	textArea.val(this.desc);
	textArea.addClass('description');
	div.append(textArea);	
};

Text.prototype.save = function() {
	Content.save.call(this);
	this.doc.flush();
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


Audio.prototype = new Content;
function Audio(originalPath, projectBase, title, desc) {
	Content.call(this, originalPath, projectBase, title, desc);
	this._icon = 'icon/audio.png';
}

Audio.prototype.render = function(div) {
	Content.render.call(this, div);
	mp3         = new air.Sound(new air.URLRequest(this.path));
	channel     = null;
	btn         = $('<input type="button" value="Play" />');
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
};
