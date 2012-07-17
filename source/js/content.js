'use strict';

// If idOrPath is a path, then the constructor will import the file
// into the projectBase and give it a new unique name. If idOrPath is
// a number, the constructed content will refer to an existing import.
function Content(projectBase, title, idOrPath, ext) {
	if(!projectBase) {
		// when Content is used in prototypal inherience, these
		// arguments will be unspecified
		return; 
	}
	this.type  = 'content'; // used in saving/loading object
	this._base = projectBase;
    this.extension = ext;
    this._tmpObj = null;
    if (air.File.separator != "/"){
		this._base = this._base.replace(/\//g, air.File.separator);
	}
	this._project = projectBase.split(air.File.separator);
	this._project = this._project[this._project.length - 1];
	
    idOrPath   = idOrPath || '';
	if(typeof idOrPath == 'number') {                  
		this.id = idOrPath;
	}
    else {
		// prepare a new place within this project
		this.id = this._uniqueId();
	}
	
	this.path = this._base + air.File.separator + this.id;
	if (this.extension && this.extension != "")
		this.path += "." + this.extension
	// if an outside path was specified, copy that file
	if(typeof idOrPath == 'string' && idOrPath != '') {
		var src = new air.File(idOrPath);
		if (src.extension) {
			this.path = this.path + "." + src.extension.toLowerCase();
			this.extension = src.extension.toLowerCase();
		}
		var dst = new air.File(this.path);
		src.copyTo(dst, true);
	}
	this.title    = title;
	this.attachments = [];
	
	// descriptions are associated by convention in an <id>.dsc file
	this.descFile = new FileCache(this.path + '.dsc');	
	this.icon     = 'icons/unknown.png';
	this.status = "Unpublished";
	this._saved = false;
	this._confirm = $('\
		<div id="dialog-confirm" style="display: none" title="Discard unsaved changes"> \
			<p>You are about to close this edit window. \
			Do you want to discard unsaved changes? \
		</div>');
}

Content.prototype.updateStatus = function(didPublish){
	if (didPublish){
		if (this.status == "Unpublished" || this.status == "Modified") {
			this.status = "Published";
		}
	} else {
		if (this.status == "Published") { 
			this.status = "Modified";
		}
	}
}

// Return this object but with members of only simple types
// (strings, numbers). Exclude members beginning with '_'
// because they are considered "private."
Content.prototype.metadata = function(basePath) {
	var ret = {};
	for(var m in this) {
		if(m[0] != '_' && (typeof this[m] == 'string') || (typeof this[m] == 'number')) {
			var val = this[m];
			if (m == "path" && basePath != null){
				val = val.replace(basePath, "");
				if (air.File.separator != "/"){
					var re = new RegExp("\\"+air.File.separator, "g");
					val = val.replace(re, "/");
				}
			}
			ret[m] = val;
		}	
	}
	var attach = [];
	
	for (var a in this.attachments) {
		a = this.attachments[a];
		attach.push(a.metadata(basePath));
	}
	if (attach.length > 0){
		ret["attachments"] = attach;
	}
	return ret; // wouldn't it be nice to have filter() in JS?
}

Content.prototype.save = function(title) {
	this._saved = true;
	
	if (this._descInput && this._tmpObj){
		this._tmpObj._descInput = this._descInput;
	}
	// render creates the text input _titleInput		
	if (this._titleInput){
		this.title = this._titleInput.val() || this.title;		
		if (this._tmpObj){
			this._tmpObj.title = this.title;
		}
		return;
	}	
	if (title != null) {
		this.title = title
		if (this._tmpObj){
			this._tmpObj.title = this.title;
		}
	}
	
};

Content.prototype.render = function(div) {
	this._titleInput = $('<input type="text" size="69" class="title" />');
	this._titleInput.val(this.title);
	div.append(this._titleInput);
	this._saved = false;
	//$.cleditor.defaultOptions.height = 250;
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
	this.descFile.deleteData();
};

/*
 * Replaces the media file associatied with the content element
 * Keeps track of the original file as well as the new one
 * in case the user decides to 'discard' the changes
 *
 * TODO: Make the function more general (other media types than img)
 */
Content.prototype.replaceMedia = function(replacement) {
    if(this._tmpObj) {
        var delFile = new air.File(this._tmpObj.path);
        delFile.deleteFile();
    }
	this._tmpObj = Content.FromImport(this._base, this.title, replacement);
	this._tmpObj.descFile.val = this.descFile.val;
    if(this.type == "image") {
    	$('#imgWrapper').empty();
    	var img = $('<img />');
    	img.attr('src', 'file://' + this._tmpObj.path);
    	$('#imgWrapper').append(img); 
    }
};

Content.prototype.unrender = function() { 
	// technically this is not true, but if we get to 
	// this function, then we sure don't want to save the
	// content anymore. So let's just claim we did save
	this._saved = true;
};

Content.prototype._uniqueId = function() {
	var f, id;
	do {
		id = Math.floor(Math.random()*4000000000);
		f = new air.File(this._base + air.File.separator + id);
	} while(f.exists);
	return id;
};

Content.prototype.wasModified = function(){
	var inputInst = CKEDITOR.instances.editor1 ? CKEDITOR.instances.editor1 : CKEDITOR.instances.editor2;
	var descInputCK = inputInst.getData();
	var oldText = this.docFile ? this.docFile.val : this.descFile.val;
	var result = ( this._tmpObj || (this._titleInput && (this._titleInput.val() != this.title)) );
	result = result || (descInputCK != oldText);
	return result;
}



//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Image(projectBase, title, idOrPath, ext) {
	Content.call(this, projectBase, title, idOrPath, ext);
	this.icon = 'icons/image.png';
	this.type = 'image'; // used in saving/loading object
    
}
Image.prototype = new Content();
Image.prototype.constructor = Image;

Image.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
    var wrapperDiv = $('<div id="imgWrapper"></div>');
	var img = $('<img />');
	img.attr('src', 'file://' + this.path);
    wrapperDiv.append(img);
	div.append(wrapperDiv);
    
    /*
    * replaceable image  
    */ 
   
    var self = this;  
    var imageBtn = $('<button>Replace Image</button>');
    imageBtn.click(function() {
        replaceMediaFile(function(e) {
            Content.prototype.replaceMedia.call(self, e.target.url);
            return false;
        },self.type);
        return false;
    });
    div.append(imageBtn);
      
	this._descInput = $('<textarea id="editor1" rows="3" cols="50"></textarea>');
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
	var p = $('<p/>');
	var descContent = this.descFile.val;
	if (descContent.trim() == "")
		descContent = descContent.trim();
	p.html(descContent);
	div.append(p);
	return div;
}

Image.prototype.save = function() {
	Content.prototype.save.call(this);
	if(this._descInput) {
		var newData = CKEDITOR.instances.editor1.getData().replace(/\<br\>/g, "");
		newData = newData.replace(/&nbsp;/g, "");
		if (newData.trim() == "")
			this.descFile.val = newData;
		else 
			this.descFile.val = CKEDITOR.instances.editor1.getData();
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
	this.docFile.val = "";
}
Text.prototype = new Content();
Text.prototype.constructor = Text;

Text.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	this._textInput = $('<textarea id="editor1" rows="3" cols="50"></textarea>');
	this._textInput.val(this.docFile.val);
	this._textInput.addClass('description');
	div.append(this._textInput);	
	return div;
} 

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
		this.docFile.val = CKEDITOR.instances.editor1.getData();
	}
	this.docFile.flush();
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Audio(projectBase, title, idOrPath, ext) {
	Content.call(this, projectBase, title, idOrPath, ext);
	this.icon = 'icons/audio.png';
	this.type = 'audio';
}
Audio.prototype = new Content();
Audio.prototype.constructor = Audio;

Audio.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	div = this.preview(div, true);
	this._descInput = $('<textarea id="editor1" rows="3" cols="50"></textarea>');
	this._descInput.val(this.descFile.val);
	this._descInput.addClass('description');
	div.append(this._descInput);
	return div;
};

Audio.prototype.preview = function(div, isEdit) {
	Content.prototype.preview.call(this, div);	
	var mp3         = new air.Sound(new air.URLRequest('file://' + this.path));
	var channel     = null;
	var btn         = $('<button>Play</button>');
	var self = this; 
	var currentPath = this.path 
	var toggleSound = function() {
		if(channel) {
			channel.stop();
			channel = null;
		} else {
			if (self._tmpObj && self._tmpObj.path != currentPath){
				currentPath = self._tmpObj.path		
				mp3 = new air.Sound(new air.URLRequest('file://' + currentPath));
			}
			channel = mp3.play();
			channel.addEventListener(air.Event.SOUND_COMPLETE,
			function(e) { channel = null; btn.attr('value', 'Play'); }); 
		}
		var btnHtml = channel ? 'Stop' : 'Play';
		btn.html(btnHtml);
	};
	btn.click('click', toggleSound);
	div.append(btn);
	
	/*
    * Replaceable button  
    */ 
       
    var audioBtn = $('<button>Replace Audio</button>');
    audioBtn.click(function() {
		if(channel) {
			toggleSound();
		}
        replaceMediaFile(function(e) {
            Content.prototype.replaceMedia.call(self, e.target.url);
            return false;
        },self.type);		
        return false;
    });    
	
	// unrender in this case will be sure the audio has stopped playing
	this.unrender = function() {
		Content.prototype.unrender.call(this);
		if(channel) {
			channel.stop();
			channel = null;
		}
	};
	if (!isEdit) {
		var p = $('<p/>');
		var descContent = this.descFile.val;
		if (descContent.trim() == "")
			descContent = descContent.trim();
		p.html(descContent);
		div.append(p);
	} else {
		div.append(audioBtn);
	}
	return div;
}

Audio.prototype.save = function() {
	Content.prototype.save.call(this);
	if(this._descInput) {
		var newData = CKEDITOR.instances.editor1.getData().replace(/\<br\>/g, "");
		newData = newData.replace(/&nbsp;/g, "");
		if (newData.trim() == "")
			this.descFile.val = newData;
		else 
			this.descFile.val = CKEDITOR.instances.editor1.getData();
	}
	this.descFile.flush();
};

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Quiz(projectBase, title, idOrPath, ext) {
	Content.call(this, projectBase, title, idOrPath);
	this.status = status;
	// create new quiz directory if existing id not specified
	if(typeof idOrPath != 'number') {
		var d = new air.File(this.path);
		d.createDirectory();
	}
	this.icon = 'icons/quiz.png';
	this.type = 'quiz';
	var quiz = new Manifest(this.path);
	var questions = quiz.data();
	this.status = quiz.versionData.status;
	
	for (var i = 0; i < questions.length; i++){
		if (questions[i].status != this.status){
			this.status = "Modified";
		}
	}
}
Quiz.prototype = new Content();
Quiz.prototype.constructor = Quiz;

Quiz.prototype.render = function(div) {
	window.location = 'quiz.html?' + $.param(
		{id:this.id, proj:this._project, title:this.title}, true);		
	return false;
}
 
Quiz.prototype.preview = function(argDiv) {	
	function doDisplay(which, div, argIndex){
		div.empty();
		var index = 0;
		if (argIndex != null)
			index = argIndex;
		var quiz = new Manifest(which.path);
		var questions = quiz.data();
		if (questions.length == 0 ){
			var msg = "<p/><p/><p/><b>This quiz has no questions yet.</b>";
			div.append(msg);
			return;
		}
		var question = questions[index];
		var answerFile = new FileCache(question.path); 
		var answers = answerFile.val ?
			JSON.parse(answerFile.val) : [];
		var idx = (index+1);
		var qObj = Content.FromMetadata(which.path, questions[index]);
		var questionDesc = qObj.descFile.val;
		var questionTitle = qObj.title
		if (questionDesc.trim() != "")
			questionTitle = questionDesc;
		div.append('<p><b>Question '+idx+'/'+questions.length+'</b><br/><br/>' + questionTitle +'</p>');
		for (var att in qObj.attachments) { 
			attach = qObj.attachments[att];
			attach.preview(div);
		}
		div.append('<p><b>Answers</b></p>');
		for(var i in answers) {
			var a = answers[i];
			div.append('<input name="answer" value="' + i + '" type="radio" />');
			div.append(a.text + '<br />');
		}
		div.append('<p/>');
		var next = function() {
			if(index+1 >= questions.length) {
				div.empty();
				div.append('<p>End of quiz.</p>');
				var reset = $('<button class="nice small radius black button">Retry quiz</button>');
				reset.click(function() {
				doDisplay(which, div, 0);
				});
				div.append(reset);
			} else {
				doDisplay(which, div, index+1);
			}
		};
		var submit = $('<button class="nice small radius black button" >Submit</button>');
		submit.click(function() {
			var i = $('input[name=answer]:checked').val();
			// feedback is blank when no selection is made
			// or when there simply is no feedback for a selection
			var feedback = i === undefined
				? '' : answers[i].feedback;
			div.empty();
			if(feedback) {
				
				div.append('<p>' + feedback + '</p>');

				// We are reusing this button as the continue button
				// for the feedback screen. The whole screen is erased
				// next time so it will reset to Submit.
				submit.click(next);
				submit.text('Continue');
				div.append(submit);
			} else {
				var msg = "Incorrect!";
				if (i === undefined) {
					msg = "No answer selected.";
				} else {
					if (answers[i].correct == "checked")
						msg = "Correct!";
				}
				div.append('<p>' + msg + '</p>');

				// We are reusing this button as the continue button
				// for the feedback screen. The whole screen is erased
				// next time so it will reset to Submit.
				submit.click(next);
				submit.text('Continue');
				div.append(submit);				
			}
		});
		div.append(submit);
		div.append("<br/><br/><br/><br/>");
	}
	Content.prototype.preview.call(this, argDiv);
	doDisplay(this, argDiv);	
	return argDiv;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function createAnswers(question){
	question._answerForm = $('<form class="answers"><fieldset /></form>').find('fieldset');
	question._answerForm.empty();
	var answers = question.answerFile.val ?
		JSON.parse(question.answerFile.val) : [];
	for(var a in answers) {
		a = answers[a];
		question.addAnswer(a.text, a.correct, a.feedback);
	}
}

function Question(projectBase, title, idOrPath, ext) {
	Content.call(this, projectBase, title, idOrPath, ext);
	
	this.icon = 'icons/question.png';
	this.type = 'question';
	this.answerFile = new FileCache(this.path);
	createAnswers(this);
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
	} else {
		this.answerFile.val = "{}";
		this.answerFile.flush();
	}
	if(this._descInput) {
		var newData = CKEDITOR.instances.editor2.getData().replace(/\<br\>/g, "");
		newData = newData.replace(/&nbsp;/g, "");
		if (newData.trim() == "")
			this.descFile.val = newData;
		else 
			this.descFile.val = CKEDITOR.instances.editor2.getData();
		this.descFile.flush();
	}
	
	
};

Question.prototype.render = function(div) {
	div.append('<h6>Question Title</h6>');
	Content.prototype.render.call(this, div);
	div.append('<p/><h6>Question Text</h6>');	
	this._descInput = $('<textarea id="editor2" rows="3" cols="50"></textarea>');
	this._descInput.val(this.descFile.val);
	this._descInput.addClass('description');
	//$.cleditor.defaultOptions.height = 125;
	div.append(this._descInput);
	createAnswers(this);
	div.append('<hr/><p/><h6>Media</h6><br/>');
	var mediaDiv = $('<div id="mediaDiv"></div>');
	div.append(mediaDiv);	
	var add = $('<button class="small radius white button">Add media</button>');
	var q = this;
	
	for (var idx = 0; idx < this.attachments.length; idx++){
		var content = this.attachments[idx];
		q.addMedia(mediaDiv, content, idx);
	}
	
	add.click(function() {
		chooseFile(function(e) {
			var content = Content.FromImport(q._base, 'Untitled', e.target.url);
			q.addMedia(mediaDiv, content);
			return false;
			});
	});
	div.append(add);
	div.append('<hr/><p/><h6>Answers</h6><br/>');
	div.append(this._answerForm);
	
	var add = $('<button class="small radius white button">+ Add another answer</button>');

	add.click(function() {
		q.addAnswer();
		return false;
	});
	div.append(add);
	return div;
};

Question.prototype.addMedia = function(mediaDiv, content, index){
	var q = this;

	if (index == null) {
		q.attachments.push(content);
		index = q.attachments.length -1;
	}
	mediaDiv.empty();
	
	var qManifest = new Manifest(q._base, q.title, this);
	qManifest.render(mediaDiv);
	return false;
};


Question.prototype.addAnswer = function(answer, correct, feedback) {
	var a = $('<div class="answer"/>');
	a.append(
		$('<img class="remove" src="icons/remove.png" alt="Remove Item" />')
		.click(function() {
			a.remove();
		})
	);
	a.append($('<label for="answer">Answer </label>'))
	a.append(
		$('<input type="text" size="35" name="answer" />')
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
			return false;
		});
	}

	this._answerForm.append(a);
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


function Video(projectBase, title, idOrPath, ext) {
	Content.call(this, projectBase, title, idOrPath, ext);
	this.icon = 'icons/video.png';
	this.type = 'video';
	// an AIR netstream object
}
Video.prototype = new Content();
Video.prototype.constructor = Video;

Video.prototype.render = function(div) {
	Content.prototype.render.call(this, div);
	div = this.preview(div, true);
	this._descInput = $('<textarea id="editor1" rows="3" cols="50"></textarea>');
	this._descInput.val(this.descFile.val);
	this._descInput.addClass('description');
	div.append(this._descInput);
	return div;
};

Video.prototype.preview = function(div, isEdit) {
	Content.prototype.preview.call(this, div);
	var playBtn = $('<button>Preview Video</button>');
	var self = this;
	var nc, ns, vid, newWindow;
	var currentPath = this.path;
	var process = null;
	var playVideo = function() {
		if (process) {
			process.exit();
			process = null;
		}
		if(air.NativeProcess.isSupported){
			if (self._tmpObj && self._tmpObj.path != currentPath){
				currentPath = self._tmpObj.path						
			}
			var dir = air.File.applicationDirectory;
			var opsys = air.Capabilities.os;
			var file = null;
			if (opsys.substring(0, 3) == "Mac"){
				file = dir.resolvePath("vlc/VLC.app/Contents/MacOS/VLC");
			} else if (opsys.substring(0, 3) == "Win") {
				file = dir.resolvePath("vlc/vlc/vlc.exe");
			}
			if (file != null && !file.exists){
				alert("Apparently your MASLO release does not contain the VLC player. Video preview is therefore disabled.");
			}
			if (file != null) {
		    	var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
		    	nativeProcessStartupInfo.executable = file;
		    	process = new air.NativeProcess();
				var processArgs = new air.Vector["<String>"]();
				processArgs.push("--video-on-top");
				processArgs.push("--play-and-exit");

				processArgs.push(currentPath); 
				nativeProcessStartupInfo.arguments = processArgs;
		    	process.start(nativeProcessStartupInfo);
			} else {
				alert("Video preview is not supported on this platform. (Platform string: "+opsys+")");

			}
		}				
	};
	playBtn.click(playVideo);
	
	this.unrender = function() {
		Content.prototype.unrender.call(self);
		if (process){
			process.exit();
			process = null;
		}
	};
	div.append(playBtn);
	/*
    * Replaceable video 
    */ 
    var self = this;  	
    var videoBtn = $('<button>Replace Video</button>');
    videoBtn.click(function() {
		if (process){
			process.exit();
			process = null;
		}
        replaceMediaFile(function(e) {
            Content.prototype.replaceMedia.call(self, e.target.url);
            return false;
        },self.type);
        return false;
    });
    	    
	if (!isEdit) {
		var p = $('<p/>');
		var descContent = this.descFile.val;
		if (descContent.trim() == "")
			descContent = descContent.trim();
		p.html(descContent);
		div.append(p);
	} else {
		div.append(videoBtn);
	}
	return div;
}

Video.prototype.save = function() {
	Content.prototype.save.call(this);
	if(this._descInput) {
		var newData = CKEDITOR.instances.editor1.getData().replace(/\<br\>/g, "");
		newData = newData.replace(/&nbsp;/g, "");
		if (newData.trim() == "")
			this.descFile.val = newData;
		else 
			this.descFile.val = CKEDITOR.instances.editor1.getData();
	}
	this.descFile.flush();
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


// "Static" factory method deduces file types and instantiates the
// appropriate subclass of Content
Content.FromImport = function(projectBase, title, originalPath) {
	var extension = originalPath.match(/\.(\w+)$/);
	if (extension)
		extension = extension[1].toLowerCase();	
	else 
		extension = "";
  	var type      = {
  		'png':'image', 'gif':'image', 'txt':'text', 'html':'text',
		'jpg':'image', 'jpeg':'image',
		'avi':'video', 'mp3':'audio', 'mp4':'video', 'wav':'audio', 'aiff':'audio'
	}[extension] || 'unknown';
	if(type == "unknown") 
		return null;
	var ctor = Content.TypeConstructor(type);
	return new ctor(projectBase, title, originalPath);
};

Content.FromMetadata = function(projectBase, md) {
	var ctor = Content.TypeConstructor(md.type);
	var status = ("status" in md) ? md.status : "Unpublished";
	var content = new ctor(projectBase, md.title, md.id, md.extension);
	if (content.status == "Unpublished")
		content.status = status;
	if (md.attachments != null) {
		var attach = md.attachments;
		for (var md in attach){
			md = attach[md]
			var attachment = Content.FromMetadata(projectBase, md);
			content.attachments.push(attachment);
		}
	}
	return content;
};

Content.TypeConstructor = function(type) {
	return {
		"image": Image, "text": Text, "audio": Audio,
	    "video": Video, "quiz": Quiz, "question": Question
	}[type] || Content;
};

