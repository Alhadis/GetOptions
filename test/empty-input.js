"use strict";

const getOpts = require("../index.js");
const {assert} = require("chai");


suite("Empty input", () => {
	const emptyResult = {
		options: new Object(null),
		argv: []
	};
	
	test("No arguments", () => {
		const actual = getOpts();
		assert.deepEqual(actual, emptyResult);
	});
	
	test("Options: Empty array", () => {
		const actual = getOpts([], {"-e": ""});
		assert.deepEqual(actual, emptyResult);
	});
	
	test("Options: Empty string", () => {
		const actual = getOpts("", {"-e": ""});
		assert.deepEqual(actual, emptyResult);
	});
	
	test("Options: Unexpected types", () => {
		const input = [NaN, false, null, true];
		for(const test of input)
			assert.deepEqual(getOpts(test, {"-e": ""}), emptyResult);
	});
	
	test("Optdef: Empty object", () => {
		const opts = ["--option=value"];
		const actual = getOpts(opts, {});
		assert.deepEqual(actual, {argv: opts, options: {}});
	});
	
	test("Optdef: Empty string", () => {
		const opts = ["--option=value"];
		const actual = getOpts(opts, "");
		assert.deepEqual(actual, {
			argv: [],
			options: {
				option: "value"
			}
		});
	});
	
	test("Optdef: Unexpected types", () => {
		const argv    = ["value"];
		const optdefs = [undefined, NaN, false, null, true];
		for(const test of optdefs)
			assert.deepEqual(getOpts(argv, test), {argv, options: {}});
	});
});
