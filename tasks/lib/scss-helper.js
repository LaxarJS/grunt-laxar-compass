/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

var path = require( 'path' );
var shell = require( 'shelljs' );

var SCSS_MATCHER = /^(.*)[\/\\]scss[\/\\](.*)[.]scss$/;
var CSS_MATCHER = /^(.*)[\/\\]css[\/\\](.*)[.]css$/;

module.exports = function( grunt, TASK ) {
   'use strict';

   return {
      compile: compile,
      SCSS_MATCHER: SCSS_MATCHER,
      CSS_MATCHER: CSS_MATCHER
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function compassExecutable( compassParameter ) {
      var compass = compassParameter;
      if( grunt.option( 'laxar-compass' ) ) {
         compass = grunt.option( 'laxar-compass' );
      }
      if( compass.indexOf( path.sep ) !== -1 ) {
         compass = path.resolve( shell.pwd(), compass );
      }
      return compass;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function compile( scssItem ) {
      console.log( 'COMPILE! ', scssItem ); // :TODO: Delete

      processScssItem( scssItem, compassInfo( scssItem.filePath ) );

      function processScssItem( item, fileInfo ) {
         execCompass( item, fileInfo );
         if( fileInfo.themeName === 'default.theme' ) {
            // rebuild themed versions as they often import from the default theme:
            item.files
               .filter( function( _ ) { return _.indexOf( fileInfo.artifactName ) !== -1; } )
               .forEach( function( scssPath ) {
                  var subInfo = compassInfo( scssPath );
                  if( subInfo.themeName !== 'default.theme' &&
                      subInfo.artifactName === fileInfo.artifactName ) {
                     execCompass( item, subInfo );
                  }
               } );
         }
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function execCompass( item, info ) {
      if( !grunt.file.exists( info.scssPath ) ) {
         return;
      }

      var globalThemeFolder = item.themeFoldersByName[ info.themeName ];
      var configPath = path.join( globalThemeFolder, 'compass', 'config.rb' );
      var executable = compassExecutable( item.compass );
      var command = executable + ' compile -c ' + configPath;
      grunt.verbose.writeln( TASK + ': ' + command + ' (wd: ' + info.scssProjectFolder + ')' );

      var projectPath = shell.pwd();
      shell.cd( info.scssProjectFolder );
      shell.exec( command );
      grunt.log.writeln();
      shell.cd( projectPath );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function compassInfo( scssFilePath ) {
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

};
