var token = "f32dfbe42f76a07e76b1ddf8540a6062503275cd";
var repoName = "phiresky/tmp_test";
var branch = 'master';
var key_bits = 128;
var github = new Github({
    apiUrl: "https://api.github.com",
    token: token,
    auth: "oauth"
});
var repo = github.getRepo.apply(github, repoName.split("/"));
function randomString(bits) {
    if (bits % 32 !== 0)
        throw "must be divisible by 32";
    return sjcl.codec.base64.fromBits(sjcl.random.randomWords((bits / 4 / 8) | 0), true, true);
}
function upload(data, callback) {
    var filename = randomString(64);
    var pwd = randomString(key_bits);
    var content = sjcl.encrypt(pwd, data);
    if (content.length >= 1e6)
        throw "image size must be < 1MB";
    repo.write(branch, filename, content, 'add file', function (err) { return callback(err, { filename: filename, pwd: pwd, content: content }); });
}
function displayImage(data) {
    var img = document.createElement("img");
    var file = new Blob([str2ab(data)], { type: 'image/png' });
    var url = URL.createObjectURL(file);
    img.src = url;
    document.body.innerHTML = "";
    document.body.appendChild(img);
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function download(filename, key) {
    repo.read(branch, filename, function (err, data) {
        try {
            if (err)
                throw err;
            displayImage(sjcl.decrypt(key, data));
        }
        catch (err) {
            document.body.textContent = JSON.stringify(err);
            console.error(err);
        }
    });
}
if (location.hash) {
    var _a = location.hash.substr(1).split("!"), filename = _a[0], key = _a[1];
    document.writeln("Loading...<!--");
    download(filename, key);
}
else {
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById("fileinput").addEventListener('change', uploadFile, false);
    });
}
function uploadFile(evt) {
    try {
        document.body.textContent = "Uploading...";
        var f = evt.target.files[0];
        if (f)
            readFile(f, function (data) { return upload(data, function (err, info) {
                history.replaceState({}, "", "#" + info.filename + "!" + info.pwd);
                displayImage(data);
            }); });
    }
    catch (e) { }
}
function readFile(f, callback) {
    var r = new FileReader();
    r.onload = function (e) { return callback(r.result); };
    r.readAsBinaryString(f);
}
