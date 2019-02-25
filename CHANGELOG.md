Change Log
==========

Rundown of notable changes between versions. More detailed rationale may
be found by digging through the commit logs.

This project honours [Semantic Versioning](http://semver.org/).


[Staged]
------------------------------------------------------------------------
* __Added:__ Ability to extract option-lists from strings
* __Added:__ Setting to [disable mixed-order][6] option/argument lists
* __Added:__ Setting to [throw an error][7] for unrecognised options
* __Added:__ Support for [terminating][8] options using a double-dash
* __Fixed:__ Options array being modified by reference

 [6]: ./docs/advanced-settings.md#nomixedorder
 [7]: ./docs/advanced-settings.md#noundefined
 [8]: ./docs/advanced-settings.md#terminator


[v1.1.3]
------------------------------------------------------------------------
**October 21st, 2018**  
Fixed [an oversight][5] with recently-added type definitions:

* __Fixed:__ Breakage in TypeScript if optional parameters were omitted
* __Fixed:__ Incomplete option typing for `noAliasPropagation`

 [5]: https://github.com/Alhadis/GetOptions/pull/9


[v1.1.2]
------------------------------------------------------------------------
**October 11th, 2018**  
Added [type definitions][4] for TypeScript.

 [4]: https://github.com/Alhadis/GetOptions/pull/8


[v1.1.1]
------------------------------------------------------------------------
**August 24th, 2016**  
Housekeeping release to optimise module distribution and fix minor bugs.

* __Fixed:__ Exceptions thrown when passing blank arguments
* __Fixed:__ Main file shouldn't include hashbang or be executable
* __Fixed:__ Unnecessary files included with NPM downloads


[v1.1.0]
------------------------------------------------------------------------
**August 12th, 2016**  
Fixed several bugs with option-bundling, and added helpful new features.

* __Added:__ Ability to parse options [without defining them][1]
* __Added:__ Setting to [disable bundling][2]
* __Added:__ Support for [shell-style single-character notation][3]
* __Fixed:__ Arguments given to niladic option-bundles not added to argv
* __Fixed:__ Multiple bundles misinterpreted as argv elements
* __Fixed:__ Only one option could be read with --equals=sign assignment

 [1]: ./docs/anonymous-options.md
 [2]: ./docs/advanced-settings.md#nobundling
 [3]: https://github.com/Alhadis/GetOptions/commit/501437d10c9


[v1.0.1]
------------------------------------------------------------------------
**December 9th, 2015**  
Fixed a careless bug where variadic options dropped everything after the
first value... other options included.


[v1.0.0]
------------------------------------------------------------------------
**December 9th, 2015**  
Initial release.


[Referenced links]:_____________________________________________________
[Staged]: https://github.com/Alhadis/GetOptions/compare/v1.1.3...HEAD
[v1.1.3]: https://github.com/Alhadis/GetOptions/releases/tag/v1.1.3
[v1.1.2]: https://github.com/Alhadis/GetOptions/releases/tag/v1.1.2
[v1.1.1]: https://github.com/Alhadis/GetOptions/releases/tag/v1.1.1
[v1.1.0]: https://github.com/Alhadis/GetOptions/releases/tag/v1.1.0
[v1.0.1]: https://github.com/Alhadis/GetOptions/releases/tag/v1.0.1
[v1.0.0]: https://github.com/Alhadis/GetOptions/releases/tag/v1.0.0
