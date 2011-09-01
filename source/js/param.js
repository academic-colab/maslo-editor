function queryParameters(query) {
  var keyValuePairs = query.split(/[&?]/g);
  var params = {};
  for (var i = 0, n = keyValuePairs.length; i < n; ++i) {
    var m = keyValuePairs[i].match(/^([^=]+)(?:=([\s\S]*))?/);
    if (m) {
      var key = decodeURIComponent(m[1]);
      (params[key] || (params[key] = [])).push(decodeURIComponent(m[2]));
    }
  }
  return params;
}
