// overrides decode to set '+' to space, modern style
function urldecode(encodedString) {
		return decodeURIComponent(encodedString.replace(/\+/g, ' '));
}

// no change from javascript default, but including for
// naming parity
function urlencode(clearString) {
		return encodeURIComponent(clearString);
}
