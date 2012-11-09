// overrides decode to set '+' to space, modern style
function urldecode(encodedString) {
		return decodeURIComponent(encodedString);		
}

// no change from javascript default, but including for
// naming parity
function urlencode(clearString) {
		return encodeURIComponent(clearString);
}
