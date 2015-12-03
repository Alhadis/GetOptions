#!/usr/local/bin/node --es_staging
"use strict";


class OptionParam{
	
	constructor(key){
		this.names = key.split(/\|/g);
		this.enum  = this.names.length > 1;
	}
}



class Option{
	
	constructor(names, params){
		let shortNames = {};
		let longNames  = {};
		
		/** Define the Option's names, both long and short forms */
		if(!Array.isArray(names))
			names = (""+names).split(/,/g);
		
		let match;
		for(let i of names){
			i = i.trim();
			
			/** Short option */
			if(match = i.match(/^-(\w)$/))
				shortNames[match[1]] = true;
			
			/** Long option */
			else longNames[i.replace(/^-+/, "")] = true;
		}
		
		this.shortNames  = Object.keys(shortNames);
		this.longNames   = Object.keys(longNames);
		
		
		
		/** Parameters accepted/expected by this Option */
		if(Array.isArray(params))
			params = params.join(" ");
		
		/** Remove punctuation added for readability */
		params = params.replace(/[<\[\]\(\)\{\}>]/g, "");
		
		/** Split our cleaned-up params list by whitespace */
		params = params.split(/\s+/g);
		
		this.params = [];
		for(let i of params)
			this.params.push(new OptionParam(i));
	}
}



function getOpts(input, optdef){
	let shortNames = {};
	let longNames  = {};

	
	for(let i in optdef){
		let option = new Option(i, optdef[i]);
		
		option.shortNames.forEach(n => {
			
			/** Don't allow duplicate option definitions */
			if(shortNames[n] !== undefined)
				throw new ReferenceError(`Short option "-${n}" already defined`);
			
			shortNames[n] = option;
		});
		
		option.longNames.forEach(n => {
			
			/** Again, don't allow duplicate option names; that probably isn't what the author intended */
			if(longNames[n] !== undefined)
				throw new ReferenceError(`Long option "--${n}" already defined`);
			
			longNames[n] = option;
		});
	}
	
	for(let i = 0, l = input.length; i < l; ++i){
		let arg = input[i];
		console.log(longNames);
	}
}



let argv = [
	"--set-config", "path", "~/.files/something", "subcommand", "subcommand-param"
];

getOpts(argv, {
	"-h, --help, --usage":    "",
	"-v, --version":          "",
	"-n, --number-of-lines":  "<number>",
	"-l, --level":            "<level>",
	"-t, --type":             "<normal|super|large>",
	"-z, --set-size":         "<small|medium|large>",
	"-c, --set-config":       "<key> <value>",
	"-d, --delete-files":     "<safely> <files...>",
	"-s, -T, --set-type":     "<key> <normal|super|large>"
});
