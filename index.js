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
		
		/** Split our parameter list by whitespace */
		params = params.split(/\s+/g);
		
		/** Remove punctuation added for readability */
		params = params.map(e => e.replace(/^<(.+?)>$|^\[(.+?)\]$|^\((.+?)\)$/gm, function(){
			return [].slice.call(arguments, 1, 4).filter(e => e).join("");
		}));
		
		
		this.params = [];
		this.values = [];
		for(let name of params){
			
			/** Make sure the parameter isn't blank */
			if(name){
				
				/** Check for an additional regex pattern to use for disambiguating bundled options */
				let splitName = name.match(/^([^=]+)(?:=(.+)?)?$/);
				
				this.params.push({
					name:      splitName[1],
					pattern:   splitName[2] || ".+"
				});
				
				if(/\.{3}$/.test(name))
					this.variadic = true;
			}
		}
	}
	
	
	/**
	 * Return a regex string for matching this option when expressed in bundled short-form.
	 *
	 * @return {String}
	 */
	getBundlePattern(){
		
		/** We've already generated this regex before; just return the cached result */
		if(this._bundlePattern)
			return this._bundlePattern;
		
		let param = this.params.map(p => "("+p.pattern+")?").join("");
		let names = this.shortNames.length === 1 ? this.shortNames[0] : ("[" + this.shortNames.join("") + "]");
		return (this._bundlePattern = names + param);
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



/**
 * Convert a kebab-cased-string into a camelCasedString.
 *
 * @param {String} input
 * @return {String}
 */
function kebabToCamelCase(input){
	return input.toLowerCase().replace(/([a-z])-+([a-z])/g, function(match, a, b){
		return a + b.toUpperCase();
	});
}


function getOpts(input, optdef, config){
	
	/** Optional options hash controlling option-creation */
	config           = config || {};
	let noCamelCase  = config.noCamelCase;
	let ignoreEquals = config.ignoreEquals;
	
	
	let shortNames   = {};
	let longNames    = {};
	let result       = {
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
		
		currentOption.names.forEach(n => {
			
			/** Decide whether to camelCase this option name */
			if(!noCamelCase && /-/.test(n))
				n = kebabToCamelCase(n);
			
			result.options[n] = optValue;
		});
		currentOption = null;
	};
	
	
	
	/** Tackle bundling: make sure there's at least one option with a short name to work with */
	let nameKeys = Object.keys(shortNames);
	let bundleMatch, bundlePatterns;
	
	if(nameKeys.length){
		bundlePatterns  = nameKeys.map(n => shortNames[n].getBundlePattern()).join("|");
		bundleMatch     = new RegExp("-("+bundlePatterns+")+", "g");
		bundlePatterns  = new RegExp(bundlePatterns, "g");
	}
	
	
	
	/** Is pre-processing of the argument list necessary? */
	if(!ignoreEquals || bundleMatch){
		
		/** Limit equals-sign expansion to items that begin with recognised option names */
		let legalNames = new RegExp("^(?:" + Object.keys(longNames).join("|") + ")=");
		
		for(let i = 0, l = input.length; i < l; ++i){
			let arg   = input[i];
			
			/** Expand bundled option clusters ("-mvl2" -> "-m -v -l 2") */
			if(bundleMatch.test(arg)){
				let segments = arg.match(bundlePatterns).map(m => {
					
					/** Obtain a pointer to the original Option instance that defined this short-name */
					let opt = shortNames["-"+m[0]];
					
					/** This option doesn't accept any arguments, so just keep it simple */
					if(!opt.arity)
						return ["-"+m[0]];
					
					let matches = m.match(new RegExp(opt.getBundlePattern())).slice(1).filter(i => i);
					return ["-"+m[0], ...matches];
				});
				
				segments = [].concat(...segments);
				input.splice(i, 1, ...segments);
				l = input.length;
				i += segments.length;
				console.log("Input is now: ", input);
				continue;
			}
			
			
			/** Expand "--option=value" sequences to become "--option value" */
			if(legalNames.test(arg)){
				let match = arg.match(/^([^=]+)=(.+)$/);
				input.splice(i, 1, match[1], match[2]);
				l = input.length;
				i += 2;
				continue;
			}
		}
	}
	
	
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
	"-n, --number-of-lines":  "<number=\\d+>",
	"-l, --level":            "<level>",
	"-t, --type":             "<type>",
	"-z, --set-size":         "[width=\\d+] [height=\\d+]",
	"-c, --set-config":       "<numbers=\\d+> <letters=[A-Za-z]+>",
	"-d, --delete-files":     "<safely> <files...>",
	"-s, -T, --set-type":     "<key> <type>"
});
console.log(pls);
