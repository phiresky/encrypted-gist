var babel = require('babel');
var fs = require('fs');
fs.truncateSync("bin/bin.js",0);
var map = JSON.parse(fs.readFileSync('bin/tmp.js.map'));
var out = babel.transformFileSync("bin/tmp.js", {
	"blacklist":["regenerator","es6.forOf"],
	"inputSourceMap":map,
	"sourceMaps":"inline",
});
fs.writeFileSync("bin/bin.js", out.code+"\n//# sourceMappingURL=bin.js.map");
fs.writeFileSync("bin/bin.js.map", JSON.stringify(out.map));
