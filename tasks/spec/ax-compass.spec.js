/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var path = require( 'path' );
var grunt = require( 'grunt' );
var expect = require( 'expect.js' );

var run = require( './lib/run-elsewhere' );

describe( 'the laxar-compass task', function() {
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
      },
      expected: {
      },
      actual: {
      }
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when invoked with a widget reference', function() {

      before( function( done ) {
         run( 'laxar-compass', {}, dir.actual, done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not fail', function() {
      } );

   } );

} );
