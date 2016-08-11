"use strict";

const getOpts = require("../index.js");
const assert  = require("chai").assert;


suite("Basic usage", function(){
	
	
	test("Bundled short-options", function(){
		
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
		}, {
			input: "-mvl2",
			expected: {
				argv: [],
				options: {
					messages: true,
					version: true,
					level: "2"
				}
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
		
		
		let result = getOpts(["-c0", "-u0"], {
			"-m, --mutilate":        "<bool>",
			"-u, --underline-urls":  "<bool>",
			"-i, --indent":          "<string>",
			"-c, --colour, --colours, --colourise": "<bool>"
		});
		assert.deepEqual(result, {
			argv: [],
			options: {
				c: "0",
				colour: "0",
				colours: "0",
				colourise: "0",
				u: "0",
				underlineUrls: "0"
			}
		});
	});
	
	
	
	test("Argument and option order", function(){
		
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
	
	
	test("Equals-sign assignment", function(){
		let tests = [{
			input: "--width=320 --config=/path/to/some/file",
			expected: {
				options: {
					width: "320",
					config: "/path/to/some/file"
				},
				argv: []
			}
		}];
		
		for(let i of tests){
			let result = getOpts(i.input.split(/\s+/g), {
				"-w, --width": "<number>",
				"-c, --config": "<string>"
			}, {noAliasPropagation: "first-only"});
			assert.deepEqual(result, i.expected);
		}
	});
	
	
	test("Variadic options", function(){
		
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
	
	
	
	test("Anonymous options", function(){
		
		let tests = [{
			input: "--something --size 640 480 --yea=nah unknown",
			expected: {
				options: {
					something: true,
					size: ["640", "480"],
					yea: "nah"
				},
				argv: ["unknown"]
			}
		},{
			input: "--something --size=640 480 --yea nah unknown",
			expected: {
				options: {
					something: true,
					size: "640",
					yea: "nah"
				},
				argv: ["480", "unknown"]
			}
		}];

		for(let i of tests){
			let result = getOpts(i.input.split(/\s+/g));
			assert.deepEqual(result, i.expected);
		}
	});
	
	
	
	test("Shell-style definitions", function(){
		
		let tests = [{
			input: ["abc", "-a -b -c"],
			expected: {
				argv: [],
				options: {
					a: true,
					b: true,
					c: true
				}
			}
		},{
			input: ["a:b:c:", "-a1 -b2 -c3"],
			expected: {
				argv: [],
				options: {
					a: "1",
					b: "2",
					c: "3"
				}
			}
		},{
			input: ["ab:c:de:f:", "-abc -c1 -d -ef"],
			expected: {
				argv: [],
				options: {
					a: true,
					b: "c",
					c: "1",
					d: true,
					e: "f"
				}
			}
		},{
			input: ["abc d:e2: f1:", "-a1b -bd2 -c2a"],
			expected: {
				argv: [],
				options: {
					a: true,
					b: true,
					d: "2",
					c: true,
					2: "a",
					1: "b"
				}
			}
		}];
		
		for(let i of tests){
			let result = getOpts(i.input[1].split(/\s+/g), i.input[0]);
			assert.deepEqual(result, i.expected);
		}
	});
});
