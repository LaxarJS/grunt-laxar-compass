# grunt-laxar-compass [![Build Status](https://travis-ci.org/LaxarJS/grunt-laxar.svg?branch=master)](https://travis-ci.org/LaxarJS/grunt-laxar)

> Watches SCSS of LaxarJS artifacts, runs compass when SCSS changes.

This task makes it easy to use [compass](http://compass-style.org/) in LaxarJS applications.

Right now it only watches your SCSS files while the development server is running.
Whenever you change SCSS for an artifact, the CSS for the same theme folder of the artifact gets recreated using `compass compile`.
The configuration path will be set to the `compass/config.rb` from the matching global theme folder (e.g. `includes/themes/my.theme/config/compass.rb`).

Also, when you modify the *default.theme* SCSS of an artifact, all other themes of that artifact are recompiled, because they usually import the default theme.  


## Getting Started

This plugin is designed to be used with [grunt-laxar](https://github.com/LaxarJS/grunt-laxar) `v1.1.0` or later.

To use this plugin, you first need to install it using [npm](https://npmjs.org):

```console
$ npm install grunt-laxar-compass
```

After that, load its tasks from your Gruntfile:

```js
grunt.loadNpmTasks( 'grunt-laxar-compass' );
```

Finally, configure *laxar-compass* as a user task for the build stage:

```js
grunt.initConfig( {
   // ...
   'laxar-configure': {
      // ...
      options: {
         userTasks: {
            'build-flow': [ 'laxar-compass-flow' ]
         }
      }
   },
   'laxar-compass': {
      options: {
         // optional:
         compass: 'path/to/compass'
      }
   }
}
```

This will automatically launch the task during development (e.g. `grunt develop`), watching your application artifacts.


## CLI Tasks

The plugin provides a task which is intended for use on the command line:

⚙ **laxar-compass**

Compile SCSS for a given artifacts or for all artifacts, in a selected theme or in all themes.

For more information, run `grunt laxar-compass --usage`.


## User Tasks

This plugin makes available a new *user task* for the *build*-stage of the grunt-laxar task [*laxar-configure*](https://github.com/LaxarJS/grunt-laxar/blob/master/docs/tasks/laxar-configure.md).

⚙ **laxar-compass-flow**

This multi-task configures the `watch` task to keep an eye on the SCSS of widgets, controls and themes for a given flow target.
Whenever the SCSS changes, `compass compile` is executed with the `config.rb` of the theme.
This only actually works if `watch` is used, e.g (for a flow-target _main_):

```console
$ grunt laxar-configure laxar-compass-flow:main watch
```

or simply

```console
grunt laxar-develop
```

which will also run a development server with live-reload.


## Options

* compass

The path to the compass executable (relative or absolute).
If omitted, `compass` must exist on the path.
This option can be overridden on the command line using the argument `grunt develop --laxar-compass my/path/to/compass`.

* debounceDelay

Subsequent changes within this time window will be batched together before running compass.
The default is 50 milliseconds.
This is useful if several files are changes within a short duration (e.g. saving multiple editor tabs together).
