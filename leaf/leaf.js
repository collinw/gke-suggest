var jayson = require('jayson');
var http = require('http');
var lineReader = require('line-reader');
var os = require('os');

var argv = require('minimist')(process.argv.slice(2));

var DATA = {};


function loadData(filePath, leafIndex, suggestTable, callback) {
	lineReader.eachLine(filePath, function(line) {
		var entry = JSON.parse(line);
		if (entry.leaf === leafIndex) {
			suggestTable[entry.key] = entry.suggestions;
		}
	}).then(callback);
}


function suggestHandler(q, callback) {
	console.log('Received request for', q);
	callback(null, DATA[q]);
}


var server = jayson.server({
  suggest: suggestHandler,
  i_cant_find_anything: function(id, callback) {
    var error = {code: 404, message: 'Cannot find ' + id};
    callback(error);
  },
  i_cant_return_a_valid_error: function(callback) {
    callback({message: 'I forgot to enter a code'});
  }
});

function getHostname(callback) {
	var options = {
	  host: 'metadata.google.internal',
	  path: '/computeMetadata/v1/instance/hostname',
	  headers: {'Metadata-Flavor': 'Google'}
	};

	http.get(options, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            callback(body);
        });
    }).on('error', function(e) {
		throw e;
	});
}


function getLeafIndex(callback) {
	if (process.env.LEAF_INDEX) {
		callback(process.env.LEAF_INDEX - 0);
		return;
	}
	getHostname(function(hostname) {
		// Hostnames from GCE metadata look like
		// k8s-suggest-root-node-1.c.imposing-league-769.internal
		console.log('Running on', hostname);
		var matches = hostname.match(/-(\d+)\.c\./);
		// Kubernetes uses 1-indexing for hostnames. wtf.
		callback(matches[1] - 1);
	});
}


function main() {
	console.log('Loaded suggestions:', Object.keys(DATA).length)
	console.log('Ready to serve');
	server.http().listen(argv.port, function() {
	  console.log('Leaf listening on localhost:' + argv.port);
	});
}

getLeafIndex(function(leafIndex) {
	console.log('I am leaf', leafIndex);
	console.log('Loading suggestions from ' + argv.data_file);
	loadData(argv.data_file, leafIndex, DATA, main);
});