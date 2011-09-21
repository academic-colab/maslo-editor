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
