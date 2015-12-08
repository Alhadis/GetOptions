Bundling
========

... is a total pain-in-the-arse. Sure, this mightn't look so hard:

```
-a -v -l -n
-avln
```

What if one of the options takes an argument?

<pre><code>-a -v -l <b>3</b> -n
-avl<b>3</b>n</code></pre>


Again, that's not so bad. You can easily see where the `-l` option is assigned a value of `3`.

But what if the argument it expects is a letter?

<pre><code>-a -v -l <b>Z</b> -n
-avl<b>Z</b>n</code></pre>

... especially one that matches another option?

<pre><code>-a -v -l <b>n</b>
-av<b>l</b>n</code></pre>


Uh-oh. And it gets even worse if you need to pass multiple options:

<pre><code>-a -s <b>a z</b> -l -z
-as<b>az</b>lz</code></pre>

Yeah, you can see where this is going.



How arguments are handled in option-bundles
-------------------------------------------

#### Traditionally
The shell built-in's response to the aforementioned scenario is to make *everything* following the bundled option name a part of its argument; even if it's supposed to be another option:
```
-a -l 3 -z -f
-al3zf == -a -l 3zf
```

But the built-in is also limited to assigning only one argument per option, so this approach kinda makes sense.


#### With this repo

With JavaScript's `getopts`, there's obviously no foolproof way to parse multi-argument bundles:
```bash
-s 1024 768
-s1024768 == -s 1024768 # 1,024,768 pixels wide... yup, that's a helluva widescreen monitor
```

However, it *is* possible if the arguments have distinct formats:
```bash
-s string 1024
-sFUBAR1024 == -s FUBAR 1024
```

To achieve this, specify a **type-hint** in your option rules:
<pre><code>getOpts(argv, {
    "-s, --size":  "&lt;name<b>=[A-Za-z]+</b>&gt; &lt;width<b>=\\d+</b>&gt;"
});</code></pre>


These are just regular expressions to help `getOpts` parse bundles a little more accurately. They don't do anything to validate a user's input (you're expected to handle that, remember?).

This is why the feature's not mentioned in the main documentation - it might be misinterpreted as a formatting constraint:
```bash
# "--size": "<width=\\d+> <height=\\d+>"
program.js --size 1024 768;
program.js --size string string;

# Developer: "Dude, how come this is letting me pass non-numeric arguments?!"
open "https://github.com/Alhadis/GetOptions/issues/new?title=HUGE BUG RIGHT HERE, BRO"
```


Type-hint syntax
----------------

As mentioned above, the type-hints are simply ECMAScript-friendly regex, nothing magical. They're separated from the parameter's label by `=`, without whitespace. Remember to double-escape any backslashes!
```js
getOpts(argv, {
    "-s, --size": "<amount=\d+>",   // WRONG
    "-s, --size": "<amount=\\d+>",  // CORRECT
});
```
