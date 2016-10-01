var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var base64;
(function (base64_1) {
    base64_1._chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    base64_1._chars_url = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    base64_1.encode = function (arraybuffer, url, equals) {
        const chars = url ? base64_1._chars_url : base64_1._chars;
        var bytes = new Uint8Array(arraybuffer), len = bytes.length, base64 = "";
        for (let i = 0; i < len; i += 3) {
            base64 += chars[bytes[i] >> 2];
            base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
            base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
            base64 += chars[bytes[i + 2] & 63];
        }
        if ((len % 3) === 2) {
            base64 = base64.substring(0, base64.length - 1) + (equals ? "=" : "");
        }
        else if (len % 3 === 1) {
            base64 = base64.substring(0, base64.length - 2) + (equals ? "==" : "");
        }
        return base64;
    };
    base64_1.decode = function (base64, url) {
        const chars = url ? base64_1._chars_url : base64_1._chars;
        const len = base64.length;
        var bufferLength = len * 0.75, p = 0;
        if (base64[len - 1] === "=") {
            bufferLength--;
            if (base64[len - 2] === "=") {
                bufferLength--;
            }
        }
        const bytes = new Uint8Array(new ArrayBuffer(bufferLength));
        for (let i = 0; i < len; i += 4) {
            const encoded1 = chars.indexOf(base64[i]);
            const encoded2 = chars.indexOf(base64[i + 1]);
            const encoded3 = chars.indexOf(base64[i + 2]);
            const encoded4 = chars.indexOf(base64[i + 3]);
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return bytes.buffer;
    };
})(base64 || (base64 = {}));
class Github {
    constructor(apiUrl = `https://api.github.com/`) {
        this.apiUrl = apiUrl;
    }
    fetch(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            log("fetching " + (data && data.method || "") + " " + this.apiUrl + path);
            return yield fetch(this.apiUrl + path, data);
        });
    }
    fetchJSON(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (yield this.fetch(path, data)).json();
        });
    }
    fetchRaw(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = new Headers();
            headers.append("Accept", "application/vnd.github.v3.raw");
            const r = yield this.fetch(path, { headers });
            return yield r.arrayBuffer();
        });
    }
    postJSON(path, data, method = "POST") {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = new Headers();
            headers.append("Content-Type", "application/json;charset=UTF-8");
            return yield this.fetchJSON(path, { method, headers, body: JSON.stringify(data) });
        });
    }
    createGist(description, files, is_public = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.postJSON("gists", { description, public: is_public, files: files }, "POST");
        });
    }
    getGist(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.fetchJSON("gists/" + id);
        });
    }
}
let github = new Github();
function log(info) {
    console.log(info);
    const e = document.getElementById("log");
    if (e)
        e.innerHTML += info + "<br>";
}
function showLog() {
    document.getElementById("showlogbutton").style.display = 'none';
    document.getElementById("showlog").style.display = '';
}
var SimpleCrypto;
(function (SimpleCrypto) {
    SimpleCrypto.encryptionAlgorithm = "AES-GCM";
    function encrypt(data) {
        return __awaiter(this, void 0, void 0, function* () {
            log("Generating key and IV...");
            const key = yield crypto.subtle.generateKey({ name: SimpleCrypto.encryptionAlgorithm, length: 128 }, true, ["encrypt"]);
            const iv = new Uint8Array(16);
            crypto.getRandomValues(iv);
            log("Encrypting...");
            const encrypted = yield crypto.subtle.encrypt({ name: SimpleCrypto.encryptionAlgorithm, iv }, key, data);
            return {
                data: [iv, new Uint8Array(encrypted)],
                key: base64.encode(yield crypto.subtle.exportKey("raw", key), true, false),
            };
        });
    }
    SimpleCrypto.encrypt = encrypt;
    function decrypt(data, key_str) {
        return __awaiter(this, void 0, void 0, function* () {
            log("Decoding IV...");
            const iv = data.subarray(0, 16);
            const encrypted_data = data.subarray(16);
            const key = new Uint8Array(base64.decode(key_str, true));
            log("Decrypting...");
            const imported_key = yield crypto.subtle.importKey("raw", key, SimpleCrypto.encryptionAlgorithm, false, ["decrypt"]);
            return yield crypto.subtle.decrypt({ name: SimpleCrypto.encryptionAlgorithm, iv }, imported_key, encrypted_data);
        });
    }
    SimpleCrypto.decrypt = decrypt;
})(SimpleCrypto || (SimpleCrypto = {}));
var Upload;
(function (Upload) {
    function uploadToGist(d) {
        return __awaiter(this, void 0, void 0, function* () {
            const f = Util.randomString(1, 16);
            if (d.byteLength >= 1000 * 3 / 4 * 1000)
                log("Data should be < 700 kB to avoid calling api twice");
            if (d.byteLength >= 5e6)
                throw "Data must be < 5 MB"; // more should be possible
            return (yield github.createGist(Util.randomString(0, 10), {
                [f]: { content: base64.encode(d.buffer, true, false) }
            })).id;
        });
    }
    function downloadFromGist(sha) {
        return __awaiter(this, void 0, void 0, function* () {
            const gist = yield github.getGist(sha);
            const file = gist.files[Object.keys(gist.files)[0]];
            if (file.truncated) {
                return base64.decode(yield (yield fetch(file.raw_url)).text(), true);
            }
            else
                return base64.decode(file.content, true);
        });
    }
    function uploadEncrypted(meta, raw_data) {
        return __awaiter(this, void 0, void 0, function* () {
            log("Uploading...");
            const nullByte = new Uint8Array(1);
            const inputData = yield Util.joinBuffers(new TextEncoder().encode(JSON.stringify(meta)), nullByte, raw_data);
            const { data, key } = yield SimpleCrypto.encrypt(inputData);
            // TODO: don't copy all data twice (via Util.joinBuffers)
            return { data, key, sha: yield uploadToGist(yield Util.joinBuffers(...data)) };
        });
    }
    Upload.uploadEncrypted = uploadEncrypted;
    function downloadEncrypted(sha, key) {
        return __awaiter(this, void 0, void 0, function* () {
            sha = Util.arrToHex(new Uint8Array(base64.decode(sha, true)));
            const buf = yield SimpleCrypto.decrypt(new Uint8Array(yield downloadFromGist(sha)), key);
            const sep = new Uint8Array(buf).indexOf(0);
            const meta = new TextDecoder().decode(new Uint8Array(buf, 0, sep));
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
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const r = new FileReader();
                r.onload = _ => resolve(r.result);
                r.readAsArrayBuffer(f);
            });
        });
    }
    Util.readFile = readFile;
    function randomString(minlength, maxlength = minlength) {
        const length = (Math.random() * (maxlength + 1 - minlength) + minlength) | 0;
        return base64.encode(crypto.getRandomValues(new Uint8Array((length * 3 / 4 + 2) | 0)).buffer, true, false).substr(0, length);
    }
    Util.randomString = randomString;
    function hexToArr(hex) {
        const out = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            out[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return out;
    }
    Util.hexToArr = hexToArr;
    function arrToHex(arr) {
        let out = "";
        for (let byte of arr)
            out += (byte < 16 ? "0" + byte.toString(16) : byte.toString(16));
        return out;
    }
    Util.arrToHex = arrToHex;
    function joinBuffers(...arrs) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Uint8Array(yield Util.readFile(new Blob(arrs)));
        });
    }
    Util.joinBuffers = joinBuffers;
    function htmlEscape(s) {
        const div = document.createElement("div");
        div.textContent = s;
        return div.innerHTML;
    }
    Util.htmlEscape = htmlEscape;
    function createBlobUrl(data) {
        log(`Displaying ${data.byteLength / 1000} kByte file`);
        return URL.createObjectURL(new Blob([data]));
    }
    Util.createBlobUrl = createBlobUrl;
})(Util || (Util = {}));
var GUI;
(function (GUI) {
    const container = document.getElementsByClassName("container")[0];
    ;
    const types = [
        { name: "Text", toHTML: (_, data) => `<pre class="uploaded">${new TextDecoder().decode(data)}</pre>` },
        { name: "Raw", toHTML: (f, data) => `<a href="${Util.createBlobUrl(data)}" download="${f}">Download ${f}</a>` },
        { name: "Image", toHTML: (_, data) => `<img src="${Util.createBlobUrl(data)}">` },
        { name: "Audio", toHTML: (_, data) => `<audio controls><source src="${Util.createBlobUrl(data)}"></audio>` },
        { name: "Video", toHTML: (_, data) => `<video controls><source src="${Util.createBlobUrl(data)}"></video>` }
    ];
    function displayFile(info) {
        const type = types.filter(t => t.name == info.meta.type)[0];
        if (type) {
            container.innerHTML = `<h3>File ${Util.htmlEscape(info.meta.name)}</h3>`
                + type.toHTML(info.meta.name, info.data);
            log("Displayed file as " + info.meta.type);
        }
        else
            log("unknown type " + info.meta.type);
    }
    function beginUpload() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = document.querySelector("input[type=file]").files[0];
                if (file) {
                    const data = new Uint8Array(yield Util.readFile(file));
                    const type = document.querySelector("input[type=radio]:checked");
                    if (!type)
                        throw Error("no type selected");
                    container.innerHTML = "<h3>Uploading...</h3>";
                    const meta = { name: file.name, type: type.value };
                    const info = yield Upload.uploadEncrypted(meta, data);
                    log("Uploaded. Updating URL and displaying...");
                    const sha = base64.encode(Util.hexToArr(info.sha).buffer, true, false);
                    history.replaceState({}, "", "#" + sha + "!" + info.key);
                    displayFile({ meta, data });
                    document.getElementById("removeIfUpload").style.display = "";
                }
                else
                    throw Error("no file selected");
            }
            catch (e) {
                log(e);
                showLog();
                throw e;
            }
        });
    }
    GUI.beginUpload = beginUpload;
    function initializeUploader() {
        container.innerHTML = `
			<h3>Upload a file (image/audio/video/text)</h3>
			<p><input type="file" id="fileinput"></p>
			${types.map(type => `<input type="radio" name="type" id="type_${type.name}" value="${type.name}">
				 <label for="type_${type.name}">${type.name}</label>`).join("")}
			<button id="uploadbutton">Upload</button>
			<p>The file will be encrypted and authenticated completely client-side using 128bit AES-GCM. Limit 5 MB.</p>
		`;
        document.getElementById("removeIfUpload").style.display = "none";
        document.getElementById("uploadbutton").addEventListener('click', beginUpload);
    }
    /*declare var process: any, require: any;
    async function initializeNode() {
        // (broken) running from node
        const args = process.argv.slice(2);
        if (args.length !== 1) {
            console.log("usage: node " + process.argv[1] + " [filename to upload]");
            process.exit(1);
        } else {
            console.log("uploading");
            const fs = require('fs');
            if (!fs.existsSync(args[0])) throw args[0] + " does not exist";
            const data = new Uint8Array(fs.readFileSync(args[0]));
        }
    }*/
    document.addEventListener('DOMContentLoaded', () => {
        /*if (typeof process !== "undefined") {
            initializeNode();
        } else */ if (location.hash) {
            const [filename, key] = location.hash.substr(1).split("!");
            log("Loading...");
            container.innerHTML = "<h3>Loading...</h3>";
            Upload.downloadEncrypted(filename, key).then(displayFile);
        }
        else {
            initializeUploader();
        }
    });
    window.addEventListener('hashchange', () => location.reload());
})(GUI || (GUI = {}));
//# sourceMappingURL=bin.js.map