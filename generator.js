var ConsistentHashing = require('consistent-hashing');
var fs = require('fs');
var lineReader = require('line-reader');

var argv = require('minimist')(process.argv.slice(2));

var leafAddrs = new Array();
for (var i = 0; i < argv.num_leaves; i++) {
	leafAddrs.push(i);
}
var leaves = new ConsistentHashing(leafAddrs);


function readDict(filePath, suggestTable, callback) {
	lineReader.eachLine(filePath, function(line) {
		if (line.length > 3) {
			suggestTable[line.toLowerCase()] = [line, line, line, line];
		}
	}).then(callback);
}

function writeSuggestions(filePath, suggestTable, callback) {
	var stream = fs.createWriteStream(filePath);

	for (var key in suggestTable) {
		stream.write(JSON.stringify({
			key: key,
			suggestions: suggestTable[key],
			leaf: leaves.getNode(key)
		}) + '\n');
	}

	stream.on('finish', callback);
	stream.end();
}


var data = {};
readDict(argv.dict, data, function() {
	writeSuggestions(argv.output_file, data, function() {
		console.log('Done writing suggestions to', argv.output_file);
	})
})