const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const http = require('http');
const tempDirectory = require('temp-dir');
const { exec } = require('child_process');
const rimraf = require('rimraf');

const keys = ["test_num", "desc", "cwd", "script", "flags", "expect_error"];

const tests = require('./tests/');

let remote1;

async function run() {
	remote1 = new RemoteServer;
	await remote1.start();

	tests.forEach(async(t,i) => {
		t.test_num = i;
		let run_data;
		try {
			run_data = await prepareTest(t);
			const log_datas = await runTest(t, run_data);
			//console.log(...log_datas);
			doLog(i, log_datas);
		}
		catch(e) {
			console.error(e);
			doLog(i, [testNumStr(t)+' Bad test']);
		}
		cleanupTest(run_data);
	});

	console.log("done looping");
	// ^^ this gets logged before any test concludes.
	// need to find out when all tests are done and terminate server then.
}

let log_index = 0;
let logs = [];
function doLog(index, log_datas) {
	if( !log_datas ) log_datas = ['...no data?...'];
	if( !Array.isArray(log_datas) ) log_datas = [log_datas]
	
	logs[index] = log_datas;
	while( logs[log_index] ) {
		console.log(...logs[log_index]);
		++log_index;
	}
}

async function prepareTest(t) {
	const dir = await fsPromises.mkdtemp(path.join(tempDirectory, 'foo-'));
	return { dir };
}

async function runTest(t, run_data) {
	const dir = run_data.dir;

	const files = {};
	const remotes = {};
	for( let k in t ) {
		if( !keys.includes(k) ) {
			let content_str = '';
			
			if( typeof t[k] !== "object" || !t[k].content ) t[k] = { content: t[k] };
			
			content = t[k].content;
			
			if( typeof content === 'string' ) content_str = content;
			else if( typeof content === 'function' ) content_str = content(run_data);	// TODO: get rid of "function" now that we have text replacement?
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

	const remote1_replace = remote1.getUrl()+'/'+t.test_num;
	[files, remotes].forEach( resps => {
		for( let p in resps ) {
			resps[p].content = transformContent(resps[p].content, dir, remote1_replace);
		}
	});

	t.script = transformContent(t.script, dir, remote1_replace);

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

	remote1.addResponses(t.test_num, remotes);

	try {
		await checkTest(t, run_data);
	}
	catch(e) {
		throw new Error(e);
	}

	let log_data = [];
	try {
		log_data = await execTest(t, run_data);
	}
	catch(e) {
		console.error("bad test:", t, e);
		throw new Error(e);
	}

	return log_data;
}

function transformContent(str, abs_dir, remote_url) {
	str = str.replace(/\$absolute/g, abs_dir);
	str = str.replace(/\$remote1/g, remote_url);
	return str;
}

function checkTest(t, run) {
	return new Promise( (resolve, reject) => {
		exec('deno --allow-all --reload '+t.script, {
			cwd: path.join(run.dir, t.cwd)
		}, (err, stdout, stderr) => {
			if(err) {
				console.error(testNumStr(t)+" bad test", t, err);
				reject(err);
			}
			resolve();
		});
	});
}

function execTest(t, run) {
	return new Promise( (resolve, reject) => {
		exec('deno --reload '+t.flags+' '+t.script, {
			cwd: path.join(run.dir, t.cwd)
		}, (err, stdout, stderr) => {
			if( err && !t.expect_error ) {
				resolve([testNumStr(t)+" Should allow:", t.desc, err])
			}
			else if( !err && t.expect_error ) {
				resolve([testNumStr(t)+" DANGER! allowed:", t.desc]);
			}
			else {
				resolve([testNumStr(t)+" OK: "+(t.expect_error?"denied: ":"allowed: ")+t.desc]);
			}
		});
	});
}

function cleanupTest(run) {
	rimraf(run.dir,{}, (err) => {
		if(err) console.error(err);
	});
}

function testNumStr(t) {
	return "Test "+t.test_num.toString().padStart(2, " ");
}

// server class
class RemoteServer {
	constructor() {
		this.listen_ip = '127.0.0.1';
		this.listen_port = 55889;
		this.domain = 'deno-sandbox-tests-1.develop';
		// ^^ we might be able to start a single server at a single port
		// ..and have multiple domains redirecting there.

		this.test_resps = {};
	}

	async start() {
		return new Promise( (resolve, reject) => {
			const server = http.createServer(this.handleReq.bind(this));
			server.listen(this.listen_port, this.listen_ip, () => {
				resolve(server);
			});
		});
	}

	getUrl() {
		return 'http://'+this.domain+':'+this.listen_port;
	}

	addResponses(test_num, resps) {
		this.test_resps[test_num] = resps;
	}

	handleReq(req, res) {
		const test_num = req.url.split('/')[1];
		if( test_num === '' || isNaN(test_num) ) throw new Error("couldn't get test num from url "+req.url) ;
		
		const key = '$remote1/'+req.url.split('/').slice(2).join('/');
		const test_resp = this.test_resps[test_num][key];

		if( !test_resp ) throw new Error(`test resp not found for ${test_num} ${key} Keys:`);

		const resp = Object.assign({
			content_type: 'text/plain',
			code: 200,
		}, test_resp);

		res.statusCode = resp.code;
		res.setHeader('Content-Type', resp.content_type);
		res.end(resp.content);
	}
}

run();