"use strict";

const getOpts = require("../index.js");
const {assert} = require("chai");


suite("Duplicate option handling", () => {
	let optdef = {"-a, --arg": "<numbers=\\d+>"};
	let config = {
		noAliasPropagation: "first-only",
		duplicates: "use-first"
	};
	
	
	test("Mode: use-first", () => {
		const tests = [{
			input: "--arg 1 alpha --arg 2 beta --arg 3 gamma --arg 4 delta",
			expected: {
				options: {arg: "1"},
				argv: ["alpha", "beta", "gamma", "delta"]
			}
		}, {
			input: "alpha beta --arg alpha --arg 2 --arg 2 gamma --arg 3 delta --arg 4 epsilon",
			expected: {
				options: {arg: "alpha"},
				argv: ["alpha", "beta", "gamma", "delta", "epsilon"]
			}
		}];
		
		for(const test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});
	
	
	test("Mode: use-last", () => {
		config.duplicates = "use-last";
		const tests = [{
			input: "--arg 1 alpha --arg 2 beta --arg 3 gamma --arg 4 delta",
			expected: {
				options: {arg: "4"},
				argv: ["alpha", "beta", "gamma", "delta"]
			}
		}, {
			input: "alpha beta --arg alpha --arg 2 --arg 2 gamma --arg 3 delta --arg 4 epsilon",
			expected: {
				options: {arg: "4"},
				argv: ["alpha", "beta", "gamma", "delta", "epsilon"]
			}
		}];
		
		for(let test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});
	
	
	test("Mode: limit-first", () => {
		config.duplicates = "limit-first";
		const tests = [{
			input: "--arg 1 alpha --arg 2 beta --arg 3 gamma --arg 4 delta",
			expected: {
				options: {arg: "1"},
				argv: ["alpha", "--arg", "2", "beta", "--arg", "3", "gamma", "--arg", "4", "delta"]
			}
		}];
		for(const test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});
	
	
	test("Mode: limit-last", () => {
		config.duplicates = "limit-last";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		const tests = [{
			input: "alpha --set-size 640 480 beta --set-size 800 600 gamma --set-size 1024 768",
			expected: {
				options: {setSize: ["1024", "768"]},
				argv: ["alpha", "--set-size", "640", "480", "beta", "--set-size", "800", "600", "gamma"]
			}
		}];
		for(const test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});
	

	test("Mode: error", () => {
		config.duplicates = "error";
		assert.throw(() => {
			const input = "--arg 1 alpha --arg 2";
			const optdef = {"-a, --arg": "<numbers=\\d+>"};
			return getOpts(input.split(/\s+/g), optdef, config);
		}, "Attempting to reassign option");
	});
	
	
	test("Mode: append", () => {
		config.duplicates = "append";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		const tests = [{
			input: "--set-size 640 480 alpha --set-size 1024 768 beta",
			expected: {
				options: {setSize: ["640", "480", "1024", "768"]},
				argv: ["alpha", "beta"]
			}
		}];
		for(const test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});


	test("Mode: stack", () => {
		config.duplicates = "stack";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		const tests = [{
			input: "--set-size 640 480 alpha --set-size 1024 768 beta",
			expected: {
				options: {setSize: [["640", "480"], ["1024", "768"]]},
				argv: ["alpha", "beta"]
			}
		}];
		for(const test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});
	
	
	test("Mode: stack-values", () => {
		config.duplicates = "stack-values";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		const tests = [{
			input: "--set-size 640 480 alpha --set-size 1024 768 beta",
			expected: {
				options: {setSize: [["640", "1024"], ["480", "768"]]},
				argv: ["alpha", "beta"]
			}
		}, {
			input: "--set-size 640 --set-size 1024 768 alpha",
			expected: {
				options: {setSize: [["640", "1024"], [, "768"]]},
				argv: ["alpha"]
			}
		}];
		for(const test of tests)
			assert.deepEqual(getOpts(
				test.input.split(/\s+/g),
				optdef,
				config
			), test.expected);
	});
});
