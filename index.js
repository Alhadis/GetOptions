#!/usr/local/bin/node --es_staging
"use strict";



class Option{
	
	/**
	 * Create a new Option instance.
	 *
	 * @param {String|Array} names  - Comma-separated list of names (e.g., "-l, --long-list, --length")
	 * @param {String}       params - List of args the option expects (e.g., "<num> <type>" or "[num] [type]", etc)
	 * @constructor
	 */
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
		this.values = [];
		for(let name of params){
			if(name){
				this.params.push(name);
				if(/\.{3}$/.test(name))
					this.variadic = true;
			}
		}
	}
	
	
	
	/**
	 * Return the number of parameters this option expects/accepts.
	 *
	 * @readonly
	 * @return {Number}
	 */
	get arity(){
		return this.params ? this.params.length : 0;
	}
	
	
	/**
	 * Return an array of all names this Option recognises, long or short.
	 *
	 * @readonly
	 * @return {Array}
	 */
	get names(){
		return this.shortNames.concat(this.longNames);
	}
	
	
	/**
	 * Whether or not the Option still has room for remaining parameters.
	 *
	 * @readonly
	 * @return {Boolean}
	 */
	get canCollect(){
		return this.variadic || this.values.length < this.params.length;
	}
}



function getOpts(input, optdef){
	let shortNames = {};
	let longNames  = {};
	let result     = {
		options: new Object(null),
		argv:    []
	};

	
	for(let i in optdef){
		let option = new Option(i, optdef[i]);
		
		option.shortNames.forEach(n => {
			
			/** Don't allow duplicate option definitions */
			if(shortNames[n] !== undefined)
				throw new ReferenceError(`Short option "-${n}" already defined`);
			
			shortNames["-"+n] = option;
		});
		
		option.longNames.forEach(n => {
			
			/** Again, don't allow duplicate option names; that obviously isn't what the author intended */
			if(longNames[n] !== undefined)
				throw new ReferenceError(`Long option "--${n}" already defined`);
			
			longNames["--"+n] = option;
		});
	}
	
	
	/** Pointer to the option that's currently picking up arguments */
	let currentOption;
	
	
	/** Pushes the contents of the current option into result.options and resets the pointer */
	let wrapItUp = () => {
		let optValue = currentOption.values;
		
		/** Don't store solitary values in an array. Store them directly as strings */
		if(currentOption.arity === 1)
			optValue = optValue[0];
		
		currentOption.names.forEach(n => {result.options[n] = optValue});
		currentOption = null;
	};
	
	
	
	/** Start processing the arguments we were given to handle */
	for(let i = 0, l = input.length; i < l; ++i){
		let arg = input[i];
		let opt = shortNames[arg] || longNames[arg];
		
		
		/** This argument matches a recognised option name */
		if(opt){
			
			/** Did we have an existing option that was collecting values? */
			if(currentOption) wrapItUp();
			
			
			/** This option takes at least one argument */
			if(opt.arity)
				currentOption = opt;
			
			/** This option takes no arguments, so just assign it a value of "true" */
			else opt.names.forEach(n => {result.options[n] = true});
		}
		
		
		else{
			/** A previous option is still collecting arguments */
			if(currentOption && currentOption.canCollect)
				currentOption.values.push(arg);
			
			/** Not an option's argument, just a... "regular" argument or something */
			else{
				result.argv.push(arg);
				
				/** If there was an option collecting stuff, show it the door */
				currentOption && wrapItUp();
			}
		}
	}
	
	
	/** Ended abruptly? */
	if(currentOption) wrapItUp();
	
	return result;
}



let process = require("process");

let pls = getOpts(process.argv, {
	"-h, --help, --usage":    "",
	"-v, --version":          "",
	"-n, --number-of-lines":  "<number>",
	"-l, --level":            "<level>",
	"-t, --type":             "<type>",
	"-z, --set-size":         "<size>",
	"-c, --set-config":       "<key> <value>",
	"-d, --delete-files":     "<safely> <files...>",
	"-s, -T, --set-type":     "<key> <type>"
});
console.log(pls);
