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
   var flatten = taskHelper.flatten;
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

   // Files that needs to be processed by compass are collected here.
   var compassQueue = [];

   // Batch fast subsequent changes to SCSS files (e.g. editor saving all open files at the same time):
   var processQueueDebounced = debounce(
      processQueue,
      grunt.config( 'laxar-compass.options.debounceDelay' ) || 50,
      { trailing: true }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function runCompassFlow( task ) {
      var startMs = Date.now();
      var flowId = task.nameArgs.split( ':' )[ 1 ];
      var flowsDirectory = task.files[ 0 ].src[ 0 ];
      var subTask = flowId + '-compass';

      // collect artifacts and themes:
      var artifacts = taskHelper.artifactsListing( flowsDirectory, flowId );
      var options = task.options( {
         spawn: false,
         saveConfig: true
      } );
      var themeFoldersByName = {};
      artifacts.themes.forEach( function( item ) {
         themeFoldersByName[ item.name ] = path.resolve( '.', item.path );
      } );

      // generate watch-configuration:
      var config = { watch: {} };
      var watchConfiguration = watchConfigForCompass( artifacts, flowId, options );
      config.watch[ subTask ] = watchConfiguration.config;
      if( options.saveConfig ) {
         var destination = path.join( flowsDirectory, flowId, CONFIG_FILE );
         var result = JSON.stringify( config, null, 3 );
         taskHelper.writeIfChanged( destination, result, startMs );
      }
      grunt.log.writeln( TASK + ': registering compass watchers for sub-task ' + subTask );
      grunt.config( 'watch.' + subTask, config.watch[ subTask ] );

      // (re-)register listener function:
      if( watchListeners[ subTask ] ) {
         grunt.event.off( 'watch', watchListeners[ subTask ] );
      }
      watchListeners[ subTask ] = function( action, filePath, target ) {
         if( !/-compass$/.test( target ) || !SCSS_MATCHER.test( filePath ) ) {
            return;
         }
         compassQueue.push( {
            filePath: filePath,
            dependents: watchConfiguration.dependents,
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

      // collect (possibly) affected project folders from each default.theme project folder
      var dependents = {};
      items.forEach( function( item ) {
         var watchPaths = watchPathsForItem( item ).filter( isCss );
         watchPaths.forEach( function( watchPath ) {
            var parentFolder = watchPath.replace( CSS_MATCHER, '$1' );
            if( parentFolder.indexOf( 'default.theme' ) !== -1 ) {
               dependents[ parentFolder ] = watchPaths
                  .filter( function( _ ) { return _ !== watchPath; } )
                  .map( function( _ ) { return _.replace( CSS_MATCHER, '$1' ); } );
            }
         } );
      } );

      // generate SCSS watch-patterns from CSS watch patterns
      var config = {
         files: flatten( items.map( watchPathsForItem ) )
            .filter( isCss )
            .map( function( cssFilePath ) {
               return cssFilePath.replace( CSS_MATCHER, path.join( '$1', 'scss','*.scss' ) );
            } ),
         event: [ 'changed', 'added' ],
         options: {
            livereload: false
         }
      };

      return {
         config: config,
         dependents: dependents
      };

      function isCss( filePath ) {
         return CSS_MATCHER.test( filePath );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function processQueue() {
      // File may be triggered multiple times (from one or multiple flows).
      // Process each file only once.
      var filesProcessed = {};

      while( compassQueue.length ) {
         var item = compassQueue.shift();
         var filePath = item.filePath;
         if( !filesProcessed[ filePath ] ) {
            filesProcessed[ filePath ] = true;
            processQueueItem( item );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function processQueueItem( item ) {
         scssHelper.compile( item );
         var parentFolder = item.filePath.replace( SCSS_MATCHER, '$1' );
         var baseName = item.filePath.replace( SCSS_MATCHER, '$2' );
         ( item.dependents[ parentFolder ] || [] ).forEach( function( dependentFolder ) {
            compassQueue.push( {
               filePath: path.join( dependentFolder, 'scss', baseName + '.scss' ),
               dependents: item.dependents,
               themeFoldersByName: item.themeFoldersByName
            } );
         } );
      }
   }

};
