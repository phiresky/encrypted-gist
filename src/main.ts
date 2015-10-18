const repoName = "phire-store/testing";
const branch = 'master';
declare var fetch: typeof window.fetch;

class Github {
	constructor(public access_token: string = null, public apiUrl = `https://api.github.com/`) { }
	getRepo(repo: string) {
		return new GithubRepo(this, repo);
	}
	async fetch(path: string, data?: RequestInit, authenticate = false) {
		if (!data) data = { headers: new Headers() };
		if (!data.headers) data.headers = new Headers();
		const h: Headers = data.headers as Headers;
		if (authenticate)
			if (this.access_token) h.append("Authorization", "token " + this.access_token);
			else throw Error(`can't ${data.method} ${path} without access token`);
		console.log("fetch", this.apiUrl + path, data);
		return await fetch(this.apiUrl + path, data);
	}
	async fetchJSON(path: string, data?: RequestInit, authenticate = false) {
		return await (await this.fetch(path, data, authenticate)).json();
	}
	async fetchRaw(path: string, data?: RequestInit, authenticate = false) {
		const headers = new Headers();
		headers.append("Accept", "application/vnd.github.v3.raw");
		const r = await this.fetch(path, { headers }, authenticate);
		return await r.arrayBuffer();
	}
	async postJSON(path: string, data: any, method = "POST", authenticate = false) {
		const headers = new Headers();
		headers.append("Content-Type", "application/json;charset=UTF-8");
		return await this.fetchJSON(path, {
			method,
			headers,
			body: JSON.stringify(data)
		}, authenticate);
	}
	async createGist(description: string, files: { [filename: string]: { content: string } }, is_public = true, authenticate = false) {
		return await this.postJSON("gists", {
			description, public: is_public,
			files: files
		}, "POST", authenticate);
	}
	async getGist(id: string) {
		return await this.fetchJSON("gists/" + id);
	}
}
class GithubRepo {
	constructor(public github: Github, public repo: string) { }

	async getRefs() {
		return await this.github.fetchJSON(this.repo + "/git/refs");
	}
	async getRef(ref = "heads/master") {
		return await this.github.fetchJSON(this.repo + "/git/refs/" + ref);
	}
	async updateRef(sha: string, ref = "heads/master") {
		return await this.github.postJSON(this.repo + "/git/refs/" + ref, { sha }, "PATCH");
	}
	async getHead() {
		const branch = await this.getRef();
		return branch.object.sha as string;
	}
	async getTree(sha: string, recursive = false) {
		return await this.github.fetchJSON(this.repo + "/git/trees/" + sha + (recursive ? "?recursive=1" : ""));
	}
	async createBlob(data: ArrayBuffer) {
		const resp = await this.github.postJSON(this.repo + "/git/blobs", {
			encoding: "base64",
			content: base64.encode(data, false, true)
		});
		return resp.sha;
	}
	async getBlob(sha) {
		return await this.github.fetchRaw(this.repo + "/git/blobs/" + sha);
	}
	async createTree(base_tree: string, path: string, sha: string) {
		const resp = await this.github.postJSON(this.repo + "/git/trees", {
			base_tree,
			tree: [{ path, mode: "100644", type: "blob", sha }]
		});
		return resp;
	}
	async createCommit(parent: string, tree: string, message: string) {
		return await this.github.postJSON(this.repo + "/git/commits", { message, parents: [parent], tree });
	}
	async pushFileToMaster(path: string, content: Uint8Array, commitMessage: string) {
		const head = await this.getHead();
		const newtree = await this.createTree(head, path, await this.createBlob(content.buffer));
		const newsha = newtree.sha;
		const files = newtree.tree;
		const filesha = files.filter(file => file.path == path)[0].sha;
		const commit = await this.createCommit(head, newsha, commitMessage);
		await this.updateRef(commit.sha);
		return filesha;
	}
}
let github = new Github(localStorage.getItem("accessToken"));
let repo = github.getRepo(repoName);

module SimpleCrypto {
	export async function encrypt(data: Uint8Array) {
		const key: CryptoKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 },
			true, ["encrypt"]);
		const iv = new Uint8Array(16);
		
		// crypto.getRandomValues(iv);
		// IV randomness not necessary because every key is only used once
		const key_arr: ArrayBuffer = await crypto.subtle.exportKey("raw", key);
		return {
			data: new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data) as ArrayBuffer),
			key: base64.encode(key_arr, true, false),
			key_arr,
			iv: iv
		};
	}
	export async function decrypt(data: Uint8Array, key_str: string, iv: Uint8Array) {
		const key = await crypto.subtle.importKey("raw", new Uint8Array(base64.decode(key_str, true)), "AES-CBC", false, ["decrypt"]);
		return await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data) as ArrayBuffer;
	}
}
module Upload {
	let uploadMethod: (name: string, data: Uint8Array) => Promise<string> = 
		//(f, d) => repo.pushFileToMaster(f, d, "add");
		async function(f, d) {
			return (await github.createGist(Util.randomString(0, 10), { [f]: { content: base64.encode(d.buffer, true, false) } })).id;
		}
	let downloadMethod: (sha: string) => Promise<ArrayBuffer> = 
		//(sha) => repo.getBlob(sha);
		async function(sha) {
			const gist = await github.getGist(sha);
			const file = gist.files[Object.keys(gist.files)[0]];
			if(file.truncated) {
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
	let WebP;
	export async function supportsWebP() {
		return new Promise<boolean>((resolve, reject) => {
			if (WebP) resolve(WebP.height === 2);
			else {
				WebP = new Image();
				WebP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
				WebP.onload = WebP.onerror = () => resolve(WebP.height === 2);
			}
		});
	}
	declare var WebPDecoder: any;
	export function decodeWebP(buf: ArrayBuffer) {
		const decoder = new WebPDecoder();
		const width = {value:0}, height ={value:0};
		const data = new Uint8Array(buf);
		const bitmap:number[] = decoder.WebPDecodeRGBA(data, data.length, width, height);
		return {bitmap, width:width.value, height:height.value};
	}
}

module GUI {
	const magics = { 0xFFD8: 'image/jpeg', 0x5249: 'image/webp', 0x8950: 'image/png' }
	async function displayImage(data: ArrayBuffer) {
		
		const magic = new DataView(data, 0, 2).getInt16(0, false);
		const mime = magics[magic];
		console.log(`displaying ${data.byteLength / 1000}kByte mime=${mime || "unknown: 0x" + magic.toString(16) } image`);
		let file: Blob;
		if(mime === "image/webp" && !(await Util.supportsWebP())) {
			console.log("decoding WebP", data);
			(window as any)._d = data;
			const {bitmap, width, height} = Util.decodeWebP(data);
			bitmap.pop();
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			const img = ctx.createImageData(width, height);
			const imgdata = img.data as any as Uint8ClampedArray;
			console.log(bitmap.length, imgdata.length);
			imgdata.set(bitmap as any, 0);
			ctx.putImageData(img, 0, 0);
			document.body.innerHTML = "";
			document.body.appendChild(canvas);
		} else {
			const img = document.createElement("img");
			file = new Blob([data], { type: mime || "image/jpeg" });
			const url = URL.createObjectURL(file);
			img.src = url;
			document.body.innerHTML = "";
			document.body.appendChild(img);
		}
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
	} else if (github.access_token) {
		document.addEventListener('DOMContentLoaded', () => {
			document.getElementById("fileinput").addEventListener('change', e => { Upload.uploadFile(e).then(displayImage) }, false);
		});
	} else {
		document.writeln("No image given and upload key missing<!--");
	}
}