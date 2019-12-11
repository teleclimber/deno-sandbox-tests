# Deno Sandbox Tests

[Deno](http://deno.land) is a "A secure runtime for JavaScript and TypeScript". As such it will be used to run untrusted code, and it may even be used as the sandbox component of an application platform.

If Deno is used as the sandbox component of an application platform the developer of that platform needs to have a very clear picture of what Deno allows. This is not terribly obvious from the docs or from the discussions in issues, so this project provides a repeatable way of verifying that dangerous operations are blocked in the version of Deno installed locally.

[Deno-sandbox-tests](https://github.com/teleclimber/deno-sandbox-tests) is a suite of tests and a test runner. Each test is an attempt to perform an operation that Deno may or may not allow, and an expectation as to whether the operation should be allowed.

For example one test might attempt to load a JSON file via a static import statement using an absolute path that resolves outside your current directory. Another will try to import a remote TypeScript file using a dynamic import statement.

## What Should Be Allowed?

Personally I have my own expectations about what Deno should allow and operations I have to watch out for for my use case. Your use case may be different and the Deno team have their own way of thinking about things.

If your expectations differ from mine, you could fork this and change the `expected_error` value on those tests.

# Install and Run

The test runner runs on [Node.js](https://nodejs.org/) so you must have that installed. It assumes `deno` is available on the path.

Clone this repo and run `npm install`. There are very few dependencies.

For remote tests to work you have to add `deno-sandbox-tests-1.develop` to your `/etc/hosts` or to your `dnsmasq` config so that it resolves to `127.0.0.1`. (I'll make this configurable later.)

To run all tests, simply run it with no arguments: `node index.js`.

It should work on Mac and linux. Untested on Windows for the time being.

# Sample Output

```
Test  0 OK: allowed: local static import of TS, sibling, relative path
Test  1 DANGER! allowed: local static import of TS, break root, relative path
Test  2 DANGER! allowed: local static import of TS, break root, absolute path
Test  3 DANGER! allowed: local static import of JSON, break root, relative path
Test  4 DANGER! allowed: local static import of JSON, break root, absolute path
Test  5 DANGER! allowed: local static import of TS, break root, relative path, CWD above
Test  6 OK: denied: local dynamic import of TS, sibling, relative path
Test  7 OK: denied: local dynamic import of TS, break root, relative path
Test  8 OK: denied: local dynamic import of TS, break root, absolute path
Test  9 OK: denied: local dynamic import of JSON, break root, relative path
Test 10 OK: denied: local dynamic import of JSON, break root, absolute path
Test 11 OK: denied: local dynamic import of TS, break root, relative path, CWD above
Test 12 DANGER! allowed: remote static import of TS
Test 13 OK: denied: remote dynamic import of TS
Test 14 DANGER! allowed: local absolute static import of TS from remote
Test 15 OK: denied: local absolute dynamic import of TS from remote
Test 16 DANGER! allowed: local absolute static import of JSON from remote
Test 17 OK: denied: local absolute dynamic import of TS from remote
```

Note that _test numbers_ are just the index of each test in the array of tests. If you add or remove a test, test numbers of subsequent tests will change. Don't depend on test numbers alone in your notes or bug reports. Use the full description of a test instead.

# Inner Workings

The node runtime starts up a dummy remote server on localhost, then iterates over the set of tests.

For each test it creates a temporary directory where all local file ops will take place. Then it works through the test's data.

## Test Data

Each test is described with a JS object similar to the one below:

```
{
	desc: "remote dynamic import of TS from local",
	
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
}
```

Known keys are as follows:

- `desc` is a concise and unique description of the test.
- `cwd` is the current working directory that Deno will be run from relative to the local test dir.
- `script` is the last argument passed to Deno telling it which script to run. Naturally it is relative to the `cwd`.
- `flags` is used to pass additional flags to Deno.
- `expect_error` tells the runtime whether Deno should error or not. If `expect_error` is true, that means that we expect Deno will disallow the import/request/file access, and will result in a "Danger" result if it runs without error.

Other keys in the test are interpreted as files that can be accessed either via the filesystem or a dummy remote server.

## Files

A key like `$remote1/packages/target.ts` tells the test runner that this is a file that should be available on the remote server.

A simple relative path like `script/test.ts` tells the test runner to create a local file in the test's temporary directory.

There can be as many of these files, local or remote, as necessary.

If the value is a string, that string is the contents of the file. If it's an object the `content` key should be a string that serves this purpose.

Currently the only other key on an object that describes a file is `content_type` which is used by the dummy server to set the content type of the response.

Within the content of these files, special strings can be used to refer to these locations. The test runner replaces instances of these as appropriate.

- `$absolute` is the absolute local path of the test's directory
- `$remote1` is the URL of the dummy remote server

## Running a Test

Once all the transformations have been performed and the test is ready to run, Deno is called to run the script with `--allow-all` and checked for errors. A test that fails to run with `--allow-all` is considered a bad test and will be reported as such.

Finally the test is actually run and the results recorded.

# Contribute

Please feel free to contribute tests to this project. The description should be complete and concise and unique, and the test should verify something useful regarding Deno's sandbox mechanism.

Other contributions are welcome too, subject to prior discussions on an issue.

Thanks.