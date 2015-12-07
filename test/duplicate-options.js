"use strict";

let getOpts = require("../index.js");
let Chai    = require("chai");
let assert  = Chai.assert;
Chai.should();


describe("Duplicate option handling", function(){
	let optdef = {"-a, --arg": "<numbers=\\d+>"};
	let config = {
		noAliasPropagation: "first-only",
		multipleOptions: "use-first"
	};
	
	
	it("Mode: use-first", function(){
		
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
	
	
	it("Mode: use-last", function(){
		config.multipleOptions = "use-last";
		
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
	
	
	it("Mode: limit-first", function(){
		config.multipleOptions = "limit-first";
		
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
	
	
	it("Mode: limit-last", function(){
		config.multipleOptions = "limit-last";
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
	

	it("Mode: error", function(){
		config.multipleOptions = "error";

		let fn = () => {
			let input  = "--arg 1 alpha --arg 2";
			let optdef = {"-a, --arg": "<numbers=\\d+>"};
			return getOpts(input.split(/\s+/g), optdef, config);
		};
		
		assert.throw(fn, "Attempting to reassign option");
	});
	
	
	it("Mode: append", function(){
		config.multipleOptions = "append";
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


	it("Mode: stack", function(){
		config.multipleOptions = "stack";
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
	
	
	
	it("Mode: stack-values", function(){
		config.multipleOptions = "stack-values";
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
