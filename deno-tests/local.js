module.exports = [{
	desc: "local static import of TS, sibling, relative path",
	
	"script/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import hello from './target.ts';",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:false
},{
	desc: "local static import of TS, break root, relative path",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import hello from '../outside/target.ts';",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local static import of TS, break root, absolute path",

	"outside/target.ts":
	"export default function hello() { return 'hello'; }",

	"script/test.ts":
	"import hello from '$absolute/outside/target.ts';",

	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local static import of JSON, break root, relative path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	"import hello from '../outside/target.json';",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	check_fails: true,
	expect_error: true
},{
	desc: "local static import of JSON, break root, absolute path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	"import hello from '$absolute/outside/target.json';",
		
	cwd:"script/",
	script:"test.ts",
	flags:"",
	check_fails: true,
	expect_error: true
},
// Now let's put the CWD at the root of the test dir, so target is within it
{
	desc: "local static import of TS, break root, relative path, CWD above",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import hello from '../outside/target.ts'; hello();",
	
	cwd:"",
	script:"script/test.ts",
	flags:"",
	expect_error: true
},
// Dynamic imports
{
	desc: "local dynamic import of TS, sibling, relative path",
	
	"script/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import('./target.ts').then( m => { m.default(); });",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true	// requires --allow-read
},{
	desc: "local dynamic import of TS, break root, relative path",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import('../outside/target.ts').then( m => { m.default(); });",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local dynamic import of TS, break root, absolute path",

	"outside/target.ts":
	"export default function hello() { return 'hello'; }",

	"script/test.ts":
	"import('$absolute/outside/target.ts').then( m => { m.default(); });",

	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local dynamic import of JSON, break root, relative path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	"import('../outside/target.json').then( m => { console.log(m.hello); });",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	check_fails: true,
	expect_error: true
},{
	desc: "local dynamic import of JSON, break root, absolute path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	"import('$absolute/outside/target.json').then( m => { console.log(m.hello); });",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	check_fails: true,
	expect_error: true
},
// Now let's put the CWD at the root of the test dir, so target is within it
{
	desc: "local dynamic import of TS, break root, relative path, CWD above",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import('../outside/target.ts').then( m => { m.default(); });",
	
	cwd:"",
	script:"script/test.ts",
	flags:"",
	expect_error: true
}
];
