"use strict";

const getOpts = require("../index.js");


suite("Mixed-order options", () => {
	const optdef = {
		"-e, --eval": "<string>",
		"--log-file": "<path>",
		"--size":     "[width] [height]",
		"--files":    "[list...]",
		"--verbose":  "",
	};
	
	
	test("Mixed: Basic", () => {
		assert.deepEqual(getOpts([
			"--log-file", "/var/log/stuff.txt",
			"generate",
			"all-files",
			"--verbose",
		], optdef), {
			argv: ["generate", "all-files"],
			options: {
				logFile: "/var/log/stuff.txt",
				verbose: true,
			},
		});
		
		assert.deepEqual(getOpts([
			"generate",
			"all-files",
			"--log-file", "/var/log/stuff.txt",
			"--size", "100", "200",
			"--verbose",
		], optdef), {
			argv: ["generate", "all-files"],
			options: {
				logFile: "/var/log/stuff.txt",
				size: ["100", "200"],
				verbose: true,
			},
		});
	});
	
	
	test("Mixed: Variadic", () => {
		const args = [
			"foo",
			"bar",
			"--files", "1.gif", "2.gif", "3.gif",
			"--size", "600", "400",
			"baz",
		];
		const expected = {
			argv: ["foo", "bar", "baz"],
			options: {
				files: ["1.gif", "2.gif", "3.gif"],
				size: ["600", "400"],
			},
		};
		assert.deepEqual(getOpts(args, optdef), expected);
		args.unshift("--verbose");
		expected.options.verbose = true;
		assert.deepEqual(getOpts(args, optdef), expected);
	});
	
	
	test("Mixed: Undefined", () => {
		assert.deepEqual(getOpts([
			"--unknown",
			"--verbose",
			"foo",
			"--also-unknown",
			"bar",
			"--size", "3", "2",
		], optdef), {
			argv: ["--unknown", "foo", "--also-unknown", "bar"],
			options: {verbose: true, size: ["3", "2"]},
		});
	});
	
	
	test("Mixed: With terminator", () => {
		assert.deepEqual(getOpts([
			"foo",
			"--verbose",
			"bar",
			"--",
			"--size", "600", "400",
		], optdef, {terminator: "--"}), {
			argv: ["foo", "bar", "--size", "600", "400"],
			options: {verbose: true},
		});
		
		assert.deepEqual(getOpts([
			"foo",
			"--",
			"--verbose",
			"bar",
			"--",
			"--size", "600", "400",
		], optdef, {terminator: "--"}), {
			argv: ["foo", "--verbose", "bar", "--", "--size", "600", "400"],
			options: {},
		});
	});
	
	
	test("Unmixed: Basic", () => {
		assert.deepEqual(getOpts(["--verbose", "foo"], optdef, {noMixedOrder: true}), {
			argv: ["foo"],
			options: {verbose: true},
		});
		
		assert.deepEqual(getOpts(["foo", "--verbose"], optdef, {noMixedOrder: true}), {
			argv: ["foo", "--verbose"],
			options: {},
		});
		
		const args = [
			"--verbose",
			"--size", "100", "200",
			"generate",
			"--log-file",
			"/var/log/stuff.txt",
			"all-files",
		];
		assert.deepEqual(getOpts(args, optdef, {noMixedOrder: true}), {
			argv: ["generate", "--log-file", "/var/log/stuff.txt", "all-files"],
			options: {
				size: ["100", "200"],
				verbose: true,
			},
		});
		args.unshift("foo");
		assert.deepEqual(getOpts(args, optdef, {noMixedOrder: true}), {argv: args, options: {}});
		
		assert.deepEqual(getOpts([
			"foo",
			"--verbose",
			"--files",
			"1.gif",
			"2.gif",
		], optdef, {noMixedOrder: true}), {
			argv: ["foo", "--verbose", "--files", "1.gif", "2.gif"],
			options: {},
		});
	});
	
	
	test("Unmixed: Variadic", () => {
		assert.deepEqual(getOpts([
			"--files", "1.gif", "2.gif", "3.gif",
			"--verbose",
			"foo",
			"--size", "1", "2",
		], optdef, {noMixedOrder: true}), {
			argv: ["foo", "--size", "1", "2"],
			options: {
				verbose: true,
				files: ["1.gif", "2.gif", "3.gif"],
			},
		});
		
		const args = [
			"bar",
			"--files", "1.gif", "2.gif", "3.gif",
			"--verbose",
			"foo",
			"--size", "1", "2",
		];
		assert.deepEqual(getOpts(args, optdef, {noMixedOrder: true}), {
			argv: args,
			options: {},
		});
	});
	
	
	test("Unmixed: Undefined", () => {
		assert.deepEqual(getOpts(["--verbose", "foo", "--unknown", "bar"], optdef, {noMixedOrder: true}), {
			argv: ["foo", "--unknown", "bar"],
			options: {verbose: true},
		});
		
		assert.deepEqual(getOpts(["foo", "--verbose", "--unknown", "bar"], optdef, {noMixedOrder: true}), {
			argv: ["foo", "--verbose", "--unknown", "bar"],
			options: {},
		});
		
		assert.deepEqual(getOpts(["foo", "--unknown", "--verbose", "bar"], optdef, {noMixedOrder: true}), {
			argv: ["foo", "--unknown", "--verbose", "bar"],
			options: {},
		});
	});
	
	
	test("Unmixed: With terminator", () => {
		assert.deepEqual(getOpts(["--verbose", "--", "--size", "1", "2"], optdef, {
			noMixedOrder: true,
			terminator: "--",
		}), {
			options: {verbose: true},
			argv: ["--size", "1", "2"],
		});
		
		assert.deepEqual(getOpts(["--", "--verbose", "--", "--size", "1", "2"], optdef, {
			noMixedOrder: true,
			terminator: "--",
		}), {
			options: {},
			argv: ["--verbose", "--", "--size", "1", "2"],
		});
		
		assert.deepEqual(getOpts(["--files", "1.gif", "--", "2.gif", "--verbose"], optdef, {
			noMixedOrder: true,
			terminator: "--",
		}), {
			options: {files: ["1.gif"]},
			argv: ["2.gif", "--verbose"],
		});
	});
});
