const DummyRemoteServer = require( './dummy-server.js');
const Results = require( './results.js');
const RunTest = require('./run-test.js');

const passing_test = {
	desc: "local static import of TS, sibling, relative path",

	"script/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import hello from './target.ts';",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:false
};

const failing_test = {
	desc: "local dynamic import of TS, sibling, relative path",
	
	"script/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import('./target.ts').then( m => { m.default(); });",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true	// requires --allow-read
};

test( 'It runs a passing test', async () => {
	const test_i = 7;
	const tests = [];
	tests[test_i] = Object.assign({}, passing_test);

	const options = {};
	options.remote1 = new DummyRemoteServer;
	await options.remote1.start();
	options.results = new Results({}, tests);

	const run_test = new RunTest(options, tests[7], test_i);
	await run_test.start();
	const logs = options.results.get(test_i);

	expect(logs[1]).toBe('ok-allowed');

	options.remote1.stop();
});

test( 'It fails a failing test', async () => {
	const test_i = 7;
	const tests = [];
	tests[test_i] = Object.assign({}, failing_test);

	const options = {};
	options.remote1 = new DummyRemoteServer;
	await options.remote1.start();
	options.results = new Results({}, tests);

	const run_test = new RunTest(options, tests[7], test_i);
	await run_test.start();
	const logs = options.results.get(test_i);

	expect(logs[1]).toBe('ok-denied');

	options.remote1.stop();
});

test( 'Bad script is caught', async () => {
	const test_i = 7;
	const tests = [];
	tests[test_i] = Object.assign({}, failing_test);
	tests[test_i].script = "some-script.ts";	// <- script doesn't exist
	
	const options = {};
	options.remote1 = new DummyRemoteServer;
	await options.remote1.start();
	options.results = new Results({}, tests);

	const run_test = new RunTest(options, tests[test_i], test_i);
	await run_test.start();
	const logs = options.results.get(test_i);

	expect(logs[1]).toBe('bad-test');

	options.remote1.stop();
});

test( 'Bad flag is caught', async () => {
	const test_i = 7;
	const tests = [];
	tests[test_i] = Object.assign({}, failing_test);
	tests[test_i].flags = "--some-flag";	// <- flag doesn't exist
	
	const options = {};
	options.remote1 = new DummyRemoteServer;
	await options.remote1.start();
	options.results = new Results({}, tests);

	const run_test = new RunTest(options, tests[test_i], test_i);
	await run_test.start();
	const logs = options.results.get(test_i);

	expect(logs[1]).toBe('bad-test');

	options.remote1.stop();
});

test( 'no-hit hit causes test to fail', async () => {
	const test_i = 7;
	const test_i2 = 11;
	const tests = [];
	const test = {
		desc: "no-hit hit",
	
		"$remote1/packages/script.ts": "console.log('hello');",
			
		cwd:"",
		script:"$remote1/packages/script.ts",
		flags:"",
		expect_error: false
	};

	tests[test_i] = test;

	tests[test_i2] = Object.assign({}, test);
	tests[test_i2]["$remote1/packages/script.ts"] =  {	// <- same thing but with no-hit
		content:"console.log('hello');",
		no_hit: true
	}

	const options = {};
	options.remote1 = new DummyRemoteServer;
	await options.remote1.start();
	options.results = new Results({}, tests);

	let run_test, logs;
	
	run_test = new RunTest(options, tests[test_i], test_i);
	await run_test.start();
	logs = options.results.get(test_i);
	expect(logs[1]).toBe('ok-allowed');

	run_test = new RunTest(options, tests[test_i2], test_i2);
	await run_test.start();
	logs = options.results.get(test_i2);
	expect(logs[1]).toBe('danger');

	options.remote1.stop();
}, 20000);