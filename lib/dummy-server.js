const http = require('http');
const dns = require( 'dns');

class DummyRemoteServer {
	constructor() {
		this.listen_ip = '127.0.0.1';
		this.domain = 'deno-sandbox-tests-1.develop';
		// ^^ we might be able to start a single server at a single port
		// ..and have multiple domains redirecting there.

		this.test_resps = {};
	}
	async start() {
		return new Promise( (resolve, reject) => {
			this.server = http.createServer(this.handleReq.bind(this));
			this.server.on('close', () => {
				if( !this.stopped )	console.error('Dummy remote server has died!');
			});
			this.server.listen(undefined, this.listen_ip, () => {
				this.listen_port = this.server.address().port;
				console.log('Dummy server listening on port', this.listen_port);
				resolve();
			});
		});
	}
	stop() {
		this.stopped = true;
		this.server.close();
	}
	getUrl() {
		return 'http://'+this.domain+':'+this.listen_port;
	}
	testDomain() {
		return new Promise((resolve, reject) => {
			dns.lookup(this.domain, (err, address, family) => {
				if( err ) {
					reject();
					return;
				}
				const opts = {
					hostname: this.domain,
					port: this.listen_port,
					path: '/domain-test',
					method: 'GET',
					timeout: 3000
				};
				const req = http.request(opts, res => {
					if( res.statusCode === 200 ) resolve();
					else reject();
				});
				req.on('error', () => {
					reject();
				});
				req.on('timeout', () => {
					reject();
				});
				req.end();
			});
		});
	}
	addResponses(test_num, resps) {
		this.test_resps[test_num] = resps;
	}
	handleReq(req, res) {
		let req_url = req.url;

		if( req_url.split('/')[1] === 'domain-test' ) {
			res.end();
			return;
		}

		const test_num = req_url.split('/')[1];
		if( test_num === '' || isNaN(test_num) ) throw new Error("couldn't get test num from url "+req_url) ;
		
		const key = '$remote1/'+req_url.split('/').slice(3).join('/');
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

module.exports = DummyRemoteServer;