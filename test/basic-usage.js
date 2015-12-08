"use strict";

let getOpts = require("../index.js");
let Chai    = require("chai");
let assert  = Chai.assert;
Chai.should();


describe("Basic usage", function(){
	
	
	it("Parse bundled short-options", function(){
		
		let tests  = [{
			input: "-hvn2",
			expected: {
				options: {
					help: true,
					version: true,
					numberOfLines: "2"
				},
				argv: []
			}
		}, {
			input: "-r10 20 -vn55id2",
			expected: {
				options: {
					range: ["10", "20"],
					version: true,
					numberOfLines: "55",
					invertMatches: true,
					debugLevel: "2"
				},
				argv: []
			}
		}];
		
		for(let i of tests){
			let result = getOpts(i.input.split(/\s+/g), {
				"-h, --help, --usage":    "",
				"-v, --version":          "",
				"-n, --number-of-lines":  "<number=\\d+>",
				"-m, --messages":         "",
				"-i, --invert-matches":   "",
				"-l, --level":            "<number=\\d+>",
				"-d, --debug-level":      "<number=\\d+>",
				"-c, --config":           "<key> <value>",
				"-r, --range":            "<min=\\d+> <max=\\d+>"
			}, {noAliasPropagation: "first-only"});
			
			assert.deepEqual(result, i.expected);
		}
	});
	
	
	
	it("Maintain correct argument and option order", function(){
		
		let tests  = [{
			input: "-l 2 --set-size 640 480 -s alpha beta gamma",
			expected: {
				options: {
					level: "2",
					setSize: ["640", "480"],
					setType: ["alpha", "beta"]
				},
				argv: ["gamma"]
			}
		}, {
			input: "foo -l 2 bar --set-size 640 480 760 -s alpha beta gamma",
			expected: {
				options: {
					level: "2",
					setSize: ["640", "480"],
					setType: ["alpha", "beta"]
				},
				argv: ["foo", "bar", "760", "gamma"]
			}
		}];
		
		for(let i of tests){
			
			let result = getOpts(i.input.split(/\s+/g), {
				"-l, --level":            "<level>",
				"-t, --type":             "<type>",
				"-z, --set-size":         "[width=\\d+] [height=\\d+]",
				"-c, --set-config":       "<numbers=\\d+> <letters=[A-Za-z]+>",
				"-d, --delete-files":     "<safely> <files...>",
				"-s, -T, --set-type":     "<key> <type>"
			}, {noAliasPropagation: "first-only"});
			
			assert.deepEqual(result, i.expected);
		}
		
	});
	
	
	
	it("Parse variadic options", function(){
		
		let tests  = [{
			input: "-f one two three four five",
			expected: {
				options: {
					files: ["one", "two", "three", "four", "five"]
				},
				argv: []
			}
		}, {
			input: "-f one two three 4 5 -lA3 uno dos tres cuatro -n Ajaja",
			expected: {
				options: {
					files: ["one", "two", "three", "4", "5"],
					list:  ["A", "3", "uno", "dos", "tres", "cuatro"],
					name:  "Ajaja"
				},
				argv: []
			}
		}];
		
		for(let i of tests){
			let result = getOpts(i.input.split(/\s+/g), {
				"-f, --files":  "<list...>",
				"-l, --list":   "<letter=[A-Za-z]> <integer=\\d+> <mystery...>",
				"-n, --name":   "<name>"
			}, {noAliasPropagation: "first-only"});
			
			assert.deepEqual(result, i.expected);
		}
	});
	
});
