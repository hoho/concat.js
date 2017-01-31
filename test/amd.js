var _concatJS;

function getConcatJS() {
    return _concatJS;
}

function amdLoadConcatJSAndRunTests(isMinified) {
    // QUnit itself supports AMD, so defining `define` and
    // loading concat.js only after QUnit is loaded.
    window.define = function define(id, deps, factory) {
        var _currentConcatJS = _concatJS;
        var _currentDeps = deps;
        var e = {};
        factory(undefined, e);
        _concatJS = e.$C;

        QUnit.test('AMD definition', function(assert) {
            assert.ok(_currentConcatJS === undefined);
            assert.deepEqual(id, 'concatjs');
            assert.deepEqual(_currentDeps, ['require', 'exports']);
            assert.ok(window.$C === undefined);
        });
    }
    define.amd = true;

    var s = document.createElement('script');
    s.src = isMinified ? '../concat.min.js' : '../concat.js';
    s.onload = allTests;
    document.body.appendChild(s);
}
