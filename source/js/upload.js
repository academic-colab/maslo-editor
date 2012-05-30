'use strict';

var uploadManifest = null;

function postMessage(msg){
	$("#info-div").html(msg);
	$('#info-div').dialog({
		autoOpen: true,
		modal: true,
		width: 450,
		position: 'center',
		buttons: {
			"OK": function() {
				$(this).dialog("close");
			}
		}
	  });	
}

function uploadProgress(data){
}

function completeHandler(event){
	uploadManifest.updateStatus(true);
	uploadManifest.save();
	$("#contentTable").find("div").text("Published");
	$("#info-div").html("Upload completed successfully.<br/><p/>");
	$('#info-div').dialog({
		autoOpen: true,
		modal: true,
		width: 450,
		position: 'top',
		buttons: {
			"OK": function() {
				$(this).dialog("close");
			}
		}
	  });
}

function uploadError(event){
	$("#info-div").html("Upload failed.<br/><p/>Detailed error message:<br/>"+event.toString());
	$('#info-div').dialog({
		autoOpen: true,
		modal: true,
		width: 450,
		position: 'top',
		buttons: {
			"OK": function() {
				$(this).dialog("close");
			}
		}
	  });
}

function uploadComplete(event){
}

function fileUploader(urlRequest, serial, totalNum){
	air.trace("file uploader "+serial);
	var fPath = getAppPath()+"contents.zip";
	if (serial > 0)
		fPath += "."+serial	
	var file = new air.File(fPath);
	air.trace("file uploader path "+fPath);	
	var cHandler = function(event) {
		var file = new air.File(fPath);
		file.deleteFile();
		if (serial == totalNum-1){
			completeHandler(event);
			return false;
		}		
		
		fileUploader(urlRequest, serial+1, totalNum);
	}
		
	file.addEventListener(air.ProgressEvent.PROGRESS, uploadProgress); 
	file.addEventListener(air.SecurityErrorEvent.SECURITY_ERROR, uploadError); 
	file.addEventListener(air.HTTPStatusEvent.HTTP_STATUS, uploadError); 
	file.addEventListener(air.IOErrorEvent.IO_ERROR, uploadError); 
	file.addEventListener(air.DataEvent.UPLOAD_COMPLETE_DATA, cHandler)
	file.upload(urlRequest, "contentPackUpload");
}




function doUpload(numFiles,dirName,sessionId){
	
	var f = new FileCache(getAppPath() + air.File.separator + 'uploadSettings.config');
	if (!f.val){
		return false;
	}
	/*var text = "Content pack upload is disabled in this version of the MASLO authoring tool.<p/> \
		This functionality will soon be available together with the appropriate backend software."
	postMessage(text);*/
	var jsonData = JSON.parse(f.val);
	var url = jsonData.serverURL;
	var instId = jsonData.instId;
	
	var urlRequest = new air.URLRequest(url); 
	var urlVariables = new air.URLVariables();
	
	if (sessionId == null){
		urlVariables.handshake = "true";
		urlRequest.method = air.URLRequestMethod.POST; 		
		urlRequest.data = urlVariables;
		var loader = new air.URLLoader();
		var completeHandlerHandshake = function(event) {
		            var loader = air.URLLoader(event.target);
		            //air.trace("completeHandlerHandshake: " + loader.data);
					return doUpload(numFiles, dirName, loader.data);
		}
		loader.addEventListener(air.Event.COMPLETE, completeHandlerHandshake);
		loader.load(urlRequest);
	} else {
	
	// pw will be MD5'ed , then concatenated with SHA256'ed sessionId.
	// The end result will be SHA256'ed again and leads to the final
	// string to be sent.
	// It is still highly recommended to use proper SSL encryption, but at least this
	// scheme will not make it completely obvious what the user's password is
	var pw = CryptoJS.MD5($("#userPassword").val())+CryptoJS.SHA256(sessionId);
	pw = CryptoJS.SHA256(pw);
	//air.trace(pw);
	urlVariables.userName = $("#userName").val();
	urlVariables.password = pw;
	urlVariables.institutionId = instId;
	urlVariables.packTitle = $("#packTitle").val();
	urlVariables.courseId = $("#courseId").val();
	urlVariables.numberFiles = ""+numFiles;
	urlVariables.zipName = "contents.zip";
	urlVariables.dirName = dirName
	urlRequest.method = air.URLRequestMethod.POST; 		
	urlRequest.data = urlVariables;	
	var loader = new air.URLLoader();
	var completeHandler = function(event) {
	            var loader = air.URLLoader(event.target);
	            air.trace("completeHandler: " + loader.data);
				if (loader.data == "OK.") {
					fileUploader(urlRequest, 0, numFiles);
				} else {
					var msg = "Upload denied. Check your user name/password settings."
					postMessage(msg);
				}
	}
	loader.addEventListener(air.Event.COMPLETE, completeHandler);
	loader.load(urlRequest);
	
	
	}
	return true;
}

function saveUploadSettings(overwrite){
	
	var f = new FileCache(getAppPath() + air.File.separator + 'uploadSettings.config');
	if (f.val) {
		if (!overwrite)
			return true;
	}
	if (!overwrite)
			return false;
	var instId = $("#instId").val();
	var serverURL = $("#serverURL").val();
	if (instId.trim() == "" || serverURL.trim() == ""){
		postMessage("<p/>You have to enter values for both Server URL and Institution Name/ID!<br/>");
		return false;
	}
	
	var obj = {"serverURL":serverURL, "instId":instId};
	f.val = JSON.stringify(obj);
	f.flush();
	return true;
}

function uploadPrefs(){
	var prefDiv = $('<div id="configure-upload" style="display: none" title="Configure Upload Settings"> \
		<form id="uploadSettings" action="#"> \
		<table> \
			<tbody> \
				<tr> \
					<td>Server URL</td> \
					<td><input type="text" size="55" id="serverURL"/></td> \
				</tr>\
				<tr>\
					<td>Institution Name/ID</td>\
					<td><input type="text" size="55"  id="instId"/></td>\
				</tr> \
			</tbody> \
		</table> \
		</form> \
	</div>');
	$("body").append(prefDiv);
	return false;
}

function checkFormValues(uName, password){
	if (uName.val().trim() == '' || password.val().trim() == '') {
		postMessage("You need to enter values into the required fields.");
		return false;
	}
	return true;
}

function passwordPrompt(numFiles, dirName, gManifest){
	uploadManifest = null;
	uploadManifest = gManifest;
	if (saveUploadSettings(false)) {
	  $('#user-pass').dialog({
		autoOpen: true,
		modal: true,
		width: 650,
		position: 'top',
		buttons: {
			"OK": function() {
				if (checkFormValues($("#userName"),$("#userPassword"))) {
					$(this).dialog("close");
					var result = doUpload(numFiles, dirName);
				}
				
			},
			"Cancel": function() { 
				$(this).dialog("close"); 
			}
		}
	  });
	  return true;
	}
	return false;
}

function configureUpload(wantOverwrite, wantPrompt){
	var f = new FileCache(getAppPath() + air.File.separator + 'uploadSettings.config');
	if (f.val) {
		var jsonData = JSON.parse(f.val);
		var url = jsonData.serverURL;
		var instId = jsonData.instId;
		$("#instId").val(instId);
		$("#serverURL").val(url);		
	}
	$('#configure-upload').dialog({
		autoOpen: true,
		modal: true,
		width: 650,
		position: 'top',
		buttons: {
			"Save":  function() {
				var result = saveUploadSettings(wantOverwrite);
				if (result) {
					$(this).dialog("close");
					if (wantPrompt)
						passwordPrompt();
				}
				return false;
			},
			"Cancel": function() { 
				$(this).dialog("close"); 
			}
		}
	});
}

function splitZipFile(path){
	var maxSize = 1024*1024;
	var zipFileOld = new air.File(path);
	var zipFile = new air.File(path+".old");
	zipFileOld.moveTo(zipFile);
	var stream = new air.FileStream();
	stream.open( zipFile, air.FileMode.READ );
	var i = 0;
	while (stream.bytesAvailable>0) {
		var numBytes = maxSize;
		if (numBytes > stream.bytesAvailable){
			numBytes = stream.bytesAvailable;
		}
		var fileContent = new air.ByteArray();
		stream.readBytes(fileContent, 0, numBytes);
		var partFile = null;
		if (i == 0)
			partFile = new air.File(path);
		else
			partFile = new air.File(path+"."+i);
		var outStream = new air.FileStream();
		outStream.open( partFile, air.FileMode.WRITE );
		outStream.writeBytes(fileContent,0,numBytes);
		outStream.close();
		i+=1;
	}	
	stream.close();
	zipFile = new air.File(path+".old");
	zipFile.deleteFile();
	return i;
}
