test('concat.js parts', function() {
    var container = document.getElementById('container');

    $C(container)
        .elem('section')
            .text('hello')
            .text(function() { if (this.tagName === 'SECTION') { return ' world'; }})
        .end()
    .end();

    deepEqual(container.innerHTML, '<section>hello world</section>');

    container.innerHTML = '';
});

test('concat.js complex test', function() {
    var container = document.getElementById('container'),
        tmp = 0;


    $C(container)
        .div({something: function() { return this.tagName; }})
            .do(function() { this.addEventListener('click', function() { alert(5555); }); })
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

    // TODO: Make a cross-browser function to compare resulting HTML.
    deepEqual(container.innerHTML, '<div something="DIV"><ul><li>aaa</li><li>aaa</li></ul></div><span style="border: 1px solid green;">0</span><span style="border: 1px solid green;">1</span><span style="border: 1px solid green;">2</span><p>0 1</p><p>1 2</p><p>2 3</p><p>3 4</p><p>4 5</p><div>hello<br>world</div><p style="background-color: purple; height: 100px;">0 9<div>0</div><div>1</div><div>0 9</div></p><p style="background-color: purple; height: 100px;">1 8<div>0</div><div>1</div><div>1 8</div></p><p style="background-color: purple; height: 100px;">2 7<div>0</div><div>1</div><div>2 7</div></p>');

    container.innerHTML = '';
});
