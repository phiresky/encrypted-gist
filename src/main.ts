let github = new Github();

const $ = s => [].slice.call(document.querySelectorAll(s)) as HTMLElement[];
function log(info: any) {
	console.log(info);
	const e = $("#log")[0];
	if (e) e.innerHTML += info + "<br>";
}
function showLog() {
	$("button[onclick='showLog()']")[0].style.display = 'none';
	$("#showlog")[0].style.display = '';
}

declare var TextDecoder, TextEncoder;

module SimpleCrypto {
	export let encryptionAlgorithm = "AES-GCM";
	export async function encrypt(data: Uint8Array) {
		log("Generating key and IV...");
		const key: CryptoKey = await crypto.subtle.generateKey({ name: encryptionAlgorithm, length: 128 }, true, ["encrypt"]);
		const iv = new Uint8Array(16); crypto.getRandomValues(iv);
		log("Encrypting...");
		const encrypted = await crypto.subtle.encrypt({ name: encryptionAlgorithm, iv }, key, data) as ArrayBuffer;
		return {
			data: [iv, new Uint8Array(encrypted)],
			key: base64.encode(await crypto.subtle.exportKey("raw", key), true, false),
		};
	}
	export async function decrypt(data: Uint8Array, key_str: string) {
		log("Decoding IV...");
		const iv = data.subarray(0, 16);
		const encrypted_data = data.subarray(16);
		const key = new Uint8Array(base64.decode(key_str, true));
		log("Decrypting...");
		const imported_key = await crypto.subtle.importKey("raw", key, encryptionAlgorithm, false, ["decrypt"]);
		return await crypto.subtle.decrypt({ name: encryptionAlgorithm, iv }, imported_key, encrypted_data) as ArrayBuffer;
	}
}
interface UploadMetadata {
	name: string, type: string
}
module Upload {
	async function uploadToGist(d) {
		const f = Util.randomString(1, 16);
		if (d.byteLength >= 1000 * 3 / 4 * 1000) log("Data should be < 700 kB to avoid calling api twice");
		if (d.byteLength >= 5e6) throw "Data must be < 5 MB"; // more should be possible
		return (await github.createGist(Util.randomString(0, 10), {
			[f]: { content: base64.encode(d.buffer, true, false) }
		})).id;
	}
	async function downloadFromGist(sha) {
		const gist = await github.getGist(sha);
		const file = gist.files[Object.keys(gist.files)[0]];
		if (file.truncated) {
			return base64.decode(await (await fetch(file.raw_url)).text(), true);
		} else
			return base64.decode(file.content, true);
	}
	export async function uploadEncrypted(meta: UploadMetadata, raw_data: Uint8Array) {
		log("Uploading...");
		const nullByte = new Uint8Array(1);
		const inputData = await Util.joinBuffers(new TextEncoder().encode(JSON.stringify(meta)), nullByte, raw_data);
		const {data, key} = await SimpleCrypto.encrypt(inputData);
		// TODO: don't copy all data twice (via Util.joinBuffers)
		return { data, key, sha: await uploadToGist(await Util.joinBuffers(...data)) };
	}
	export async function downloadEncrypted(sha: string, key: string) {
		sha = Util.arrToHex(new Uint8Array(base64.decode(sha, true)));
		const buf = await SimpleCrypto.decrypt(new Uint8Array(await downloadFromGist(sha)), key);
		const sep = new Uint8Array(buf).indexOf(0);
		const meta = new TextDecoder().decode(new Uint8Array(buf, 0, sep));
		log("Decoded metadata: " + meta);
		return {
			meta: JSON.parse(meta) as UploadMetadata,
			data: new Uint8Array(buf, sep + 1)
		}
	}
}

module Util {
	export async function readFile(f: File | Blob) {
		return new Promise<ArrayBuffer>(resolve => {
			const r = new FileReader();
			r.onload = e => resolve(r.result as ArrayBuffer);
			r.readAsArrayBuffer(f);
		});
	}
	export function randomString(minlength: number, maxlength = minlength) {
		const length = (Math.random() * (maxlength + 1 - minlength) + minlength) | 0;
		return base64.encode(crypto.getRandomValues(new Uint8Array(length * 3 / 4 + 2)).buffer, true, false).substr(0, length);
	}
	export function hexToArr(hex: string) {
		const out = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			out[i / 2] = parseInt(hex.substr(i, 2), 16);
		}
		return out;
	}
	export function arrToHex(arr: Uint8Array) {
		let out = "";
		for (const byte of arr) out += (byte < 16 ? "0" + byte.toString(16) : byte.toString(16));
		return out;
	}
	export async function joinBuffers(...arrs: Uint8Array[]) {
		return new Uint8Array(await Util.readFile(new Blob(arrs)));
	}
	export function htmlEscape(s: string) {
		const div = document.createElement("div"); div.textContent = s;
		return div.innerHTML;
	}
	export function getMimeType(fname: string) {
		const ext = fname.split(".").pop();
		const map = { jpg: "image/jpeg", png: "image/png", mp3: "audio/mpeg" };
		return map[fname] || "";
	}
	export function createBlobUrl(fname: string, data: Uint8Array) {
		log(`Displaying ${data.byteLength / 1000} kByte file`);
		return URL.createObjectURL(new Blob([data]));
	}
}

module GUI {
	const container = $(".container")[0];
	interface UploadType { name: string, toHTML: (filename: string, data: Uint8Array) => string };
	const types: UploadType[] = [
		{ name: "Text", toHTML: (f, data) => `<pre class="uploaded">${new TextDecoder().decode(data) }</pre>` },
		{ name: "Raw", toHTML: (f, data) => `<a href="${Util.createBlobUrl(f, data) }" download="${f}">Download ${f}</a>` },
		{ name: "Image", toHTML: (f, data) => `<img src="${Util.createBlobUrl(f, data) }">` },
		{ name: "Audio", toHTML: (f, data) => `<audio controls><source src="${Util.createBlobUrl(f, data) }"></audio>` },
		{ name: "Video", toHTML: (f, data) => `<video controls><source src="${Util.createBlobUrl(f, data) }"></video>` }
	]

	function displayFile(info: { meta: UploadMetadata, data: Uint8Array }) {
		const type = types.filter(t => t.name == info.meta.type)[0];
		if (type) {
			container.innerHTML = `<h3>File ${Util.htmlEscape(info.meta.name) }</h3>`
			+ type.toHTML(info.meta.name, info.data);
			log("Displayed file as " + info.meta.type);
		} else log("unknown type " + info.meta.type);
	}

	export async function beginUpload() {
		try {
			const file = ($("input[type=file]")[0] as HTMLInputElement).files[0];
			if (file) {
				const data = new Uint8Array(await Util.readFile(file));
				const type = (($("input[type=radio]:checked")[0] || {}) as HTMLInputElement).value;
				if (!type) throw Error("no type selected");
				container.innerHTML = "<h3>Uploading...</h3>";
				const meta = { name: file.name, type };
				const info = await Upload.uploadEncrypted(meta, data);
				log("Uploaded. Updating URL and displaying...");
				const sha = base64.encode(Util.hexToArr(info.sha).buffer, true, false);
				history.replaceState({}, "", "#" + sha + "!" + info.key);
				displayFile({ meta, data });
				$("#removeIfUpload")[0].style.display = "";
			} else throw Error("no file selected");
		} catch (e) {
			log(e); showLog(); throw e;
		}
	}

	function initializeUploader() {
		container.innerHTML = `
			<h3>Upload a file (image/audio/video/text)</h3>
			<p><input type="file" id="fileinput"></p>
			${types.map(type =>
			`<input type="radio" name="type" id="type_${type.name}" value="${type.name}">
				 <label for="type_${type.name}">${type.name}</label>`
			).join("") }
			<button id="uploadbutton">Upload</button>
			<p>File must be < 5MB. The file will be encrypted and authenticated using 128bit AES-GCM.</p>
		`;
		$("#removeIfUpload")[0].style.display = "none";
		$("#uploadbutton")[0].addEventListener('click', beginUpload);
	}

	declare var process, require;
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
	}
	document.addEventListener('DOMContentLoaded', () => {
		if (typeof process !== "undefined") {
			initializeNode();
		} else if (location.hash) {
			const [filename, key] = location.hash.substr(1).split("!");
			log("Loading...");
			container.innerHTML = "<h3>Loading...</h3>";
			Upload.downloadEncrypted(filename, key).then(displayFile);
		} else {
			initializeUploader();
		}
	});
	window.addEventListener('hashchange', () => location.reload());
}