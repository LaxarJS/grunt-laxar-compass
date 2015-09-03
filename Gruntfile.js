/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   grunt.initConfig( {
      clean: {
         test: [ 'tmp' ]
      },
      copy: {
         test: {
            expand: true,
            src: './**/*.*',
            cwd: 'tasks/spec/fixtures/',
            dest: 'tmp/'
         }
      },
      chmod: {
         test: {
            options: {
               mode: 'a+x'
            },
            src: [ 'tmp/fake_compass.sh' ]
         }
      },
      jshint: {
         gruntfile: [
            __filename
         ],
         tasks: [
            'tasks/*.js'
         ],
         spec: [
            'tasks/spec/*.js'
         ]
      },

      mochacli: {
         options: {
            ui: 'bdd',
            reporter: 'spec'
         },
         'tasks': [
            'tasks/spec/*.spec.js'
         ]
      },
      'npm-publish': {
         options: {
            requires: [ 'test' ]
         }
      },
      bump: {
         options: {
            commitMessage: 'release v%VERSION%',
            tagName: 'v%VERSION%',
            tagMessage: 'version %VERSION%',
            push: false
         }
      }
   } );

   grunt.loadNpmTasks( 'grunt-contrib-clean' );
   grunt.loadNpmTasks( 'grunt-contrib-copy' );
   grunt.loadNpmTasks( 'grunt-chmod' );
   grunt.loadNpmTasks( 'grunt-contrib-jshint' );
   grunt.loadNpmTasks( 'grunt-mocha-cli' );
   grunt.loadNpmTasks( 'grunt-bump' );

   grunt.registerTask( 'test', [
      'clean:test',
      'copy:test',
      'chmod:test',
      'mochacli:tasks',
      'jshint'
   ] );
   grunt.registerTask( 'default', [ 'test' ] );

   grunt.registerTask( 'release', 'Test and commit version-bump (does not push/publish).', function( type ) {
      grunt.task.run( [
         'test',
         'bump:#{type || \'patch\'}'
      ] );
   } );

};
