/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-compass-flow';
   var debounce = require( 'lodash' ).debounce;

   var path = require( 'path' );
   var CONFIG_FILE = path.join( 'work', 'compass-watch-configuration.json' );
   var ARTIFACTS = path.join( 'tooling', 'artifacts.json' );
   var CSS_MATCHER = /^(.*)[\/\\]css[\/\\](.*)[.]css$/;
   var SCSS_MATCHER = /^(.*)[\/\\]scss[\/\\](.*)[.]scss$/;

   var shell = require( 'shelljs' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerMultiTask( TASK,
      'Configures watchers for compiling SCSS files.',
      function() { runCompassFlow( this ); }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Make sure that events are registered only once per flow-target.
   var watchListeners = {};
   // Batch fast subsequent changes to SCSS files (e.g. editor saving all open files at the same time):
   var processDebounced = debounce( processWaitingItems, 50, { trailing: true } );

   function runCompassFlow( task ) {
      var startMs = Date.now();
      var flowId = task.nameArgs.split( ':' )[ 1 ];
      var flowsDirectory = task.files[ 0 ].src[ 0 ];

      var artifacts = artifactsListing( flowsDirectory, flowId );
      var options = task.options( {
         compass: 'compass',
         spawn: false,
         saveConfig: true
      } );

      if( grunt.option( 'laxar-compass' ) ) {
         options.compass = grunt.option( 'laxar-compass' );
      }

      if( options.compass.indexOf( path.sep ) !== -1 ) {
         options.compass = path.resolve( shell.pwd(), options.compass );
      }

      var themeFoldersByName = {};
      artifacts.themes.forEach( function( item ) {
         themeFoldersByName[ item.name ] = path.resolve( shell.pwd(), item.path );
      } );

      var subTask = flowId + '-compass';
      var config = { watch: {} };
      config.watch[ subTask ] = watchConfigForCompass( artifacts, flowId, options );
      var files = config.watch[ subTask].files;

      if( options.saveConfig ) {
         var destination = path.join( flowsDirectory, flowId, CONFIG_FILE );
         var result = JSON.stringify( config, null, 3 );
         writeIfChanged( destination, result, startMs );
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
            options: options,
            themeFoldersByName: themeFoldersByName
         } );
         processDebounced();
      };

      grunt.event.on( 'watch', watchListeners[ subTask ] );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function watchConfigForCompass( artifacts ) {
      var items = artifacts.themes
         .concat( artifacts.widgets )
         .concat( artifacts.controls );

      return {
         files: flatten( items.map( getResourcePaths( artifacts.themes, 'watch' ) ) )
            .filter( isCss )
            .map( function( cssFilePath ) {
               return cssFilePath.replace( CSS_MATCHER, path.join( '$1', 'scss','$2.scss' ) );
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

   function processWaitingItems() {
      // File may be triggered multiple times (from one or multiple flows).
      // Process each file only once.
      var filesProcessed = {};

      while( compassQueue.length ) {
         var item = compassQueue.shift();
         var filePath = item.filePath;
         if( !filesProcessed[ filePath ] ) {
            filesProcessed[ filePath ] = true;
            processScssItem( item, scssInfo( filePath ) );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function processScssItem( item, fileInfo ) {
         execCompass( item, fileInfo );
         if( fileInfo.themeName === 'default.theme' ) {
            // rebuild themed versions as they often import from the default theme:
            item.files
               .filter( function( _ ) { return _.indexOf( fileInfo.artifactName ) !== -1; } )
               .forEach( function( scssPath ) {
                  var subInfo = scssInfo( scssPath );
                  if( subInfo.themeName !== 'default.theme' &&
                      subInfo.artifactName === fileInfo.artifactName ) {
                     execCompass( item, subInfo );
                  }
               } );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function scssInfo( scssFilePath ) {
         var match = SCSS_MATCHER.exec( scssFilePath );
         var scssProjectFolder = match[ 1 ];
         var scssArtifactName = match[ 2 ];

         var folderSegments = scssProjectFolder.split( path.sep );
         var themeName = 'default.theme';
         for( var i = folderSegments.length - 1; i > 0; i-- ) {
            if( /\.theme$/.test( folderSegments[ i ] ) ) {
               themeName = folderSegments[ i ];
               break;
            }
         }

         return {
            scssProjectFolder: scssProjectFolder,
            themeName: themeName,
            artifactName: scssArtifactName,
            scssPath: scssFilePath
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function execCompass( item, info ) {
         if( !grunt.file.exists( info.scssPath ) ) {
            return;
         }

         var globalThemeFolder = item.themeFoldersByName[ info.themeName ];
         var configPath = path.join( globalThemeFolder, 'compass', 'config.rb' );
         var command = item.options.compass + ' compile -c ' + configPath;
         grunt.log.verbose( TASK + ': ' + command + ' (wd: ' + info.scssProjectFolder + ')' );

         var projectPath = shell.pwd();
         shell.cd( info.scssProjectFolder );
         shell.exec( command );
         shell.cd( projectPath );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // helpers copied from grunt-laxar:

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function flatten( arrays ) {
      return [].concat.apply( [], arrays );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function writeIfChanged( resultsPath, newResults, startMs ) {
      newResults = newResults + '\n';

      var previous = '';
      try { previous = grunt.file.read( resultsPath, { encoding: 'utf-8' } ); }
      catch( e ) { /* OK, probably the first run */ }

      var hasChanged;
      var words;
      if( previous !== newResults ) {
         grunt.file.write( resultsPath, newResults );
         hasChanged = true;
         words = grunt.log.wordlist( [ 'wrote', resultsPath ], { color: 'cyan' } );
      }
      else {
         hasChanged = false;
         words = grunt.log.wordlist( [ 'unchanged', resultsPath ], { color: 'green' } );
      }

      var endMs = Date.now() - startMs;
      grunt.log.ok( TASK + ': ' + words + ' (' + endMs + 'ms)' );
      return hasChanged;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function artifactsListing( src, flowId ) {
      if( !flowId ) {
         grunt.log.error( TASK + ': named sub-task is required!' );
         return;
      }
      var source = path.join( src, flowId, ARTIFACTS );
      if( !grunt.file.exists( source ) ) {
         grunt.log.error( TASK + ': No artifact list! Run laxar-artifacts:' + flowId + ' first.' );
         return {};
      }
      return grunt.file.readJSON( source );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function getResourcePaths( themes, resourceType ) {
      return function( artifact ) {
         var paths = extract( artifact, resourceType );
         if( resourceType === 'list' ) {
            // Embedding implies listing:
            return paths.concat( extract( artifact, 'embed' ) );
         }
         return paths;
      };

      function extract( artifact, type ) {
         if( !artifact.resources || !artifact.resources[ type ] ) {
            return [];
         }
         return flatten( artifact.resources[ type ].map( expandThemes ) ).map( fixPaths );

         function expandThemes( pattern ) {
            var isThemed = 0 === pattern.indexOf( '*.theme' + path.sep );
            return isThemed ? themes.map( substituteTheme( pattern ) ) : [ pattern ];
         }

         function fixPaths( pattern ) {
            var isSelf = pattern === '.';
            var isAbsolute = 0 === pattern.indexOf( path.sep );
            return isSelf ? artifact.path : (
               isAbsolute ? pattern.substring( 1 ) : path.join( artifact.path, pattern )
            );
         }
      }

      function substituteTheme( pattern ) {
         return function( theme ) {
            var segments = pattern.split( path.sep );
            segments[ 0 ] = theme.name;
            return segments.join( path.sep );
         };
      }
   }

};
