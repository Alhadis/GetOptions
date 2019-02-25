"use strict";

const getOpts = require("../index.js");


suite("Terminators", () => {
	const optdef = {
		"--foo": "",
		"--bar": "",
	};
	

	test("None: Unspecified", () => {
		const args = ["--foo", "--", "--bar"];
		const expected = {
			options: {foo: true, bar: true},
			argv: ["--"],
		};
		assert.deepEqual(getOpts(args, optdef), expected);
		assert.deepEqual(getOpts(args, optdef, {}), expected);
	});
	
	
	test("None: Empty values", () => {
		const args = ["--foo", "--", "--bar"];
		const expected = {
			options: {foo: true, bar: true},
			argv: ["--"],
		};
		for(const terminator of ["", null, false, undefined])
			assert.deepEqual(getOpts(args, optdef, {terminator}), expected);
	});


	test("Strings: Single", () => {
		let terminator = "--";
		for(const {input, expected} of [{
			input: ["--foo", "--", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["--", "--foo", "--bar"],
			expected: {
				options: {},
				argv: ["--foo", "--bar"],
			},
		}, {
			input: ["--foo", "--bar", "--"],
			expected: {
				options: {foo: true, bar: true},
				argv: [],
			},
		}, {
			input: ["--", "--", "--foo"],
			expected: {
				options: {},
				argv: ["--", "--foo"],
			},
		}, {
			input: ["--bar", "--", "--"],
			expected: {
				options: {bar: true},
				argv: ["--"],
			},
		}, {
			input: ["--foo", "--bar", "--baz", "--", "--", "---"],
			expected: {
				options: {foo: true, bar: true},
				argv: ["--baz", "--", "---"],
			},
		}, {
			input: ["--"],
			expected: {
				options: {},
				argv: [],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
		
		terminator = "#";
		for(const {input, expected} of [{
			input: ["--foo", "#", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["--foo", "--", "#", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--", "--bar"],
			},
		}, {
			input: ["#"],
			expected: {
				options: {},
				argv: [],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
	});
	
	
	test("Strings: Multiple", () => {
		const terminator = ["STOP", "THIS", "SHIT"];
		for(const {input, expected} of [{
			input: ["--bar", "STOP", "--foo"],
			expected: {
				options: {bar: true},
				argv: ["--foo"],
			},
		}, {
			input: ["--foo", "SHIT", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["THIS", "--foo", "IS", "--bar", "SHIT"],
			expected: {
				options: {},
				argv: ["--foo", "IS", "--bar", "SHIT"],
			},
		}, {
			input: ["--foo"],
			expected: {
				options: {foo: true},
				argv: [],
			},
		}, {
			input: ["STOP"],
			expected: {
				options: {},
				argv: [],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
	});


	test("RegExps: Single", () => {
		let terminator = /^STOP:/;
		for(const {input, expected} of [{
			input: ["--foo", "STOP:", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["STOP:", "--foo", "STOP:", "--bar"],
			expected: {
				options: {},
				argv: ["--foo", "STOP:", "--bar"],
			},
		}, {
			input: ["stop:", "--foo", "STOP:", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["stop:", "--bar"],
			},
		}, {
			input: ["STOP:", "STOP:"],
			expected: {
				options: {},
				argv: ["STOP:"],
			},
		}, {
			input: [" STOP:", "--foo", "STOP:"],
			expected: {
				options: {foo: true},
				argv: [" STOP:"],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
		
		terminator = /^ENOUGH[, ]+ALREADY\b/;
		for(const {input, expected} of [{
			input: ["--foo", "ENOUGH ALREADY", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["--foo", "ENOUGH, ,ALREADY!", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
	});
	
	
	test("RegExps: Multiple", () => {
		const terminator = [/^STOP\b/, /\bTHAT$/];
		for(const {input, expected} of [{
			input: ["--foo", "STOP!", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["--bar", "STOPPPP", "--foo", "THAT"],
			expected: {
				options: {bar: true, foo: true},
				argv: ["STOPPPP"],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
	});
	
	
	test("Mixed-type values", () => {
		const terminator = ["STOP", /^(THAT|THIS)$/i, "SHIT"];
		for(const {input, expected} of [{
			input: ["--foo", "STOP", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["--bar"],
			},
		}, {
			input: ["THAT", "--foo", "--bar", "SHIT"],
			expected: {
				options: {},
				argv: ["--foo", "--bar", "SHIT"],
			},
		}, {
			input: ["--foo", "this", "and", "that", "--bar"],
			expected: {
				options: {foo: true},
				argv: ["and", "that", "--bar"],
			},
		}, {
			input: ["--bar", "that", "and", "this", "--foo"],
			expected: {
				options: {bar: true},
				argv: ["and", "this", "--foo"],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {terminator}), expected);
	});
	
	
	test("Parameter interruption", () => {
		const terminator = "--";
		const optdef = {
			"--foo": "<value>",
			"--bar": "<name> <value>",
			"--files": "<paths...>",
		};
		for(const {input, expected, config = {}} of [{
			input: ["--foo", "--", "3"],
			expected: {
				options: {foo: undefined},
				argv: ["3"],
			},
		}, {
			input: ["--foo", "3", "--bar", "--", "4"],
			expected: {
				options: {foo: "3", bar: []},
				argv: ["4"],
			},
		}, {
			input: ["--files", "foo", "bar", "--", "baz"],
			expected: {
				options: {files: ["foo", "bar"]},
				argv: ["baz"],
			},
		}, {
			input: ["--files", "--", "foo", "bar"],
			expected: {
				options: {files: []},
				argv: ["foo", "bar"],
			},
		}, {
			input: ["--bar", "3", "--", "4", "--foo", "1"],
			expected: {
				options: {bar: ["3"]},
				argv: ["4", "--foo", "1"],
			},
		}, {
			input: [
				"--foo", "1",
				"--foo", "2",
				"--foo", "--",
				"--foo", "4",
			],
			config: {
				duplicates: "append",
				noAliasPropagation: true, // HACK: Excuse me, wtF
			},
			expected: {
				options: {foo: ["1", "2", undefined]},
				argv: ["--foo", "4"],
			},
		}]) assert.deepEqual(getOpts(input, optdef, {...config, terminator}), expected);
	});
});
