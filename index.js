const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const http = require('http');
const tempDirectory = require('temp-dir');
const { exec } = require('child_process');
const rimraf = require('rimraf');
const throttleActions = require('./throttle.js');

const keys = ["test_num", "desc", "cwd", "script", "flags", "expect_error"];

const tests = require('./deno-tests');

let remote1;

const result_strs = initResultStrs();

async function run() {
	remote1 = new RemoteServer;
	await remote1.start();

	const test_promises = tests.map( (t,i) => {
		return async () => {
			t.test_num = i;
			let run_data;
			try {
				run_data = await prepareTest(t);
				const log_datas = await runTest(t, run_data);
				doLog(i, log_datas);
			}
			catch(e) {
				console.error(e);
				doLog(i, [testNumStr(t)+' Bad test']);
			}
			cleanupTest(run_data);
		}
	});

	try {
		await throttleActions(test_promises, 10);
	}
	catch(e) {
		console.error(e);
	}

	console.log("done");

	remote1.stop();
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

	let err = null;
	try {
		err = await execTest(t, run_data);
	}
	catch(e) {
		console.error("bad test:", t, e);//??
		throw new Error(e);
	}

	let log_data = [];
	if( err && !t.expect_error ) {
		log_data = [testNumStr(t), result_strs['denied'], t.desc, err];
	}
	else if( !err && t.expect_error ) {
		log_data = [testNumStr(t), result_strs['danger'], t.desc];
	}
	else {
		log_data = [testNumStr(t), result_strs[t.expect_error?"ok-denied":"ok-allowed"],t.desc];
	}

	for( let k in remotes ) {
		const r = remotes[k];
		if( r.no_hit && r.got_hit ) {
			log_data[1] = result_strs['danger'];
			log_data[3] = (log_data[3]||'') +  "remote was hit when it shouldn't have: "+k;
		}
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
			resolve(err);
		});
	});
}

function cleanupTest(run) {
	rimraf(run.dir,{}, (err) => {
		if(err) console.error(err);
	});
}

function testNumStr(t) {
	return t.test_num.toString().padStart(3, " ");
}

function initResultStrs() {
	const result_strs = {
		"denied":"Denied :(",
		"danger": "DANGER!",
		"ok-allowed": "Ok (allowed)",
		"ok-denied": "Ok (denied)"
	}
	let length = Math.max(...(Object.values(result_strs).map(v => v.length)));
	for( let k in result_strs ) {
		result_strs[k] = result_strs[k].padEnd(length);
	}
	return result_strs;
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
			this.server = http.createServer(this.handleReq.bind(this));
			this.server.listen(this.listen_port, this.listen_ip, () => {
				resolve();
			});
		});
	}
	stop() {
		this.server.close();
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

		test_resp.got_hit = true;

		res.statusCode = resp.code;
		res.setHeader('Content-Type', resp.content_type);
		res.end(resp.content);
	}
}

run();