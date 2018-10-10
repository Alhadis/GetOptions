export declare type Options = { options: any; argv: string[] };
export declare type Config = {
	noAliasPropagation?: boolean | "first-only";
	noCamelCase?: boolean;
	noBundling?: boolean;
	ignoreEquals?: boolean;
	duplicates?:
		| "use-first"
		| "use-last"
		| "limit-first"
		| "limit-last"
		| "error"
		| "append"
		| "stack"
		| "stack-values";
};
export declare function getOpts(
	input: any[],
	optdef?: string | { [key: string]: string },
	config?: Config
): Options;

export default getOpts;
