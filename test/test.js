function arrayToString(arr) {
    return arr === undefined ? 'undefined' : '[' + arr + ']';
}

function domToArray(node) {
    var ret = [], i, j, n, attr, a, tmp;

    for (i = 0; i < node.childNodes.length; i++) {
        n = node.childNodes[i];

        if (n.nodeType === 3) {
            ret.push(n.nodeValue);
        } else {
            attr = {};
            for (j = 0; j < n.attributes.length; j++) {
                a = n.attributes[j];

                if (!a.specified) {
                    continue;
                }

                if (a.name === 'style') {
                    tmp = n.style.cssText.replace(/'|"|;$/g, '').toLowerCase().split('; ');
                    tmp.sort();
                    while (tmp.length > 0 && !tmp[0]) {
                        tmp.shift();
                    }
                    attr[a.name] = tmp.join('; ');
                } else {
                    attr[a.name] = a.value;
                }
            }

            ret.push({name: n.tagName.toLowerCase(), attr: attr, children: domToArray(n)});
        }
    }

    return ret;
}

function attrEqual(val, expected) {
    var i = 0, j = 0, name;

    for (name in val) {
        i++;
    }

    for (name in expected) {
        j++;
    }

    deepEqual(i, j, 'Same attribute count');

    for (name in val) {
        deepEqual(val[name], expected[name], 'Same attribute value');
    }
}

function domEqual(val, expected) {
    var i;

    deepEqual(val.length, expected.length, 'Same node count');

    for (i = 0; i < Math.min(val.length, expected.length); i++) {
        deepEqual(typeof val[i], typeof expected[i], 'Same node type');

        if (typeof val[i] === 'object') {
            deepEqual(val[i].name, expected[i].name, 'Same name');
            attrEqual(val[i].attr, expected[i].attr);
            domEqual(val[i].children, expected[i].children);
        } else {
            deepEqual(val[i], expected[i], 'Same text value');
        }
    }
}

test('concat.js replace content', function() {
    var container = document.getElementById('container');

    $C(container).text('text1').end();

    domEqual(domToArray(container), ['text1']);

    $C(container).text('text2').end();

    domEqual(domToArray(container), ['text1', 'text2']);

    $C(container, true).text('text3').end();

    domEqual(domToArray(container), ['text3']);

    $C(container, true).text('text4').end();

    domEqual(domToArray(container), ['text4']);

    container.innerHTML = '';
});

test('concat.js undefined values', function() {
    var container = document.getElementById('container');

    $C(container).text('text1').test(undefined).text('text2').end().text('text3').end();

    domEqual(domToArray(container), ['text1', 'text3']);

    $C(container, true).text('text4').each(undefined).text('text5').end().text('text6').end();

    domEqual(domToArray(container), ['text4', 'text6']);

    $C(container, true).text('text7').repeat(undefined).text('text8').end().text('text9').end();

    domEqual(domToArray(container), ['text7', 'text9']);

    container.innerHTML = '';
});

test('concat.js return value', function() {
    var container = document.getElementById('container');

    deepEqual($C(container).text('text1').end(), []);

    container.innerHTML = '';

    var tmp = $C().text('text2').br(true).end();

    deepEqual(tmp.length, 1);

    tmp = tmp[0];
    deepEqual(tmp.nodeType, 11);
    deepEqual(tmp.firstChild.nodeValue, 'text2');
    deepEqual(tmp.lastChild.tagName.toLowerCase(), 'br');
    domEqual(domToArray(container), []);
});

test('concat.js callback context', function() {
    var container = document.getElementById('container'),
        acts = [];

    var callback = function(item, index, arr) { return "'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + (this.tagName || 'fragment').toLowerCase() + "'"; },
        actcallback = function(item, index, arr) { acts.push(index + ' ' + item + ' ' + arrayToString(arr) + ' ' + (this.tagName || 'fragment').toLowerCase()) };

    $C(container, true)
        .elem('h1')
            .text('hello')
            .act(actcallback)
            .text(function() { if (this.tagName === 'H1') { return ' world'; }})
            .each([777])
                .test(true)
                    .br({test: callback}, true)
                .end()
                .test(function(item, index, arr) { actcallback.call(this, item, index, arr); return true; })
                    .br({test: callback}, true)
                .end()
            .end()
        .end()
        .repeat(2)
            .act(actcallback)
            .span()
                .each(['aa', 'bb'])
                    .repeat(3)
                        .b({test: callback, style: function() { return {content: callback}}})
                            .text(callback)
                            .act(actcallback)
                        .end()
                        .act(actcallback)
                    .end()
                    .act(actcallback)
                    .u({style: {content: callback}})
                        .text(callback)
                        .act(actcallback)
                    .end()
                .end()
                .act(actcallback)
                .i()
                    .act(actcallback)
                    .text(callback)
                .end()
                .choose()
                    .when(callback)
                        .text('oooo')
                        .act(actcallback)
                    .end()
                .end()
            .end()
        .end()
    .end();

    domEqual(domToArray(container), [
        {name: 'h1', children: [
            'hello',
            ' world',
            {name: 'br', attr: {test: "'0 777 [777] br'"}, children: []},
            {name: 'br', attr: {test: "'0 777 [777] br'"}, children: []}
        ]},
        {name: 'span', children: [
            {name: 'b', attr: {test: "'undefined 0 undefined b'", style: "content: undefined 0 undefined b"}, children: ["'undefined 0 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 1 undefined b'", style: "content: undefined 1 undefined b"}, children: ["'undefined 1 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 2 undefined b'", style: "content: undefined 2 undefined b"}, children: ["'undefined 2 undefined b'"]},
            {name: 'u', attr: {style: "content: 0 aa [aa,bb] u"}, children: ["'0 aa [aa,bb] u'"]},
            {name: 'b', attr: {test: "'undefined 0 undefined b'", style: "content: undefined 0 undefined b"}, children: ["'undefined 0 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 1 undefined b'", style: "content: undefined 1 undefined b"}, children: ["'undefined 1 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 2 undefined b'", style: "content: undefined 2 undefined b"}, children: ["'undefined 2 undefined b'"]},
            {name: 'u', attr: {style: "content: 1 bb [aa,bb] u"}, children: ["'1 bb [aa,bb] u'"]},
            {name: 'i', children: ["'undefined 0 undefined i'"]},
            'oooo'
        ]},
        {name: 'span', children: [
            {name: 'b', attr: {test: "'undefined 0 undefined b'", style: "content: undefined 0 undefined b"}, children: ["'undefined 0 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 1 undefined b'", style: "content: undefined 1 undefined b"}, children: ["'undefined 1 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 2 undefined b'", style: "content: undefined 2 undefined b"}, children: ["'undefined 2 undefined b'"]},
            {name: 'u', attr: {style: "content: 0 aa [aa,bb] u"}, children: ["'0 aa [aa,bb] u'"]},
            {name: 'b', attr: {test: "'undefined 0 undefined b'", style: "content: undefined 0 undefined b"}, children: ["'undefined 0 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 1 undefined b'", style: "content: undefined 1 undefined b"}, children: ["'undefined 1 undefined b'"]},
            {name: 'b', attr: {test: "'undefined 2 undefined b'", style: "content: undefined 2 undefined b"}, children: ["'undefined 2 undefined b'"]},
            {name: 'u', attr: {style: "content: 1 bb [aa,bb] u"}, children: ["'1 bb [aa,bb] u'"]},
            {name: 'i', children: ["'undefined 1 undefined i'"]},
            'oooo'
        ]}
    ]);

    deepEqual(acts, [
        'undefined undefined undefined h1',
        '0 777 [777] h1',
        'undefined 0 undefined fragment',
        'undefined 0 undefined b',
        'undefined 0 undefined span',
        'undefined 1 undefined b',
        'undefined 1 undefined span',
        'undefined 2 undefined b',
        'undefined 2 undefined span',
        '0 aa [aa,bb] span',
        '0 aa [aa,bb] u',
        'undefined 0 undefined b',
        'undefined 0 undefined span',
        'undefined 1 undefined b',
        'undefined 1 undefined span',
        'undefined 2 undefined b',
        'undefined 2 undefined span',
        '1 bb [aa,bb] span',
        '1 bb [aa,bb] u',
        'undefined 0 undefined span',
        'undefined 0 undefined i',
        'undefined 0 undefined span',
        'undefined 1 undefined fragment',
        'undefined 0 undefined b',
        'undefined 0 undefined span',
        'undefined 1 undefined b',
        'undefined 1 undefined span',
        'undefined 2 undefined b',
        'undefined 2 undefined span',
        '0 aa [aa,bb] span',
        '0 aa [aa,bb] u',
        'undefined 0 undefined b',
        'undefined 0 undefined span',
        'undefined 1 undefined b',
        'undefined 1 undefined span',
        'undefined 2 undefined b',
        'undefined 2 undefined span',
        '1 bb [aa,bb] span',
        '1 bb [aa,bb] u',
        'undefined 1 undefined span',
        'undefined 1 undefined i',
        'undefined 1 undefined span'
    ]);

    container.innerHTML = '';
});

test('concat.js complex test', function() {
    var container = document.getElementById('container'),
        tmp = 0;

    $C(container, true)
        .div({'class': 'ololo', tmp: undefined, tmp2: function() {}, something: function() { return this.tagName; }})
            .ul()
                .repeat(2)
                    .li()
                        .text('aaa')
        .end(4)
        .repeat(3)
            .span({'style': 'left: 123px;'})
                .text(function(index) { return index; })
            .end()
        .end()
        .repeat(function() { return ++tmp <= 5; })
            .p()
                .text(function(index) { return index + ' ' + tmp; })
            .end()
        .end()
        .div()
            .text('hello')
            .act(function() { this.innerHTML += '<br>'; })
            .text('world')
        .end()
        .br(true)
        .elem('hr', true)
        .br({'class': 'auch'}, true)
        .each([9, 8, 7])
            .p({style: {'background-color': function() { return this.tagName.toLowerCase() + 'urple'; }, height: '100px'}})
                .text(function(item, index, arr) { return index + ' ' + item + ' ' + arrayToString(arr); })
                .repeat(2)
                    .div()
                        .text(function(index) { return index; })
                    .end()
                .end()
                .div()
                    .text(function(item, index, arr) { return index + ' ' + item + ' ' + arrayToString(arr); })
        .end(3)
        .test(true)
            .br({test: 'ololo'}, true)
        .end()
        .test(false)
            .br({test: 'ololo2'}, true)
        .end()
        .test(function() { return false; })
            .br({test: 'ololo3'}, true)
        .end()
        .test(function() { return true; })
            .br({test: 'ololo4'}, true)
        .end()
        .div()
            .choose()
                .when(true).p().text('123').end().end()
                .when(true).p().text('234').end(2)
                .otherwise().p().text('345')
        .end(4)
        .div()
            .choose()
                .when(false).p().text('456').end(2)
                .when(false).p().text('567').end().end()
            .end()
            .choose()
                .when(false).p().text('678').end(2)
                .when(false).p().text('789').end().end()
                .otherwise().p().text('890').end().end()
            .end()
            .choose()
                .when(false).p().text('901').end().end()
                .when(true).p().text('012').end().end()
                .otherwise().p().text('123').end().end()
            .end()
        .end()
        .choose()
        .end()
        .choose()
            .when().text('ahahahaha').end()
            .when(false).text('ohohohoho').end()
            .when(true).text('uhuhuhuhu').end()
        .end()
    .end();

    domEqual(domToArray(container), [
        {name: 'div', attr: {'class': 'ololo', something: 'DIV'}, children: [
            {name: 'ul', children: [
                {name: 'li', children: ['aaa']},
                {name: 'li', children: ['aaa']}
            ]}
        ]},
        {name: 'span', attr: {style: 'left: 123px'}, children: ['0']},
        {name: 'span', attr: {style: 'left: 123px'}, children: ['1']},
        {name: 'span', attr: {style: 'left: 123px'}, children: ['2']},
        {name: 'p', children: ['0 1']},
        {name: 'p', children: ['1 2']},
        {name: 'p', children: ['2 3']},
        {name: 'p', children: ['3 4']},
        {name: 'p', children: ['4 5']},
        {name: 'div', children: ['hello', {name: 'br', children: []}, 'world']},
        {name: 'br', children: []},
        {name: 'hr', children: []},
        {name: 'br', attr: {'class': 'auch'}, children: []},
        {name: 'p', attr: {style: 'background-color: purple; height: 100px'}, children: [
            '0 9 [9,8,7]',
            {name: 'div', children: ['0']},
            {name: 'div', children: ['1']},
            {name: 'div', children: ['0 9 [9,8,7]']}
        ]},
        {name: 'p', attr: {style: 'background-color: purple; height: 100px'}, children: [
            '1 8 [9,8,7]',
            {name: 'div', children: ['0']},
            {name: 'div', children: ['1']},
            {name: 'div', children: ['1 8 [9,8,7]']}
        ]},
        {name: 'p', attr: {style: 'background-color: purple; height: 100px'}, children: [
            '2 7 [9,8,7]',
            {name: 'div', children: ['0']},
            {name: 'div', children: ['1']},
            {name: 'div', children: ['2 7 [9,8,7]']}
        ]},
        {name: 'br', attr: {test: 'ololo'}, children: []},
        {name: 'br', attr: {test: 'ololo4'}, children: []},
        {name: 'div', children: [
            {name: 'p', children: ['123']}
        ]},
        {name: 'div', children: [
            {name: 'p', children: ['890']},
            {name: 'p', children: ['012']}
        ]},
        'uhuhuhuhu'
    ]);

    container.innerHTML = '';
});

test('concat.js noFragment test', function() {
    var container = document.getElementById('container'),
        tmp;

    // Ignore noFragment == true when no parent.
    tmp = $C(null, true, true).text('text').end();

    deepEqual(tmp.length, 1);
    tmp = tmp[0];
    deepEqual(tmp.nodeType, 11);

    tmp = $C(container, false, true).text('text2').end();
    deepEqual(tmp, []);
    domEqual(domToArray(container), ['text2']);

    // Ignore replace == true when nofragment == true.
    tmp = $C(container, true, true).text('text3').end();
    deepEqual(tmp, []);
    domEqual(domToArray(container), ['text2', 'text3']);

    container.innerHTML = '';
});

test('concat.js define test', function() {
    var actual = [];

    $C.define('ololo', function(item, index, arr, args) {
        args = Array.prototype.slice.call(args, 0);
        actual.push("'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + args + ' ' + this.tagName.toLowerCase() + "'");
    });

    $C()
        .div()
            .ololo('a', 'b', 'c')
            .ololo('d', 'e', 'f')
        .end()
        .span()
            .ololo('g', 'h', 'i')
        .end()
        .repeat(3)
            .a()
                .ololo('j', 'k', 'l')
            .end()
        .end()
        .each([111, 222, 333])
            .elem('section')
                .ololo('m', 'n', 'o')
                .each([11111, 22222])
                    .p()
                        .ololo('p', 'q', 'r')
                    .end()
                .end()
                .ololo('s', 't', 'u')
            .end()
        .end()
    .end();

    deepEqual(actual, [
        "'undefined undefined undefined a,b,c div'",
        "'undefined undefined undefined d,e,f div'",
        "'undefined undefined undefined g,h,i span'",
        "'undefined 0 undefined j,k,l a'",
        "'undefined 1 undefined j,k,l a'",
        "'undefined 2 undefined j,k,l a'",
        "'0 111 [111,222,333] m,n,o section'",
        "'0 11111 [11111,22222] p,q,r p'",
        "'1 22222 [11111,22222] p,q,r p'",
        "'0 111 [111,222,333] s,t,u section'",
        "'1 222 [111,222,333] m,n,o section'",
        "'0 11111 [11111,22222] p,q,r p'",
        "'1 22222 [11111,22222] p,q,r p'",
        "'1 222 [111,222,333] s,t,u section'",
        "'2 333 [111,222,333] m,n,o section'",
        "'0 11111 [11111,22222] p,q,r p'",
        "'1 22222 [11111,22222] p,q,r p'",
        "'2 333 [111,222,333] s,t,u section'"
    ]);
});

test('concat.js ret test', function() {
    var container = document.getElementById('container'),
        tmp;

    tmp = $C(container)
        .div()
            .text('aaa')
            .mem()
        .end()
        .span()
            .mem()
            .mem(function(item, index, arr) { return 'hehe'; })
        .end()
        .each([22, 33])
            .p()
                .mem()
                .text('ho')
                .mem(function(item, index, arr) { return "'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + this.tagName.toLowerCase() + "'"; })
            .end()
        .end()
    .end();

    deepEqual(tmp.length, 7);
    domEqual(domToArray(container), [
        {name: 'div', children: ['aaa']},
        {name: 'span', children: []},
        {name: 'p', children: ['ho']},
        {name: 'p', children: ['ho']}
    ]);

    deepEqual(tmp[0].tagName.toLowerCase(), 'div');
    deepEqual(tmp[1].tagName.toLowerCase(), 'span');
    deepEqual(tmp[2], 'hehe');
    deepEqual(tmp[3].tagName.toLowerCase(), 'p');
    deepEqual(tmp[4], "'0 22 [22,33] p'");
    deepEqual(tmp[5].tagName.toLowerCase(), 'p');
    deepEqual(tmp[6], "'1 33 [22,33] p'");

    tmp = $C()
        .mem(function() { return 'zzz'; })
        .mem()
        .div()
            .mem()
        .end()
    .end();

    deepEqual(tmp.length, 4);
    deepEqual(tmp[0].nodeType, 11);
    deepEqual(tmp[1], 'zzz');
    deepEqual(tmp[2].nodeType, 11);
    deepEqual(tmp[3].tagName.toLowerCase(), 'div');

    container.innerHTML = '';
});
