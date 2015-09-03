/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

var grunt = require( 'grunt' );
var expect = require( 'expect.js' );

var path = require( '../lib/path-platform/path' ).posix;
var run = require( './lib/run-elsewhere' );

describe( 'the laxar-compass-flow task', function() {
   'use strict';

   var dir = {
      fixtures: 'tasks/spec/fixtures',
      expected: 'tasks/spec/expected',
      actual: 'tmp'
   };

   var project = {
      work: 'var/flows'
   };

   var paths = {
      fixtures: {
         configuration: path.join( dir.fixtures, project.work, 'my-flow/work/task-configuration.json' )
      },
      expected: {
         result: path.join( dir.expected, project.work, 'my-flow/work/compass-watch-configuration.json' )
      },
      actual: {
         result: path.join( dir.actual, project.work, 'my-flow/work/compass-watch-configuration.json' )
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'configured for a given flow', function() {

      var taskConfig;

      before( function( done ) {
         taskConfig = grunt.file.readJSON( paths.fixtures.configuration )[ 'laxar-compass-flow' ];
         run( 'laxar-compass-flow:my-flow', taskConfig, dir.actual, done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'generates the correct watch-task configuration for SCSS files', function() {
         var actual = grunt.file.readJSON( paths.actual.result );
         var expected = grunt.file.readJSON( paths.expected.result );
         expect( actual ).to.eql( expected );
      } );

   } );

} );
