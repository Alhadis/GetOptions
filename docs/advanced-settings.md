Advanced settings
=================

There's an optional third parameter for adjusting the nuances of `getOpts`:

<pre><code>getOpts(argv, optionDefinitions, <b><ins>settings</ins></b>)</code></pre>

The supported settings and their default values are:
<pre><code>getOpts(argv, optdef, {
    <a href="#duplicates">duplicates</a>:          "use-last",
    <a href="#ignoreequals">ignoreEquals</a>:        false,
    <a href="#noaliaspropagation">noAliasPropagation</a>:  false,
    <a href="#nobundling">noBundling</a>:          false,
    <a href="#nocamelcase">noCamelCase</a>:         false,
    <a href="#nomixedorder">noMixedOrder</a>:        false,
    <a href="#noundefined">noUndefined</a>:         false,
    <a href="#terminator">terminator</a>:          null,
});</code></pre>


duplicates
----------

Specifies what to do when an option's specified more than once:

    program --set-sizes 640 480 --set-sizes 1024 768


**use-first**  
Use the first value (or set of values); discard any following duplicates.

     $  program    --set-sizes 640 480 alpha beta --set-sizes 1024 768 gamma
    ->  setSizes:  [640, 480]
    ->  argv:      ["alpha", "beta", "gamma"]

**use-last**  
Use the last value (or set of values); discard any preceding duplicates. Default.

     $  program    --set-sizes 640 480 alpha beta --set-sizes 1024 768 gamma
    ->  setSizes:  [1024, 768]
    ->  argv:      ["alpha", "beta", "gamma"]

**limit-first**  
Use the first option; treat any following duplicates as items of argv:

     $  program    --set-sizes 640 480 alpha --set-sizes 1024 768 beta gamma
    ->  setSizes:  [640, 480]
    ->  argv:      ["alpha", "--set-sizes", "1024", "768", "beta", "gamma"]

**limit-last**  
Use only the last option; treat any preceding duplicates as items of argv:

     $  program    --set-sizes 640 480 alpha --set-sizes 1024 768 beta gamma
    ->  setSizes:  [1024, 768]
    ->  argv:      ["--set-sizes", "640", "480", "alpha", "beta", "gamma"]

**error**  
Throw an exception on the first duplicate.

**append**  
Add parameters of duplicate options to the argument list of the first:

     $  program    --set-sizes 640 480 --set-sizes 1024 768
    ->  setSizes:  [640, 480, 1024, 768]

**stack**  
Store the parameters of duplicated options in a multidimensional array:

     $  program    --set-sizes 640 480
    ->  setSizes:  [640, 480]
    
     $  program    --set-sizes 640 480 --set-sizes 1024 768
    ->  setSizes:  [ [640, 480], [1024, 768] ]


**stack-values**  
Store each duplicated value in an array in the order they appear:

     $  program    --set-sizes 640 480
    ->  setSizes:  [640, 480]

     $  program    --set-sizes 640 480 --set-sizes 1024 768
    ->  setSizes:  [ [640, 1024], [480, 768] ]



ignoreEquals
------------

A --long-option can accept its argument in one of two ways. Both are functionally equivalent.

    --option value
    --option=value

If you need to disable the latter for whatever reason, you can.

    --option=value
    # Treated as though the option's name were literally "option=value"

Which is weird, but hey, it's your program.




noAliasPropagation
------------------

When an option is matched, its value is assigned to the result using every name it's recognised by:

     #  getOpts( argv, {"-h, --help, --usage": ""} )
    
     $  program  -h
    ->  options: {
            h:     true,
            help:  true,
            usage: true
        }

This saves developers from pointlessly checking every possible alias:

```js
if(options.h || options.help || options.usage)
    displayHelp();

if(options.w < 500 || options.width < 500 || options.size < 500)
    throw new RangeError("Too small");
```

However, not everybody will prefer this approach, because
* It adds craploads of clutter to the result, hampering the readability of larger option sets
* It makes it impossible to discern *which* option name was originally matched on command-line

You can fix this by setting `noAliasPropagation` to either of the following:

**Boolean `true`**  
The option's value is assigned using the name that first matched it on command-line:

     #  getOpts( argv, {"-h, --help, --usage": ""} )
    
     $  program  -h
    ->  options: {h: true}
    
     $  program --help
    ->  options: {help: true}
    
     $  program --usage
    ->  options: {usage: true}


**first-only**  
The option's value is assigned using its first --long-name:

     #  getOpts( argv, {"-h, --help, --usage": ""} )
    
     $  program  -h
     $  program  --help
     $  program  --usage
    ->  options: {help: true}

This is my preferred setting, and probably the one many developers will prefer, too.
I refrained from making it the default setting because its behaviour wouldn't be immediately obvious to most developers.

If an option doesn't have any --long-names, the first short-name is simply used instead:

     #  getOpts( argv, {"-h, -u": ""} )
    
     $  program  -h
     $  program  -u
    ->  options: {h: true}




noBundling
----------

Disables [option-bundling](./bundling.md) for developers who'd rather turn it off.
Note this doesn't mean it's possible to specify long-names using single-dashes:

     #  getOpts( argv, {"-tag": "<name>"} )
    
     $  program  -tag name
    ->  options: {}
    ->  argv:    ["-tag", "name"]

Currently, two dashes are needed to indicate a long-name. That'll be fixed in a future release.



noCamelCase
-----------

An option's name is camelCased when assigning it as a property:

     $  program  --set-size
    ->  options.setSize

If you prefer to keep names verbatim, just set `noCamelCase` to any truthy value to preserve hyphenation:

     $  program  --set-size
    ->  options["set-size"]



noMixedOrder
------------

Terminate option-processing at the first non-option:

     $  program  --global outdated   # This would work
     $  program  outdated --global   # This would not

Normally, the whole argument list is traversed and filtered free of recognised option declarations.
If you're building complex subcommands with their own option-lists, you'll want `noMixedOrder` enabled. Seriously.



noUndefined
-----------

Throw a [`TypeError`](https://mdn.io/TypeError) if an unrecognised option is passed whilst still parsing options.

Custom error messages may be specified to replace the default `Unknown option: "%s"`. If that isn't enough, you can also supply a callback to return something more specific to throw at the user.


terminator
----------

A string (conventionally a double-dash) signifying that option parsing is to stop and all remaining elements should be treated verbatim.
