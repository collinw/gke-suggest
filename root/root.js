var bodyParser = require('body-parser');
var ConsistentHashing = require('consistent-hashing');
var express = require('express');
var jayson = require('jayson');
var app = express();
app.use(bodyParser.json());

var argv = require('minimist')(process.argv.slice(2));

var leafList = process.env.LEAVES;
var leafTokens = new Array();
var leafAddrs = leafList.split(',');
for (var i in leafAddrs) {
	leafTokens.push(i);
}
console.log('Using leaves:', leafAddrs.join(', '));

var leaves = new ConsistentHashing(leafTokens);

function queryLeaves(query, onError, onSuccess) {
	var leafId = leaves.getNode(query);

	var client = jayson.client.http("http://" + leafAddrs[leafId]);
	client.request('suggest', {'q': query}, function(err, error, response) {
		if (err) {
			onError(err);
		} else {
			onSuccess(response);
		}
	});
}


function normalize(str) {
	str = str.trim().toLowerCase();
	str = str.replace(/\s+/g, ' ');
	return str;
}


function rootMain(req, res) {
	res.header('Content-Type', 'application/json');
	var normalized = normalize(req.query.q);

	function onError(err) {
		console.log('Error! ' + err);
		res.send(JSON.stringify({
			result: null,
			error: err
		}));
	}

	function onSuccess(suggestions) {
		console.log('success! ' + suggestions);
		res.send(JSON.stringify({
			result: suggestions,
			error: null
		}));
	}

	queryLeaves(normalized, onError, onSuccess);
}


app.get('/', rootMain);

var server = app.listen(argv.port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Root listening at http://%s:%s', host, port);
});