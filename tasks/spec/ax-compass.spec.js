/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var path = require( 'path' );
var grunt = require( 'grunt' );
var runTask = require( 'grunt-run-task' );
var expect = require( 'expect.js' );

describe( 'the laxar-compass task', function() {
   'use strict';

   var dir = {
      fixtures: 'tasks/spec/fixtures',
      expected: 'tasks/spec/expected',
      actual: 'tmp'
   };

   // the names have no further meaning: widgets were copied from the grunt-laxar test fixtures
   var testWidgetDefaultThemeCssPath = 'widgets/default/test_widget/default.theme/css/test_widget.css';
   var localWidgetDefaultThemeCssPath = 'widgets/default/local_widget/default.theme/css/local_widget.css';
   var localWidgetTestThemeCssPath = 'widgets/default/local_widget/test.theme/css/local_widget.css';

   var paths = {
      fixtures: {
      },
      expected: {
         testWidgetDefaultThemeCss: path.join( dir.expected, testWidgetDefaultThemeCssPath ),
         localWidgetDefaultThemeCss: path.join( dir.expected, localWidgetDefaultThemeCssPath ),
         localWidgetTestThemeCss: path.join( dir.expected, localWidgetTestThemeCssPath )
      },
      actual: {
         testWidgetDefaultThemeCss: path.join( dir.actual, testWidgetDefaultThemeCssPath ),
         localWidgetDefaultThemeCss: path.join( dir.actual, localWidgetDefaultThemeCssPath ),
         localWidgetTestThemeCss: path.join( dir.actual, localWidgetTestThemeCssPath )
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when invoked with a widget reference', function() {

      before( function( done ) {
         run( 'laxar-compass', null, [ 'widget', 'default/test_widget' ], done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'invokes the configured compass executable within the widget directory', function() {
         var expected = grunt.file.read( paths.expected.testWidgetDefaultThemeCss );
         var actual = grunt.file.read( paths.actual.testWidgetDefaultThemeCss );
         expect( actual ).to.eql( expected );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      after( function( done ) {
         grunt.file.delete( paths.actual.testWidgetDefaultThemeCss );
         done();
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when invoked with a specific theme', function() {

      before( function( done ) {
         run( 'laxar-compass', 'test.theme', [ 'widget', 'default/local_widget' ], done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'invokes the configured compass executable only for that theme', function() {
         var expected = grunt.file.read( paths.expected.localWidgetTestThemeCss );
         var actual = grunt.file.read( paths.actual.localWidgetTestThemeCss );
         expect( actual ).to.eql( expected );

         var defaultThemeCompiled = grunt.file.exists( paths.actual.localWidgetDefaultThemeCss );
         expect( defaultThemeCompiled ).to.be( false );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      after( function( done ) {
         grunt.file.delete( paths.actual.localWidgetTestThemeCss );
         done();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when invoked with the "-X" target selector', function() {

      before( function( done ) {
         run( 'laxar-compass', null, [ 'X', 'default/local_widget' ], done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'compiles (all themes of) any widget of a matching name', function() {
         var expected = grunt.file.read( paths.expected.localWidgetTestThemeCss );
         var actual = grunt.file.read( paths.actual.localWidgetTestThemeCss );
         expect( actual ).to.eql( expected );

         var expected_ = grunt.file.read( paths.expected.localWidgetDefaultThemeCss );
         var actual_ = grunt.file.read( paths.actual.localWidgetDefaultThemeCss );
         expect( actual_ ).to.eql( expected_ );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      after( function( done ) {
         grunt.file.delete( paths.actual.localWidgetTestThemeCss );
         grunt.file.delete( paths.actual.localWidgetDefaultThemeCss );
         done();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when invoked with the "--all" target selector', function() {

      before( function( done ) {
         run( 'laxar-compass', null, [ 'all', ' ' ], done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'compiles (all themes of) all widgets', function() {
         var expected = grunt.file.read( paths.expected.localWidgetTestThemeCss );
         var actual = grunt.file.read( paths.actual.localWidgetTestThemeCss );
         expect( actual ).to.eql( expected );

         var expected_ = grunt.file.read( paths.expected.localWidgetDefaultThemeCss );
         var actual_ = grunt.file.read( paths.actual.localWidgetDefaultThemeCss );
         expect( actual_ ).to.eql( expected_ );

         var expected__ = grunt.file.read( paths.expected.testWidgetDefaultThemeCss );
         var actual__ = grunt.file.read( paths.actual.testWidgetDefaultThemeCss );
         expect( actual__ ).to.eql( expected__ );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      after( function( done ) {
         grunt.file.delete( paths.actual.localWidgetTestThemeCss );
         grunt.file.delete( paths.actual.localWidgetDefaultThemeCss );
         grunt.file.delete( paths.actual.testWidgetDefaultThemeCss );
         done();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function run( taskName, targetTheme, targetSelector, done ) {

      // simulate Gruntfile config
      runTask.grunt.config.set( 'laxar-configure.options.flows', [
         { target: 'my-flow', src: 'not-needed.json' }
      ] );
      runTask.grunt.config.set( 'laxar-compass.options.compass', './fake_compass.sh' );

      // simulate commandline invocation
      var previousBase = path.resolve( '.' );
      runTask.grunt.file.setBase( dir.actual );
      runTask.grunt.option( 'T', targetTheme || null );
      runTask.grunt.option( targetSelector[ 0 ], targetSelector[ 1 ] );
      var task = runTask.task( taskName );
      task.run( function( err ) {
         runTask.grunt.file.setBase( previousBase );
         done( err );
      } );
      return task;
   }

} );
