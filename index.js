const DummyRemoteServer = require( './lib/dummy-server.js');
const Results = require( './lib/results.js');
const RunTest = require('./lib/run-test.js');
const throttleActions = require('./lib/throttle.js');

const tests = require('./deno-tests');

async function run() {
	const options = {};

	if( !checkDescriptions() ) {
		process.exit(1);
	}

	const remote1 = new DummyRemoteServer;	// pass options probably
	await remote1.start();

	try {
		await remote1.testDomain();
	}
	catch(e) {
		console.error("There was a problem connecting with the dummy server.");
		console.error(`Did you add ${remote1.domain} to /etc/hosts?`);
		console.error(e);
		process.exit(1);
	}

	options.remote1 = remote1;
	options.results = new Results({}, tests);

	const run_tests = tests.map( (t, i) => new RunTest(options, t, i) );

	const test_promises = run_tests.map( (rt) => {
		return async () => {
			await rt.start();
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

///
function checkDescriptions() {
	const keys = {};
	const _no_desc = [];
	tests.forEach( (t, i)=> {
		const desc = t.desc;
		if( !desc ) _no_desc.push(i);
		if( !keys[desc] ) keys[desc] = [];
		keys[desc].push(i);
	});

	let ok = true;
	if( _no_desc.length ) {
		ok = false;
		console.log('ERROR: the following tests have no description:');
		_no_desc.forEach(test_i => console.log('Test #'+test_i, tests[test_i]));
	}

	for( let desc in keys ) {
		if( keys[desc].length > 1 ) {
			ok = false;
			console.log('ERROR: the following tests have the same description:' );
			keys[desc].forEach(test_i => console.log('Test #'+test_i, tests[test_i]));
		}
	}

	return ok;
}


run();