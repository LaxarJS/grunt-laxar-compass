/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-compass';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var path = require( 'path' ).posix;
   var scssHelper = require( './lib/scss-helper' )( grunt, TASK );
   var taskHelper = require( 'grunt-laxar/tasks/lib/task_helpers' )( grunt, TASK );
   var requireConfig = require( 'grunt-laxar/lib/require_config' );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var TYPES = {
      widgets: 'widget',
      controls: 'control',
      themes: 'theme',
      layouts: 'layout'
   };

   var DEFAULT_REF_TYPES = {
      themes: 'local',
      layouts: 'local',
      widgets: 'local',
      controls: 'amd'
   };

   // sentinel value indicating that an artifact should be compiled for all themes
   var ALL_THEMES = '*ALL*';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerTask( TASK,
      'Run `compass compile` for an individual artifact',
      function() { runCompass(); }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function runCompass() {
      var requirejs = requireConfig.fromConfiguration( requireConfig.configuration() );
      var artifactListingsCache = {};
      var targetThemeName = grunt.option( 'T' ) || ALL_THEMES;

      if( grunt.option( 'usage' ) ) {
         printUsageInfo();
         return;
      }

      if( grunt.option( 'all' ) ) {
         compileAll( targetThemeName );
         return;
      }

      var subject = refAndSearchLists();
      if( !subject ) {
         grunt.log.warn( 'No artifact found. Try --usage for help.' );
         return;
      }
      subject.searchLists.forEach( function( artifactListName ) {
         compileArtifact( subject.ref, targetThemeName, artifactListName );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function printUsageInfo() {
         writeHead( 'Usage: grunt laxar-compass [<theme-selection>] <target-selector>' );
         write( 'Note that SCSS files will be processed only if they are in a subfolder' );
         write( 'with name "scss" of the artifact theme folder.' );
         write( 'Themes must have a file "compass/config.rb" declaring their import paths.' );

         writeHead( 'theme-selection (optional):' );
         write( '  -T <theme-name>          Targets (below) will be compiled only for the given theme.' );
         write( '                           By default, SCSS for all themes is processed.' );
         write( '                           Example: "-T default.theme" ignores user-defined theme(s).' );

         writeHead( 'target-selectors:' );
         write( '  --layout <layout-ref>    Compile SCSS for the given layout (scss sub-folder).' );
         write( '                           The layout-ref has the same format as is used in' );
         write( '                           page definitions (and as given by `grunt laxar-info`).' );
         write( '  --widget <widget-ref>    Compile SCSS for the given widget.' );
         write( '                           The widget-ref has the same format as is used in' );
         write( '                           page definitions (and as printed by `grunt laxar-info`).' );
         write( '  --control <control-ref>  Compile SCSS for the given control.' );
         write( '                           The control-ref has the same format as is used in' );
         write( '                           the controls-section of widget.json descriptors' );
         write( '                           (and as printed by `grunt laxar-info`).' );
         write( '  --theme <theme-name>     Compile SCSS for the given theme itself.' );
         write( '                           The page-ref has the same format as is used in' );
         write( '                           flow definitions (and as printed by --flow).' );
         write( '  --any | -X <ref>         Try all artifact types and compile SCSS for the' );
         write( '                           first matching item' );

         write( '  --all                    Compile SCSS for ALL artifacts.' );

         write( '  --usage                  Print this information.' );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function refAndSearchLists() {
         var reference = grunt.option( 'X' ) || grunt.option( 'any' ) || null;
         if( reference ) {
            return {
               ref: reference,
               searchLists: Object.keys( TYPES )
            };
         }

         var matches = Object.keys( TYPES )
            .filter( function( listName ) {
               return !!grunt.option( TYPES[ listName ] );
            } )
            .map( function( listName ) {
               reference = grunt.option( TYPES[ listName ] );
               if( reference ) {
                  return {
                     ref: reference,
                     searchLists: [ listName ]
                  };
               }
            } );

         return matches.length ? matches[ 0 ] : null;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function compileAll( targetThemeName ) {
         var failures = [];
         var done = {};
         flowTargets().forEach( function( flow ) {
            var model = artifactsListing( flow.target );
            Object.keys( TYPES ).forEach( function( listName ) {
               model[ listName ].forEach( function( artifactItem ) {
                  var refType = DEFAULT_REF_TYPES[ listName ];
                  var ref = artifactItem.references[ refType ].self;
                  done[ listName ] = done[ listName ] || {};
                  if( !done[ listName ][ ref ] ) {
                     var results = compileArtifact( ref, targetThemeName, listName );
                     results.forEach( function( result ) {
                        if( !result.success ) {
                           failures.push( result );
                        }
                     } );
                     done[ listName ][ artifactItem.references[ refType ].self ] = true;
                  }
               } );
            } );
         } );

         if( failures.length ) {
            grunt.log.warn( 'The following artifacts FAILED to compile: ' );
            grunt.log.warn( '|' );
            failures.forEach( function( failureResult ) {
               grunt.log.warn( '|  *', failureResult.ref + ':'  );
               grunt.log.warn( '|   ', failureResult.filePath );
               grunt.log.warn( '|' );
            } );
            grunt.log.warn( 'Consult the output above for details.' );
            grunt.log.warn( 'To recompile after fixing use e.g.:' );
            var themeSelector = targetThemeName === ALL_THEMES ? '' : ' -T ' + targetThemeName;
            var targetSelector = ' --' + failures[ 0 ].type + ' ' + failures[ 0 ].ref;
            grunt.log.warn(  'grunt laxar-compass' + themeSelector + targetSelector );
         }
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function compileArtifact( ref, targetThemeName, artifactListName ) {
         var matchesRef= matchesReference( ref, DEFAULT_REF_TYPES[ artifactListName ] );
         var matches = flowTargets()
            .map( function( flow ) {
               var model = artifactsListing( flow.target );
               return {
                  model: model,
                  item: model[ artifactListName ].filter( matchesRef )[ 0 ]
               };
            } )
            .filter( function( result ) { return !!result.item; } );

         if( !matches.length ) {
            return [];
         }

         // Themes from any flow that are available at all:
         var availableThemeItems = matches.reduce( function( themeItems, match ) {
            return themeItems.concat( match.model.themes.filter( function( themeItem ) {
               return !themeItems.some( function( existingThemeItem ) {
                  return existingThemeItem.name === themeItem.name;
               } );
            } ) );
         }, [] );

         // Themes for which a compile was actually requested.
         var targetThemeItems = availableThemeItems.filter( function( themeItem ) {
            return targetThemeName === ALL_THEMES || themeItem.name === targetThemeName;
         } );

         var artifactItem = matches[ 0 ].item;
         return targetThemeItems
            .map( function( targetThemeItem ) {
               return cssFileInfo( artifactItem, targetThemeItem, availableThemeItems );
            } )
            .filter( function( info ) { return !!info; } )
            .map( function( info ) {
               var success = scssHelper.compile( info );
               return {
                  filePath: info.filePath,
                  ref: ref,
                  type: TYPES[ artifactListName ],
                  success: success
               };
            } );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Determine the relevant compass-compile parameters for a given artifact+theme combination.
       * If there is no SCSS file for the given combination, return `null`.
       *
       * @param artifactItem
       *   An entry from the artifact model that may have theme resources (widget, control, layout).
       * @param availableThemeItems
       *   All theme items relevant for compilation.
       * @param targetThemeItem
       *   The themes for which SCSS should be compiled
       *
       * @returns {{
       *      filePath: String,
       *      themeName: String,
       *      themeFoldersByName: Object< String, String >
       *   }}
       *   Information on the SCSS file to compile, or `null` if there is no matching file.
       */
      function cssFileInfo( artifactItem, targetThemeItem, availableThemeItems ) {
         var paths = taskHelper.getResourcePaths( availableThemeItems, 'list' )( artifactItem );
         var scssPaths = paths
            .filter( function( _ ) { return /\.css$/.test( _ ); } )
            .filter( function( _ ) { return _.split( path.sep ).indexOf( targetThemeItem.name ) !== -1; } )
            .map( function( _ ) {
               return _.replace( scssHelper.CSS_MATCHER, function( _, basePart, artifactNamePart ) {
                  return path.join( basePart, 'scss', artifactNamePart + '.scss' );
               } );
            } )
            .filter( function( _ ) { return grunt.file.exists( _ ); } );

         if( !scssPaths.length ) {
            return null;
         }

         var themeFoldersByName = {};
         availableThemeItems.forEach( function( item ) {
            themeFoldersByName[ item.name ] = path.resolve( '.', item.path );
         } );

         return {
            filePath: scssPaths[ 0 ],
            themeFoldersByName: themeFoldersByName,
            themeName: targetThemeItem.name
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function artifactsListing( flowTarget ) {
         artifactListingsCache[ flowTarget ] =
            artifactListingsCache[ flowTarget ] ||
            taskHelper.artifactsListing( flowsDirectory(), flowTarget );
         return artifactListingsCache[ flowTarget ];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function flowsDirectory() {
         var defaultFlowsDirectory = [ 'var', 'flows' ].join( path.sep );
         return grunt.config.get( 'laxar-configure.options.workDirectory' ) || defaultFlowsDirectory ;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function flowTargets() {
         return grunt.config.get( 'laxar-configure.options.flows' ) || [];
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function matchesReference( reference, defaultProtocol ) {
         var protocol = defaultProtocol;

         var parts = reference.split( ':' );
         if( parts.length > 1 ) {
            protocol = parts[ 0 ];
            reference = parts.slice( 1, parts.length - 1 ).join( ':' );
         }

         // normalize AMD references
         if( protocol === 'amd' ) {
            reference = path.relative( requirejs.toUrl( '.' ), requirejs.toUrl( reference ) );
         }

         return function( item ) {
            return item.references[ protocol ].self === reference;
         };
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function write() {
         grunt.log.writeln.apply( grunt.log, arguments );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function writeHead() {
         grunt.log.subhead.apply( grunt.log, arguments );
      }

   }

};
