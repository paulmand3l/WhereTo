module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")
    jade:
      options:
        pretty: true
        data:
          debug: false
      build:
        files:
          "index.html": "index.jade"

    stylus:
      options:
        compress: false
      build:
        files:
          "css/whereto.css": "stylus/whereto.stylus"

    coffee:
      build:
        files:
          "js/whereto.js": "coffee/whereto.coffee"

    watch:
      files: ['coffee/*', 'stylus/*', 'index.jade'],
      tasks: ['default']


  # Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks "grunt-contrib-jade"
  grunt.loadNpmTasks "grunt-contrib-stylus"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks 'grunt-contrib-watch'

  # Default task(s).
  grunt.registerTask "default", ["jade", "stylus", "coffee"]
