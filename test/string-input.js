"use strict";

const getOpts = require("../index.js");
const {assert} = require("chai");


suite("String input", () => {
	const expect = (input, optdef, output) => {
		const msg = `Parsing ${input}`;
		assert.deepEqual(getOpts(input, optdef), output, msg);
	};
	
	test("Basic value: Single", () =>
		expect("--foo", {"--foo": ""}, {
			argv: [],
			options: {foo: true},
		}));
	
	test("Basic value: Multiple", () => {
		expect("--foo bar", {"--foo": ""}, {
			argv: ["bar"],
			options: {foo: true},
		});
		expect("--foo bar", {"--foo": "string"}, {
			argv: [],
			options: {foo: "bar"},
		});
		expect("--foo --bar baz", {
			"--foo": "string",
			"--bar": "string",
		}, {
			argv: [],
			options: {
				foo: undefined,
				bar: "baz",
			},
		});
		expect("--foo baz --bar qux", {
			"--foo": "string",
			"--bar": "string",
		}, {
			argv: [],
			options: {
				foo: "baz",
				bar: "qux",
			},
		});
	});

	
	test("Quotes: Basic usage", () => {
		expect('"--foo" "--bar"', {"--foo": "", "--bar": ""}, {
			argv: [],
			options: {
				foo: true,
				bar: true,
			},
		});
		expect('"--foo --bar"', {"--foo": "", "--bar": ""}, {
			argv: ["--foo --bar"],
			options: {},
		});
		expect('--foo "bar baz"', {"--foo": "string"}, {
			argv: [],
			options: {foo: "bar baz"},
		});
	});
	
	
	test("Quotes: Nested", () => {
		expect("--foo \"--bar='qux'\"", {"--foo": ""}, {
			argv: ["--bar='qux'"],
			options: {foo: true},
		});
		expect("--foo baz --bar='qux \" \" qul' 123", {
			"--foo": "string",
			"--bar": "string",
		}, {
			argv: ["123"],
			options: {
				foo: "baz",
				bar: 'qux " " qul',
			},
		});
	});
	
	
	test("Escapes: Delimiters", () => {
		expect("--foo bar\\ baz", {"--foo": "string"}, {
			argv: [],
			options: {foo: "bar baz"},
		});
		expect("--foo bar\\ baz", {"--foo": ""}, {
			argv: ["bar baz"],
			options: {foo: true},
		});
	});
	
	
	test("Escapes: Consecutive", () => {
		expect("--foo bar\\ \\ baz", {"--foo": "string"}, {
			argv: [],
			options: {foo: "bar  baz"},
		});
		expect("--foo bar\\ \\ baz", {"--foo": ""}, {
			argv: ["bar  baz"],
			options: {foo: true},
		});
	});
	
	
	test("Escapes: Bare quotes", () => {
		expect("--foo bar\\'s baz", {"--foo": "string"}, {
			argv: ["baz"],
			options: {foo: "bar's"},
		});
		expect('--foo bar\\"s baz', {"--foo": "string"}, {
			argv: ["baz"],
			options: {foo: 'bar"s'},
		});
		expect('--title="Foo \\"Bar\\" Baz"', {"--title": "string"}, {
			argv: [],
			options: {title: 'Foo "Bar" Baz'},
		});
	});
	
	
	test("Escapes: Between quotes", () => {
		expect("--title='Foo\\'s Bar' bar", {"--title": "string"}, {
			argv: ["bar"],
			options: {title: "Foo's Bar"},
		});
		expect("--title='Foo \\\"Bar\\\" Baz'", {"--title": "string"}, {
			argv: [],
			options: {title: 'Foo \\"Bar\\" Baz'},
		});
		expect("--title '\\\"bar\\\"'", {"--title": "string"}, {
			argv: [],
			options: {title: '\\"bar\\"'},
		});
		expect('--title "\\\'bar\\\'"', {"--title": "string"}, {
			argv: [],
			options: {title: "\\'bar\\'"},
		});
	});
	
	
	test("Escapes: Dashes", () => {
		expect("bar\\-baz",   {"-b, --baz": ""}, {argv: ["bar-baz"],   options: {}});
		expect('"bar\\-baz"', {"-b, --baz": ""}, {argv: ["bar\\-baz"], options: {}});
		expect("\\--foo",     {"--foo": ""},     {argv: [],            options: {foo: true}});
		expect("\\ --foo",    {"--foo": ""},     {argv: [" --foo"],    options: {}});
		expect('"\\--foo"',   {"--foo": ""},     {argv: ["\\--foo"],   options: {}});
		expect('"\\\\--foo"', {"--foo": ""},     {argv: ["\\--foo"],   options: {}});
		
		// Assert that parsing esaped option-strings won't have affect arrays
		expect(["\\--foo"],     {"--foo": ""}, {argv: ["\\--foo"],     options: {}});
		expect(["\\ --foo"],    {"--foo": ""}, {argv: ["\\ --foo"],    options: {}});
		expect(['"\\--foo"'],   {"--foo": ""}, {argv: ['"\\--foo"'],   options: {}});
		expect(['"\\\\--foo"'], {"--foo": ""}, {argv: ['"\\\\--foo"'], options: {}});
	});
});
