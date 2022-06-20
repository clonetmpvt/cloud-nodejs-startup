var fs = require('fs');
var async = require("async");
const path = require("path");
function readAsync(filename, callback) {
    var file = path.join(__dirname, "/api/" + filename + ".json");
    fs.readFile(file, 'utf8', callback);
}

var getdata = async function (files) {
    return await async.map(files, readAsync, function (err, results) {
        if (results[0] == undefined) {
            return 'not';
            //res.status(400).send('Not Found');
        } else {
            var pdata = {
                pagedata: JSON.parse(results[0]),
                header: JSON.parse(results[1])
            };
            return pdata;
            //res.send(pdata);
        }
    });
}
exports.getdata = getdata;