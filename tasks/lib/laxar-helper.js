/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */


var path = require( 'path' );
var ARTIFACTS = path.join( 'tooling', 'artifacts.json' );

module.exports = function( grunt, TASK ) {
   'use strict';

   return {
      flatten: flatten,
      artifactsListing: artifactsListing,
      getResourcePaths: getResourcePaths,
      writeIfChanged: writeIfChanged
   };

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
