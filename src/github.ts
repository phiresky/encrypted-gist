declare var fetch: typeof window.fetch;
class Github {
	constructor(public apiUrl = `https://api.github.com/`) { }
	async fetch(path: string, data?: RequestInit) {
		log("fetching " + (data && data.method||"") + " " +this.apiUrl + path);
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
		return await this.fetchJSON(path, { method, headers, body: JSON.stringify(data) });
	}
	async createGist(description: string, files: { [filename: string]: { content: string } }, is_public = true, authenticate = false) {
		return await this.postJSON("gists", { description, public: is_public, files: files }, "POST");
	}
	async getGist(id: string) {
		return await this.fetchJSON("gists/" + id);
	}
}