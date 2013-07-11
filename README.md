concat.js
=========

Chainable DOM Builder

**Usage example:**

    var tmp = 0;

    $C(document.body)
        .div({'class': 'ololo', 'style': 'background-color: red; height: 100px;'})
            .act(function() { this.addEventListener('click', function() { alert(5555); }); })
            .ul()
                .repeat(2)
                    .li()
                        .text('aaa')
        .end(4)
        .repeat(3)
            .span({'style': 'border: 1px solid green;'})
                .text(function(index) { return index + ' ' + Math.random(); })
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
            .p()
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

**Will append the following to `<body>` tag:**

    <div class="ololo" style="background-color: red; height: 100px;">
        <ul>
            <li>aaa</li>
            <li>aaa</li>
        </ul>
    </div>
    <span style="border: 1px solid green;">0 0.3901003133505583</span>
    <span style="border: 1px solid green;">1 0.19187432969920337</span>
    <span style="border: 1px solid green;">2 0.0640524192713201</span>
    <p>0 1</p>
    <p>1 2</p>
    <p>2 3</p>
    <p>3 4</p>
    <p>4 5</p>
    <div>
        hello
        <br>
        world
    </div>
    <p>
        0 9
        <div>0</div>
        <div>1</div>
        <div>0 9</div>
    </p>
    <p>
        1 8
        <div>0</div>
        <div>1</div>
        <div>1 8</div>
    </p>
    <p>
        2 7
        <div>0</div>
        <div>1</div>
        <div>2 7</div>
    </p>

**First `<div>` will have 'click' event handler.**
