function allTests() {
    var $C = getConcatJS();

    QUnit.test('concat.js replace content', function(assert) {
        var container = document.getElementById('container');

        $C(container).text('text1').end();

        domEqual(assert, domToArray(container), ['text1']);

        $C(container).text('text2').end();

        domEqual(assert, domToArray(container), ['text1', 'text2']);

        $C(container, true).text('text3').end();

        domEqual(assert, domToArray(container), ['text3']);

        $C(container, true).text('text4').end();

        domEqual(assert, domToArray(container), ['text4']);

        container.innerHTML = '';
    });


    QUnit.test('concat.js undefined values', function(assert) {
        var container = document.getElementById('container');

        $C(container).text('text1').test(undefined).text('text2').end().text('text3').end();

        domEqual(assert, domToArray(container), ['text1', 'text3']);

        $C(container, true).text('text4').each(undefined).text('text5').end().text('text6').end();

        domEqual(assert, domToArray(container), ['text4', 'text6']);

        $C(container, true).text('text7').repeat(undefined).text('text8').end().text('text9').end();

        domEqual(assert, domToArray(container), ['text7', 'text9']);

        container.innerHTML = '';
    });


    QUnit.test('concat.js return value', function(assert) {
        var container = document.getElementById('container');

        assert.deepEqual($C(container).text('text1').end(), undefined);

        container.innerHTML = '';

        var tmp = $C().text('text2').br(true).end();

        assert.deepEqual(tmp.nodeType, 11);
        assert.deepEqual(tmp.firstChild.nodeValue, 'text2');
        assert.deepEqual(tmp.lastChild.tagName.toLowerCase(), 'br');
        domEqual(assert, domToArray(container), []);
    });


    QUnit.test('concat.js callback context', function(assert) {
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

        domEqual(assert, domToArray(container), [
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

        assert.deepEqual(acts, [
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


    QUnit.test('concat.js complex test', function(assert) {
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
                .br({test: 'ololo'})
                    .each([88, 99])
                        .attr(function(item) { return 'hoho' + item; },
                            function(item, index) { return 'hahaha' + index; })
                .end(2)
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
            .repeat(2)
                .each(function(index) { return ['aaa' + index, 'ooo' + (index + 1)]; })
                    .text(function(item, index, arr) { return index + ' ' + item + ' ' + arrayToString(arr); })
                .end()
            .end()
        .end();

        domEqual(assert, domToArray(container), [
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
            {name: 'br', attr: {test: 'ololo', hoho88: 'hahaha0', hoho99: 'hahaha1'}, children: []},
            {name: 'br', attr: {test: 'ololo4'}, children: []},
            {name: 'div', children: [
                {name: 'p', children: ['123']}
            ]},
            {name: 'div', children: [
                {name: 'p', children: ['890']},
                {name: 'p', children: ['012']}
            ]},
            'uhuhuhuhu',
            '0 aaa0 [aaa0,ooo1]',
            '1 ooo1 [aaa0,ooo1]',
            '0 aaa1 [aaa1,ooo2]',
            '1 ooo2 [aaa1,ooo2]'
        ]);

        container.innerHTML = '';
    });


    QUnit.test('concat.js define test', function(assert) {
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

        assert.deepEqual(actual, [
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


    QUnit.test('concat.js ret test', function(assert) {
        var container = document.getElementById('container'),
            tmp,
            num = 0;

        tmp = $C(container)
            .div()
                .text('aaa')
                .mem(num++)
            .end()
            .span()
                .mem(num++)
                .mem(num++, function(item, index, arr) { return 'hehe'; })
            .end()
            .each([22, 33])
                .p()
                    .mem(function() { return 'aaa' + num++; })
                    .text('ho')
                    .mem(function() { return 'bbb' + num++; },
                        function(item, index, arr) { return "'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + this.tagName.toLowerCase() + "'"; })
                .end()
            .end()
        .end();

        assert.deepEqual(tmp, undefined);

        domEqual(assert, domToArray(container), [
            {name: 'div', children: ['aaa']},
            {name: 'span', children: []},
            {name: 'p', children: ['ho']},
            {name: 'p', children: ['ho']}
        ]);

        assert.deepEqual($C.mem[0].tagName.toLowerCase(), 'div');
        assert.deepEqual($C.mem[1].tagName.toLowerCase(), 'span');
        assert.deepEqual($C.mem[2], 'hehe');
        assert.deepEqual($C.mem['aaa3'].tagName.toLowerCase(), 'p');
        assert.deepEqual($C.mem['bbb4'], "'0 22 [22,33] p'");
        assert.deepEqual($C.mem['aaa5'].tagName.toLowerCase(), 'p');
        assert.deepEqual($C.mem['bbb6'], "'1 33 [22,33] p'");

        $C.mem = {aa: 'haha', 'bobo': 'baba'};

        tmp = $C()
            .mem('aa', function() { return 'zzz'; })
            .mem('bb')
            .div()
                .mem('cc')
            .end()
            .mem('dd', 'ee')
        .end();

        assert.deepEqual(tmp.nodeType, 11);
        assert.deepEqual($C.mem.aa, 'zzz');
        assert.deepEqual($C.mem.bb.nodeType, 11);
        assert.deepEqual($C.mem.cc.tagName.toLowerCase(), 'div');
        assert.deepEqual($C.mem.dd, 'ee');
        assert.deepEqual($C.mem.bobo, 'baba');

        $C.mem = {};

        container.innerHTML = '';
    });


    QUnit.test('concat.js each test', function(assert) {
        var container = document.getElementById('container'),
            data = {'aa': 11, 'bb': 22};

        $C(container)
            .each(data)
                .text(function(value, key, obj) {
                    return '|' + value + '|' + key + '|' + (data === obj)  + '|';
                })
            .end()
        .end();

        domEqual(assert, domToArray(container), [
            '|11|aa|true|',
            '|22|bb|true|'
        ]);

        container.innerHTML = '';

        $C(container)
            .each(function() { data['cc'] = 33; return data; })
                .text(function(value, key, obj) {
                    return '|' + value + '|' + key + '|' + (data === obj)  + '|';
                })
            .end()
        .end();

        domEqual(assert, domToArray(container), [
            '|11|aa|true|',
            '|22|bb|true|',
            '|33|cc|true|'
        ]);

        container.innerHTML = '';

        $C(container).each({}).text('ololo').end().end();
        domEqual(assert, domToArray(container), []);

        $C(container).each(null).text('alala').end().end();
        domEqual(assert, domToArray(container), []);

        $C(container).each(function() { return null; }).text('ululu').end().end();
        domEqual(assert, domToArray(container), []);

        $C(container).each(undefined).text('ylyly').end().end();
        domEqual(assert, domToArray(container), []);

        $C(container).each(123).text('ilili').end().end();
        domEqual(assert, domToArray(container), []);

        $C(container)
            .each('hi')
                .text(function(value, key, obj) {
                    return '|' + value + '|' + key + '|' + obj + '|';
                })
            .end()
        .end();

        domEqual(assert, domToArray(container), [
            '|h|0|hi|',
            '|i|1|hi|'
        ]);

        container.innerHTML = '';
    });


    QUnit.test('concat.js unescaped text', function(assert) {
        var container = document.getElementById('container');

        $C(container)
            .text('<p>hello</p><a>world</a>!')
            .text('<p>hello</p><a>world</a>!', true)
        .end();

        domEqual(assert, domToArray(container), [
            '<p>hello</p><a>world</a>!',
            {name: 'p', children: ['hello']},
            {name: 'a', children: ['world']},
            '!'
        ]);

        container.innerHTML = '';

        $C(container)
            .div()
                .text('<p>hello</p><a>world</a>!', true)
                .text('<p>hello</p><a>world</a>!')
            .end()
        .end();

        domEqual(assert, domToArray(container), [
            {name: 'div', children: [
                {name: 'p', children: ['hello']},
                {name: 'a', children: ['world']},
                '!',
                '<p>hello</p><a>world</a>!'
            ]}
        ]);

        container.innerHTML = '';
    });


    QUnit.test('concat.js function as element name and attributes object test', function(assert) {
        var container = document.getElementById('container'),
            ret = [];

        $C(container, true)
            .elem(function(item, index, arr) { ret.push("'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + (this.tagName || 'fragment').toLowerCase() + "'"); return 'em' })
                .text('om')
            .end()
            .each(['aa'])
                .div()
                    .elem(function(item, index, arr) { ret.push("'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + (this.tagName || 'fragment').toLowerCase() + "'"); return 'strong' })
                        .text('really')
                    .end()
                    .div(function(item, index, arr) { return {hello: "'" + index + ' ' + item + ' ' + arrayToString(arr) + ' ' + (this.tagName || 'fragment').toLowerCase() + "'"}; })
                        .text('indeed')
        .end(4);

        domEqual(assert, domToArray(container), [
            {name: 'em', children: ['om']},
            {name: 'div', children: [
                {name: 'strong', children: ['really']},
                {name: 'div', attr: {hello: "'0 aa [aa] div'"}, children: ['indeed']}
            ]}
        ]);

        assert.deepEqual(ret, ["'undefined undefined undefined fragment'", "'0 aa [aa] div'"], 'Same context');

        container.innerHTML = '';
    });


    QUnit.test('concat.js test direct result generation', function(assert) {
        var container = document.getElementById('container'),
            ret;

        $C(container)
            .div()
                .act(function() {
                    $C(this, false, true)
                        .attr('attr1', 'val1')
                        .attr(function() { return 'attr2'; }, function() { return 'val2'; })
                    .end();
                })
            .end()
            .p()
                .act(function() {
                    ret = this;
                })
        .end(2);

        $C(ret, false, true)
            .span().text('Hello').end()
            .attr('aaa', 'bbb')
        .end();


        domEqual(assert, domToArray(container), [
            {name: 'div', attr: {attr1: 'val1', attr2: 'val2'}, children: []},
            {name: 'p', attr: {aaa: 'bbb'}, children: [{name: 'span', children: ['Hello']}]}
        ]);

        container.innerHTML = '';
    });


    QUnit.test('concat.js proper lazy attributes object value', function(assert) {
        var container = document.getElementById('container'),
            index = 0;

        $C(container)
            .div()
                .repeat(5)
                    .act(function() { index++; })
                    .elem(
                        function() { return 'e' + index; },
                        function() { return {a: index, b: function() { return index + index; }}; }
                    )
        .end(4);

        domEqual(assert, domToArray(container), [
            {name: 'div', children: [
                {name: 'e1', attr: {a: '1', b: '2'}, children: []},
                {name: 'e2', attr: {a: '2', b: '4'}, children: []},
                {name: 'e3', attr: {a: '3', b: '6'}, children: []},
                {name: 'e4', attr: {a: '4', b: '8'}, children: []},
                {name: 'e5', attr: {a: '5', b: '10'}, children: []}
            ]}
        ]);

        container.innerHTML = '';
    });


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


    function attrEqual(assert, val, expected) {
        var i = 0, j = 0, name;

        for (name in val) {
            i++;
        }

        for (name in expected) {
            j++;
        }

        assert.deepEqual(i, j, 'Same attribute count');

        for (name in val) {
            assert.deepEqual(val[name], expected[name], 'Same attribute value');
        }
    }


    function domEqual(assert, val, expected) {
        var i;

        assert.deepEqual(val.length, expected.length, 'Same node count');

        for (i = 0; i < Math.min(val.length, expected.length); i++) {
            assert.deepEqual(typeof val[i], typeof expected[i], 'Same node type');

            if (typeof val[i] === 'object') {
                assert.deepEqual(val[i].name, expected[i].name, 'Same name');
                attrEqual(assert, val[i].attr, expected[i].attr);
                domEqual(assert, val[i].children, expected[i].children);
            } else {
                assert.deepEqual(val[i], expected[i], 'Same text value');
            }
        }
    }
}
