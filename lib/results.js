

const result_strs = initResultStrs();

class Results {
	constructor(opts, tests) {
		this.tests = tests;
		this.log_index = 0;
		this.logs = [];
	}

	add(index, log_datas) {
		if( !log_datas ) log_datas = ['...no data?...'];
		if( !Array.isArray(log_datas) ) log_datas = [log_datas];
		
		this.logs[index] = log_datas;
		while( this.logs[this.log_index] ) {
			const test = this.tests[this.log_index];
			const log = this.logs[this.log_index];
			console.log(testNumStr(this.log_index), result_strs[log[1]], test.desc);
			if(log.length >3) {
				log.slice(3).forEach(l => console.log('ERROR:'.padStart(23), l));
			}
			++this.log_index;
		}
	}

	get(index) {
		return this.logs[index];
	}
}

function testNumStr(index) {
	return (index+'').padStart(3, " ");
}

function initResultStrs() {
	const result_strs = {
		"denied":"Denied",
		"danger": "DANGER",
		"ok-allowed": "Ok (allowed)",
		"ok-denied": "Ok (denied)",
		"bad-test": 'BAD TEST'
	}
	let length = Math.max(...(Object.values(result_strs).map(v => v.length)));
	for( let k in result_strs ) {
		result_strs[k] = result_strs[k].padEnd(length);
	}
	return result_strs;
}

module.exports = Results;