#!/usr/local/bin/node --es_staging
"use strict";

const full  = "\x1B[38;5;46m\u2593 \x1B[0m";
const empty = "\x1B[38;5;22m\u2593 \x1B[0m";

function printProgress(current, outOf){
	let str = "";
	for(let i = 0; i < outOf; ++i){
		if(i < current)
			str += full;
		else
			str += empty;
	}
	return str;
}

let length = 5;
for(let i = 0; i < length; ++i){
	if(i === 3){
		length = 20;
		console.log("");
		continue;
	}
	console.log((i < 10 ? " " : "") + "   %j %s", i, printProgress(i, length));
}
