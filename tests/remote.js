
module.exports = [{
	desc: "remote static import of TS",
	
	"$remote1/packages/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		content_type: 'text/plain',
	},
	
	"script/test.ts":
	"import hello from '$remote1/packages/target.ts'; hello();",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:true
},{
	desc: "remote dynamic import of TS",
	
	"$remote1/packages/target.ts": {
		content: "export default function hello() { return 'hello'; }",
		content_type: 'text/plain',
	},
	
	"script/test.ts":
	"import('$remote1/packages/target.ts');",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:true
},{
	desc: "local absolute static import of TS from remote",
	
	"script/target.ts":
	"export default function hello() { return 'hello'; }",

	"$remote1/packages/script.ts": {
		content: "import hello from 'file://$absolute/script/target.ts'; hello();",	// I think this resolves to $remote1/packages/target.ts
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
}];