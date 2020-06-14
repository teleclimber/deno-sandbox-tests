const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const clone = require('clone');

const tempDirectory = require('temp-dir');
const { exec } = require('child_process');
const rimraf = require('rimraf');

const keys = ["desc", "cwd", "script", "flags", "check_fails", "expect_error"];

class RunTest {

	constructor( opts={}, test, test_i) {
		this.opts = opts;
		this.raw_test = test;
		this.test_i = test_i;
	}

	async start() {
		let log_datas;

		await this.prepare();
		try {
			await this.run(true);
		}
		catch(e) {
			if( this.test.check_fails ) {
				log_datas = [null, 'ok-denied', this.test.desc];
			}
			else {
				log_datas = [null, 'bad-test', this.test.desc, e];
			}
		}
		await this.cleanup();
		
		if( log_datas ) {
			this.opts.results.add(this.test_i, log_datas);
			return;	// bail
		}

		await this.prepare();
		try {
			log_datas = await this.run();
		}
		catch(e) {
			log_datas = [null, 'bad-test', this.test.desc, e];
		}
		this.opts.results.add(this.test_i, log_datas);
	
		await this.cleanup();
	}

	async prepare() {
		this.dir = await fsPromises.mkdtemp(path.join(tempDirectory, 'foo-'));
		this.test = clone(this.raw_test);
	}

	async run(is_check) {
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

		let log_data = [];

		if( is_check ) {
			try {
				await this.check();
			}
			catch(e) {
				throw new Error(e);
			}
		}
		else {

			let err = null;
			try {
				err = await this.exec();
			}
			catch(e) {
				throw e;
			}

			if( err ) {
				let err_lines = err.split('\n');
				const err_line = err_lines.find( l => l.includes('error') );
				if( err_line ) err = err_line;
				//if( err_lines[0].startsWith('Command failed:') ) err = err_lines[1];
			}

			const expect_error = t.check_fails || t.expect_error;
			
			if( err && !expect_error ) {
				log_data = [this.test_i, 'denied', t.desc, err];
			}
			else if( !err && expect_error ) {
				log_data = [this.test_i, 'danger', t.desc];
			}
			else if( err && expect_error ) {
				log_data = [this.test_i, "ok-denied", t.desc, err];
			}
			else if( !err && !expect_error ) {
				log_data = [this.test_i, "ok-allowed", t.desc];
			}
		}

		// const hits = await this.opts.remote1.checkHits(this.test_i);
		// for( let k in hits ) {
		// 	if( this.test[k].no_hit ) {
		// 		log_data[1] = 'danger';
		// 		log_data.push("remote was hit when it shouldn't have: "+k);
		// 	}
		// }

		return log_data;
	}

	transformContent(str, abs_dir, remote_url) {	// TEST duh
		str = str.replace(/\$absolute/g, abs_dir);
		str = str.replace(/\$remote1/g, remote_url);
		return str;
	}

	check() {
		return new Promise( (resolve, reject) => {
			const t = this.test;
			exec('deno run --allow-all -q '+t.script, {
				cwd: path.join(this.dir, t.cwd)
			}, (err, stdout, stderr) => {
				if(err) {
					reject(err);
				}
				resolve();
			});
		});
	}

	exec() {
		return new Promise( (resolve, reject) => {
			const t = this.test;
			exec('deno run -q '+t.flags+' '+t.script, {
				cwd: path.join(this.dir, t.cwd)
			}, (err, stdout, stderr) => {
				if( err && this.errIsBadTest(err.message) ) reject(err.message);
				else if( err ) resolve(err.message);
				else resolve();
			});
		});
	}

	errIsBadTest(err_str) {
		if( !err_str ) return false;
		// This catches tests that error because of an incorrect argument:
		if( err_str.match(/Found argument .* which wasn't expected/)) return true;
		//if( err_str.match(/Cannot resolve module/)) return true;
		return false;
	}

	async cleanup() {
		return new Promise( (resolve, reject) => {
			rimraf(this.dir,{}, (err) => {
				if(err) {
					reject(err);
					console.error(err);
				}
				else {
					resolve();
				}
			});
		});
	}
}

module.exports = RunTest;