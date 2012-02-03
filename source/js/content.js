'use strict';

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

Content.prototype.preview = function(div) { }

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
	this._descInput = $('<textarea rows="3" cols="50"></textarea>');
	this._descInput.val(this.descFile.val);
	this._descInput.addClass('description');
	div.append(this._descInput);	
	return div;
};

Image.prototype.preview = function(div) {
	Content.prototype.preview.call(this, div);
	var img = $('<img />');
	img.attr('src', 'file://' + this.path);
	div.append(img);
	var p = $('<p>');
	p.html(this.descFile.val);
	div.append(p);
	return div;
}

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

Text.prototype.preview = function(div) {
	Content.prototype.preview.call(this, div);
	var p = $('<p>');
	p.html(this.docFile.val);
	div.append(p);
	return div;
}

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
	return this.preview(div);
};

Audio.prototype.preview = function(div) {
	Content.prototype.preview.call(this, div);
	var mp3         = new air.Sound(new air.URLRequest('file://' + this.path));
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
}


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
	var project = /([^\/]+)$/.exec(this._base)[0];
	window.location = 'quiz.html?' + $.param(
		{id:this.id, proj:project, title:this.title}, true);
	return false;
};

Quiz.prototype.preview = function(div) {
	div.append(
		'<h3 style="color:red"><b>TODO</b>: copy logic from presentQuestion \
		 function (in preview.html) to Quiz::preview.</h3>');
	return div;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Question(projectBase, title, idOrPath) {
	Content.call(this, projectBase, title, idOrPath);
	this.icon = 'icons/question.png';
	this.type = 'question';
	this.answerFile = new FileCache(this.path);
	this._answerForm = $('<form class="answers"><fieldset /></form>').find('fieldset');
	var answers = this.answerFile.val ?
		JSON.parse(this.answerFile.val) : [];
	for(var a in answers) {
		a = answers[a];
		this.addAnswer(a.text, a.correct, a.feedback);
	}
}
Question.prototype = new Content();
Question.prototype.constructor = Question;

Question.prototype.save = function() {
	Content.prototype.save.call(this);
	if(this._answerForm) {
		var ar = [];
		this._answerForm.find('div.answer').each(function(k, v) {
			feedback = $(v).find('input[name="feedback"]');
			ar.push( {
				text: $(v).find('input[name="answer"]').val(),
				feedback: feedback ? feedback.val() : '',
				correct: $(v).find('input[name="correct"]').attr('checked')
			});
		});
		this.answerFile.val = JSON.stringify(ar);
		this.answerFile.flush();
	}
};

Question.prototype.render = function(div) {
	div.append('<h6>Question</h6>');
	Content.prototype.render.call(this, div);
	div.append(this._answerForm);
	var add = $('<button class="small radius white button">+ Add another answer</button>');

	var q = this;
	add.click(function() {
		q.addAnswer();
	});
	div.append(add);
	return div;
};

Question.prototype.addAnswer = function(answer, correct, feedback) {
	var a = $('<div class="answer"></div>');
	a.append(
		$('<img class="remove" src="icons/remove.png" alt="Remove Item" />')
		.click(function() {
			a.remove();
		})
	);
	a.append($('<label for="answer">Answer </label>'))
	a.append(
		$('<input type"text" size="35" name="answer" />')
			.val(answer)
	);
	a.append(
		$('<input type="checkbox" name="correct" />')
			.attr('checked', correct || false)
	);
	a.append($('<label for="correct">Correct</label>'));
	a.append($('<br />'));

	if(feedback) {
		a.append($('<label for="feedback">Feedback </label>'))
		var f = $('<input type="text" name="feedback" size="45" />');
		f.val(feedback);
		a.append(f);
	} else {
		a.append($('<input type="button" class="feedback small radius white button" value="+ Feedback" />'));
		a.find('input[type="button"]').click(function() {
			$(this).remove();
			a.append($('<label for="feedback">Feedback </label>'))
			a.append($('<input type="text" name="feedback" size="45" />'));
		});
	}

	this._answerForm.append(a);
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Video(projectBase, title, idOrPath) {
	Content.call(this, projectBase, title, idOrPath);
	this.icon = 'icons/video.png';
	this.type = 'video';
	// an AIR netstream object
}
Video.prototype = new Content();
Video.prototype.constructor = Video;

Video.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	return this.preview(div);
};

Video.prototype.preview = function(div) {
	Content.prototype.preview.call(this, div);
	var playBtn = $('<button>Preview Video (FLV only)</button>');
	var self = this;
	var nc, ns, vid, newWindow;
	playBtn.click(function() {
		var options = new air.NativeWindowInitOptions(); 
		options.systemChrome = air.NativeWindowSystemChrome.STANDARD; 
		options.transparent = false; 
		newWindow = new air.NativeWindow(options);
		newWindow.activate();

		nc = new air.NetConnection();
		nc.connect(null);
		ns = new air.NetStream(nc);
		ns.addEventListener(air.AsyncErrorEvent.ASYNC_ERROR, function(){});
		ns.play('file://' + self.path);
		vid = new air.Video();
		vid.attachNetStream(ns);
		newWindow.stage.addChild(vid);	
	});
	this.unrender = function() {
		Content.prototype.unrender.call(self);
		if(vid && ns && nc && newWindow) {
			vid.clear();
			ns.close();
			nc.close();
			newWindow.close();
		}
	};
	div.append(playBtn);
	return div;
}


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
		"image": Image, "text": Text, "audio": Audio,
	    "video": Video, "quiz": Quiz, "question": Question
	}[type] || Content;
};
