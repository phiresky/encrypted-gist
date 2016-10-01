let github = new Github();

function log(info: any) {
	console.log(info);
	const e = document.getElementById("log");
	if (e) e.appendChild(<span>{info}<br/></span>);
}
function showLog() {
	document.getElementById("showlogbutton")!.style.display = 'none';
	document.getElementById("showlog")!.style.display = '';
}
declare var TextDecoder: any, TextEncoder: any, fetch: typeof window.fetch;

module SimpleCrypto {
	export let encryptionAlgorithm = "AES-GCM";
	export async function encrypt(data: Uint8Array) {
		log("Generating key and IV...");
		const key: CryptoKey = await crypto.subtle.generateKey({ name: encryptionAlgorithm, length: 128 }, true, ["encrypt"]);
		const iv = new Uint8Array(16); crypto.getRandomValues(iv);
		log("Encrypting...");
		const encrypted = await crypto.subtle.encrypt({ name: encryptionAlgorithm, iv }, key, data);
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
		return await crypto.subtle.decrypt({ name: encryptionAlgorithm, iv }, imported_key, encrypted_data);
	}
}
interface UploadMetadata { name: string, type: string }
module Upload {
	async function uploadToGist(d: Uint8Array) {
		const f = Util.randomString(1, 16);
		if (d.byteLength >= 1000 * 3 / 4 * 1000) log("Data should be < 700 kB to avoid calling api twice");
		if (d.byteLength >= 5e6) throw "Data must be < 5 MB"; // more should be possible
		return (await github.createGist(Util.randomString(0, 10), {
			[f]: { content: base64.encode(d.buffer, true, false) }
		})).id;
	}
	async function downloadFromGist(sha: string) {
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
			r.onload = _ => resolve(r.result as ArrayBuffer);
			r.readAsArrayBuffer(f);
		});
	}
	export function randomString(minlength: number, maxlength = minlength) {
		const length = (Math.random() * (maxlength + 1 - minlength) + minlength) | 0;
		return base64.encode(crypto.getRandomValues(new Uint8Array((length * 3 / 4 + 2) | 0)).buffer, true, false).substr(0, length);
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
		for (let byte of arr) out += (byte < 16 ? "0" + byte.toString(16) : byte.toString(16));
		return out;
	}
	export async function joinBuffers(...arrs: Uint8Array[]) {
		return new Uint8Array(await Util.readFile(new Blob(arrs)));
	}
	export function createBlobUrl(data: Uint8Array) {
		log(`Displaying ${data.byteLength / 1000} kByte file`);
		return URL.createObjectURL(new Blob([data]));
	}
}
// tiny native DOM creator wrapped in a simple React API for use with Typescript JSX
module React {
	export function render(element: HTMLElement, target: Element) {
		target.innerHTML = "";
		target.appendChild(element);
	}
	export function createElement(tag: string, attributes: { [name: string]: string }, ...children: any[]) {
		const ele = document.createElement(tag);
		for (let name in attributes) ele.setAttribute(name, attributes[name]);
		for (let child of children) React.elementAddChild(ele, child);
		return ele;
	}
	export function elementAddChild(ele: Element, child: any) {
		if (child instanceof Node) ele.appendChild(child);
		else if (child instanceof Array) for(let subchild of child) React.elementAddChild(ele, subchild);
		else ele.appendChild(document.createTextNode(child));
	}
}
declare namespace JSX {
	type IntrinsicElements = {[name: string]: { [name: string]: string | number | boolean }};
	type Element = HTMLElement;
}

namespace GUI {
	const container = document.getElementsByClassName("container")[0];
	interface UploadType { name: string, toHTML: (filename: string, data: Uint8Array) => HTMLElement };
	export const types: UploadType[] = [
		{ name: "Text", toHTML: (_, data) => <pre class="uploaded">{new TextDecoder().decode(data)}</pre> },
		{ name: "Raw", toHTML: (f, data) => <a href={Util.createBlobUrl(data)} download={f}>Download {f}</a> },
		{ name: "Image", toHTML: (_, data) => <img src={Util.createBlobUrl(data)} /> },
		{ name: "Audio", toHTML: (_, data) => <audio controls><source src={Util.createBlobUrl(data)} /></audio> },
		{ name: "Video", toHTML: (_, data) => <video controls><source src={Util.createBlobUrl(data)} /></video> }
	]

	function displayFile(info: { meta: UploadMetadata, data: Uint8Array }) {
		const type = types.find(t => t.name == info.meta.type);
		if (type) {
			React.render(<div><h3>File {info.meta.name}</h3>{type.toHTML(info.meta.name, info.data)}</div>, container);
			log("Displayed file as " + info.meta.type);
		} else log("unknown type " + info.meta.type);
	}

	export async function beginUpload() {
		try {
			const file = (document.querySelector("input[type=file]") as HTMLInputElement).files![0];
			if (file) {
				const data = new Uint8Array(await Util.readFile(file));
				const type = document.querySelector("input[type=radio]:checked") as HTMLInputElement;
				if (!type) throw Error("no type selected");
				React.render(<h3>Uploading...</h3>, container);
				const meta = { name: file.name, type: type.value };
				const info = await Upload.uploadEncrypted(meta, data);
				log("Uploaded. Updating URL and displaying...");
				const sha = base64.encode(Util.hexToArr(info.sha).buffer, true, false);
				history.replaceState({}, "", "#" + sha + "!" + info.key);
				displayFile({ meta, data });
				document.getElementById("removeIfUpload")!.style.display = "";
			} else throw Error("no file selected");
		} catch (e) {
			log(e); showLog(); throw e;
		}
	}

	function initializeUploader() {
		React.render(
			<div>
				<h3>Upload a file (image/audio/video/text)</h3>
				<p><input type="file" id="fileinput" /></p>
				<div>{types.map(type =>
					<span><input type="radio" name="type" id={"type_"+type.name} value={type.name} />
					<label for={"type_"+type.name}>{type.name}</label></span>
				)}</div>
				<button id="uploadbutton">Upload</button>
				<p>The file will be encrypted and authenticated completely client-side using 128bit AES-GCM. Limit 5 MB.</p>
			</div>,
			container
		);
		document.getElementById("removeIfUpload")!.style.display = "none";
		document.getElementById("uploadbutton")!.addEventListener('click', beginUpload);
	}

	document.addEventListener('DOMContentLoaded', () => {
		if (location.hash) {
			const [filename, key] = location.hash.substr(1).split("!");
			log("Loading...");
			React.render(<h3>Loading...</h3>, container);
			Upload.downloadEncrypted(filename, key).then(displayFile);
		} else {
			initializeUploader();
		}
	});
	window.addEventListener('hashchange', () => location.reload());
}