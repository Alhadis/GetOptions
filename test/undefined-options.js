"use strict";

const getOpts = require("../index.js");


suite("Undefined options", () => {
	test("No error-handling", () => {
		assert.deepEqual(getOpts([
			"foo",
			"--bar",
			"--unknown",
		], {"--bar": ""}), {
			options: {bar: true},
			argv: ["foo", "--unknown"],
		});
	});
	
	
	test("Error: Default message", () => {
		assert.throws(() => getOpts([
			"foo",
			"--bar",
			"--unknown",
		], {"--bar": ""}, {
			noUndefined: true,
		}), TypeError, 'Unknown option: "--unknown"');
	});
	
	
	test("Error: Custom message", () => {
		assert.throws(() => getOpts([
			"foo",
			"--bar",
			"--unknown",
		], {"--bar": ""}, {
			noUndefined: "Weird option passed",
		}), TypeError, "Weird option passed");
		
		assert.throws(() => getOpts([
			"foo",
			"--bar",
			"--unknown",
		], {"--bar": ""}, {
			noUndefined: "Weird option: `%s`",
		}), TypeError, "Weird option: `--unknown`");
	});
	
	
	test("Error: Callback", () => {
		assert.throws(() => getOpts([
			"foo",
			"--bar",
			"--unknown",
		], {"--bar": ""}, {
			noUndefined: arg =>
				new ReferenceError(`Can't find switch named "${arg.replace(/^-+/, "")}"`),
		}), ReferenceError, `Can't find switch named "unknown"`);
	});
	
	
	test("Error: Object reference", () => {
		const error = new Error("Derp");
		assert.throws(() => getOpts([
			"foo",
			"--bar",
			"--unknown",
		], {"--bar": ""}, {
			noUndefined: error,
		}), error);
	});
});
