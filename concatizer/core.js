var concatizerCompile;

(function() {
    'use strict';

    var whitespace = /[\x20\t\r\n\f]/,
        attrName = /^[a-zA-Z][a-zA-Z0-9-_]*$/g,
        _tags = 'div|span|p|a|ul|ol|li|table|tr|td|th|br|img|b|i|s|u'.split('|'),
        TAG_FUNCS = {},
        i;

    for (i = 0; i < _tags.length; i++) {
        TAG_FUNCS[_tags[i]] = true;
    }


    function strip(text) {
        return text.replace(/^\s+|\s+$/g, '');
    }


    function concatizerError(line, col, message) {
        throw message + ' (line: ' + line + ', col: ' + col + ')';
    }


    function concatizerTokenizeSelector(line, selector) {
        selector = selector.replace(/\s+$/g, '');

        var selectorLength = selector.length,
            className = [],
            attr = {},
            mods = {},
            elem,
            val = [],
            bemElem = [],
            what,
            i,
            whatCol,

            bemName = /^[a-zA-Z0-9-]+$/g,
            blockPrefixes = /^(?:b-|l-)[a-zA-Z0-9-]/,
            modSeparator = '_',
            elemSeparator = '__',

            processToken = function() {
                if (!val.length) {
                    if (what === undefined) {
                        return;
                    }

                    concatizerError(line, whatCol, 'No name');
                }

                val = val.join('');

                switch (what) {
                    case '.':
                        if (!val.match(attrName)) {
                            concatizerError(line, whatCol, "Illegal class name '" + val + "'");
                        }

                        if ('class' in attr) {
                            concatizerError(line, whatCol, "Previously assigned 'class' attribute is being rewritten");
                        }

                        className.push(val);
                        break;

                    case '#':
                        if ('id' in attr) {
                            concatizerError(line, whatCol, "'id' attribute is already set");
                        }

                        attr.id = val;
                        break;

                    case '%':
                        if (!val.match(bemName) || !val.match(blockPrefixes)) {
                            concatizerError(line, whatCol, "Illegal block name '" + val + "'");
                        }

                        if (bemElem.length) {
                            if (!bemElem.match(bemName)) {
                                concatizerError(line, whatCol, "Illegal element name '" + bemElem + "'");
                            }

                            val += elemSeparator + bemElem;
                            bemElem = [];
                        }

                        if ('class' in attr) {
                            concatizerError(line, whatCol, "Previously assigned 'class' attribute is being rewritten");
                        }

                        className.push(val);

                        for (var name in mods) {
                            className.push(val + modSeparator + name + (mods[name] === true ? '' : modSeparator + mods[name]));
                        }

                        break;

                    case undefined:
                        if (elem) {
                            concatizerError(line, whatCol, "Duplicate tag name ('" + val + "')");
                        }
                        elem = val;
                        break;
                }

            },

            processAttrMod = function(closer) {
                var name = [],
                    value = [],
                    isString,
                    attrmodCol = i;

                if (closer === '}' && what !== '%') {
                    concatizerError(line, i, 'Modifier has no block');
                }

                i++;

                while (i < selectorLength && whitespace.test(selector[i])) {
                    i++;
                }

                while (i < selectorLength && !whitespace.test(selector[i]) && selector[i] !== '=' && selector[i] !== closer) {
                    name.push(selector[i]);
                    i++;
                }

                while (i < selectorLength && whitespace.test(selector[i])) {
                    i++;
                }

                if (selector[i] === '=') {
                    i++;
                }

                while (i < selectorLength && whitespace.test(selector[i])) {
                    i++;
                }

                if (selector[i] !== closer) {
                    if (selector[i] === '"') {
                        isString = true;
                        i++;
                    }

                    while (i < selectorLength) {
                        if (selector[i] === '"') {
                            if (isString) {
                                i++;
                                break;
                            } else {
                                concatizerError(line, i, "Illegal symbol '" + selector[i] + "'");
                            }
                        } else if (selector[i] === '\\') {
                            if (isString) {
                                i++;

                                if (selector[i] === '\\') {
                                    value.push('\\');
                                } else if (selector[i] === '"') {
                                    value.push('"');
                                } else {
                                    concatizerError(line, i, "Illegal symbol '" + selector[i] + "'");
                                }

                                i++;
                            } else {
                                concatizerError(line, i, "Illegal symbol '" + selector[i] + "'");
                            }
                        } else {
                            if (isString) {
                                value.push(selector[i]);
                            } else {
                                if (selector[i] === closer || whitespace.test(selector[i])) {
                                    break;
                                } else {
                                    value.push(selector[i]);
                                }
                            }

                            i++;
                        }
                    }

                    while (i < selectorLength && whitespace.test(selector[i])) {
                        i++;
                    }
                }

                if (selector[i] !== closer) {
                    if (i === selectorLength) {
                        concatizerError(line, i, 'Unterminated selector');
                    } else {
                        concatizerError(line, i, "Unexpected symbol '" + selector[i] + "'");
                    }
                }

                if (!name.length) {
                    concatizerError(line, attrmodCol, 'No ' + (closer === ']' ? 'attribute' : 'modifier') + ' name');
                }

                name = name.join('');
                value = value.join('');

                if (closer === ']' && !name.match(attrName)) {
                    concatizerError(line, attrmodCol, "Illegal attribute name '" + name + "'");
                } else if (closer === '}' && !name.match(bemName)) {
                    concatizerError(line, attrmodCol, "Illegal modifier name '" + name + "'");

                    if (value && !value.match(bemName)) {
                        concatizerError(line, attrmodCol, "Illegal modifier value '" + value + "'");
                    }
                }

                if (closer === ']') {
                    if (name in attr) {
                        concatizerError(line, attrmodCol, "Attribute '" + name + "' is already set");
                    }

                    if (name === 'class' && className.length) {
                        concatizerError(line, attrmodCol, "Previously assigned 'class' attribute is being rewritten");
                    }

                    attr[name] = value || name;
                } else {
                    if (name in mods) {
                        concatizerError(line, attrmodCol, "Modifier '" + name + "' is already set");
                    }

                    mods[name] = value || true;
                }

                i++;

                if (selector[i] === '[') {
                    processAttrMod(']');
                } else if (selector[i] === '{') {
                    processAttrMod('}');
                }
            };

        i = 0;

        while (i < selectorLength && whitespace.test(selector[i])) {
            i++;
        }

        while (i < selectorLength) {
            switch (selector[i]) {
                case '.':
                case '#':
                case '%':
                    processToken();
                    val = [];
                    what = selector[i];
                    whatCol = i + 1;
                    i++;
                    break;

                case '(':
                    if (what !== '%') {
                        concatizerError(line, i, 'Element without a block');
                    }

                    if (bemElem.length) {
                        concatizerError(line, i, 'Duplicate element');
                    }

                    i++;

                    bemElem = [];

                    while (i < selectorLength && whitespace.test(selector[i])) {
                        i++;
                    }

                    while (i < selectorLength && !whitespace.test(selector[i]) && selector[i] !== ')') {
                        bemElem.push(selector[i]);
                        i++;
                    }

                    while (i < selectorLength && whitespace.test(selector[i])) {
                        i++;
                    }

                    if (selector[i] !== ')') {
                        concatizerError(line, i, "Unexpected symbol '" + selector[i] + "'");
                    }

                    i++;

                    if (!bemElem.length) {
                        concatizerError(line, i, 'Empty element name');
                    }

                    bemElem = bemElem.join('');

                    break;

                case '[':
                case '{':
                    processAttrMod(selector[i] === '[' ? ']' : '}');
                    processToken();
                    mods = {};
                    val = [];
                    what = undefined;
                    whatCol = i;

                    break;

                default:
                    val.push(selector[i]);
                    i++;
                    break;
            }
        }

        processToken();

        if (!elem) {
            concatizerError(line, 1, 'No tag name');
        }

        if (className.length) {
            attr['class'] = className.join(' ');
        }

        return {elem: elem, attr: attr};
    }


    function concatizerClearComments(text) {
        var i,
            j,
            k,
            tmp,
            inComment,
            inString;

        i = 0;
        while (i < text.length) {
            tmp = text[i];

            if (!inComment) {
                inString = false;
                j = 0;

                while (j < tmp.length) {
                    if (tmp[j] === "'" || tmp[j] === '"') {
                        if (inString === tmp[j] && tmp[j - 1] !== '\\') {
                            inString = false;
                            j++;
                            continue;
                        } else if (!inString) {
                            inString = tmp[j];
                            j++;
                            continue;
                        }
                    }

                    if (!inString) {
                        if (tmp[j] === '/' && (tmp[j + 1] === '/' || tmp[j + 1] === '*')) {
                            if (tmp[j + 1] === '*') {
                                k = tmp.indexOf('*/');

                                if (k > j) {
                                    tmp = tmp.substring(0, j) + Array(k + 3 - j).join(' ') + tmp.substring(k + 2);
                                    continue;
                                } else {
                                    inComment = true;
                                }
                            }

                            tmp = tmp.substring(0, j);
                            break;
                        }
                    }

                    j++;
                }

                text[i] = tmp;
            } else { // In comment.
                k = tmp.indexOf('*/');

                if (k >= 0) {
                    text[i] = Array(k + 3).join(' ') + tmp.substring(k + 2);
                    inComment = false;
                    i--;
                } else {
                    text[i] = '';
                }
            }

            i++;
        }

        for (i = 0; i < text.length; i++) {
            text[i] = text[i].replace(/\s+$/g, '');
        }
    }


    function concatizerExtractExpression(text, index, col) {
        var i = col,
            line = text[index],
            expr = [],
            inString,
            brackets;

        while (i < line.length && whitespace.test(line[i])) {
            i++;
        }

        if (line[i] !== '(') {
            concatizerError(index + 1, i + 1, "Illegal symbol '" + line[i] + "'");
        }

        i++;
        brackets = 1;

        while (brackets > 0 && i < line.length) {
            if (!inString) {
                if (line[i] === '(') {
                    brackets++;
                } else if (line[i] === ')') {
                    brackets--;

                    if (brackets === 0) {
                        i++;
                        break;
                    }
                } else if (line[i] === '"' || line[i] === "'") {
                    inString = line[i];
                }
            } else {
                if (line[i] === inString && line[i - 1] !== '\\') {
                    inString = false;
                }
            }

            expr.push(line[i]);

            i++;

            if (i === line.length) {
                index++;

                while (index < text.length && !text[index]) {
                    index++;
                }

                if (index < text.length) {
                    line = text[index];
                    i = 0;
                } else {
                    concatizerError(index + 1, 1, 'Unterminated expression');
                }
            }
        }

        expr = strip(expr.join(''));

        while (i < line.length && whitespace.test(line[i])) {
            i++;
        }

        if (expr.substring(0, 8) !== 'function') {
            expr = 'function() { return (' + expr + '); }';
        }

        return {index: index, col: i, expr: expr};
    }


    function concatizerProcessAtAttribute(text, index, stack, ret) {
        stack[stack.length - 1].end = false;

        var line = text[index],
            i,
            name = [],
            val;

        i = 0;

        while (i < line.length && whitespace.test(line[i])) {
            i++;
        }

        if (line[i] !== '@') {
            concatizerError(index + 1, i + 1, "Unexpected symbol '" + line[i] + "'");
        }

        i++;

        while (i < line.length && !whitespace.test(line[i])) {
            name.push(line[i]);
            i++;
        }

        name = name.join('');

        if (!name.length || !name.match(attrName)) {
            concatizerError(index + 1, i + 1, "Illegal attribute name '" + name + "'");
        }

        while (i < line.length && whitespace.test(line[i])) {
            i++;
        }

        if (line[i] === '"') {
            val = line.substring(i);
        } else if (line[i] === '(') {
            val = concatizerExtractExpression(text, index, i);
            index = val.index;
            val = val.expr;
        } else {
            concatizerError(index + 1, i + 1, "Unexpected symbol '" + line[i] + "'");
        }

        ret.push(".attr('" + name + "', " + val + ')');

        return index;
    }

    function concatizerProcessText(text, index, stack, ret) {
        ret.push('.text(' + strip(text[index]) + ')');
    }

    function concatizerProcessTextExpression(text, index, stack, ret) {
        var expr = concatizerExtractExpression(text, index, 0);

        index = expr.index;

        if (expr.col < text[index].length) {
            concatizerError(index + 1, expr.col + 1, "Unexpected symbol '" + text[index][expr.col] + "'");
        }

        ret.push('.text(');
        ret.push(expr.expr);
        ret.push(')');

        stack[stack.length - 1].end = false;

        return index;
    }

    function concatizerProcessCommand(text, index, stack, ret) {
        stack[stack.length - 1].end = false;
        return index;
    }

    function concatizerProcessElement(text, index, stack, ret) {
        var elem = concatizerTokenizeSelector(index + 1, text[index]),
            hasAttr,
            needComma;

        for (hasAttr in elem.attr) {
            break;
        }

        if (elem.elem in TAG_FUNCS) {
            ret.push('.' + elem.elem + '(');
            needComma = '';
        } else {
            ret.push(".elem('" + elem.elem + "'");
            needComma = ', '
        }

        if (hasAttr) {
            ret.push(needComma + JSON.stringify(elem.attr));
        }

        ret.push(')');

        stack[stack.length - 1].end = true;
    }


    function concatizerProcess(text, index, stack, ret) {
        var line = strip(text[index]); //.split(/\s+/);

        switch (line[0]) {
            case '"':
            case "'":
                concatizerProcessText(text, index, stack, ret);
                break;

            case '@':
                index = concatizerProcessAtAttribute(text, index, stack, ret);
                break;

            case '(':
                index = concatizerProcessTextExpression(text, index, stack, ret);
                break;

            default:
                stack[stack.length - 1].end = true;
                if (/[A-Z]/.test(line[0])) {
                    index = concatizerProcessCommand(text, index, stack, ret);
//                    console.log(line);
                } else {
                    concatizerProcessElement(text, index, stack, ret);
                }
        }

        return index;
    }


    concatizerCompile = function (text) {
        text = text.split(/\n\r|\r\n|\r|\n/);

        concatizerClearComments(text);

        var ret = ['{'],
            i,
            j,
            k,
            ends,
            line,
            stack = [{indent: -1}],
            tabs,
            spaces,
            first = true;

        for (i = 0; i < text.length; i++) {
            line = text[i];

            if (!line) {
                continue;
            }

            j = 0;
            while (j < line.length && whitespace.test(line[j])) {
                if (line[j] === '\t') {
                    tabs = true;
                } else if (line[j] === ' ') {
                    spaces = true;
                } else {
                    concatizerError(i + 1, j + 1, 'Unexpected symbol (only tabs or spaces are allowed here)');
                }

                if (tabs && spaces) {
                    concatizerError(i + 1, j + 1, 'Please, never ever mix tabs and spaces');
                }

                j++;
            }

            k = j;
            ends = 0;

            while (j <= stack[stack.length - 1].indent) {
                k = stack.pop();

                if (stack.length === 1) {
                    ret.push('}');
                }

                if (k.end) {
                    ends++;
                }

                k = k.indent;
            }

            if (ends > 0) {
                ret.push('.end(' + (ends > 1 ? ends : '') + ')');
            }

            if (k !== j) {
                concatizerError(i + 1, j + 1, 'Bad indentation');
            }

            if (j >= stack[stack.length - 1].indent) {
                if (j > stack[stack.length - 1].indent) {
                    stack.push({indent: j});
                }

                if (stack.length > 2) {
                    i = concatizerProcess(text, i, stack, ret);
                } else {
                    if (first) {
                        first = false;
                    } else {
                        ret.push(', ');
                    }

                    line = strip(line).split(/\s+/);
                    ret.push('"' + line[0] + '": ');
                    line.shift();
                    ret.push('function(' + line.join(', ') + ') {');
                }
            }
        }

        ret.push('}');

        console.log(ret.join(''));
    }

})();
