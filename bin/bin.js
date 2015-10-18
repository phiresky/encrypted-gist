"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var base64;
(function (base64_1) {
    base64_1._chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    base64_1._chars_url = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    base64_1.encode = function (arraybuffer, url, equals) {
        var chars = url ? base64_1._chars_url : base64_1._chars;
        var bytes = new Uint8Array(arraybuffer),
            len = bytes.length,
            base64 = "";
        for (var i = 0; i < len; i += 3) {
            base64 += chars[bytes[i] >> 2];
            base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
            base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
            base64 += chars[bytes[i + 2] & 63];
        }
        if (len % 3 === 2) {
            base64 = base64.substring(0, base64.length - 1) + (equals ? "=" : "");
        } else if (len % 3 === 1) {
            base64 = base64.substring(0, base64.length - 2) + (equals ? "==" : "");
        }
        return base64;
    };
    base64_1.decode = function (base64, url) {
        var chars = url ? base64_1._chars_url : base64_1._chars;
        var bufferLength = base64.length * 0.75,
            len = base64.length,
            i,
            p = 0,
            encoded1,
            encoded2,
            encoded3,
            encoded4;
        if (base64[base64.length - 1] === "=") {
            bufferLength--;
            if (base64[base64.length - 2] === "=") {
                bufferLength--;
            }
        }
        var arraybuffer = new ArrayBuffer(bufferLength),
            bytes = new Uint8Array(arraybuffer);
        for (i = 0; i < len; i += 4) {
            encoded1 = chars.indexOf(base64[i]);
            encoded2 = chars.indexOf(base64[i + 1]);
            encoded3 = chars.indexOf(base64[i + 2]);
            encoded4 = chars.indexOf(base64[i + 3]);
            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
        }
        return arraybuffer;
    };
})(base64 || (base64 = {}));
var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};

var Github = (function () {
    function Github() {
        var access_token = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
        var apiUrl = arguments.length <= 1 || arguments[1] === undefined ? "https://api.github.com/" : arguments[1];

        _classCallCheck(this, Github);

        this.access_token = access_token;
        this.apiUrl = apiUrl;
    }

    _createClass(Github, [{
        key: "getRepo",
        value: function getRepo(repo) {
            return new GithubRepo(this, repo);
        }
    }, {
        key: "fetch",
        value: (function (_fetch) {
            function fetch(_x, _x2) {
                return _fetch.apply(this, arguments);
            }

            fetch.toString = function () {
                return _fetch.toString();
            };

            return fetch;
        })(function (path, data) {
            var authenticate = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                if (!data) data = { headers: new Headers() };
                if (!data.headers) data.headers = new Headers();
                var h = data.headers;
                if (authenticate) if (this.access_token) h.append("Authorization", "token " + this.access_token);else throw Error("can't " + data.method + " " + path + " without access token");
                console.log("fetch", this.apiUrl + path, data);
                return yield fetch(this.apiUrl + path, data);
            });
        })
    }, {
        key: "fetchJSON",
        value: function fetchJSON(path, data) {
            var authenticate = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                return yield (yield this.fetch(path, data, authenticate)).json();
            });
        }
    }, {
        key: "fetchRaw",
        value: function fetchRaw(path, data) {
            var authenticate = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                var headers = new Headers();
                headers.append("Accept", "application/vnd.github.v3.raw");
                var r = yield this.fetch(path, { headers: headers }, authenticate);
                return yield r.arrayBuffer();
            });
        }
    }, {
        key: "postJSON",
        value: function postJSON(path, data) {
            var method = arguments.length <= 2 || arguments[2] === undefined ? "POST" : arguments[2];
            var authenticate = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

            return __awaiter(this, void 0, Promise, function* () {
                var headers = new Headers();
                headers.append("Content-Type", "application/json;charset=UTF-8");
                return yield this.fetchJSON(path, { method: method, headers: headers, body: JSON.stringify(data) }, authenticate);
            });
        }
    }, {
        key: "createGist",
        value: function createGist(description, files) {
            var is_public = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
            var authenticate = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

            return __awaiter(this, void 0, Promise, function* () {
                return yield this.postJSON("gists", { description: description, "public": is_public, files: files }, "POST", authenticate);
            });
        }
    }, {
        key: "getGist",
        value: function getGist(id) {
            return __awaiter(this, void 0, Promise, function* () {
                return yield this.fetchJSON("gists/" + id);
            });
        }
    }]);

    return Github;
})();

var GithubRepo = (function () {
    function GithubRepo(github, repo) {
        _classCallCheck(this, GithubRepo);

        this.github = github;
        this.repo = repo;
    }

    _createClass(GithubRepo, [{
        key: "getRefs",
        value: function getRefs() {
            return __awaiter(this, void 0, Promise, function* () {
                return yield this.github.fetchJSON(this.repo + "/git/refs");
            });
        }
    }, {
        key: "getRef",
        value: function getRef() {
            var ref = arguments.length <= 0 || arguments[0] === undefined ? "heads/master" : arguments[0];

            return __awaiter(this, void 0, Promise, function* () {
                return yield this.github.fetchJSON(this.repo + "/git/refs/" + ref);
            });
        }
    }, {
        key: "updateRef",
        value: function updateRef(sha) {
            var ref = arguments.length <= 1 || arguments[1] === undefined ? "heads/master" : arguments[1];

            return __awaiter(this, void 0, Promise, function* () {
                return yield this.github.postJSON(this.repo + "/git/refs/" + ref, { sha: sha }, "PATCH");
            });
        }
    }, {
        key: "getHead",
        value: function getHead() {
            return __awaiter(this, void 0, Promise, function* () {
                var branch = yield this.getRef();
                return branch.object.sha;
            });
        }
    }, {
        key: "getTree",
        value: function getTree(sha) {
            var recursive = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            return __awaiter(this, void 0, Promise, function* () {
                return yield this.github.fetchJSON(this.repo + "/git/trees/" + sha + (recursive ? "?recursive=1" : ""));
            });
        }
    }, {
        key: "createBlob",
        value: function createBlob(data) {
            return __awaiter(this, void 0, Promise, function* () {
                var resp = yield this.github.postJSON(this.repo + "/git/blobs", {
                    encoding: "base64", content: base64.encode(data, false, true)
                });
                return resp.sha;
            });
        }
    }, {
        key: "getBlob",
        value: function getBlob(sha) {
            return __awaiter(this, void 0, Promise, function* () {
                return yield this.github.fetchRaw(this.repo + "/git/blobs/" + sha);
            });
        }
    }, {
        key: "createTree",
        value: function createTree(base_tree, path, sha) {
            return __awaiter(this, void 0, Promise, function* () {
                var resp = yield this.github.postJSON(this.repo + "/git/trees", {
                    base_tree: base_tree, tree: [{ path: path, mode: "100644", type: "blob", sha: sha }]
                });
                return resp;
            });
        }
    }, {
        key: "createCommit",
        value: function createCommit(parent, tree, message) {
            return __awaiter(this, void 0, Promise, function* () {
                return yield this.github.postJSON(this.repo + "/git/commits", { message: message, parents: [parent], tree: tree });
            });
        }
    }, {
        key: "pushFileToMaster",
        value: function pushFileToMaster(path, content, commitMessage) {
            return __awaiter(this, void 0, Promise, function* () {
                var head = yield this.getHead();
                var newtree = yield this.createTree(head, path, (yield this.createBlob(content.buffer)));
                var newsha = newtree.sha;
                var files = newtree.tree;
                var filesha = files.filter(function (file) {
                    return file.path == path;
                })[0].sha;
                var commit = yield this.createCommit(head, newsha, commitMessage);
                yield this.updateRef(commit.sha);
                return filesha;
            });
        }
    }]);

    return GithubRepo;
})();

var repoName = null; // "phire-store/testing";
var github = new Github(localStorage.getItem("accessToken"));
var repo = github.getRepo(repoName);
var SimpleCrypto;
(function (SimpleCrypto) {
    function encrypt(data) {
        return __awaiter(this, void 0, Promise, function* () {
            var key = yield crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ["encrypt"]);
            var iv = new Uint8Array(16);
            // IV randomness not necessary because every key is only used once
            // crypto.getRandomValues(iv);
            var key_arr = yield crypto.subtle.exportKey("raw", key);
            return {
                data: new Uint8Array((yield crypto.subtle.encrypt({ name: "AES-CBC", iv: iv }, key, data))),
                key: base64.encode(key_arr, true, false), iv: iv
            };
        });
    }
    SimpleCrypto.encrypt = encrypt;
    function decrypt(data, key_str, iv) {
        return __awaiter(this, void 0, Promise, function* () {
            var key = yield crypto.subtle.importKey("raw", new Uint8Array(base64.decode(key_str, true)), "AES-CBC", false, ["decrypt"]);
            return yield crypto.subtle.decrypt({ name: "AES-CBC", iv: iv }, key, data);
        });
    }
    SimpleCrypto.decrypt = decrypt;
})(SimpleCrypto || (SimpleCrypto = {}));
var Upload;
(function (Upload) {
    var gistUploadMethod = function gistUploadMethod(f, d) {
        return __awaiter(this, void 0, Promise, function* () {
            if (d.byteLength >= 1000 * 3 / 4 * 1000) console.warn("Image should be < 700 kB to avoid calling api twice");
            if (d.byteLength >= 2e6) throw "Image must be < 2 MB";
            return (yield github.createGist(Util.randomString(0, 10), _defineProperty({}, f, { content: base64.encode(d.buffer, true, false) }))).id;
        });
    };
    var repoUploadMethod = function repoUploadMethod(f, d) {
        return repo.pushFileToMaster(f, d, "add");
    };
    var uploadMethod = repoName ? repoUploadMethod : gistUploadMethod;
    var downloadMethod = undefined;
    if (repoName) downloadMethod = function (sha) {
        return repo.getBlob(sha);
    };else downloadMethod = function (sha) {
        return __awaiter(this, void 0, Promise, function* () {
            var gist = yield github.getGist(sha);
            var file = gist.files[Object.keys(gist.files)[0]];
            if (file.truncated) {
                return base64.decode((yield (yield fetch(file.raw_url)).text()), true);
            } else return base64.decode(file.content, true);
        });
    };
    function getAllowUploadURL() {
        return __awaiter(this, void 0, Promise, function* () {
            var info = yield SimpleCrypto.encrypt(Util.hexToArr(github.access_token));
            location.hash = "#allowupload!" + base64.encode(info.data.buffer, true, false) + "!" + info.key;
        });
    }
    Upload.getAllowUploadURL = getAllowUploadURL;
    function uploadEncrypted(inputData) {
        return __awaiter(this, void 0, Promise, function* () {
            var filename = Util.randomString(1, 16);

            var _ref = yield SimpleCrypto.encrypt(inputData);

            var key = _ref.key;
            var iv = _ref.iv;
            var data = _ref.data;

            return { key: key, iv: iv, sha: yield uploadMethod(filename, data) };
        });
    }
    Upload.uploadEncrypted = uploadEncrypted;
    function downloadFile(sha, key) {
        return __awaiter(this, void 0, Promise, function* () {
            sha = Util.arrToHex(new Uint8Array(base64.decode(sha, true)));
            return yield SimpleCrypto.decrypt(new Uint8Array((yield downloadMethod(sha))), key, new Uint8Array(16));
        });
    }
    Upload.downloadFile = downloadFile;
    function uploadFile(evt) {
        return __awaiter(this, void 0, Promise, function* () {
            try {
                document.body.textContent = "Uploading...";
                var f = evt.target.files[0];
                if (f) {
                    var data = new Uint8Array((yield readFile(f)));
                    var info = yield uploadEncrypted(data);
                    var sha = base64.encode(Util.hexToArr(info.sha).buffer, true, false);
                    history.replaceState({}, "", "#" + sha + "!" + info.key);
                    return data.buffer;
                } else throw "no image selected";
            } catch (e) {
                document.body.textContent = JSON.stringify(e);
                throw e;
            }
        });
    }
    Upload.uploadFile = uploadFile;
    function readFile(f) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise(function (resolve, reject) {
                var r = new FileReader();
                r.onload = function (e) {
                    return resolve(r.result);
                };
                r.readAsArrayBuffer(f);
            });
        });
    }
    Upload.readFile = readFile;
})(Upload || (Upload = {}));
var Util;
(function (Util) {
    function randomString(minlength) {
        var maxlength = arguments.length <= 1 || arguments[1] === undefined ? minlength : arguments[1];
        return (function () {
            var length = Math.random() * (maxlength + 1 - minlength) + minlength | 0;
            return base64.encode(crypto.getRandomValues(new Uint8Array(length * 3 / 4 + 2)).buffer, true, false).substr(0, length);
        })();
    }
    Util.randomString = randomString;
    function hexToArr(hex) {
        var out = new Uint8Array(hex.length / 2);
        for (var i = 0; i < hex.length; i += 2) {
            out[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return out;
    }
    Util.hexToArr = hexToArr;
    function arrToHex(arr) {
        var out = "";
        for (var byte of arr) {
            out += byte < 16 ? "0" + byte.toString(16) : byte.toString(16);
        }return out;
    }
    Util.arrToHex = arrToHex;
})(Util || (Util = {}));
var GUI;
(function (GUI) {
    var magics = { 0xFFD8: 'image/jpeg', 0x5249: 'image/webp', 0x8950: 'image/png' };
    function displayImage(data) {
        return __awaiter(this, void 0, Promise, function* () {
            var magic = new DataView(data, 0, 2).getInt16(0, false);
            var mime = magics[magic];
            console.log("displaying " + data.byteLength / 1000 + "kByte mime=" + (mime || "unknown: 0x" + magic.toString(16)) + " image");
            var file = new Blob([data], { type: mime || "image/jpeg" });
            var img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            document.body.innerHTML = "";
            document.body.appendChild(img);
        });
    }
    if (location.hash) {
        if (location.hash.startsWith("#allowupload!")) {
            var _location$hash$substr$split = location.hash.substr(1).split("!");

            var _location$hash$substr$split2 = _slicedToArray(_location$hash$substr$split, 3);

            var crypt = _location$hash$substr$split2[1];
            var key = _location$hash$substr$split2[2];

            SimpleCrypto.decrypt(new Uint8Array(base64.decode(crypt, true)), key, new Uint8Array(16)).then(function (token) {
                localStorage.setItem("accessToken", Util.arrToHex(new Uint8Array(token)));
                location.hash = "";
                location.reload();
            });
        } else {
            var _location$hash$substr$split3 = location.hash.substr(1).split("!");

            var _location$hash$substr$split32 = _slicedToArray(_location$hash$substr$split3, 2);

            var filename = _location$hash$substr$split32[0];
            var key = _location$hash$substr$split32[1];

            document.writeln("Loading...<!--");
            Upload.downloadFile(filename, key).then(displayImage);
        }
    } else if (github.access_token || !repoName) {
        document.addEventListener('DOMContentLoaded', function () {
            document.getElementById("fileinput").addEventListener('change', function (e) {
                Upload.uploadFile(e).then(displayImage);
            }, false);
        });
    } else {
        document.writeln("No image given and upload key missing<!--");
    }
})(GUI || (GUI = {}));
//# sourceMappingURL=tmp.js.map
//# sourceMappingURL=bin.js.map