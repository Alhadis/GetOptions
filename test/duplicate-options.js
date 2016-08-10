"use strict";

const getOpts = require("../index.js");
const assert  = require("chai").assert;


suite("Duplicate option handling", function(){
	let optdef = {"-a, --arg": "<numbers=\\d+>"};
	let config = {
		noAliasPropagation: "first-only",
		duplicates: "use-first"
	};
	
	
	test("Mode: use-first", function(){
		
		let tests  = [{
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
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});
	
	
	test("Mode: use-last", function(){
		config.duplicates = "use-last";
		
		let tests  = [{
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
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});
	
	
	test("Mode: limit-first", function(){
		config.duplicates = "limit-first";
		
		let tests  = [{
			input: "--arg 1 alpha --arg 2 beta --arg 3 gamma --arg 4 delta",
			expected: {
				options: {arg: "1"},
				argv: ["alpha", "--arg", "2", "beta", "--arg", "3", "gamma", "--arg", "4", "delta"]
			}
		}];
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});
	
	
	test("Mode: limit-last", function(){
		config.duplicates = "limit-last";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		
		let tests  = [{
			input: "alpha --set-size 640 480 beta --set-size 800 600 gamma --set-size 1024 768",
			expected: {
				options: {setSize: ["1024", "768"]},
				argv: ["alpha", "--set-size", "640", "480", "beta", "--set-size", "800", "600", "gamma"]
			}
		}];
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});
	

	test("Mode: error", function(){
		config.duplicates = "error";

		let fn = () => {
			let input  = "--arg 1 alpha --arg 2";
			let optdef = {"-a, --arg": "<numbers=\\d+>"};
			return getOpts(input.split(/\s+/g), optdef, config);
		};
		
		assert.throw(fn, "Attempting to reassign option");
	});
	
	
	test("Mode: append", function(){
		config.duplicates = "append";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		
		let tests  = [{
			input: "--set-size 640 480 alpha --set-size 1024 768 beta",
			expected: {
				options: {setSize: ["640", "480", "1024", "768"]},
				argv: ["alpha", "beta"]
			}
		}];
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});


	test("Mode: stack", function(){
		config.duplicates = "stack";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		
		let tests  = [{
			input: "--set-size 640 480 alpha --set-size 1024 768 beta",
			expected: {
				options: {setSize: [["640", "480"], ["1024", "768"]]},
				argv: ["alpha", "beta"]
			}
		}];
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});
	
	
	
	test("Mode: stack-values", function(){
		config.duplicates = "stack-values";
		optdef = {"-s, --set-size": "<width=\\d+> <height=\\d+>"};
		
		let tests  = [{
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
		
		for(let i of tests)
			assert.deepEqual(getOpts(
				i.input.split(/\s+/g),
				optdef,
				config
			), i.expected);
	});
	


	
});
