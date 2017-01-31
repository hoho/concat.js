var _concatJS;

function getConcatJS() {
    return _concatJS;
}

window.module = {exports: {}};
window.exports = module.exports;
window.require = function() { throw new Error('Should not be called'); };

function commonjsGetModuleAndRunTests() {
    var _globalConcatJS = window.$C;

    QUnit.test('CommonJS definition', function(assert) {
        assert.ok(_globalConcatJS === undefined);
        assert.ok(!!exports.$C);
    });

    _concatJS = exports.$C;

    allTests();
}
