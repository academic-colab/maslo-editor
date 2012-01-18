'use strict';

function FileCache(path) {
	this.path = path;
}

FileCache.prototype.__defineGetter__('val', function() {
	if(!this._val) {
		this._val = this._loadData(this.path);
	}
	return this._val;
});

FileCache.prototype.__defineSetter__('val', function(v) {
	this._val = v;
});

FileCache.prototype.flush = function() {
	this._saveData(this.path, this._val);
};

FileCache.prototype._saveData = function(path, data) {
	var f = new air.File(path);
	var fs = new air.FileStream();
	fs.open(f, air.FileMode.WRITE);
	fs.writeMultiByte(data, "utf-8");
	fs.close();
	return true;
};

FileCache.prototype._loadData = function(path) {
	var f = new air.File(path);
	var ret = '';
	if(f.exists) {
		var fs = new air.FileStream();
		fs.open(f, air.FileMode.READ);
		ret = fs.readMultiByte(fs.bytesAvailable, "utf-8");
		fs.close();
	}
	return ret;
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

// If idOrPath is a path, then the constructor will import the file
// into the projectBase and give it a new unique name. If idOrPath is
// a number, the constructed content will refer to an existing import.
function Content(projectBase, title, idOrPath) {
	if(!projectBase) {
		// when Content is used in prototypal inherience, these
		// arguments will be unspecified
		return; 
	}
	this.type  = 'content'; // used in saving/loading object
	this._base = projectBase;
	idOrPath   = idOrPath || '';
	if(typeof idOrPath == 'number') {
		this.id = idOrPath;
	} else {
		// prepare a new place within this project
		this.id = this._uniqueId();
	}
	this.path = this._base + air.File.separator + this.id;
	// if an outside path was specified, copy that file
	if(typeof idOrPath == 'string' && idOrPath != '') {
		var src = new air.File(idOrPath);
		var dst = new air.File(this.path);
		src.copyTo(dst, true);
	}
	this.title    = title;
	// descriptions are associated by convention in an <id>.dsc file
	this.descFile = new FileCache(this.path + '.dsc');
	this.icon     = 'icons/unknown.png';
}

// Return this object but with members of only simple types
// (strings, numbers). Exclude members beginning with '_'
// because they are considered "private."
Content.prototype.metadata = function() {
	var ret = {};
	for(var m in this) {
		if(m[0] != '_' && (typeof this[m] == 'string') || (typeof this[m] == 'number')) {
			ret[m] = this[m];
		}
	}
	return ret; // wouldn't it be nice to have filter() in JS?
}

Content.prototype.save = function() {
	// render creates the text input _titleInput
	this.title = this._titleInput.val() || this.title;
};

Content.prototype.render = function(div) {
	this._titleInput = $('<input type="text" size="55" class="title" />');
	this._titleInput.val(this.title);
	div.append(this._titleInput);	
	return div;
};

Content.prototype.deleteFile = function() {
	var condemned = new air.File(this.path);
	if(condemned.isDirectory) {
		condemned.deleteDirectory(true);
	} else {
		condemned.deleteFile();
	}
};

Content.prototype.unrender = function() { };

Content.prototype._uniqueId = function() {
	var f, id;
	do {
		id = Math.floor(Math.random()*4000000000);
		f = new air.File(this._base + air.File.separator + id);
	} while(f.exists);
	return id;
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Image(projectBase, title, idOrPath) {
	Content.call(this, projectBase, title, idOrPath);
	this.icon = 'icons/image.png';
	this.type = 'image'; // used in saving/loading object
}
Image.prototype = new Content();
Image.prototype.constructor = Image;

Image.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	var img = $('<img />');
	img.attr('src', 'file://' + this.path);
	div.append(img);
	this._descInput.val(this.descFile.val);
	this._descInput.addClass('description');
	div.append(this._descInput);	
	return div;
};

Image.prototype.save = function() {
	Content.prototype.save.call(this);
	if(this._descInput) {
		this.descFile.val = this._descInput.val();
	}
	this.descFile.flush();
};



//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Text(projectBase, title, idOrPath) {
	Content.call(this, projectBase, title, idOrPath);
	this.docFile = new FileCache(this.path);
	this.icon = 'icons/text.png';
	this.type = 'text';
}
Text.prototype = new Content();
Text.prototype.constructor = Text;

Text.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	this._textInput = $('<textarea rows="3" cols="50"></textarea>');
	this._textInput.val(this.docFile.val);
	this._textInput.addClass('description');
	div.append(this._textInput);	
	return div;
};

Text.prototype.save = function() {
	Content.prototype.save.call(this);
	if(this._textInput) {
		this.docFile.val = this._textInput.val();
	}
	this.docFile.flush();
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Audio(projectBase, title, idOrPath) {
	Content.call(this, projectBase, title, idOrPath);
	this.icon = 'icons/audio.png';
	this.type = 'audio';
}
Audio.prototype = new Content();
Audio.prototype.constructor = Audio;

Audio.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	var mp3         = new air.Sound(new air.URLRequest(this.path));
	var channel     = null;
	var btn         = $('<input type="button" value="Play" />');
	var toggleSound = function() {
		if(channel) {
			channel.stop();
			channel = null;
		} else {
			channel = mp3.play();
			channel.addEventListener(air.Event.SOUND_COMPLETE,
			function(e) { channel = null; btn.attr('value', 'Play'); }); 
		}
		btn.attr('value', channel ? 'Stop' : 'Play');
	};
	btn.click('click', toggleSound);
	div.append(btn);
	// unrender in this case will be sure the audio has stopped playing
	this.unrender = function() {
		Content.prototype.unrender.call(this);
		if(channel) {
			channel.stop();
			channel = null;
		}
	};
	return div;
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Quiz(projectBase, title, idOrPath) {
	Content.call(this, projectBase, title, idOrPath);
	// create new quiz directory if existing id not specified
	if(typeof idOrPath != 'number') {
		var d = new air.File(this.path);
		d.createDirectory();
	}
	this.icon = 'icons/quiz.png';
	this.type = 'quiz';
}
Quiz.prototype = new Content();
Quiz.prototype.constructor = Quiz;

Quiz.prototype.render = function(div) {
	window.location = 'quiz.html?name=' + this.id;
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


// "Static" factory method deduces file types and instantiates the
// appropriate subclass of Content
Content.FromImport = function(projectBase, title, originalPath) {
	var extension = originalPath.match(/\.(\w+)$/);
  	var type      = {
  		'png':'image', 'gif':'image', 'txt':'text', 'html':'text',
		'jpg':'image', 'jpeg':'image', 'swf':'video', 'mpeg':'video', 'mpg':'video',
		'avi':'video', 'flv':'video', 'mp3':'audio', 'wav':'audio', 'aiff':'audio'
	}[extension[1]] || 'unknown';
	var ctor = Content.TypeConstructor(type);
	return new ctor(projectBase, title, originalPath);
};

Content.FromMetadata = function(projectBase, md) {
	var ctor = Content.TypeConstructor(md.type);
	return new ctor(projectBase, md.title, md.id);
};

Content.TypeConstructor = function(type) {
	return {
		"image": Image, "text": Text, "audio": Audio, "video": Content
	}[type] || Content;
};
