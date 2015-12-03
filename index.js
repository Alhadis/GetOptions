"use strict";

class GetOptions{
	
	static parse(args){
		let result = {
			options: {},
			argv:    []
		};
		
		for(let optName of args){
			optName  = optName.replace(/=/g, " ");
			
		}
	}
}



GetOptions.parse({
	"-h, --help":                             "Display this help message and exit",
	"-p, --preserve-urls":                    "Don't modify URLs when downloading files",
	"-i, --images (embed|download|ignore)":   "Whether to embed or download relevant image files",
	"-l, --log-level <level>":                "Degree of logging feedback"
})
