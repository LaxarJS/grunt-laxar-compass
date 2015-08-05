var path = require( 'path' );
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
