"use strict";

/**
 * Class used internally to represent individual options.
 * @internal
 */
class Option{
	
	/**
	 * Create a new Option instance.
	 *
	 * @param {String|Array} names - Comma-separated list of names.
	 * @param {String|Array} params - Arguments which the option expects.
	 * @example new Option("-l, --long-list, --length", "<num> <type>")
	 * @example new Option("-e, --exec", "[num] [type]")
	 * @constructor
	 */
	constructor(names, params = ""){
		this.shortNames = [];
		this.longNames  = [];
		this.params     = [];
		this.values     = [];
		
		this.defineNames(names);
		this.defineParams(params);
	}
	
	
	/**
	 * Describe the names used to refer to this option.
	 * 
	 * @param {String|Array} input
	 * @internal
	 */
	defineNames(input){
		if(!Array.isArray(input))
			input = String(input).split(/,/g);
		
		for(let name of input){
			name = name.trim();
			/^-([^\s-])$/.test(name)
				? this.shortNames.push(RegExp.lastParen)
				: this.longNames.push(name.replace(/^-+/, ""));
		}
	}
	
	
	/**
	 * Describe the parameters this option accepts/expects.
	 *
	 * @param {String|Array} input
	 * @internal
	 */
	defineParams(input){
		input = Array.isArray(input)
			? input.filter(Boolean).join(" ")
			: String(input).trim().split(/\s+/g);
		
		// Strip any enclosing brackets added for readability
		input = input.map(param => param.replace(/^<(.+?)>$|^\[(.+?)\]$|^\((.+?)\)$/gm, (...args) =>
			args.slice(1, 4).filter(Boolean).join("")));
		
		for(const param of input){
			if(!param) continue;
			const [, name, pattern=".+"] = param.match(/^([^=]+)(?:=(.+)?)?$/);
			this.params.push({name, pattern});
			if(/\.{3}$/.test(name))
				this.variadic = true;
		}
	}
	
	
	/**
	 * Pattern to match option when expressed in bundled short-form.
	 *
	 * @readonly
	 * @return {String}
	 */
	get bundlePattern(){
		
		// Use a cached result if possible
		if(this._bundlePattern)
			return this._bundlePattern;
		
		const param = this.params.map(param => `(${param.pattern})?`).join("");
		const names = 1 === this.shortNames.length
			? this.shortNames[0]
			: `[${this.shortNames.join("")}]`;
		return (this._bundlePattern = names + param);
	}
	
	
	/**
	 * Number of parameters this option expects/accepts.
	 *
	 * @readonly
	 * @property {Number}
	 */
	get arity(){
		return this.params ? this.params.length : 0;
	}
	
	
	/**
	 * Array of names recognised by the option, both long and short.
	 *
	 * @readonly
	 * @property {Array}
	 */
	get names(){
		return this.shortNames.concat(this.longNames);
	}
	
	
	/**
	 * Whether the option can accept another parameter.
	 *
	 * @readonly
	 * @property {Boolean}
	 */
	get canCollect(){
		return !!(this.variadic || this.values.length < this.params.length);
	}
}



/**
 * Box a value inside an {@link Array}, unless it already is one.
 *
 * @example arrayify(1)   => [1]
 * @example arrayify([1]) => [1]
 * @param {*} input
 * @return {Array}
 * @internal
 */
function arrayify(input){
	return Array.isArray(input) ? input : [input];
}


/**
 * Strip leading dashes from an option name and convert it to camelCase.
 *
 * @param {String} input - An option's name, such as "--write-to"
 * @param {Boolean} noCamelCase - Strip leading dashes only
 * @return {String}
 * @internal
 */
function formatName(input, noCamelCase){
	input = input.replace(/^-+/, "");
	
	// Convert kebab-case to camelCase
	if(!noCamelCase && /-/.test(input))
		input = input.toLowerCase().replace(/([a-z])-+([a-z])/g, (_, a, b) => a + b.toUpperCase());
	
	return input;
}


/**
 * Test a string against a list of patterns.
 *
 * @param {String} input
 * @param {String[]|RegExp[]} patterns
 * @return {Boolean}
 * @internal
 */
function match(input, patterns = []){
	if(!patterns || 0 === patterns.length)
		return false;
	
	input    = String(input);
	patterns = arrayify(patterns).filter(Boolean);
	for(const pattern of patterns)
		if((pattern === input && "string" === typeof pattern)
		|| (pattern instanceof RegExp) && pattern.test(input))
			return true;
	return false;
}


/**
 * Filter duplicate strings from an array.
 *
 * @param {String[]} input
 * @return {Array}
 * @internal
 */
function uniqueStrings(input){
	const output = {};
	for(let i = 0, l = input.length; i < l; ++i)
		output[input[i]] = true;
	return Object.keys(output);
}


/**
 * Parse a string as a whitespace-delimited list of options,
 * preserving quoted and escaped characters.
 *
 * @example unstringify("--foo --bar")     => ["--foo", "--bar"];
 * @example unstringify('--foo "bar baz"') => ["--foo", '"bar baz"'];
 * @param {String} input
 * @return {Object}
 * @internal
 */
function unstringify(input){
	input = String(input || "");
	const tokens   = [];
	const {length} = input;
	
	let quoteChar  = "";    // Quote-type enclosing current region
	let tokenData  = "";    // Characters currently being collected
	let isEscaped  = false; // Flag identifying an escape sequence
	
	for(let i = 0; i < length; ++i){
		const char = input[i];
		
		// Previous character was a backslash
		if(isEscaped){
			tokenData += char;
			isEscaped = false;
			continue;
		}
		
		// Whitespace: terminate token unless quoted
		if(!quoteChar && /[ \t\n]/.test(char)){
			tokenData && tokens.push(tokenData);
			tokenData = "";
			continue;
		}
		
		// Backslash: escape next character
		if("\\" === char){
			isEscaped = true;
			
			// Swallow backslash if it escapes a metacharacter
			const next = input[i + 1];
			if(quoteChar && (quoteChar === next || "\\" === next)
			|| !quoteChar && /[- \t\n\\'"`]/.test(next))
				continue;
		}
		
		// Quote marks
		else if((!quoteChar || char === quoteChar) && /['"`]/.test(char)){
			quoteChar = quoteChar === char ? "" : char;
			continue;
		}
		
		tokenData += char;
	}
	if(tokenData)
		tokens.push(tokenData);
	return tokens;
}


/**
 * Parse input using "best guess" logic. Called when no optdef is passed.
 *
 * Essentially, the following assumptions are made about input:
 *
 * - Anything beginning with at least one dash is an option name
 * - Options without arguments mean a boolean "true"
 * - Option-reading stops at "--"
 * - Anything caught between two options becomes the first option's value
 *
 * @param {Array} input
 * @param {Object} [config={}]
 * @return {Object}
 * @internal
 */
function autoOpts(input, config = {}){
	const opts = new Object(null);
	const argv = [];
	let argvEnd;
	
	// Bail early if passed a blank string
	if(!input) return opts;
	
	// Stop parsing options after a double-dash
	const stopAt = input.indexOf("--");
	if(stopAt !== -1){
		argvEnd = input.slice(stopAt + 1);
		input = input.slice(0, stopAt);
	}
	
	for(let i = 0, l = input.length; i < l; ++i){
		let name = input[i];
		
		// Appears to be an option
		if(/^-/.test(name)){
			
			// Equals sign is used, should it become the option's value?
			if(!config.ignoreEquals && /=/.test(name)){
				const split = name.split(/=/);
				name        = formatName(split[0], config.noCamelCase);
				opts[name]  = split.slice(1).join("=");
			}
			
			else{
				name = formatName(name, config.noCamelCase);
				
				// Treat a following non-option as this option's value
				const next = input[i + 1];
				if(next != null && !/^-/.test(next)){
					
					// There's another option after this one. Collect multiple non-options into an array.
					const nextOpt = input.findIndex((s, I) => I > i && /^-/.test(s));
					if(nextOpt !== -1){
						opts[name] = input.slice(i + 1, nextOpt);
						
						// There's only one value to store; don't wrap it in an array
						if(nextOpt - i < 3)
							opts[name] = opts[name][0];
						
						i = nextOpt - 1;
					}
					
					// We're at the last option. Don't touch argv; assume it's a boolean-type option
					else opts[name] = true;
				}
				
				// No arguments defined. Assume it's a boolean-type option.
				else opts[name] = true;
			}
		}
		
		// Non-option: add to argv
		else argv.push(name);
	}
	
	
	// Add any additional arguments that were found after a "--" delimiter
	if(argvEnd)
		argv.push(...argvEnd);
	
	return {
		options: opts,
		argv:    argv,
	};
}



/**
 * Extract command-line options from a list of strings.
 *
 * @param {String|Array} input
 * @param {String|Object} [optdef=null]
 * @param {Object} [config={}]
 */
function getOpts(input, optdef = null, config = {}){
	
	// Do nothing if given nothing
	if(!input || 0 === input.length)
		return {options: {}, argv: []};
	
	// Avoid modifying original array
	if(Array.isArray(input))
		input = [...input].map(String);
	
	// If called with a string, break it apart into an array
	else if("string" === typeof input)
		input = unstringify(input);
	
	
	// Take a different approach if optdefs aren't specified
	if(null === optdef || "" === optdef || false === optdef)
		return autoOpts(input, config);
	
	
	// Allow "t:h:i:s" style of getopt usage
	if("[object String]" === Object.prototype.toString.call(optdef)){
		const names = optdef.match(/[^\s:]:?/g);
		optdef = {};
		names.forEach(name => {
			optdef[`-${name.replace(/:/, "")}`] = name.length > 1 ? "<arg>" : "";
		});
	}

	// Parse settings that affect runtime option-handling
	const {
		noAliasPropagation,
		noCamelCase,
		noBundling,
		noMixedOrder,
		noUndefined,
		terminator,
		ignoreEquals,
		duplicates = "use-last",
	} = config;
	
	const shortNames = {};
	const longNames = {};
	const result = {argv: [], options: new Object(null)};

	// Define each named option. Throw an error if a duplicate is found.
	for(const name in optdef){
		const option = new Option(name, optdef[name]);
		
		for(const name of option.shortNames){
			if(undefined !== shortNames[name])
				throw new ReferenceError(`Short option "-${name}" already defined`);
			shortNames[`-${name}`] = option;
		}
		
		for(const name of option.longNames){
			if(undefined !== longNames[name])
				throw new ReferenceError(`Long option "--${name}" already defined`);
			longNames[`--${name}`] = option;
		}
	}
	
	// Pointer to the option that's currently picking up arguments
	let currentOption;
	
	
	// Manage duplicated option values
	function resolveDuplicate(option, name, value){
		switch(duplicates){
			
			// Use the first value (or set of values); discard any following duplicates
			case "use-first":
				return result.options[name];
			
			// Use the last value (or set of values); discard any preceding duplicates. Default.
			case "use-last":
			default:
				return result.options[name] = value;
			
			// Use the first/last options; treat any following/preceding duplicates as argv items respectively
			case "limit-first":
			case "limit-last":
				result.argv.push(option.prevMatchedName, ...arrayify(value));
				break;
			
			// Throw an exception
			case "error":
				const error = new TypeError(`Attempting to reassign option "${name}" with value(s) ${JSON.stringify(value)}`);
				error.affectedOption = option;
				error.affectedValue  = value;
				throw error;
			
			// Add parameters of duplicate options to the argument list of the first
			case "append":
				const oldValues = arrayify(result.options[name]);
				const newValues = arrayify(value);
				result.options[name] = oldValues.concat(newValues);
				break;
			
			// Store parameters of duplicated options in a multidimensional array
			case "stack": {
				let oldValues   = result.options[name];
				const newValues = arrayify(value);
				
				// This option hasn't been "stacked" yet
				if(!option.stacked){
					oldValues            = arrayify(oldValues);
					result.options[name] = [oldValues, newValues];
					option.stacked       = true;
				}
				
				// Already "stacked", so just shove the values onto the end of the array
				else result.options[name].push(arrayify(newValues));
				
				break;
			}
			
			// Store each duplicated value in an array using the order they appear
			case "stack-values": {
				let values = result.options[name];
				
				// First time "stacking" this option (nesting its value/s inside an array)
				if(!option.stacked){
					const stack = [];
					for(const value of arrayify(values))
						stack.push([value]);
					values = stack;
					option.stacked = true;
				}
				
				arrayify(value).forEach((v, i) => {
					
					// An array hasn't been created at this index yet,
					// because an earlier option wasn't given enough parameters.
					if(undefined === values[i])
						values[i] = Array(values[0].length - 1);
					
					values[i].push(v);
				});
				
				result.options[name] = values;
				break;
			}
		}
	}
	
	
	// Assign an option's parsed value to the result's `.options` property
	function setValue(option, value){
		
		// Assign the value only to the option name it matched
		if(noAliasPropagation){
			let name = option.lastMatchedName;
			
			// Special alternative:
			// In lieu of using the matched option name, use the first --long-name only
			if("first-only" === noAliasPropagation)
				name = option.longNames[0] || option.shortNames[0];
			
			// camelCase?
			name = formatName(name, noCamelCase);
			
			// This option's already been set before
			if(result.options[name])
				resolveDuplicate(option, name, value);
			
			else result.options[name] = value;
		}
		
		// Copy across every alias this option's recognised by
		else{
			const {names} = option;
			
			// Ascertain if this option's being duplicated
			if(result.options[ names[0] ])
				value = resolveDuplicate(option, value);
			
			
			option.names.forEach(name => {
				
				// Decide whether to camelCase this option name
				name = formatName(name, noCamelCase);
				
				result.options[name] = value;
			});
		}
	}
	
	
	// Push whatever we've currently collected for this option and reset pointer
	function wrapItUp(){
		let optValue = currentOption.values;
		
		// Don't store solitary values in an array. Store them directly as strings
		if(1 === currentOption.arity && !currentOption.variadic)
			optValue = optValue[0];

		setValue(currentOption, optValue);
		currentOption.values = [];
		currentOption = null;
	}
	
	
	// Reverse the order of an argument list, keeping options and their parameter lists intact
	function flip(input){
		input = input.reverse();
		
		// Flip any options back into the right order
		for(let i = 0, l = input.length; i < l; ++i){
			const arg = input[i];
			const opt = shortNames[arg] || longNames[arg];
			
			if(opt){
				const from    = Math.max(0, i - opt.arity);
				const to      = i + 1;
				const extract = input.slice(from, to).reverse();
				input.splice(from, extract.length, ...extract);
			}
		}
		
		return input;
	}
	
	
	// Tackle bundling. Ensure there's at least one option with a short name to work with.
	const nameKeys = Object.keys(shortNames);
	let bundleMatch, bundlePatterns, niladicArgs;
	
	if(!noBundling && nameKeys.length){
		bundlePatterns  = uniqueStrings(nameKeys.map(n => shortNames[n].bundlePattern)).join("|");
		bundleMatch     = new RegExp(`^-(${bundlePatterns})+`, "g");
		niladicArgs     = uniqueStrings(nameKeys.filter(n => !shortNames[n].arity).map(n => shortNames[n].bundlePattern)).join("|");
		niladicArgs     = new RegExp(`^(-(?:${niladicArgs})+)((?!${bundlePatterns})\\S+)`);
		bundlePatterns  = new RegExp(bundlePatterns, "g");
	}
	
	
	// Is pre-processing of the argument list necessary?
	if(!ignoreEquals || bundleMatch){
		
		// Limit equals-sign expansion to items that begin with recognised option names
		const legalNames = new RegExp(`^(?:${ Object.keys(longNames).join("|") })=`);
		
		for(let i = 0, l = input.length; i < l; ++i){
			let arg = input[i];
			
			// We have bundling in use
			if(bundleMatch){
				bundleMatch.lastIndex = 0;
				
				// Expand bundled option clusters ("-mvl2" -> "-m -v -l 2")
				if(bundleMatch.test(arg)){
					
					// Break off arguments attached to niladic options
					const niladicMatch = arg.match(niladicArgs);
					if(niladicMatch){
						niladicArgs.lastIndex = 0;
						arg = niladicMatch[1];
						input.splice(i + 1, 0, niladicMatch[2]);
						l = input.length;
					}
					
					const segments = [].concat(...arg.match(bundlePatterns).map(m => {
						const option = shortNames[`-${m[0]}`];
						const result = [`-${m[0]}`];
						if(!option.arity) return result;
						result.push(...m.match(new RegExp(option.bundlePattern)).slice(1).filter(i => i));
						return result;
					}));
					input.splice(i, 1, ...segments);
					l =  input.length;
					i += segments.length - 1;
					continue;
				}
			}
			
			// Expand "--option=value" sequences to become "--option value"
			if(legalNames.test(arg)){
				const match = arg.match(/^([^=]+)=(.+)$/);
				input.splice(i, 1, match[1], match[2]);
				l =  input.length;
				i += 1;
			}
		}
	}
	
	
	// If we're handling duplicate options with "limit-last", flip the input order
	if("limit-last" === duplicates)
		input = flip(input);
	
	// Start processing the arguments we were given to handle
	for(let i = 0, l = input.length; i < l; ++i){
		const arg = input[i];
		const opt = shortNames[arg] || longNames[arg];
		
		// This argument matches a recognised option name
		if(opt){
			
			// Record the name given on command-line that matched the option
			opt.lastMatchedName = arg;
			
			// Did we have an existing option that was collecting values?
			if(currentOption) wrapItUp();
			
			
			// Option takes at least one argument
			if(opt.arity)
				currentOption = opt;
			
			// This option takes no arguments, so just assign it a value of "true"
			else setValue(opt, true);
			
			
			// Store an additional back-reference to the current option's name
			opt.prevMatchedName = arg;
		}
		
		else{
			const isTerminator = match(arg, terminator);
			const keepRest = () => result.argv.push(...input.slice(i + 1));
			
			// A previous option is still collecting arguments
			if(currentOption && currentOption.canCollect && !isTerminator)
				currentOption.values.push(arg);
			
			// Not associated with an option
			else{
				currentOption && wrapItUp();
				
				// Terminate option parsing?
				if(isTerminator){
					keepRest();
					break;
				}
				
				// Raise an exception if unrecognised switches are considered an error
				if(noUndefined && /^-./.test(arg)){
					let error = noUndefined;
					
					// Prepare an error object to be thrown in the user's direction
					switch(typeof noUndefined){
						case "function": error = error(arg); break;
						case "boolean":  error = `Unknown option: "%s"`; // Fall-through
						case "string":   error = new TypeError(error.replace("%s", arg));
					}
					throw error;
				}
				
				result.argv.push(arg);
				
				// Finish processing if mixed-order is disabled
				if(noMixedOrder){
					keepRest();
					break;
				}
			}
		}
	}
	
	
	// Ended abruptly?
	if(currentOption) wrapItUp();
	
	
	// Check if we need to flip the returned .argv array back into the right order again
	if("limit-last" === duplicates)
		result.argv = flip(result.argv);
		
	return result;
}


if("undefined" !== typeof module.exports)
	module.exports = getOpts;
