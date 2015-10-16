const repoName = "phire-store/testing";
const branch = 'master';
declare var fetch: typeof window.fetch;

class GithubRepo {
	apiUrl = "";
	constructor(repo: string, public access_token: string = null) {
		this.apiUrl = `https://api.github.com/repos/${repo}`;
	}
	async fetch(path: string, data?: RequestInit) {
		if (!data) data = { headers: new Headers() };
		const h: Headers = data.headers as Headers;
		if(this.access_token) h.append("Authorization", "token " + this.access_token);
		console.log(data);
		return await fetch(this.apiUrl + path, data);
	}
	async fetchJSON(path: string, data?: RequestInit) {
		return await (await this.fetch(path, data)).json();
	}
	async fetchRaw(path: string, data?: RequestInit) {
		const headers = new Headers();
		headers.append("Accept", "application/vnd.github.v3.raw");
		const r = await this.fetch(path, { headers });
		return await r.arrayBuffer();
	}
	async postJSON(path: string, data: any, method = "POST") {
		const headers = new Headers();
		headers.append("Content-Type", "application/json;charset=UTF-8");
		return await this.fetchJSON(path, {
			method,
			headers,
			body: JSON.stringify(data)
		});
	}
	async getRefs() {
		return await this.fetchJSON("/git/refs");
	}
	async getRef(ref = "heads/master") {
		return await this.fetchJSON("/git/refs/" + ref);
	}
	async updateRef(sha: string, ref = "heads/master") {
		return await this.postJSON("/git/refs/" + ref, { sha }, "PATCH");
	}
	async getHead() {
		const branch = await this.getRef();
		return branch.object.sha as string;
	}
	async getTree(sha: string, recursive = false) {
		return await this.fetchJSON("/git/trees/" + sha + (recursive ? "?recursive=1" : ""));
	}
	async createBlob(data: ArrayBuffer) {
		const resp = await this.postJSON("/git/blobs", {
			encoding: "base64",
			content: base64.encode(data)
		});
		return resp.sha;
	}
	async getBlob(sha) {
		return await this.fetchRaw("/git/blobs/" + sha);
	}
	async createTree(base_tree: string, path: string, sha: string) {
		const resp = await this.postJSON("/git/trees", {
			base_tree,
			tree: [
				{ path, mode: "100644", type: "blob", sha }
			]
		});
		return resp;
	}
	async createCommit(parent: string, tree: string, message: string) {
		const resp = await this.postJSON("/git/commits", {
			message,
			parents: [parent],
			tree,
		});
		return resp;
	}
	async pushFileToMaster(path: string, content: Uint8Array) {
		const head = await this.getHead();
		const newtree = await this.createTree(head, path, await this.createBlob(content.buffer));
		const newsha = newtree.sha;
		const files = newtree.tree;
		const filesha = files.filter(file => file.path == path)[0].sha;
		const commit = await this.createCommit(head, newsha, "testiiing");
		await this.updateRef(commit.sha);
		return filesha;
	}
}
let repo = new GithubRepo(repoName, localStorage.getItem("accessToken"));

async function getAllowUploadURL() {
	const info = await encrypt(hexToArr(repo.access_token));
	location.hash = "#allowupload!" + base64.encode(info.data.buffer, true, false)+"!"+info.key; 
}
async function encrypt(data: Uint8Array) {
	//const iv:number[] = sjcl.random.randomWords(4, 0);
	//sjcl.arrayBuffer.ccm.encrypt(new sjcl.cipher.aes(key), data, iv);
	//crypto.subtle.encrypt({name: "AES-CBC", iv: iv}, key, new Uint8Array(data));
	const key: CryptoKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 },
		true, ["encrypt"]);
	const iv = new Uint8Array(16);
	
	// crypto.getRandomValues(iv);
	// not necessary because every key is only used once
	const key_arr:ArrayBuffer = await crypto.subtle.exportKey("raw", key);
	console.log(key_arr.byteLength);
	return {
		data: new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data) as ArrayBuffer),
		key: base64.encode(key_arr, true, false),
		key_arr,
		iv: iv
	};
}
async function decrypt(data: Uint8Array, key_str: string, iv: Uint8Array) {
	const key = await crypto.subtle.importKey("raw", new Uint8Array(base64.decode(key_str, true)), "AES-CBC", false, ["decrypt"]);
	return await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data) as ArrayBuffer;
}

async function uploadEncrypted(inputData: Uint8Array) {
	const filename = base64.encode(crypto.getRandomValues(new Uint8Array(16)).buffer, true, false);
	const {key, iv, data} = await encrypt(inputData);
	return { key, iv, sha: await repo.pushFileToMaster(filename, data) };
}

function displayImage(data: ArrayBuffer) {
	const img = document.createElement("img");
	const magic = new Uint16Array(data, 0, 1)[0];
	const file = new Blob([data], { type: (magic == 0xFFD8 ? 'image/jpeg' : 'image/png') });
	const url = URL.createObjectURL(file);
	img.src = url;
	document.body.innerHTML = "";
	document.body.appendChild(img);
}
async function download(sha: string, key: string) {
	sha = arrToHex(new Uint8Array(base64.decode(sha)));
	displayImage(await decrypt(new Uint8Array(await repo.getBlob(sha)), key, new Uint8Array(16)));
}

if (location.hash) {
	if(location.hash.startsWith("#allowupload!")) {
		const [, crypt, key] = location.hash.substr(1).split("!");
		decrypt(new Uint8Array(base64.decode(crypt, true)), key, new Uint8Array(16)).then(token => {
			localStorage.setItem("accessToken", arrToHex(new Uint8Array(token)));
			location.hash = "";
			location.reload();
		});
	} else {
		const [filename, key] = location.hash.substr(1).split("!");
		document.writeln("Loading...<!--");
		download(filename, key);
	}
} else if (repo.access_token) {
	document.addEventListener('DOMContentLoaded', () => {
		document.getElementById("fileinput").addEventListener('change', uploadFile, false);
	});
} else {
	document.writeln("No image given and upload key missing<!--");
}
function hexToArr(hex: string) {
	const out = new Uint8Array(hex.length/2);
	for(let i = 0; i < hex.length; i+=2) {
		out[i/2] = parseInt(hex.substr(i,2), 16);
	}
	return out;
}
function arrToHex(arr: Uint8Array) {
	let out = "";
	for(const byte of arr) out += (byte<16?"0"+byte.toString(16):byte.toString(16));
	return out;
}
async function uploadFile(evt) {
	try {
		document.body.textContent = "Uploading...";
		const f = evt.target.files[0];
		if (f) {
			const data = new Uint8Array(await readFile(f));
			const info = await uploadEncrypted(data);
			const sha = base64.encode(hexToArr(info.sha).buffer, true, false);
			history.replaceState({}, "", "#" + sha + "!" + info.key);
			displayImage(data.buffer);
		}
	} catch (e) {
		document.body.textContent = JSON.stringify(e);
		throw e;
	}
}
async function readFile(f: File) {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		const r = new FileReader();
		r.onload = e => resolve(r.result as ArrayBuffer);
		r.readAsArrayBuffer(f);
	});
}
