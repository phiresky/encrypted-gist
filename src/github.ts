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
		log("fetching " + (data.method||"") + " " +this.apiUrl + path);
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
		return await this.fetchJSON(path, { method, headers, body: JSON.stringify(data) }, authenticate);
	}
	async createGist(description: string, files: { [filename: string]: { content: string } }, is_public = true, authenticate = false) {
		return await this.postJSON("gists", { description, public: is_public, files: files }, "POST", authenticate);
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
			encoding: "base64", content: base64.encode(data, false, true)
		});
		return resp.sha;
	}
	async getBlob(sha) {
		return await this.github.fetchRaw(this.repo + "/git/blobs/" + sha);
	}
	async createTree(base_tree: string, path: string, sha: string) {
		const resp = await this.github.postJSON(this.repo + "/git/trees", {
			base_tree, tree: [{ path, mode: "100644", type: "blob", sha }]
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