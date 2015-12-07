#!/usr/bin/env node --es_staging
"use strict";

let fs         = require("fs");
let util       = require("util");
let Chai       = require("chai");
let assert     = Chai.assert;

let getOpts    = require("../index.js");
let testConfig = JSON.parse(fs.readFileSync("./test/tests.json"));

describe("getOpts()", function(){
	
	for(let test of testConfig){
		let name     = test.name;
		let input    = test.input;
		let optdef   = test.optdef;
		let config   = test.config;
		let expected = test.expected;

		/** Normalise our input to ensure we're always dealing with arrays */
		if("string" === typeof input) input    = [input];
		if(!Array.isArray(expected))  expected = [expected];
		
		input.forEach((value, index) => {
			let description = name ? (/%[sdj%]/.test(name) ? util.format(name, value) : name) : util.format("Correctly parse %j", value);
			
			it(description, function(){
				let args   = [value.split(/\s+/g), optdef, config];
				let result = getOpts.apply(null, args);
				
				assert.deepEqual(result, expected[index]);
			});
		});
	}
});
