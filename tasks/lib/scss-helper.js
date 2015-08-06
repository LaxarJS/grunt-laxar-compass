/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

var path = require( 'path' ).posix;
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

   function compassExecutable() {
      var compass = grunt.config( 'laxar-compass.options.compass' ) || 'compass';
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
      var compassItemInfo = compassInfo( scssItem.filePath );
      return execCompass( scssItem, compassItemInfo );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function execCompass( item, info ) {
      if( !grunt.file.exists( info.scssPath ) ) {
         return;
      }

      var globalThemeFolder = item.themeFoldersByName[ info.themeName ];
      var configPath = path.relative( info.scssProjectFolder, path.join( globalThemeFolder, 'compass', 'config.rb' ) );
      var executable = compassExecutable();
      grunt.log.writeln( info.scssProjectFolder + ' > compass compile -c ' + configPath ); // :TODO: Delete
      var command = executable + ' compile -c ' + configPath;
      grunt.verbose.writeln( TASK + ': ' + command + ' (wd: ' + info.scssProjectFolder + ')' );

      var projectPath = shell.pwd();
      shell.cd( info.scssProjectFolder );
      var resultCode = shell.exec( command ).code;
      grunt.log.writeln();
      shell.cd( projectPath );
      return resultCode === 0;
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
