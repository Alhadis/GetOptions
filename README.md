GetOptions
==========

The JavaScript equivalent of `getopts`. No frills, no bullshit; nothing but cold, hard option extraction.

**Use this module if you**
* Are happy validating and type-checking input yourself
* Don't mind writing your own documentation
* Prefer a hands-on approach without pointless array-fiddling


This lets you extract options so this...

<pre><code>$ program <b>--log-path <ins>/var/log/stuff.txt</ins></b> generate all-files <b><ins>--verbose</ins></b></code></pre>


... gets filtered down to this:

<pre><code>$ program generate all-files</code></pre>


... with everything neatly sorted into one little object:
```js
let result = {
    options: {
        logPath: "/var/log/stuff.txt",
        verbose: true
    },
    argv: [
        "generate",
        "all-files"
    ]
};
```

That's seriously all.


Example
-------

```js
getOpts(process.argv, {
    "-v, --verbose":    "",
    "-l, --log-level":  "[level]",
    "-p, --log-path":   "<path>",
    "-s, --set-config": "<name> <value>",
    "-f, --files":      "<search-path> <variadic-file-list...>"
});
```

**Left column:**  
Short and long forms of each defined option, separated by commas.

**Right column:**  
Arguments each option takes, if any.

Note: There's no requirement to enclose each parameter's name with `< > [ ] ( )`. These characters are just permitted for readability, and are ignored by the function when it runs. They're allowed because some authors might find them easier on the eyes than simple space-separation.


Result
------

The value that's assigned to each corresponding `.options` property is either:  
* **Boolean `true`** if the option doesn't take any parameters (e.g., `"--verbose": ""`)
* **A string** holding the value of the option's only argument (e.g., `"--log-path": "path"`)
* **An array** if more than one parameter was specified. (e.g., `"-s, --set-config": "name value"`)

Given the earlier example, the following line...

<pre><code>program <b>--files <ins>/search/path</ins> <ins>1.jpg</ins> <ins>2.txt</ins> <ins>3.gif</ins></b> <b>--log-path <ins>/path/to/</ins></b> subcommand param <b>--verbose</b></code></pre>

... would yield:
```js
let result = {
    argv:    ["subcommand", "param"],
    options: {
        files:   ["/search/path", "1.jpg", "2.txt", "3.gif"],
        logPath: "/path/to",
        verbose: true
    }
};
```

I'm sure you get it by now.

	

That's it?
----------

Yeah, that's it. You want fancy subcommands? Just leverage the `.argv` property of the returned object:
```js
let subcommands = {
    generate: function(whichFiles){
        console.log("Let's generate... " + whichFiles);
    }
};

subcommands[ result.argv[0] ].apply(null, result.argv.slice(1));
/** -> Outputs "Let's generate... all-files" */
```

This would work too, if you're an `eval` kinda guy:
```js
function generate(whichFiles){ /* ... */ }

eval(result.argv[0]).apply(null, result.argv.slice(1));
```
Obviously you'd be checking if the function existed and all that jazz. But that's up to you.


Further reading
---------------

I've broken the more convoluted documentation into different files, in an effort to keep this readme file terse:

* **[Advanced Options](docs/advanced-settings.md):** Covers additional features not detailed here
* **[Bundling](docs/bundling.md):** Describes how `getOpts` parses bundled short-options like `-cyfaws`



Reminders
---------
* This is pure JavaScript, so it's not reliant on Node to work. Feel free to use it in a browser environment or whatever.<br/><br/>
* The array that's passed to the function isn't modified. If you want to overwrite the values stored in `process.argv`, do so by assignment:
  <pre><code>process.argv = result.argv;</code></pre>
  This is by design. It's not reasonable to assume developers will expect the contents of the array to be automatically shifted as options are being plucked from it.<br/><br/>
* As you'd expect, the first two values in `process.argv` contain the paths of the Node executable and the currently-running script.
  These have been omitted from the examples documented here (perhaps misleadingly, but done so for brevity's sake).
  In production, you'd probably want to pass `process.argv.slice(2)` to `getOpts` or something.




Why?
----

Yeah, there's billions of CLI-handling modules on NPM. Among the most well-known and popular are [Commander.JS](https://github.com/tj/commander.js) and [yargs](https://www.npmjs.com/package/yargs). Since I'm a control freak, though, I prefer doing things my way. So I developed a solution that'd permit more idiosyncratic approaches than those offered by "mainstream" option modules.
