function loadTextfile(path) {
	var f = new air.File(path);
	var fs = new air.FileStream();
	fs.open(f, air.FileMode.READ);
	var ret = fs.readMultiByte(fs.bytesAvailable, "utf-8");
	fs.close();
	return ret;
}
