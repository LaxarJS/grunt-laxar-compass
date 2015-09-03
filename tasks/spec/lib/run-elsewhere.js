/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

var runTask = require( 'grunt-run-task' );
var path = require( '../../lib/path-platform/path' ).posix;

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
