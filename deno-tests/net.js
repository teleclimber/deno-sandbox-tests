module.exports = [
	// local script fetches remote file:
	{
		desc: "fetch remote txt file from local",
		
		"$remote1/data/file.txt": {
			content: "hello world",
			no_hit: true
		},
		
		"script/test.ts":
		"const dat = await fetch('$remote1/data/file.txt'); console.log(dat);",
		
		cwd:"script/",
		script:"test.ts",
		flags:"",
		expect_error:true	// Should require --allow-net
	}
];