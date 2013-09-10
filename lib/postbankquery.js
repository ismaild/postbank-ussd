var Parse = require('node-parse-api').Parse;

var APP_ID = "YQcdfF8x99lP2d2tMGn4RBktmDFOv3QhOF5n4vmv";
var MASTER_KEY = "NF9K4tugR4oQAWRUfnEK3HRG0Lbgmsfjur4iSkLL";

var app = new Parse(APP_ID, MASTER_KEY);

var locationName = "balfour";

app.findMany("Postbank", {loc2: locationName.toUpperCase()}, function(err, response){
	console.log(response);
});
