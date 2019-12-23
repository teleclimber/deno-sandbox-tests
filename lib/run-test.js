const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

const tempDirectory = require('temp-dir');
const { exec } = require('child_process');
const rimraf = require('rimraf');

const keys = ["desc", "cwd", "script", "flags", "expect_error"];

class RunTest {

	constructor( opts={}, test, test_i) {
		this.opts = opts;
		this.test = test;
		this.test_i = test_i;
	}

	async start() {
		try {
			await this.prepare();
			let log_datas;
			try {
				log_datas = await this.run();
			}
			catch(e) {
				log_datas = [null, 'bad-test'];
			}
			this.opts.results.add(this.test_i, log_datas);
		}
		catch(e) {
			console.error(e);
			this.opts.results.add(this.test_i, [this.test_i+' Bad test']);
		}
		this.cleanup();
	}

	async prepare() {
		this.dir = await fsPromises.mkdtemp(path.join(tempDirectory, 'foo-'));
	}

	async run() {
		const t = this.test;
		const dir = this.dir;

		const files = {};
		const remotes = {};
		for( let k in t ) {
			if( !keys.includes(k) ) {
				let content_str = '';
				
				if( typeof t[k] !== "object" || !t[k].content ) t[k] = { content: t[k] };
				
				const content = t[k].content;
				
				if( typeof content === 'string' ) content_str = content;
				else throw new Error("what is this? "+k);

				t[k].content = content_str;

				if( k.startsWith('$remote1') ) {	// for now assume a single remote
					remotes[k] = t[k];
				}
				else {
					files[k] = t[k];
				}
			}
		}
		const random_str = Math.random().toString(36).substring(2) + Date.now().toString(36);
		const remote1_replace = `${this.opts.remote1.getUrl()}/${this.test_i}/${random_str}`;
		[files, remotes].forEach( resps => {
			for( let p in resps ) {
				resps[p].content = this.transformContent(resps[p].content, dir, remote1_replace);
			}
		});

		t.script = this.transformContent(t.script, dir, remote1_replace);

		for( let p in files ) {
			try {
				await fsPromises.mkdir(path.join(dir, path.dirname(p)), {recursive: true});
			}
			catch(e) {
				if (e.code != 'EEXIST') {
					throw new Error(e);
				}
			}
			try {
				await fsPromises.writeFile(path.join(dir,p), files[p].content);
			}
			catch(e) {
				console.error("Error creating file "+p, e);
				throw new Error(e);
			}
		}

		this.opts.remote1.addResponses(this.test_i, remotes);

		try {
			await this.check();
		}
		catch(e) {
			throw new Error(e);
		}

		let err = null;
		try {
			err = await this.exec();
		}
		catch(e) {
			console.error("bad test:", t.desc, e);//??
			throw new Error(e);
		}

		if( err ) {
			let err_lines = err.split('\n');
			if( err_lines[0].startsWith('Command failed:') ) err = err_lines[1];
		}

		let log_data = [];
		if( err && !t.expect_error ) {
			console.log('err && !expect error');
			log_data = [this.test_i, 'denied', t.desc, err];
		}
		else if( !err && t.expect_error ) {
			log_data = [this.test_i, 'danger', t.desc];
		}
		else if( err && t.expect_error ) {
			log_data = [this.test_i, "ok-denied", t.desc, err];
		}
		else if( !err && !t.expect_error ) {
			log_data = [this.test_i, "ok-allowed", t.desc];
		}

		for( let k in remotes ) {
			const r = remotes[k];
			if( r.no_hit && r.got_hit ) {
				log_data[1] = 'danger';
				log_data.push("remote was hit when it shouldn't have: "+k);
			}
		}

		return log_data;
	}

	transformContent(str, abs_dir, remote_url) {	// TEST duh
		str = str.replace(/\$absolute/g, abs_dir);
		str = str.replace(/\$remote1/g, remote_url);
		return str;
	}

	check() {
		return new Promise( (resolve, reject) => {
			exec('deno --allow-all '+this.test.script, {
				cwd: path.join(this.dir, this.test.cwd)
			}, (err, stdout, stderr) => {
				if(err) {
					console.error("bad test", this.test, err);
					reject(err);
				}
				resolve();
			});
		});
	}

	exec() {
		return new Promise( (resolve, reject) => {
			const t = this.test;
			exec('deno '+t.flags+' '+t.script, {
				cwd: path.join(this.dir, t.cwd)
			}, (err, stdout, stderr) => {
				if( err && this.errIsBadTest(err.message) ) reject(err.message);
				if( err ) resolve(err.message);
				else resolve();
			});
		});
	}

	errIsBadTest(err_str) {
		if( !err_str ) return false;
		// This catches tests that error because of an incorrect argument:
		if( err_str.match(/Found argument .* which wasn't expected/)) return true;
		return false;
	}

	cleanup() {
		rimraf(this.dir,{}, (err) => {
			if(err) console.error(err);
		});
	}
}

module.exports = RunTest;