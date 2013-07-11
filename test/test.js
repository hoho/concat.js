function domToArray(node) {
    var ret = [], i, j, n, attr, a;

    for (i = 0; i < node.childNodes.length; i++) {
        n = node.childNodes[i];

        if (n.nodeType === 3) {
            ret.push(n.textContent);
        } else {
            attr = {};
            for (j = 0; j < n.attributes.length; j++) {
                a = n.attributes[j];

                if (a.name === 'style') {
                    attr[a.name] = n.style.cssText.replace(/'|"|;$/g, '');
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

    equal(i, j, 'Same attribute count');

    for (name in val) {
        equal(val[name], expected[name], 'Same attribute value');
    }
}

function domEqual(val, expected) {
    var i, attr;

    equal(val.length, expected.length, 'Same node count');

    for (i = 0; i < Math.min(val.length, expected.length); i++) {
        equal(typeof val[i], typeof expected[i], 'Same node type');

        if (typeof val[i] === 'object') {
            equal(val[i].name, expected[i].name, 'Same name');
            attrEqual(val[i].attr, expected[i].attr);
            domEqual(val[i].children, expected[i].children);
        } else {
            equal(val[i], expected[i], 'Same text value');
        }
    }
}

test('concat.js callback context', function() {
    var container = document.getElementById('container'),
        dos = [];

    var callback = function(index, item) { return "'" + index + ' ' + item + ' ' + this.tagName + "'"; },
        docallback = function(index, item) { dos.push(index + ' ' + item + ' ' + this.tagName) };

    $C(container)
        .elem('section')
            .text('hello')
            .do(docallback)
            .text(function() { if (this.tagName === 'SECTION') { return ' world'; }})
        .end()
        .repeat(2)
            .do(docallback)
            .span()
                .each(['a', 'b'])
                    .repeat(3)
                        .b({test: callback, style: function() { return {content: callback}}})
                            .text(callback)
                            .do(docallback)
                        .end()
                        .do(docallback)
                    .end()
                    .do(docallback)
                    .u({style: {content: callback}})
                        .text(callback)
                        .do(docallback)
                    .end()
                .end()
                .do(docallback)
                .i()
                    .do(docallback)
                    .text(callback)
                .end()
            .end()
        .end()
    .end();

    domEqual(domToArray(container), [
        {name: 'section', children: ['hello', ' world']},
        {name: 'span', children: [
            {name: 'b', attr: {test: "'0 undefined B'", style: "content: 0 undefined B"}, children: ["'0 undefined B'"]},
            {name: 'b', attr: {test: "'1 undefined B'", style: "content: 1 undefined B"}, children: ["'1 undefined B'"]},
            {name: 'b', attr: {test: "'2 undefined B'", style: "content: 2 undefined B"}, children: ["'2 undefined B'"]},
            {name: 'u', attr: {style: "content: 0 a U"}, children: ["'0 a U'"]},
            {name: 'b', attr: {test: "'0 undefined B'", style: "content: 0 undefined B"}, children: ["'0 undefined B'"]},
            {name: 'b', attr: {test: "'1 undefined B'", style: "content: 1 undefined B"}, children: ["'1 undefined B'"]},
            {name: 'b', attr: {test: "'2 undefined B'", style: "content: 2 undefined B"}, children: ["'2 undefined B'"]},
            {name: 'u', attr: {style: "content: 1 b U"}, children: ["'1 b U'"]},
            {name: 'i', children: ["'0 undefined I'"]}
        ]},
        {name: 'span', children: [
            {name: 'b', attr: {test: "'0 undefined B'", style: "content: 0 undefined B"}, children: ["'0 undefined B'"]},
            {name: 'b', attr: {test: "'1 undefined B'", style: "content: 1 undefined B"}, children: ["'1 undefined B'"]},
            {name: 'b', attr: {test: "'2 undefined B'", style: "content: 2 undefined B"}, children: ["'2 undefined B'"]},
            {name: 'u', attr: {style: "content: 0 a U"}, children: ["'0 a U'"]},
            {name: 'b', attr: {test: "'0 undefined B'", style: "content: 0 undefined B"}, children: ["'0 undefined B'"]},
            {name: 'b', attr: {test: "'1 undefined B'", style: "content: 1 undefined B"}, children: ["'1 undefined B'"]},
            {name: 'b', attr: {test: "'2 undefined B'", style: "content: 2 undefined B"}, children: ["'2 undefined B'"]},
            {name: 'u', attr: {style: "content: 1 b U"}, children: ["'1 b U'"]},
            {name: 'i', children: ["'1 undefined I'"]}
        ]}
    ]);

    deepEqual(dos, [
        'undefined undefined SECTION',
        '0 undefined undefined',
        '0 undefined B',
        '0 undefined SPAN',
        '1 undefined B',
        '1 undefined SPAN',
        '2 undefined B',
        '2 undefined SPAN',
        '0 a SPAN',
        '0 a U',
        '0 undefined B',
        '0 undefined SPAN',
        '1 undefined B',
        '1 undefined SPAN',
        '2 undefined B',
        '2 undefined SPAN',
        '1 b SPAN',
        '1 b U',
        '0 undefined SPAN',
        '0 undefined I',
        '1 undefined undefined',
        '0 undefined B',
        '0 undefined SPAN',
        '1 undefined B',
        '1 undefined SPAN',
        '2 undefined B',
        '2 undefined SPAN',
        '0 a SPAN',
        '0 a U',
        '0 undefined B',
        '0 undefined SPAN',
        '1 undefined B',
        '1 undefined SPAN',
        '2 undefined B',
        '2 undefined SPAN',
        '1 b SPAN',
        '1 b U',
        '1 undefined SPAN',
        '1 undefined I'
    ]);

    container.innerHTML = '';
});

test('concat.js complex test', function() {
    var container = document.getElementById('container'),
        tmp = 0;

    $C(container)
        .div({'class': 'ololo', tmp: undefined, tmp2: function() {}, something: function() { return this.tagName; }})
            .ul()
                .repeat(2)
                    .li()
                        .text('aaa')
        .end(4)
        .repeat(3)
            .span({'style': 'border: 1px solid green;'})
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
            .do(function() { this.innerHTML += '<br>'; })
            .text('world')
        .end()
        .each([9, 8, 7])
            .p({style: {'background-color': function() { return this.tagName.toLowerCase() + 'urple'; }, height: '100px'}})
                .text(function(index, item) { return index + ' ' + item; })
                .repeat(2)
                    .div()
                        .text(function(index) { return index; })
                    .end()
                .end()
                .div()
                    .text(function(index, item) { return index + ' ' + item; })
        .end(3)
    .end();

    domEqual(domToArray(container), [
        {name: 'div', attr: {'class': 'ololo', something: 'DIV'}, children: [
            {name: 'ul', children: [
                {name: 'li', children: ['aaa']},
                {name: 'li', children: ['aaa']}
            ]}
        ]},
        {name: 'span', attr: {style: 'border: 1px solid green'}, children: ['0']},
        {name: 'span', attr: {style: 'border: 1px solid green'}, children: ['1']},
        {name: 'span', attr: {style: 'border: 1px solid green'}, children: ['2']},
        {name: 'p', children: ['0 1']},
        {name: 'p', children: ['1 2']},
        {name: 'p', children: ['2 3']},
        {name: 'p', children: ['3 4']},
        {name: 'p', children: ['4 5']},
        {name: 'div', children: ['hello', {name: 'br', children: []}, 'world']},
        {name: 'p', attr: {style: 'background-color: purple; height: 100px'}, children: [
            '0 9',
            {name: 'div', children: ['0']},
            {name: 'div', children: ['1']},
            {name: 'div', children: ['0 9']}
        ]},
        {name: 'p', attr: {style: 'background-color: purple; height: 100px'}, children: [
            '1 8',
            {name: 'div', children: ['0']},
            {name: 'div', children: ['1']},
            {name: 'div', children: ['1 8']}
        ]},
        {name: 'p', attr: {style: 'background-color: purple; height: 100px'}, children: [
            '2 7',
            {name: 'div', children: ['0']},
            {name: 'div', children: ['1']},
            {name: 'div', children: ['2 7']}
        ]}
    ]);

    container.innerHTML = '';
});

