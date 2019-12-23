// temporary. Full test loader coming later

function checkDescriptions(tests) {
	const keys = {};
	const _no_desc = [];
	tests.forEach( (t, i)=> {
		const desc = t.desc;
		if( !desc ) _no_desc.push(i);
		if( !keys[desc] ) keys[desc] = [];
		keys[desc].push(i);
	});

	let ok = true;
	if( _no_desc.length ) {
		ok = false;
		console.log('ERROR: the following tests have no description:');
		_no_desc.forEach(test_i => console.log('Test #'+test_i, tests[test_i]));
	}

	for( let desc in keys ) {
		if( keys[desc].length > 1 ) {
			ok = false;
			console.log('ERROR: the following tests have the same description:' );
			keys[desc].forEach(test_i => console.log('Test #'+test_i, tests[test_i]));
		}
	}

	return ok;
}

module.exports.checkDescriptions = checkDescriptions;