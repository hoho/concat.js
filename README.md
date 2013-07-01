Concat.JS
=========

Chainable DOM Builder

*Requires jQuery.*

**Usage example:**

    var tmp = 0;

    $C(document.body)
        .elem('div')
            .attr('class', 'ololo')
            .css({'background-color': 'red', 'height': '100px'})
            .on('click', function() { alert(123); })
        .end()
        .repeat(3)
            .elem('span')
                .css('border', '1px solid green')
                .text(function() { return Math.random(); })
            .end()
        .end()
        .repeat(function() { return ++tmp <= 5; })
            .elem('p')
                .text(function() { return tmp; })
            .end()
        .end()
        .elem('div')
            .text('hello')
        .end()
    .end();

**Will append to `<body>` tag the following:**

    <div class="ololo" style="background-color: red; height: 100px;"></div>
    <span style="border: 1px solid green;">0.08111037290655077</span>
    <span style="border: 1px solid green;">0.08079393371008337</span>
    <span style="border: 1px solid green; ">0.906995284371078</span>
    <p>1</p>
    <p>2</p>
    <p>3</p>
    <p>4</p>
    <p>5</p>
    <div>hello</div>

**First `<div>` will have 'click' event handler.**
