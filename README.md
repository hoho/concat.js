concat.js
=========

Chainable DOM Builder

## How to use

	$C(parentNode, replace, nofragment)
	    ...
	.end();

`parentNode` is a DOM element to put the result into.

`replace` is a boolean value indicates that `parentNode`'s content should be replaced with newly built content (newly built content is being appended to the current one when `replace` is coerced to `false`).

`noFragment` indicates that **concat.js** shouldn't use documentFragment and should put the result directly to `parentNode`.

`parentNode` could be undefined, in this case result's documentFragment will be returned with the last `end()` call, `replace` and `noFragment` arguments will be ignored.


## Usage example

    var tmp = 0;

    $C(document.body)
        .div({'class': 'ololo', 'style': 'background-color: red; height: 100px;'})
            .act(function() {
                // In all callbacks _this_ is pointing to the current element
                // (it's newly created div here).
                this.addEventListener('click', function() { alert(5555); });
            })
            .ul()
                .repeat(2)
                    .li()
                        .text('aaa')
        .end(4) // end(number) could be used to replace _number_ end() calls.
        .repeat(3)
            .span({'style': function() { return 'border: 1px solid green;'}})
                .text(function(index) {
                    // _index_ is the repeat() index (from 0 to 2 here).
                    return index + ' ' + Math.random();
                })
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
        .test(1 === 1) // .test() is used for conditional processing.
            .elem('section') // Not all elements have shortcut functions like .div()
                .text('ololo')
            .end()
        .end()
        .test(function() { return false; })
            .text('alala')
        .end()
        .each([9, 8, 7])
            .p()
                .text(function(index, item) {
                    // _index_ is .each() array index, _item_ is the array element.
                    return index + ' ' + item;
                })
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
    <section>ololo</section>
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
