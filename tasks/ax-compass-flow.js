/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-compass-flow';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var debounce = require( 'lodash' ).debounce;
   var taskHelper = require( 'grunt-laxar/tasks/lib/task_helpers' )( grunt, TASK );
   var scssHelper = require( './lib/scss-helper' )( grunt, TASK );
   var path = require( './lib/path-platform/path' ).posix;

   var CONFIG_FILE = path.join( 'work', 'compass-watch-configuration.json' );
   var CSS_MATCHER = /^(.*)[\/\\]css[\/\\](.*)[.]css$/;
   var SCSS_MATCHER = /^(.*)[\/\\]scss[\/\\](.*)[.]scss$/;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerMultiTask( TASK,
      'Configures watchers for compiling SCSS files.',
      function() { runCompassFlow( this ); }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Make sure that events are registered only once per flow-target.
   var watchListeners = {};
   // Batch fast subsequent changes to SCSS files (e.g. editor saving all open files at the same time):
   var processQueueDebounced = debounce(
      processQueue,
      grunt.config( 'laxar-compass.options.debounceDelay' ) || 50,
      { trailing: true }
   );

   function runCompassFlow( task ) {
      var startMs = Date.now();
      var flowId = task.nameArgs.split( ':' )[ 1 ];
      var flowsDirectory = task.files[ 0 ].src[ 0 ];

      var artifacts = taskHelper.artifactsListing( flowsDirectory, flowId );
      var options = task.options( {
         spawn: false,
         saveConfig: true
      } );

      var themeFoldersByName = {};
      artifacts.themes.forEach( function( item ) {
         themeFoldersByName[ item.name ] = path.resolve( '.', item.path );
      } );

      var subTask = flowId + '-compass';
      var config = { watch: {} };
      config.watch[ subTask ] = watchConfigForCompass( artifacts, flowId, options );
      var files = config.watch[ subTask ].files;

      if( options.saveConfig ) {
         var destination = path.join( flowsDirectory, flowId, CONFIG_FILE );
         var result = JSON.stringify( config, null, 3 );
         taskHelper.writeIfChanged( destination, result, startMs );
      }

      grunt.log.writeln( TASK + ': registering compass watchers for sub-task ' + subTask );
      grunt.config( 'watch.' + subTask, config.watch[ subTask ] );

      if( watchListeners[ subTask ] ) {
         grunt.event.off( 'watch', watchListeners[ subTask ] );
      }
      watchListeners[ subTask ] = function( action, filePath, target ) {
         if( !/-compass$/.test( target ) || !SCSS_MATCHER.test( filePath ) ) {
            return;
         }
         compassQueue.push( {
            filePath: filePath,
            files: files,
            themeFoldersByName: themeFoldersByName
         } );
         processQueueDebounced();
      };

      grunt.event.on( 'watch', watchListeners[ subTask ] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function watchConfigForCompass( artifacts ) {
      var items = artifacts.themes
         .concat( artifacts.widgets )
         .concat( artifacts.controls )
         .concat( artifacts.layouts );

      var watchPathsForItem = taskHelper.getResourcePaths( artifacts.themes, 'watch' );

      return {
         files: taskHelper.flatten( items.map( watchPathsForItem ) )
            .filter( isCss )
            .map( function( cssFilePath ) {
               return cssFilePath.replace( CSS_MATCHER, path.join( '$1', 'scss','*.scss' ) );
            } ),
         event: [ 'changed', 'added' ],
         options: {
            livereload: false
         }
      };

      function isCss( filePath ) {
         return CSS_MATCHER.test( filePath );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Files that needs to be processed by compass are collected here.
   var compassQueue = [];

   function processQueue() {
      // File may be triggered multiple times (from one or multiple flows).
      // Process each file only once.
      var filesProcessed = {};

      while( compassQueue.length ) {
         var item = compassQueue.shift();
         var filePath = item.filePath;
         if( !filesProcessed[ filePath ] ) {
            filesProcessed[ filePath ] = true;
            scssHelper.compile( item );
         }
      }

   }

};
