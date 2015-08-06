/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-compass';

   var path = require( 'path' );
   var scssHelper = require( './lib/scss-helper' )( grunt, TASK );
   var laxarHelper = require( './lib/laxar-helper' )( grunt, TASK );


   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerTask( TASK,
      'Run compass compile for an individual artifact',
      function() { runCompass( this ); }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function runCompass( task ) {

   }

};
