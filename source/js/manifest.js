'use strict';

/**
 * Constructor for the manifest class
 * Creates a table representing all the content in 
 * the manifest
 * @param path The path to the manifest
 * @param name Name of the project
 * @param argObj Wheter the manifest is a quiz or project
 */
function Manifest(path, name, argObj) {
	/*this.parent = null
	if (parPath != null)
		this.parent = new Manifest(parPath);*/
	this.projectName = name;
	this.path = path;
	this.obj = argObj;
	var data = null;
	this.ordernum = 0;
	this.tmpOrder = new Array();
	this.versionData = null;
	if (this.obj != null) {
		data = this.obj.attachments;
		this.type = "quiz";
	}
	if (data == null) {
		var f = new FileCache(path + air.File.separator + 'manifest');
		data = f.val ? JSON.parse(f.val) : [];
		this.file = f;
		var vFile = new FileCache(path + air.File.separator + 'version');
		this.versionData = vFile.val ? JSON.parse(vFile.val) : {"version":"0", "status":"Unpublished"};
	} 
	//this.tbl = $('\
	var tableString = '\
		<table id="contentTable">                \
			<thead>                              \
				<tr>                             \
				    <th class="order">Order</th> \
					<th>Type</th>                \
					<th class="big">Title</th>   ';
				if (this.obj == null)
					tableString += '<th class="big">Status</th>';
				tableString += '<th>Remove</th>              \
				</tr>                            \
			</thead>                             \
			<tbody class="proj">                 \
			</tbody>                             \
		</table>';
	this.tbl = $(tableString);
	this.confirm = $('\
		<div id="dialog-confirm" style="display: none" title="Delete Content"> \
			<p>This content will be permanently deleted and cannot be          \
			recovered. Are you sure?</p>                                       \
		</div>');
	this.edit = $(
		'<div id="dialog-content" style="display: none" title="Edit Content"></div>');
		
	for(var i in data) {
		if (this.obj == null) {
			var content = Content.FromMetadata(path, data[i]);			
			if (content.status == "Modified" || content.status == "Unpublished"){				
				this.updateStatus(false);
			}
			this.addContent(content);
		} else {
			this.addContent(data[i]);
		}
	}
	if (data.length == 0) {
		this.tbl.show();
		var tr = $('<tr id="fillRow"/>');
		this.tbl.find('tbody').append(tr);
		tr.append($('<td colspan="5" class="fill">Click "'+$("#addButton").html()+'" to start editing.</td>'));
	}
}


/**
 * Sets up the dragable table rows
 * updateIndexes() makes sure the input fields get updated on drop
 */
var fixHelper = function(e, ui) {
	ui.children().each(function() {
		$(this).width($(this).width());
	});
	return ui;
};
function updateIndexes(manifest){
	var input = manifest.obj ? $('#mediaDiv table tbody input') : $('#contentTable tbody input');
	input.each(function(i){
		$(this).val(i+1);
	});
}
/**
 * Renders the table and makes it sortable
 * @param div The manifest div
 */
Manifest.prototype.render = function(div) {
	div.append(this.tbl);
	var manifest = this;
	this.tbl.find('tbody').sortable({
		items: 'tr', axis: 'y', helper: fixHelper, 
		forceHelperSize: true,
		placeholder: 'tablespace',
        update: function(event, ui) { 
        	manifest.save();
        	updateIndexes(manifest); 
        }
	});
};

/**
 * Gets the a list of all the metadata in the manifest.
 * @param convert Boolean value
 */
Manifest.prototype.data = function(convert) {
	var basePath = null;
	if (convert) {
		basePath = air.File.applicationStorageDirectory.nativePath +
		air.File.separator;
	}
	var ar = [];
	var is = this.items();
	for(var i in is) {		
		ar.push(is[i].metadata(basePath))
	}
	return ar;
};

/**
 * Gets all a list of all the content objects in the manifest
 * @return ar List of all the content objects in the manifest 
 */
Manifest.prototype.items = function() {
	var ar = [];
	this.tbl.find('tr').each(function(k, v) {
		if($(v).data('content')) {
			ar.push($(v).data('content'));
		}
	});
	return ar;
};

/**
 * Updates the status of the project.
 * @param hitPublish Whether the project was just published
 */
Manifest.prototype.updateStatus = function(hitPublish){
    if (this.obj == null) {
	var versionModified = false;
	if (this.versionData["status"] == "Published" && !hitPublish) {
		this.versionData["status"] = "Modified";	
		versionModified = true;
	} else if (this.versionData["status"] == "Modified" || this.versionData["status"] == "Unpublished") {
		if (hitPublish){
			this.versionData["version"] = ""+(parseInt(this.versionData["version"])+1);
			this.versionData["status"] = "Published";
			versionModified = true;
			var items = this.items();
			for (var i = 0; i < items.length; i++){
				var content = items[i];
				if (content.type == "quiz"){
					qManifest = new Manifest(content.path);
					qManifest.updateStatus(true);
					qManifest.save();
				}
				content.updateStatus(true);				
			}
		}
	}
	if (versionModified){
		if (this.obj != null) {
			this.versionData.version = "0";
		}
		var f = new FileCache(this.path + air.File.separator + 'version');
		f.val = JSON.stringify(this.versionData);
		f.flush();
	}
    }
}

/**
 * Saves the manifest
 */
Manifest.prototype.save = function() {
	if (this.file != null) { 
		var data = this.data(true);
		this.file.val = JSON.stringify(data);
		this.file.flush();
		if (data.length == 0){
			var tr = $('<tr id="fillRow"/>');
			this.tbl.find('tbody').append(tr);
			tr.append($('<td colspan="5" class="fill">Click "'+$("#addButton").html()+'" to start editing.</td>'));
		}
	} else {
		if (this.obj != null){
			this.obj.attachments = this.items();
			if (this.obj.attachments.length == 0){
				this.tbl.hide();
			}
		}
	}
};

/**
 * Adds content to the manifest
 * Handles all the functionality that comes with the content such as
 * order, type, title, status and the remove button. The event handlers
 * and dialogs are declared as the content is added. 
 * @param content The content that is to be added to the manifest
 */
Manifest.prototype.addContent = function(content) {
	this.ordernum++;

	var quiz = this.obj;
	var on = this.ordernum;
	var tempoArray = this.tmpOrder;
	
	var manifest = this;
	$("#fillRow").remove();
	this.tbl.show();
	var tr = $('<tr class="fixheight" />');
	this.tbl.find('tbody').append(tr);
	var cTitle = content.title;
	var aTitle = "";
	if (cTitle.length > 60 ) {
		cTitle = cTitle.substr(0,59) + "...";
		aTitle = 'title=" - '+content.title+'"';
	}

        // The order number (the order which the fields are displayed in) and the icon
	var rowid = "row" + this.ordernum; 
	var td = $('<td><input maxlength="3" id="' + rowid + '"\
	  class="numbering" type="text" name="number" size="2.5" value="'+ this.ordernum +'"/><br</td>'); 
	$("#" + rowid).live('blur', function() {
		tempoArray[content.id] = $(this).val();
	});
	tr.append(td);
	tr.append($('<td class="icon"><img src="' + content.icon + '"/></td>'));

        // This is the function that allows renaming of content within a project
        button = $('<button type="button" class="nice mini radius blue button">Rename</button>');
        button.click(function(e){
		var tr = $(this).parent().parent().parent().parent();
		var td = $(this).parent().parent().parent().find("a:first");
		var contentName = td.text();
		$("#contentName").val(contentName);

		var width = tr.find("td:eq(2)").width()+10;
		var height = tr.height()-10;
		$('#rename').css({'top':tr.position().top+10,'left':tr.find("td:eq(2)").position().left+3, 'width':width, 'height':height}).show();
		$('#rename').find('input').css({'width':'60%'});
                
                // This is the function that saves state once they click OK
                var func = function(e){
                        // Don't let the user supply a blank name or all whitespace.
                        // if they do that then there will be no link to click on!
                        if(/^\s*$/.test($("#contentName").val())) {
                            if($("#contentName").val()) {
                                alert("You cannot name your content with all whitespace.");
                            }
                            else {
                                alert("You must supply a name.");
                            }
                            $('#rename').hide();
                            return false;
                        }
 
                        // Update the data structures and save it back to disk
                        tr.data('content').title = $("#contentName").val();

                        if(tr.data('content').status == "Published") {
                            tr.data('content').updateStatus(false);
                            tr.find('.contentStatus').text(tr.data('content').status);
                            gManifest.updateStatus(false);
                        }

                        gManifest.save();

                        // Update the display with the new name
			td.attr('name', $("#contentName").val());
			td.attr('title', $("#contentName").val());
			var pName = $("#contentName").val();
			if (pName.length > 60)
				pName = pName.substr(0,59) + "...";
			td.html(pName);
			$('#rename').hide();

			return false;
		};

                // Assign the handler to the button
		$('#rename button.ok').attr('disabled', $("#contentName").val() == '');
		$('#rename button.ok').unbind('click');
                $('#rename button.ok').click(func);

                // Assign the handler when the user presses Enter in the box
                $('#contentName').unbind('keyup');
                $('#contentName').keyup(function(e) {
                        if(e.keyCode == '13') {
                            func(e);
                        }
                    });
	});

        // Add the title, including the (sometimes visible) rename button
        tmp_td = $('<td><div class="wrapper"><a class="title" href="#" '+aTitle+' name="'+cTitle+'">' + cTitle + '</a><div class="renameDiv"></div></div></td>');
        tmp_td.find('div').find('div.renameDiv').append(button);
        tr.append(tmp_td);
        tr.mouseover(function(e){$(this).find('div.renameDiv').show();return false;});
        tr.mouseout(function(e){$(this).find('div.renameDiv').hide();return false;});

	if (this.obj == null)
		tr.append($('<td><div class="contentStatus">'+content.status+'</div></td>'));
	tr.append($('<td class="icon"><img class="remove" src="icons/remove.png" alt="Remove Item" /></td>'));
	tr.data('content', content);

	var manifest = this;
	var cont = content;
	var sort = false;
	tr.find('input.numbering').keyup(
		function(e) {
			if(e.keyCode == '13') {		
				e.preventDefault();
				tempoArray[cont.id] = $(this).val();
				//Get the order array:
				var orderArray = [];
				orderArray.push("");
				//Get the order array
				var row = manifest.obj ? $('#mediaDiv table tbody tr') : $('#contentTable tbody tr');
				row.each(function(){
					if($(this).data('content'))
						orderArray.push($(this).data('content'));
				});
				//Rearrange the orderArray
				var tempCont;
				for(var id in tempoArray) {
					var newIndex = tempoArray[id];
					//Check if the index is in the range
					if(newIndex > 0 && newIndex < orderArray.length && !isNaN(newIndex)) { 
						//Get old index
						for(var oldIndex = 1; oldIndex < orderArray.length; oldIndex++) {
							if(orderArray[oldIndex].id == id) {
								tempCont = orderArray[oldIndex]; 
								break;
							}
						}
						//Now we have a new index (newIndex) and an old (oldIndex)
						//content should now be inserted in orderArray at newIndex and removed from oldIndex
						orderArray.splice(oldIndex, 1); 				//Remove
						orderArray.splice(newIndex, 0, tempCont); 	//Add
					}
				}
				//Need to repopulate the page with the order of orderArray
				var table = quiz ? $('#mediaDiv table')[0] : $('#contentTable')[0];
				for(var j = table.rows.length - 1; j > 0; j--) {
					table.deleteRow(j);
				}
				manifest.ordernum = 0;
				for(var p = 1; p < orderArray.length; p++)  {
					manifest.addContent(orderArray[p]);
				}	
				manifest.tmpOrder = [];
			}
		}	
	);
	tr.find('img.remove').click(function() {
		manifest.confirm.dialog({
			height:240,
			modal: true,
			buttons: {
				"Delete Content": function() {
					tr.data('content').deleteFile();
					var id;
					if(manifest.tmpOrder[id]) {
						manifest.tmpOrder.splice(id, 1);
					}
					// update numbers displayed below row to be deleted.
					var rowIndex = tr[0].sectionRowIndex;
					var rows = tr.parent().children();
					for (var i = rowIndex+1; i < rows.length; i++){
						var tRow = rows[i];
						$(tRow).find('input.numbering').val(parseInt($(tRow).find('input.numbering').val())-1);
					}
					tr.remove();
					manifest.updateStatus(false);
					manifest.save();
					bottomBar($('#contentTable').height() - 34, $(window).height());
					$( this ).dialog( "close" );
				},
				Cancel: function() {					
					$( this ).dialog( "close" );
				}
			}
		});
	});
	tr.find('a').click(function() {
		var c = tr.data('content');
		manifest.edit.empty();
		if(c.render(manifest.edit)) {
			manifest.edit.dialog({
				autoOpen: true,
				modal: true,
				width: 550,
				height:600,
				position: 'top',
				beforeClose: function(event) {
					var result = true;
					if (!c._saved && (c.wasModified())){ 
				     	c._confirm.dialog({
							height:240,
							modal: true,
							buttons: {
								"Discard changes": function(event) {
                                
                                    //Check if the image was replaced
                                    //If so, delete the temp media object and 
                                    //set c_tmpObj back to null
                                    if(c._tmpObj) {
										  c._tmpObj.deleteFile();
                                          c._tmpObj = null;
                                    }
									c.unrender();
									$( this ).dialog( "close" );
									manifest.edit.dialog("close");
									return true;
									
								},
								Cancel: function(event) {
									$( this ).dialog( "close" );
									return false;
								}
							}
						});
					} else {
						c.unrender();
						return true;
					}
					return false;
				 },
				buttons: {
					"Save": function() {
                        //If the media file was replaced. Replace the old file
                        //with the new one
						c.save();
						c.unrender();
                        if(c._tmpObj) {							
                        	c.deleteFile();
							c._tmpObj.status = c.status;
                            c = c._tmpObj;
                            c._tmpObj = null;
							c.save();
							
                        } 
						c.updateStatus(false);						
						tr.find('.contentStatus').text(c.status);
						manifest.updateStatus(false);
						var cTitle = c.title;
						if (cTitle.length > 60){
							cTitle = cTitle.substr(0,59) + "...";
						}
						tr.find('a').text(cTitle);
						tr.data('content', c);
						manifest.save();
						$(this).dialog("close"); 
						return true;
					} 
				}
			});
			    var myToolbar = [ { name: 'basicstyles', items : [ 'Bold','Italic','Underline' ] },
								  { name: 'paragraph', items : [ 'NumberedList','BulletedList','-', 
								   'JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock' ] },
							 	   { name: 'clipboard', items : [ 'Undo','Redo'] },
							 	   { name: 'basicstyles', items: ['RemoveFormat'] }];
				if(c.type != "question") {
					if(CKEDITOR.instances.editor1) 
						CKEDITOR.instances.editor1.destroy(true);
					CKEDITOR.replace( 'editor1', {
						toolbar: myToolbar
					});
				}
				else {
					if(CKEDITOR.instances.editor2) 
						CKEDITOR.instances.editor2.destroy(true);
					CKEDITOR.replace( 'editor2', {
						toolbar: myToolbar,
						resize_enabled: false,
						width: 513,
						height: 150,
						enableTabKeyTools: false,
						tabSpaces: 4
					});
				}
		}
		return false;
	});
	this.save();
};

/**
 * Creates a zip file of the manifest
 */
Manifest.prototype.zip = function() {
	var zipName = air.File.applicationStorageDirectory.nativePath +
		air.File.separator + "contents.zip";
	var zipFile = new air.File(zipName);
	var writer = new window.runtime.com.coltware.airxzip.ZipFileWriter();
	writer.open(zipFile);
	var currentFolder = new air.File(this.path);
	writer.addDirectory(this.projectName);
	
	function addData(prefix, dirFile){
		var files = dirFile.getDirectoryListing();
		for (var i = 0; i < files.length; i++){
			if (files[i].isDirectory) {
                if (files[i].name !="." && files[i].name !="..") {
					var nDir = new air.File(files[i].nativePath);
					var nPrefix = prefix+air.File.separator+files[i].name;
					writer.addDirectory(nPrefix);
					addData(nPrefix, nDir);
				}
			} else {
				var nFile = new air.File(files[i].nativePath);
				writer.addFile(nFile,prefix+air.File.separator+files[i].name);
			}
		}
		return false;	
	};
	
	var res = addData(this.projectName, currentFolder);
	writer.close();
};
