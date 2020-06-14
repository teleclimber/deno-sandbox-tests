module.exports = [
// local script imports remote:
// vary: static/dynamic, no-remote
{
	desc: "remote static import of TS from local",
	
	"$remote1/packages/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		no_hit: true
	},
	
	"script/test.ts":
	"import hello from '$remote1/packages/target.ts'; hello();",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:true
},{
	desc: "remote static import of TS from local, no-remote",
	
	"$remote1/packages/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		no_hit: true
	},
	
	"script/test.ts":
	"import hello from '$remote1/packages/target.ts'; hello();",
	
	cwd:"script/",
	script:"test.ts",
	flags:"--no-remote",
	expect_error:true
},{
	desc: "remote dynamic import of TS from local",
	
	"$remote1/packages/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		no_hit: true
	},
	
	"script/test.ts":
	"import('$remote1/packages/target.ts').then( m => { m.default(); });",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:true
},
// Plain remote script:
{
	desc: "run a remote script",
	
	"$remote1/script/test.ts": {
		content: "console.log('hello');",
		no_hit: true
	},
	
	cwd:"",
	script:"$remote1/script/test.ts",
	flags:"",
	expect_error:false	// If you ask deno to run a remote script, it should run the script.
},
// Remote script imports locals:
// Vary: static/dynamic, TS/JSON
{
	desc: "local absolute static import of TS from remote",
	
	"script/target.ts":
	"export default function hello() { return 'hello'; }",

	"$remote1/packages/script.ts":
	"import hello from 'file://$absolute/script/target.ts'; hello();",
		
	cwd:"",
	script:"$remote1/packages/script.ts",
	flags:"",
	expect_error:true
},
// The next test could be be "local relative static import of TS from remote"
// But that's not possible because the file:// protocol doesn't allow relative paths
{
	desc: "local absolute dynamic import of TS from remote",
	
	"script/target.ts":
	"export default function hello() { return 'hello'; }",

	"$remote1/packages/script.ts": {
		content: "import('file://$absolute/script/target.ts').then( m => { m.default(); });",
		content_type: 'text/plain',
	},
	
	cwd:"script/",
	script:"$remote1/packages/script.ts",
	flags:"",
	expect_error:true
},{
	desc: "local absolute static import of JSON from remote",
	
	"script/target.json":
	'{"hello": "world"}',

	"$remote1/packages/script.ts": {
		content: "import hello from 'file://$absolute/script/target.json'; console.log(hello.hello);",	// I think this resolves to $remote1/packages/target.ts
		content_type: 'text/plain',
	},
	
	cwd:"script/",
	script:"$remote1/packages/script.ts",
	flags:"",
	expect_error:true
},
// The next test could be be "local relative static import of TS from remote"
// But that's not possible because the file:// protocol doesn't allow relative paths
{
	desc: "local absolute dynamic import of JSON from remote",
	
	"script/target.json":
	'{"hello": "world"}',

	"$remote1/packages/script.ts": {
		content: "import('file://$absolute/script/target.json').then( m => { console.log(m.hello); });",
		content_type: 'text/plain',
	},
	
	cwd:"script/",
	script:"$remote1/packages/script.ts",
	flags:"",
	expect_error:true
},
// remote script imports another remote:
// Vary: static/dynamic, below-run/break-root
{
	desc: "remote static import of TS, below run script, from remote",
	
	"$remote1/somepackage/lib/target.ts":
	"export default function hello() { return 'hello'; }",
		
	"$remote1/somepackage/test.ts":
	"import hello from './lib/target.ts'; console.log(hello());",
	
	cwd:"",
	script:"$remote1/somepackage/test.ts",
	flags:"",
	expect_error: false	// A script getting its deps statically is fine
},{
	desc: "remote dynamic import of TS, below run script, from remote",
	
	"$remote1/somepackage/lib/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		no_hit: true
	},
		
	"$remote1/somepackage/test.ts":
	"import('./lib/target.ts').then( mod => console.log(mod.default()) );",
	
	cwd:"",
	script:"$remote1/somepackage/test.ts",
	flags:"",
	expect_error: true	// Dynamic imports allow data exfiltration
},{
	desc: "remote static import of TS, break root, from remote",
	
	"$remote1/outside/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		no_hit: true
	},
		
	"$remote1/somepackage/test.ts":
	"import hello from '../outside/target.ts'; console.log(hello());",
	
	cwd:"",
	script:"$remote1/somepackage/test.ts",
	flags:"",
	expect_error: true	// Not on the same path as the run script, so no implied permission
}

// statically import from remote2
];