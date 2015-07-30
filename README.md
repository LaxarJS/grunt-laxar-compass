# grunt-laxar-compass [![Build Status](https://travis-ci.org/LaxarJS/grunt-laxar.svg?branch=master)](https://travis-ci.org/LaxarJS/grunt-laxar)

> Watches SCSS of LaxarJS artifacts, runs compass when needed.

`grunt-laxar` provides a couple of custom [Grunt](http://gruntjs.com/) tasks for [LaxarJS](http://laxarjs.org) applications, plus matching default configuration for several tasks from the Grunt community.

```console
$ grunt start

  To run laxar-compass registered as a user-task (recommended, see below).

$ grunt laxar-build laxar-compass-flow:main
        └─1─────-─┘ └─2───────-─-─-─-─-─-─┘

  1) configure grunt-laxar tasks and generate artifacts
  2) run (manually configured) laxar-compass-flow for flow-target main
```


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
      userTasks: {
         'build-flow': [ 'laxar-compass-flow' ]
      }
   },
}
```

## User Tasks

This plugin makes available a new *user task* for the *build*-stage of the grunt-laxar task [*laxar-configure*](https://github.com/LaxarJS/grunt-laxar/blob/master/docs/tasks/laxar-configure.md).

⚙ **laxar-compass-flow**

Configures the `watch` task to keep an eye on the SCSS of widgets, controls and themes.
Whenever the SCSS changes, `compass compile` is executed with the `config.rb` of the theme.
