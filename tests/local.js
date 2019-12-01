const path = require('path');

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
	function(run) {
		return "import hello from '"+path.join(run.dir, "outside/target.ts")+"';"; },

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
	expect_error: true
},{
	desc: "local static import of JSON, break root, absolute path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	function(run) {
		return "import hello from '"+path.join(run.dir, "outside/target.json")+"';"; },
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},
// Now let's put the CWD at the root of the test dir, so target is within it
{
	desc: "local static import of TS, break root, relative path, CWD above",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import hello from '../outside/target.ts';",
	
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
	"import('./target.ts');",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true	// requires --allow-read
},{
	desc: "local dynamic import of TS, break root, relative path",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import('../outside/target.ts');",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local dynamic import of TS, break root, absolute path",

	"outside/target.ts":
	"export default function hello() { return 'hello'; }",

	"script/test.ts":
	function(run) {
		return "import('"+path.join(run.dir, "outside/target.ts")+"');"; },

	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local dynamic import of JSON, break root, relative path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	"import('../outside/target.json');",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},{
	desc: "local dynamic import of JSON, break root, absolute path",
	
	"outside/target.json":
	'{"hello":"world"}',
	
	"script/test.ts":
	function(run) {
		return "import('"+path.join(run.dir, "outside/target.json")+"');"; },
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error: true
},
// Now let's put the CWD at the root of the test dir, so target is within it
{
	desc: "local dynamic import of TS, break root, relative path, CWD above",
	
	"outside/target.ts":
	"export default function hello() { return 'hello'; }",
	
	"script/test.ts":
	"import('../outside/target.ts');",
	
	cwd:"",
	script:"script/test.ts",
	flags:"",
	expect_error: true
}
];
