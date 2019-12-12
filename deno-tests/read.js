module.exports = [{
	desc: "read file relative path below",
	
	"script/target.txt":
	"hello world",
	
	"test.ts":
	"const txt = await Deno.readFile('script/target.txt'); console.log(txt);",
	
	cwd:"",
	script:"test.ts",
	flags:"",
	expect_error:true
},{
	desc: "read file absolute path break root",
	
	"other/target.txt":
	"hello world",
	
	"script/test.ts":
	"const txt = await Deno.readFile('$absolute/other/target.txt'); console.log(txt);",
	
	cwd:"script/",
	script:"test.ts",
	flags:"",
	expect_error:true
}];

