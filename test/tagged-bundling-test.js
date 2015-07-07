'use strict';
var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;
var nodePath = require('path');
var util = require('./util');
var outputDir = nodePath.join(__dirname, 'build');
require('app-module-path').addPath(nodePath.join(__dirname, 'src'));
describe('lasso/bundling', function() {
    beforeEach(function(done) {
        util.rmdirRecursive(outputDir);
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        require('raptor-promises').enableLongStacks();
        require('raptor-logging').configureLoggers({
            'lasso': 'WARN',
            'raptor-cache': 'WARN'
        });
        done();
    });
    it('should bundle the bundles matching page tags', function(done) {
        var lasso = require('../');
        var theLasso = lasso.create({
            fileWriter: {
                outputDir: outputDir,
                fingerprintsEnabled: false
            },
            bundles: [
                {
                    name: 'bar',
                    tags: ['bar'],
                    dependencies: [
                        './bar-widgets.js'
                    ]
                },
                {
                    name: 'foo',
                    tags: ['foo', 'live'],
                    dependencies: [
                        './foo-widgets.js'
                    ]
                }                
            ]
        }, nodePath.join(__dirname, 'test-bundling-project'), __filename);

        var writerTracker = require('./WriterTracker').create(theLasso.writer);
        theLasso.lassoPage({
                pageName: 'testTagBundlingPage',
                dependencies: [
                        'require: ./my-tagged-page'
                    ],
                from: nodePath.join(__dirname, 'test-tag-bundling-page')
            },
            function(err, lassoPageResult) {
                if (err) {
                    return done(err);
                }

                var code = writerTracker.getCodeForFilename('my-tagged-page.js');
                expect(code).to.not.contain('[MAIN]');
                expect(code).to.not.contain('[BAR]');
                expect(code).to.contain('[FOO-WIDGETS]');
                done();
            });
        });        
    });
});    