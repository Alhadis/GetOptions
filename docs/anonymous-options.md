Anonymous options
=================

[v1.1.0](https://github.com/Alhadis/GetOptions/releases/tag/v1.1.0) made it possible to use `getOpts` without defining any options in particular:

```js
let options = getOpts(process.argv.slice(2));
```

This essentially grabs anything affixed to a dash and assumes it's an option:

<pre><code><b>--path <ins>/to/some/file</ins></b> <b>--verbose</b> argv1 argv2</code></pre>

```js
let result = {
	argv:    ["argv1", "argv2"],
	options: {
		path: "/to/some/file",
		verbose: true
	}
}
```

While this sounds convenient, it's important to be aware of the caveats:


Limited argument recognition
----------------------------
Obviously, the module has no way of knowing which options are supposed to take arguments, and which don't. To stay safe, values are only plucked from argv if they're listed between two options:

<pre><code><b><ins>--input</ins></b> foo.txt bar.txt <b><ins>--verbose</ins></b></code></pre>

```js
let result = {
	argv: [],
	options: {
		input: ["foo.txt", "bar.txt"],
		verbose: true
	}
}
```

Which means this won't work:

<pre><code><b><ins>--input</ins></b> foo.txt bar.txt</code></pre>

```js
let result = {
	argv: ["foo.txt", "bar.txt"],
	options: {
		input: true
	}
}
```

However, you can still use an equals-sign:

<pre><code><b><ins>--input=</ins></b>"foo.txt bar.txt"</code></pre>

```js
let result = {
	argv: [],
	options: {
		input: "foo.txt bar.txt"
	}
}
```


No short-options
----------------
Whether you use one dash or two, all options are considered the same:

<pre><code>-this -will -not --be --bundled</code></pre>

```js
let result = {
	argv: [],
	options: {
		this: true,
		will: true,
		not: true,
		be: true,
		bundled: true
	}
}
```



No duplicate-handling
---------------------
If an option's used more than once, whatever's used last takes precedence:

<pre><code><b>--input <ins>file1</ins></b> <b>--input=<ins>file2</ins></b></code></pre>

```js
let result = {
	argv: [],
	options: {
		input: "file2"
	}
};
```

This may be patched in a future release.
