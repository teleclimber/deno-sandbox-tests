const loader = require('./loader.js');

test('OK descriptions are OK', () => {
	const tests = [{desc:'abc'}, {desc:'def'}];
	expect(loader.checkDescriptions(tests)).toBe(true);
});

test('detects missing descriptions', () => {
	const tests = [{desc:'abc'}, {}];
	expect(loader.checkDescriptions(tests)).toBe(false);
});

test('detects dupe descriptions', () => {
	const tests = [{desc:'abc'}, {desc:'abc'}];
	expect(loader.checkDescriptions(tests)).toBe(false);
});