declare const Github:any;
const token = "f32dfbe42f76a07e76b1ddf8540a6062503275cd";
const repoName = "phiresky/tmp_test";
const branch = 'master';
const key_bits = 128;

const github = new Github({
	apiUrl: "https://api.github.com",
	token,
	auth: "oauth"
});
const repo = github.getRepo(...repoName.split("/"));


function randomString(bits: number) {
	if(bits%32 !== 0) throw "must be divisible by 32";
	return sjcl.codec.base64.fromBits(sjcl.random.randomWords((bits/4/8)|0), true, true);
}

function upload(data:string, callback) {
	const filename = randomString(64);
	const pwd = randomString(key_bits);
	let content = sjcl.encrypt(pwd, data) as any;
	if(content.length >= 1e6) throw "image size must be < 1MB";
	repo.write(branch, filename, content, 'add file', (err) => callback(err, {filename, pwd, content}));
}

function displayImage(data: string) {
	const img = document.createElement("img");
	const file = new Blob([str2ab(data)], {type: 'image/png'});
	const url = URL.createObjectURL(file);
	img.src = url;
	document.body.innerHTML = "";
	document.body.appendChild(img);
}
function str2ab(str:string) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (let i=0; i<str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function download(filename: string, key: string) {
	repo.read(branch, filename, (err, data) => {
		try {
			if(err) throw err;
			displayImage(sjcl.decrypt(key, data));
		} catch(err) {
			document.body.textContent = JSON.stringify(err);
			console.error(err);
		}
	})
}

if(location.hash) {
	const [filename, key] = location.hash.substr(1).split("!");
	document.writeln("Loading...<!--");
	download(filename, key);
} else {
	document.addEventListener('DOMContentLoaded', () => {
		document.getElementById("fileinput").addEventListener('change', uploadFile, false);
	});
}

function uploadFile(evt) {
	try {
		document.body.textContent = "Uploading...";
		const f = evt.target.files[0];
		if(f) readFile(f, data => upload(data, (err, info) => {
			history.replaceState({}, "", "#"+info.filename+"!"+info.pwd);
			displayImage(data);
		}));
	} catch(e){}
}
function readFile(f:File, callback) {
	const r = new FileReader();
	r.onload = e => callback(r.result);
	r.readAsBinaryString(f);
}
