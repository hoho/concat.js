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

    equal(i, j, 'Same attribute count');

    for (name in val) {
        equal(val[name], expected[name], 'Same attribute value');
    }
}

function domEqual(val, expected) {
    var i;

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
        acts = [];

    var callback = function(index, item) { return "'" + index + ' ' + item + ' ' + this.tagName.toLowerCase() + "'"; },
        actcallback = function(index, item) { acts.push(index + ' ' + item + ' ' + (this.tagName || 'fragment').toLowerCase()) };

    $C(container)
        .elem('h1')
            .text('hello')
            .act(actcallback)
            .text(function() { if (this.tagName === 'H1') { return ' world'; }})
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
            .end()
        .end()
    .end();

    domEqual(domToArray(container), [
        {name: 'h1', children: ['hello', ' world']},
        {name: 'span', children: [
            {name: 'b', attr: {test: "'0 undefined b'", style: "content: 0 undefined b"}, children: ["'0 undefined b'"]},
            {name: 'b', attr: {test: "'1 undefined b'", style: "content: 1 undefined b"}, children: ["'1 undefined b'"]},
            {name: 'b', attr: {test: "'2 undefined b'", style: "content: 2 undefined b"}, children: ["'2 undefined b'"]},
            {name: 'u', attr: {style: "content: 0 aa u"}, children: ["'0 aa u'"]},
            {name: 'b', attr: {test: "'0 undefined b'", style: "content: 0 undefined b"}, children: ["'0 undefined b'"]},
            {name: 'b', attr: {test: "'1 undefined b'", style: "content: 1 undefined b"}, children: ["'1 undefined b'"]},
            {name: 'b', attr: {test: "'2 undefined b'", style: "content: 2 undefined b"}, children: ["'2 undefined b'"]},
            {name: 'u', attr: {style: "content: 1 bb u"}, children: ["'1 bb u'"]},
            {name: 'i', children: ["'0 undefined i'"]}
        ]},
        {name: 'span', children: [
            {name: 'b', attr: {test: "'0 undefined b'", style: "content: 0 undefined b"}, children: ["'0 undefined b'"]},
            {name: 'b', attr: {test: "'1 undefined b'", style: "content: 1 undefined b"}, children: ["'1 undefined b'"]},
            {name: 'b', attr: {test: "'2 undefined b'", style: "content: 2 undefined b"}, children: ["'2 undefined b'"]},
            {name: 'u', attr: {style: "content: 0 aa u"}, children: ["'0 aa u'"]},
            {name: 'b', attr: {test: "'0 undefined b'", style: "content: 0 undefined b"}, children: ["'0 undefined b'"]},
            {name: 'b', attr: {test: "'1 undefined b'", style: "content: 1 undefined b"}, children: ["'1 undefined b'"]},
            {name: 'b', attr: {test: "'2 undefined b'", style: "content: 2 undefined b"}, children: ["'2 undefined b'"]},
            {name: 'u', attr: {style: "content: 1 bb u"}, children: ["'1 bb u'"]},
            {name: 'i', children: ["'1 undefined i'"]}
        ]}
    ]);

    deepEqual(acts, [
        'undefined undefined h1',
        '0 undefined fragment',
        '0 undefined b',
        '0 undefined span',
        '1 undefined b',
        '1 undefined span',
        '2 undefined b',
        '2 undefined span',
        '0 aa span',
        '0 aa u',
        '0 undefined b',
        '0 undefined span',
        '1 undefined b',
        '1 undefined span',
        '2 undefined b',
        '2 undefined span',
        '1 bb span',
        '1 bb u',
        '0 undefined span',
        '0 undefined i',
        '1 undefined fragment',
        '0 undefined b',
        '0 undefined span',
        '1 undefined b',
        '1 undefined span',
        '2 undefined b',
        '2 undefined span',
        '0 aa span',
        '0 aa u',
        '0 undefined b',
        '0 undefined span',
        '1 undefined b',
        '1 undefined span',
        '2 undefined b',
        '2 undefined span',
        '1 bb span',
        '1 bb u',
        '1 undefined span',
        '1 undefined i'
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
        {name: 'span', attr: {style: 'left: 123px'}, children: ['0']},
        {name: 'span', attr: {style: 'left: 123px'}, children: ['1']},
        {name: 'span', attr: {style: 'left: 123px'}, children: ['2']},
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

