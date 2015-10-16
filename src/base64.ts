module base64 {
	export const _chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	export const encode = function(arraybuffer:ArrayBuffer, url = false, equals = true) {
		let chars = _chars;
		if(url) chars = chars.substr(0,62) + '-_';
		var bytes = new Uint8Array(arraybuffer),
			i, len = bytes.length, base64 = "";

		for (i = 0; i < len; i += 3) {
			base64 += chars[bytes[i] >> 2];
			base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
			base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
			base64 += chars[bytes[i + 2] & 63];
		}

		if ((len % 3) === 2) {
			base64 = base64.substring(0, base64.length - 1) + (equals?"=":"");
		} else if (len % 3 === 1) {
			base64 = base64.substring(0, base64.length - 2) + (equals?"==":"");
		}

		return base64;
	};

	export const decode = function(base64:string, url = false) {
		let chars = _chars;
		if(url) chars = chars.substr(0,62) + '-_';
		var bufferLength = base64.length * 0.75,
			len = base64.length, i, p = 0,
			encoded1, encoded2, encoded3, encoded4;

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

			bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
			bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
		}

		return arraybuffer;
	}
}