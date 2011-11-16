function manifest(name) {
	var f = new air.File(
		[air.File.applicationStorageDirectory.nativePath, name, 'manifest']
		.join(air.File.separator)
	);
	var fs = new air.FileStream();
	fs.open(f, air.FileMode.READ);
	var ret;
	try {
		ret = JSON.parse(fs.readMultiByte(fs.bytesAvailable, "utf-8"));
	} catch(e) {
		ret = [];
	}
	fs.close();
	return ret;
}

function saveManifest(manifest, proj) {
	var f = new air.File(
			[air.File.applicationStorageDirectory.nativePath,
			 proj, 'manifest'].join(air.File.separator)
	);
	var fs = new air.FileStream();
	fs.open(f, air.FileMode.WRITE);
	fs.writeMultiByte(JSON.stringify(manifest), "utf-8");
	fs.close();
}

function linkManifestOrderToTable(manifest, table, projName) {
	table.sortable({
		items: 'tr',
		axis: 'y',
		start: function(event, ui) {
			ui.item.data('start_pos', ui.item.index());
		},
		change: function(event, ui) {
			ui.item.data('end_pos', ui.placeholder.index());
		},
		update: function(event, ui) {
			var start_pos = ui.item.data('start_pos');
			var end_pos   = ui.item.data('end_pos');
			if(end_pos > start_pos) {
				end_pos--;
			}
			if(end_pos >= manifest.length) {
				manifest.push(undefined);
			}
			manifest.splice(end_pos, 0, manifest.splice(start_pos, 1)[0]);
			saveManifest(manifest, projName);
		}
	});
}

