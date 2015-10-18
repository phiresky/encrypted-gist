const repoName = null; // "phire-store/testing";

let github = new Github(localStorage.getItem("accessToken"));
let repo = github.getRepo(repoName);

module SimpleCrypto {
	export async function encrypt(data: Uint8Array) {
		const key: CryptoKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ["encrypt"]);
		const iv = new Uint8Array(16);
		// IV randomness not necessary because every key is only used once
		// crypto.getRandomValues(iv);
		const key_arr: ArrayBuffer = await crypto.subtle.exportKey("raw", key);
		return {
			data: new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data) as ArrayBuffer),
			key: base64.encode(key_arr, true, false), iv
		};
	}
	export async function decrypt(data: Uint8Array, key_str: string, iv: Uint8Array) {
		const key = await crypto.subtle.importKey("raw", new Uint8Array(base64.decode(key_str, true)), "AES-CBC", false, ["decrypt"]);
		return await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data) as ArrayBuffer;
	}
}
module Upload {
	type UploadMethod = (name: string, data: Uint8Array) => Promise<string>;
	const gistUploadMethod: UploadMethod = async function(f, d) {
		if (d.byteLength >= 1000 * 3 / 4 * 1000) console.warn("Image should be < 700 kB to avoid calling api twice");
		if (d.byteLength >= 2e6) throw "Image must be < 2 MB";
		return (await github.createGist(Util.randomString(0, 10), { [f]: { content: base64.encode(d.buffer, true, false) } })).id;
	}
	const repoUploadMethod = (f, d) => repo.pushFileToMaster(f, d, "add");
	let uploadMethod = repoName ? repoUploadMethod : gistUploadMethod;

	let downloadMethod: (sha: string) => Promise<ArrayBuffer>;
	if (repoName) downloadMethod = (sha) => repo.getBlob(sha);
	else downloadMethod = async function(sha) {
		const gist = await github.getGist(sha);
		const file = gist.files[Object.keys(gist.files)[0]];
		if (file.truncated) {
			return base64.decode(await (await fetch(file.raw_url)).text(), true);
		} else
			return base64.decode(file.content, true);
	}
	export async function getAllowUploadURL() {
		const info = await SimpleCrypto.encrypt(Util.hexToArr(github.access_token));
		location.hash = "#allowupload!" + base64.encode(info.data.buffer, true, false) + "!" + info.key;
	}
	export async function uploadEncrypted(inputData: Uint8Array) {
		const filename = Util.randomString(1, 16);
		const {key, iv, data} = await SimpleCrypto.encrypt(inputData);
		return { key, iv, sha: await uploadMethod(filename, data) };
	}
	export async function downloadFile(sha: string, key: string) {
		sha = Util.arrToHex(new Uint8Array(base64.decode(sha, true)));
		return await SimpleCrypto.decrypt(new Uint8Array(await downloadMethod(sha)), key, new Uint8Array(16));
	}
	export async function uploadFile(evt) {
		try {
			document.body.textContent = "Uploading...";
			const f = evt.target.files[0];
			if (f) {
				const data = new Uint8Array(await readFile(f));
				const info = await uploadEncrypted(data);
				const sha = base64.encode(Util.hexToArr(info.sha).buffer, true, false);
				history.replaceState({}, "", "#" + sha + "!" + info.key);
				return data.buffer;
			}
			else throw "no image selected";
		} catch (e) {
			document.body.textContent = JSON.stringify(e);
			throw e;
		}
	}
	export async function readFile(f: File) {
		return new Promise<ArrayBuffer>((resolve, reject) => {
			const r = new FileReader();
			r.onload = e => resolve(r.result as ArrayBuffer);
			r.readAsArrayBuffer(f);
		});
	}
}

module Util {
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
}

module GUI {
	const magics = { 0xFFD8: 'image/jpeg', 0x5249: 'image/webp', 0x8950: 'image/png' }
	async function displayImage(data: ArrayBuffer) {
		const magic = new DataView(data, 0, 2).getUint16(0, false);
		const mime = magics[magic];
		console.log(`displaying ${data.byteLength / 1000}kByte mime=${mime || "unknown: 0x" + magic.toString(16) } image`);
		let file = new Blob([data], { type: mime || "image/jpeg" });
		const img = document.createElement("img");
		img.src = URL.createObjectURL(file);
		document.body.innerHTML = "";
		document.body.appendChild(img);
	}

	if (location.hash) {
		if (location.hash.startsWith("#allowupload!")) {
			const [, crypt, key] = location.hash.substr(1).split("!");
			SimpleCrypto.decrypt(new Uint8Array(base64.decode(crypt, true)), key, new Uint8Array(16)).then(token => {
				localStorage.setItem("accessToken", Util.arrToHex(new Uint8Array(token)));
				location.hash = "";
				location.reload();
			});
		} else {
			const [filename, key] = location.hash.substr(1).split("!");
			document.writeln("Loading...<!--");
			Upload.downloadFile(filename, key).then(displayImage);
		}
	} else if (github.access_token || !repoName) {
		document.addEventListener('DOMContentLoaded', () => {
			document.getElementById("fileinput").addEventListener('change', e => { Upload.uploadFile(e).then(displayImage) }, false);
		});
	} else {
		document.writeln("No image given and upload key missing<!--");
	}
}