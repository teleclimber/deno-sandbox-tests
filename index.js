const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const tempDirectory = require('temp-dir');
const { exec } = require('child_process');
const rimraf = require('rimraf');

const keys = ["test_num", "desc", "cwd", "script", "flags", "expect_error"];

const tests = require('./tests/');

async function run() {
	tests.forEach(async(t,i) => {
		t.test_num = i;
		try {
			const log_datas = await runTest(t, i);
			//console.log(...log_datas);
			doLog(i, log_datas);
		}
		catch(e) {
			console.error(e);
			doLog(i, [testNumStr(t)+' Bad test']);
		}
	});
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

async function runTest(t) {
	const dir = await fsPromises.mkdtemp(path.join(tempDirectory, 'foo-'));

	const run_data = {
		dir
	};

	const files = {};
	for( let k in t ) {
		if( !keys.includes(k) ) {
			if( typeof t[k] === 'function' ) files[k] = t[k](run_data);
			else if( typeof t[k] === 'string' ) files[k] = t[k];
			else throw new Error("what is this? "+k);
		}
	}

	for( let p in files ) {
		try {
			await fsPromises.mkdir(path.join(dir, path.dirname(p)), {recursive: true});
		}
		catch(e) {
			if (e.code != 'EEXIST') throw new Error(e);
		}
		try {
			await fsPromises.writeFile(path.join(dir,p), files[p]);
		}
		catch(e) {
			console.error("Error creating file "+p, e);
			throw new Error(e);
		}
	}

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

function checkTest(t, run) {
	return new Promise( (resolve, reject) => {
		exec('deno --allow-all '+t.script, {
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
		exec('deno '+t.flags+' '+t.script, {
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
	
			rimraf(run.dir,{}, (err) => {
				if(err) console.error(err);
			});
		});
	});
	
}

function testNumStr(t) {
	return "Test "+t.test_num.toString().padStart(2, " ");

}

run();