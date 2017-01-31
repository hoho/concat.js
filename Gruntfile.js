module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            target: ['concat.js', 'Gruntfile.js']
        },

        uglify: {
            options: {
                preserveComments: /^!/,
                report: 'gzip'
            },
            target: {
                src: 'concat.js',
                dest: 'concat.min.js'
            }
        },

        qunit: {
            target: ['test/**/*.html']
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('assert-version', function() {
        var assertVersion = require('assert-version'),
            error;

        error = assertVersion({
            'concat.js': '',
            'bower.json': ''
        });

        if (error) {
            grunt.log.error(error);
            return false;
        }
    });

    grunt.registerTask('default', ['eslint', 'uglify', 'assert-version', 'qunit']);
};
