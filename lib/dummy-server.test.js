const axios = require('axios');

const DummyServer = require('./dummy-server.js');

test('testDomain with good domain', async () => {
	const dum = new DummyServer;
	await dum.start();

	await expect(dum.testDomain()).resolves.toBeUndefined();

	dum.stop();
});

test('testDomain with bad domain', async () => {
	const dum = new DummyServer;
	dum.domain = 'something-something.derpveloper'
	await dum.start();

	await expect(dum.testDomain()).rejects.toBe(undefined);

	dum.stop();
});

test('it matches and returns content', async () => {
	const dum = new DummyServer;
	await dum.start();

	const resps = {
		'$remote1/target.txt': { content: 'hello' },
		'$remote1/not-a-target.txt': { content: 'not-hello' }
	}

	dum.addResponses(7, resps);

	const resp = await axios.get('http://'+dum.domain+':'+dum.listen_port+'/7/abcdef/target.txt', {
		timeout: 3000
	});

	expect(resp.status).toBe(200);
	expect(resp.data).toBe('hello');
	expect(resps['$remote1/target.txt'].got_hit).toBe(true);
	expect(resps['$remote1/not-a-target.txt'].got_hit).toBeUndefined();

	dum.stop();
});

// tests:
// - //done basic test number / route matching
// - test that content-type is set as expected
// - hit something it should register a hit, 
// - don't hit something -> no hit