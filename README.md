# concat.js [![Build Status](https://travis-ci.org/hoho/concat.js.svg?branch=master)](https://travis-ci.org/hoho/concat.js)

Chainable DOM Builder

- [How to use](#how-to-use)
- [Usage example](#usage-example)
- [Define custom actions](#define-custom-actions)
- [Memorize results](#memorize-results)
- [Node.JS and performance notes](#node-js-and-performance-notes)


## How to use

```js
$C(parentNode, replace, direct)
    ...
.end();
```

`parentNode` is a DOM element to put the result into.

`replace` is a boolean value indicates that `parentNode`'s content should be
replaced with newly built content (newly built content will be appended to the
current one when `replace` is coerced to `false`).

`direct` indicates that everything should be rendered directly to `parentNode`
right away (skipping documentFragment creation).

Return value is the result's documentFragment in case `parentNode` is not
passed. When `parentNode` is passed, return value is undefined.


## Usage example

```js
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
        .text('<br>', true) // It is possible to add unescaped markup fragments.
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
            .text(function(item, index, arr) {
                // _index_ is .each() array index, _item_ is the array element.
                return index + ' ' + item;
            })
            .repeat(2)
                .div()
                    .text(function(index) { return index; })
                .end()
            .end()
            .div()
                .text(function(item, index, arr) { return index + ' ' + item; })
    .end(3)
    .choose()
        .when(false).text('1111').end()
        .when(true).text('2222').end()
        .otherwise().text('3333').end()
    .end()
.end();
```

**Will append the following to `<body>` tag:**

```html
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
2222
```


## Define custom actions

You can define custom actions for build process. For example, if you use
jQuery, you can define an action for event handlers binding like below:

```js
$C.define('on', function(item, index, arr, args) {
    $.fn.on.apply($(this), args);
});

$C(document.body)
    .div()
        .on('click', function(e) { alert(123); })
        .on('mousemove', function(e) { alert(345); })
        .text('I am clickable and mousemoveable')
.end(2);
```


## Memorize results

On every step of DOM building, we can memorize nodes and other data. Memorized
items are being put into `$C.mem` dictionary. `$C.mem` dictionary is initially
empty, but it is shared between different `$C()` calls. You may want to reset
this dictionary manually like `$C.mem = {}`.

```js
$C(document.body)
    .div()
        .mem('helloDiv')
        .text('hello')
    .end()
    .each([11, 22])
        .span()
            .mem(function(item, index, arr) {
                return 'each' + index;
            }, function(item, index, arr) {
                return index + ' ' + item + ' ' + this.tagName.toLowerCase();
            })
        .end()
    .end()
.end();
```

In this example `$C.mem` will be:

    {helloDiv: <div>​hello​</div>​, each0: '0 11 span', each1: '1 22 span'}


Another example (with `$C.mem` resetting):

```js
$C.mem = {aa: 123, bb: 234};

$C(document.body)
    .div()
        .mem('aa')
        .text('hello')
    .end()
.end();
```

And `$C.mem` will be:

    {aa: <div>​hello​</div>​, bb: 234}


## Node.JS and performance notes

Since version `0.9.4`, concat.js could be used in Node.JS, it utilizes
[jsdom](https://github.com/tmpvar/jsdom) for DOM building.

Using concat.js in Node.JS is as simple as:

    npm install concat.js

And:

    var concatjs = require('concat.js');

    // concatjs.$C is concat.js itself.
    // concatjs.window is jsdom environment.

`jsdom` is not the fastest solution available, but it brings full W3C DOM
support. My primary goal of using `jsdom` is to bring the ability to run
[Conkitty](https://github.com/hoho/conkitty) templates on server-side to build
static sites with minimal effort. And for static site generator high
performance is not a very critical thing. With more efforts it is possible to
run templates much faster and it'll probably happen some day in future.
