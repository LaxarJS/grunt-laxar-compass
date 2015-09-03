/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

var path = require( 'grunt-laxar/lib/path-platform/path' ).posix;
var runTask = require( 'grunt-run-task' );

module.exports = run;

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function run( taskName, taskConfig, newBase, done ) {
   'use strict';
   var previousBase = path.resolve( '.' );
   runTask.grunt.file.setBase( newBase );
   var task = runTask.task( taskName, taskConfig );
   task.run( function( err ) {
      runTask.grunt.file.setBase( previousBase );
      done( err );
   } );
   return task;
}
