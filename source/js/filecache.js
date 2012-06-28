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

FileCache.prototype.deleteData = function(){
	var f = new air.File(this.path);
	if (f.exists) {	
		if (f.isDirectory){
			f.deleteDirectory(true);
		} else {
			f.deleteFile();
		}
	}
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


