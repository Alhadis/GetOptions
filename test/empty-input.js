"use strict";

const getOpts = require("../index.js");
const assert  = require("chai").assert;


suite("Empty input", function(){
	const emptyResult = {
		options: new Object(null),
		argv: []
	};
	
	test("No arguments", function(){
		const actual = getOpts();
		assert.deepEqual(actual, emptyResult);
	});
	
	test("Options: Empty array", function(){
		const actual = getOpts([], {"-e": ""});
		assert.deepEqual(actual, emptyResult);
	});
	
	test("Options: Empty string", function(){
		const actual = getOpts("", {"-e": ""});
		assert.deepEqual(actual, emptyResult);
	});
	
	test("Options: Unexpected types", function(){
		const input = [NaN, false, null, true];
		for(let i of input)
			assert.deepEqual(getOpts(i, {"-e": ""}), emptyResult);
	});
	
	test("Optdef: Empty object", function(){
		const opts = ["--option=value"];
		const actual = getOpts(opts, {});
		assert.deepEqual(actual, {argv: opts, options: {}});
	});
	
	test("Optdef: Empty string", function(){
		const opts = ["--option=value"];
		const actual = getOpts(opts, "");
		assert.deepEqual(actual, {
			argv: [],
			options: {
				option: "value"
			}
		});
	});
	
	test("Optdef: Unexpected types", function(){
		const argv    = ["value"];
		const optdefs = [undefined, NaN, false, null, true];
		for(let i of optdefs)
			assert.deepEqual(getOpts(argv, i), {argv, options: {}});
	});
});
