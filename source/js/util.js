function bottomBar(tableSize, windowSize){
	if( (windowSize - tableSize) <= 128 ) {
		$('div.action').css({
			position: "fixed",
			width: "99.7%",
			bottom: "0"
		});
		$('table').css('margin', '0 0 42px 0');
	}
	else {
		$('div.action').css({
			position: "static",
			width: "auto",
			bottom: "auto"
		});
		$('table').css('margin', '0 0 0 0');
	}	
}