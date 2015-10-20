"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

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
        var apiUrl = arguments.length <= 0 || arguments[0] === undefined ? "https://api.github.com/" : arguments[0];

        _classCallCheck(this, Github);

        this.apiUrl = apiUrl;
    }

    _createClass(Github, [{
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
            return __awaiter(this, void 0, Promise, function* () {
                log("fetching " + (data && data.method || "") + " " + this.apiUrl + path);
                return yield fetch(this.apiUrl + path, data);
            });
        })
    }, {
        key: "fetchJSON",
        value: function fetchJSON(path, data) {
            return __awaiter(this, void 0, Promise, function* () {
                return yield (yield this.fetch(path, data)).json();
            });
        }
    }, {
        key: "fetchRaw",
        value: function fetchRaw(path, data) {
            return __awaiter(this, void 0, Promise, function* () {
                var headers = new Headers();
                headers.append("Accept", "application/vnd.github.v3.raw");
                var r = yield this.fetch(path, { headers: headers });
                return yield r.arrayBuffer();
            });
        }
    }, {
        key: "postJSON",
        value: function postJSON(path, data) {
            var method = arguments.length <= 2 || arguments[2] === undefined ? "POST" : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                var headers = new Headers();
                headers.append("Content-Type", "application/json;charset=UTF-8");
                return yield this.fetchJSON(path, { method: method, headers: headers, body: JSON.stringify(data) });
            });
        }
    }, {
        key: "createGist",
        value: function createGist(description, files) {
            var is_public = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                return yield this.postJSON("gists", { description: description, "public": is_public, files: files }, "POST");
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

var github = new Github();
var $ = function $(s) {
    return [].slice.call(document.querySelectorAll(s));
};
function log(info) {
    console.log(info);
    var e = $("#log")[0];
    if (e) e.innerHTML += info + "<br>";
}
function showLog() {
    $("button[onclick='showLog()']")[0].style.display = 'none';
    $("#showlog")[0].style.display = '';
}
var SimpleCrypto;
(function (SimpleCrypto) {
    SimpleCrypto.encryptionAlgorithm = "AES-GCM";
    function encrypt(data) {
        return __awaiter(this, void 0, Promise, function* () {
            log("Generating key and IV...");
            var key = yield crypto.subtle.generateKey({ name: SimpleCrypto.encryptionAlgorithm, length: 128 }, true, ["encrypt"]);
            var iv = new Uint8Array(16);
            crypto.getRandomValues(iv);
            log("Encrypting...");
            var encrypted = yield crypto.subtle.encrypt({ name: SimpleCrypto.encryptionAlgorithm, iv: iv }, key, data);
            return {
                data: [iv, new Uint8Array(encrypted)],
                key: base64.encode((yield crypto.subtle.exportKey("raw", key)), true, false)
            };
        });
    }
    SimpleCrypto.encrypt = encrypt;
    function decrypt(data, key_str) {
        return __awaiter(this, void 0, Promise, function* () {
            log("Decoding IV...");
            var iv = data.subarray(0, 16);
            var encrypted_data = data.subarray(16);
            var key = new Uint8Array(base64.decode(key_str, true));
            log("Decrypting...");
            var imported_key = yield crypto.subtle.importKey("raw", key, SimpleCrypto.encryptionAlgorithm, false, ["decrypt"]);
            return yield crypto.subtle.decrypt({ name: SimpleCrypto.encryptionAlgorithm, iv: iv }, imported_key, encrypted_data);
        });
    }
    SimpleCrypto.decrypt = decrypt;
})(SimpleCrypto || (SimpleCrypto = {}));
var Upload;
(function (Upload) {
    function uploadToGist(d) {
        return __awaiter(this, void 0, Promise, function* () {
            var f = Util.randomString(1, 16);
            if (d.byteLength >= 1000 * 3 / 4 * 1000) log("Data should be < 700 kB to avoid calling api twice");
            if (d.byteLength >= 5e6) throw "Data must be < 5 MB"; // more should be possible
            return (yield github.createGist(Util.randomString(0, 10), _defineProperty({}, f, { content: base64.encode(d.buffer, true, false) }))).id;
        });
    }
    function downloadFromGist(sha) {
        return __awaiter(this, void 0, Promise, function* () {
            var gist = yield github.getGist(sha);
            var file = gist.files[Object.keys(gist.files)[0]];
            if (file.truncated) {
                return base64.decode((yield (yield fetch(file.raw_url)).text()), true);
            } else return base64.decode(file.content, true);
        });
    }
    function uploadEncrypted(meta, raw_data) {
        return __awaiter(this, void 0, Promise, function* () {
            var _Util;

            log("Uploading...");
            var nullByte = new Uint8Array(1);
            var inputData = yield Util.joinBuffers(new TextEncoder().encode(JSON.stringify(meta)), nullByte, raw_data);

            var _ref = yield SimpleCrypto.encrypt(inputData);

            var data = _ref.data;
            var key = _ref.key;

            // TODO: don't copy all data twice (via Util.joinBuffers)
            return { data: data, key: key, sha: yield uploadToGist((yield (_Util = Util).joinBuffers.apply(_Util, _toConsumableArray(data)))) };
        });
    }
    Upload.uploadEncrypted = uploadEncrypted;
    function downloadEncrypted(sha, key) {
        return __awaiter(this, void 0, Promise, function* () {
            sha = Util.arrToHex(new Uint8Array(base64.decode(sha, true)));
            var buf = yield SimpleCrypto.decrypt(new Uint8Array((yield downloadFromGist(sha))), key);
            var sep = new Uint8Array(buf).indexOf(0);
            var meta = new TextDecoder().decode(new Uint8Array(buf, 0, sep));
            log("Decoded metadata: " + meta);
            return {
                meta: JSON.parse(meta),
                data: new Uint8Array(buf, sep + 1)
            };
        });
    }
    Upload.downloadEncrypted = downloadEncrypted;
})(Upload || (Upload = {}));
var Util;
(function (Util) {
    function readFile(f) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise(function (resolve) {
                var r = new FileReader();
                r.onload = function (e) {
                    return resolve(r.result);
                };
                r.readAsArrayBuffer(f);
            });
        });
    }
    Util.readFile = readFile;
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
    function joinBuffers() {
        for (var _len = arguments.length, arrs = Array(_len), _key = 0; _key < _len; _key++) {
            arrs[_key] = arguments[_key];
        }

        return __awaiter(this, void 0, Promise, function* () {
            return new Uint8Array((yield Util.readFile(new Blob(arrs))));
        });
    }
    Util.joinBuffers = joinBuffers;
    function htmlEscape(s) {
        var div = document.createElement("div");
        div.textContent = s;
        return div.innerHTML;
    }
    Util.htmlEscape = htmlEscape;
    function getMimeType(fname) {
        var ext = fname.split(".").pop();
        var map = { jpg: "image/jpeg", png: "image/png", mp3: "audio/mpeg" };
        return map[fname] || "";
    }
    Util.getMimeType = getMimeType;
    function createBlobUrl(fname, data) {
        log("Displaying " + data.byteLength / 1000 + " kByte file");
        return URL.createObjectURL(new Blob([data]));
    }
    Util.createBlobUrl = createBlobUrl;
})(Util || (Util = {}));
var GUI;
(function (GUI) {
    var container = $(".container")[0];
    ;
    var types = [{ name: "Text", toHTML: function toHTML(f, data) {
            return "<pre class=\"uploaded\">" + new TextDecoder().decode(data) + "</pre>";
        } }, { name: "Raw", toHTML: function toHTML(f, data) {
            return "<a href=\"" + Util.createBlobUrl(f, data) + "\" download=\"" + f + "\">Download " + f + "</a>";
        } }, { name: "Image", toHTML: function toHTML(f, data) {
            return "<img src=\"" + Util.createBlobUrl(f, data) + "\">";
        } }, { name: "Audio", toHTML: function toHTML(f, data) {
            return "<audio controls><source src=\"" + Util.createBlobUrl(f, data) + "\"></audio>";
        } }, { name: "Video", toHTML: function toHTML(f, data) {
            return "<video controls><source src=\"" + Util.createBlobUrl(f, data) + "\"></video>";
        } }];
    function displayFile(info) {
        var type = types.filter(function (t) {
            return t.name == info.meta.type;
        })[0];
        if (type) {
            container.innerHTML = "<h3>File " + Util.htmlEscape(info.meta.name) + "</h3>" + type.toHTML(info.meta.name, info.data);
            log("Displayed file as " + info.meta.type);
        } else log("unknown type " + info.meta.type);
    }
    function beginUpload() {
        return __awaiter(this, void 0, Promise, function* () {
            try {
                var file = $("input[type=file]")[0].files[0];
                if (file) {
                    var data = new Uint8Array((yield Util.readFile(file)));
                    var type = ($("input[type=radio]:checked")[0] || {}).value;
                    if (!type) throw Error("no type selected");
                    container.innerHTML = "<h3>Uploading...</h3>";
                    var meta = { name: file.name, type: type };
                    var info = yield Upload.uploadEncrypted(meta, data);
                    log("Uploaded. Updating URL and displaying...");
                    var sha = base64.encode(Util.hexToArr(info.sha).buffer, true, false);
                    history.replaceState({}, "", "#" + sha + "!" + info.key);
                    displayFile({ meta: meta, data: data });
                    $("#removeIfUpload")[0].style.display = "";
                } else throw Error("no file selected");
            } catch (e) {
                log(e);
                showLog();
                throw e;
            }
        });
    }
    GUI.beginUpload = beginUpload;
    function initializeUploader() {
        container.innerHTML = "\n\t\t\t<h3>Upload a file (image/audio/video/text)</h3>\n\t\t\t<p><input type=\"file\" id=\"fileinput\"></p>\n\t\t\t" + types.map(function (type) {
            return "<input type=\"radio\" name=\"type\" id=\"type_" + type.name + "\" value=\"" + type.name + "\">\n\t\t\t\t <label for=\"type_" + type.name + "\">" + type.name + "</label>";
        }).join("") + "\n\t\t\t<button id=\"uploadbutton\">Upload</button>\n\t\t\t<p>File must be < 5MB. The file will be encrypted and authenticated using 128bit AES-GCM.</p>\n\t\t";
        $("#removeIfUpload")[0].style.display = "none";
        $("#uploadbutton")[0].addEventListener('click', beginUpload);
    }
    function initializeNode() {
        return __awaiter(this, void 0, Promise, function* () {
            // (broken) running from node
            var args = process.argv.slice(2);
            if (args.length !== 1) {
                console.log("usage: node " + process.argv[1] + " [filename to upload]");
                process.exit(1);
            } else {
                console.log("uploading");
                var fs = require('fs');
                if (!fs.existsSync(args[0])) throw args[0] + " does not exist";
                var data = new Uint8Array(fs.readFileSync(args[0]));
            }
        });
    }
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof process !== "undefined") {
            initializeNode();
        } else if (location.hash) {
            var _location$hash$substr$split = location.hash.substr(1).split("!");

            var _location$hash$substr$split2 = _slicedToArray(_location$hash$substr$split, 2);

            var filename = _location$hash$substr$split2[0];
            var key = _location$hash$substr$split2[1];

            log("Loading...");
            container.innerHTML = "<h3>Loading...</h3>";
            Upload.downloadEncrypted(filename, key).then(displayFile);
        } else {
            initializeUploader();
        }
    });
    window.addEventListener('hashchange', function () {
        return location.reload();
    });
})(GUI || (GUI = {}));
//# sourceMappingURL=tmp.js.map
//# sourceMappingURL=bin.js.map