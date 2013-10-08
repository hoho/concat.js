var concatizerCompile;

(function() {
    'use strict';

    var whitespace = /[\x20\t\r\n\f]/,
        attrName = /^[a-zA-Z][a-zA-Z0-9-_]*$/g,
        _tags = 'div|span|p|a|ul|ol|li|table|tr|td|th|br|img|b|i|s|u'.split('|'),
        TAG_FUNCS = {},
        i,
        indentWith = '    ',
        source,
        code,
        variables,
        currentTemplateName;

    for (i = 0; i < _tags.length; i++) {
        TAG_FUNCS[_tags[i]] = true;
    }


    function strip(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }

    function addIndent(ret, size) {
        ret.push((new Array(size)).join(indentWith));
    }

    function skipWhitespaces(str, col) {
        while (col < str.length && whitespace.test(str[col])) {
            col++;
        }

        return col;
    }

    function concatizerGetAnonymousFunctionName(line, col) {
        return '_' + currentTemplateName + '_' + (line + 1) + '_' + (col + 1);
    }


    function concatizerError(line, col, message) {
        throw new Error(message + ' (line: ' + (line + 1) + ', col: ' + (col + 1) + '):\n' +
                        source[line] + '\n' + (new Array(col + 1).join(' ')) + '^');
    }

    function concatizerErrorUnexpectedSymbol(line, col, chr) {
        concatizerError(line, col, "Unexpected symbol '" + chr + "'");
    }

    function concatizerCheckName(line, col, name) {
        if (name === '_' || !name.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            concatizerError(line, col, "Illegal name '" + name + "'");
        }
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

                i = skipWhitespaces(selector, i);

                while (i < selectorLength && !whitespace.test(selector[i]) && selector[i] !== '=' && selector[i] !== closer) {
                    name.push(selector[i]);
                    i++;
                }

                i = skipWhitespaces(selector, i);

                if (selector[i] === '=') {
                    i++;
                }

                i = skipWhitespaces(selector, i);

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

                    i = skipWhitespaces(selector, i);
                }

                if (selector[i] !== closer) {
                    if (i === selectorLength) {
                        concatizerError(line, i, 'Unterminated selector');
                    } else {
                        concatizerErrorUnexpectedSymbol(line, i, selector[i]);
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

        i = skipWhitespaces(selector, i);

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

                    i = skipWhitespaces(selector, i);

                    while (i < selectorLength && !whitespace.test(selector[i]) && selector[i] !== ')') {
                        bemElem.push(selector[i]);
                        i++;
                    }

                    i = skipWhitespaces(selector, i);

                    if (selector[i] !== ')') {
                        concatizerErrorUnexpectedSymbol(line, i, selector[i]);
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
            concatizerError(line, 0, 'No tag name');
        }

        if (className.length) {
            attr['class'] = className.join(' ');
        }

        return {elem: elem, attr: attr};
    }


    function concatizerClearComments() {
        var i,
            j,
            k,
            tmp,
            inComment,
            inString;

        i = 0;
        while (i < code.length) {
            tmp = code[i];

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

                code[i] = tmp;
            } else { // In comment.
                k = tmp.indexOf('*/');

                if (k >= 0) {
                    code[i] = Array(k + 3).join(' ') + tmp.substring(k + 2);
                    inComment = false;
                    i--;
                } else {
                    code[i] = '';
                }
            }

            i++;
        }

        for (i = 0; i < code.length; i++) {
            code[i] = code[i].replace(/\s+$/g, '');
        }
    }


    function concatizerCheckExpression(expr) {
        var tmp;

        try {
            eval('tmp = function() { tmp = ' + expr + '}');
        } catch(e) {
            console.log(expr);
            throw e;
        }
    }


    function concatizerExtractExpression(index, col, hasMore, noWrap) {
        var i = col,
            line = code[index],
            expr = [],
            inString,
            brackets,
            startIndex = index,
            funcName;

        i = skipWhitespaces(line, i);

        funcName =  concatizerGetAnonymousFunctionName(index, i);

        if (line.substring(i).match(/^(?:CURRENT|PAYLOAD)(?:\s|$)/)) {
            if (line[i] === 'C') {
                expr = 'arguments[0]';
            } else {
                expr = '_.payload';
            }

            if (!noWrap) {
                expr = 'function ' + funcName + '() { return ' + expr + '; }';
            }

            i = skipWhitespaces(line, i + 7);

            if (i < line.length && !hasMore) {
                concatizerErrorUnexpectedSymbol(index, i, line[i]);
            }

            concatizerCheckExpression(expr);

            return {index: index, col: i, expr: expr};
        } else if (line[i] === '"' || line[i] === "'") {
            inString = line[i];
            expr.push(line[i++]);

            while (i < line.length && inString) {
                if (line[i] === inString && line[i - 1] !== '\\') {
                    inString = false;
                }

                expr.push(line[i++]);
            }

            if (inString) {
                concatizerError(index, i, 'Unterminated string');
            }

            i = skipWhitespaces(line, i);

            if (i < line.length && !hasMore) {
                concatizerErrorUnexpectedSymbol(index, i, line[i]);
            }

            expr = expr.join('');

            concatizerCheckExpression(expr);

            return {index: index, col: i, expr: expr};
        } else {
            if (line[i] !== '(') {
                concatizerError(index, i, "Illegal symbol '" + line[i] + "'");
            }

            i++;
            brackets = 1;

            if (i === line.length) {
                index++;

                while (index < code.length && !strip(code[index])) {
                    index++;
                }

                if (index < code.length) {
                    line = code[index];
                    i = 0;
                } else {
                    concatizerError(startIndex, col, 'Unterminated expression');
                }
            }

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

                    while (index < code.length && !strip(code[index])) {
                        index++;
                    }

                    if (index < code.length) {
                        line = code[index];
                        i = 0;
                    } else {
                        concatizerError(startIndex, col, 'Unterminated expression');
                    }
                }
            }

            expr = strip(expr.join(''));

            if (!expr) {
                concatizerError(startIndex, col, 'Empty expression');
            }

            i = skipWhitespaces(line, i);

            if (expr.substring(0, 8) !== 'function') {
                if (noWrap) {
                    expr = '(' + expr + ')';
                } else {
                    expr = 'function ' + funcName + '() { return (' + expr + '); }';
                }
            } else {
                if (noWrap) {
                    expr = '(' + expr + ').apply(this, arguments)';
                }
            }

            if (i < line.length && !hasMore) {
                concatizerErrorUnexpectedSymbol(index, i, line[i]);
            }

            concatizerCheckExpression(expr);

            return {index: index, col: i, expr: expr};
        }
    }


    function concatizerProcessAtAttribute(index, stack, ret) {
        stack[stack.length - 1].end = false;

        var line = code[index],
            i,
            name = [],
            val;

        i = 0;

        i = skipWhitespaces(line, i);

        if (line[i] !== '@') {
            concatizerErrorUnexpectedSymbol(index, i, line[i]);
        }

        i++;

        while (i < line.length && !whitespace.test(line[i])) {
            name.push(line[i]);
            i++;
        }

        name = name.join('');

        if (!name.length || !name.match(attrName)) {
            concatizerError(index, i, "Illegal attribute name '" + name + "'");
        }

        i = skipWhitespaces(line, i);

        val = concatizerExtractExpression(index, i);
        index = val.index;
        val = val.expr;

        addIndent(ret, stack.length);
        ret.push(".attr('" + name + "', " + val + ')\n');

        return index;
    }


    function concatizerProcessTextExpression(index, stack, ret) {
        var expr = concatizerExtractExpression(index, 0);

        index = expr.index;

        addIndent(ret, stack.length);
        ret.push('.text(');
        ret.push(expr.expr);
        ret.push(')\n');

        stack[stack.length - 1].end = false;

        return index;
    }

    function concatizerProcessCommand(index, stack, ret) {
        var i = 0,
            line = code[index],
            cmd,
            expr,
            expr2,
            args,
            name,
            j,
            k,
            payload,
            payload2,
            funcName;

        stack[stack.length - 1].end = false;

        i = skipWhitespaces(line, i);

        funcName = concatizerGetAnonymousFunctionName(index, i);

        cmd = line.substring(i, i + 4);

        switch (cmd) {
            case 'CHOO':
            case 'OTHE':
                if (line.substring(i, i + 6) === 'CHOOSE' || line.substring(i, i + 9) === 'OTHERWISE') {
                    if (strip(line) === 'CHOOSE' || strip(line) === 'OTHERWISE') {
                        addIndent(ret, stack.length);
                        ret.push(cmd === 'CHOO' ? '.choose()\n' : '.otherwise()\n');

                        stack[stack.length - 1].end = true;
                        if (cmd === 'CHOO') {
                            stack[stack.length - 1].choose = true;
                            break;
                        } else if (stack[stack.length - 2].choose) {
                            delete stack[stack.length - 2].choose;
                            break;
                        }
                    } else {
                        i += (cmd === 'CHOO' ? 6 : 9);
                        if (whitespace.test(line[i])) {
                            concatizerErrorUnexpectedSymbol(index, i + 1, line[i + 1]);
                        }
                    }
                }

                concatizerError(index, i, 'Unexpected command');
                break;

            case 'TEST':
            case 'EACH':
            case 'ATTR':
            case 'WHEN':
                if (cmd === 'WHEN' && !stack[stack.length - 2].choose) {
                    concatizerError(index, i, 'Unexpected command');
                }

                if (i + 4 >= line.length) {
                    concatizerError(index, i + 4, 'Expression is expected');
                }

                expr = concatizerExtractExpression(index, i + 4, cmd === 'ATTR');

                index = expr.index;
                i = expr.col;

                break;

            case 'INSE':
                cmd = line.substring(i, i + 6);

                if (cmd === 'INSERT' && whitespace.test(line[i + 6])) {
                    expr = concatizerExtractExpression(index, i + 7, false, true);
                    addIndent(ret, stack.length);

                    index = expr.index;
                    i = expr.col;

                    ret.push('.act(function ' + funcName + '(_) {\n');
                    addIndent(ret, stack.length + 1);
                    ret.push('_ = ' + expr.expr + ';\n');
                    addIndent(ret, stack.length + 1);
                    ret.push('if (!(_ instanceof Node)) { _ = document.createTextNode(_); }\n');
                    addIndent(ret, stack.length + 1);
                    ret.push('this.appendChild(_);\n');
                    addIndent(ret, stack.length);
                    ret.push('})\n');
                } else {
                    concatizerError(index, i, 'Unexpected command');
                }

                break;

            case 'CALL':
            case 'WITH':
                args = [];
                name = [];
                j = i;

                if (!whitespace.test(line[i + 4])) {
                    concatizerError(index, i, 'Unexpected command');
                }

                i = skipWhitespaces(line, i + 4);

                while (i < line.length && !whitespace.test(line[i])) {
                    name.push(line[i]);
                    i++;
                }

                if (!name.length) {
                    concatizerError(index, i, 'No name');
                }

                name = name.join('');

                i = skipWhitespaces(line, i);

                while (i < line.length) {
                    expr = concatizerExtractExpression(index, i, cmd === 'CALL', true);
                    index = expr.index;
                    i = expr.col;
                    line = code[index];
                    args.push(expr.expr);
                }

                if (cmd === 'WITH' && !args.length) {
                    concatizerError(index, i, 'Expression is expected');
                }

                index++;

                payload = concatizerCompile(undefined, stack[stack.length - 1].indent, index);
                index = payload.index;
                payload = payload.ret;

                if (cmd === 'WITH' && index + 1 < code.length) {
                    line = code[index + 1];
                    i = skipWhitespaces(line, 0);

                    if (i === stack[stack.length - 1].indent &&
                        line.substring(i, i + 4) === 'ELSE' &&
                        (i + 4 === line.length || whitespace.test(line[i + 4])))
                    {
                        i = skipWhitespaces(line, i + 4);

                        if (i < line.length) {
                            concatizerErrorUnexpectedSymbol(index + 1, i);
                        }

                        index += 2;

                        payload2 = concatizerCompile(undefined, stack[stack.length - 1].indent, index);
                        index = payload2.index;
                        payload2 = payload2.ret;
                    }
                }

                addIndent(ret, stack.length);

                k = (new Array(stack.length + 1)).join(indentWith);

                if (cmd === 'WITH') {
                    variables[name] = true;

                    expr = args[0];

                    if (payload) {
                        payload = payload.replace('$C()', '$C(this)');
                        payload = strip(payload).split('\n').join('\n' + k);
                    }

                    if (payload2) {
                        payload2 = payload2.replace('$C()', '$C(this)');
                        payload2 = strip(payload2).split('\n').join('\n' + k);
                    }

                    ret.push('.act(function ' + funcName + '() {\n');

                    addIndent(ret, stack.length + 1);
                    ret.push('try { ' + name + ' = ' + expr + ' } catch(e) { ' + name + ' = undefined; }\n');
                    addIndent(ret, stack.length + 1);
                    ret.push('if (' + name + ' === undefined || ' + name + ' === null) {\n');
                    addIndent(ret, stack.length + (payload2 ? 2 : 1));

                    if (payload2) {
                        ret.push(payload2);
                        ret.push('\n');
                        addIndent(ret, stack.length + 1);
                    }

                    if (payload) {
                        ret.push('} else {\n');
                        addIndent(ret, stack.length + 2);
                        ret.push(payload);
                        ret.push('\n');
                        addIndent(ret, stack.length + 1);
                    }

                    ret.push('}\n');

                    addIndent(ret, stack.length);
                    ret.push('})\n');
                } else {
                    ret.push('.act(function ' + funcName + '() {\n' + k + '$C.tpl.' + name + '({parent: this');
                    if (payload) {
                        ret.push(', payload:\n' + k + indentWith + strip(payload).split('\n').join('\n' + k));
                        ret.push('[0]');
                    }
                    ret.push('}');

                    if (args.length) {
                        ret.push(',\n' + k + indentWith + (args.join(',\n' + k + indentWith)) + '\n' + k);
                    }

                    ret.push(');\n');

                    addIndent(ret, stack.length);
                    ret.push('})\n');
                }

                break;

            case 'SET':
            case 'SET ':
                name = [];

                i = skipWhitespaces(line, i + 3);

                j = i;

                while (i < line.length && !whitespace.test(line[i])) {
                    name.push(line[i]);
                    i++;
                }

                if (!name.length) {
                    concatizerError(index, j, 'No name');
                }

                name = name.join('');
                concatizerCheckName(index, j, name);

                variables[name] = true;

                i = skipWhitespaces(line, i);

                if (i < line.length) {
                    expr = concatizerExtractExpression(index, i, false, true);
                    index = expr.index;
                    i = expr.col;
                    line = code[index];
                    expr = expr.expr;
                }

                j = index + 1;

                payload = concatizerCompile(undefined, stack[stack.length - 1].indent, index + 1);
                index = payload.index;
                payload = payload.ret;

                if (payload && expr) {
                    i = skipWhitespaces(code[j], 0);
                    concatizerError(j, i, 'Duplicate variable content');
                }

                if (!payload && !expr) {
                    j--;
                    concatizerError(j, i, 'No value');
                } else if (payload) {
                    expr = payload;
                }

                addIndent(ret, stack.length);

                k = (new Array(stack.length)).join(indentWith);

                ret.push('.act(function ' + funcName + '() {\n' + k + indentWith + name + ' = ');
                ret.push(strip(expr).split('\n').join('\n' + k));
                if (payload) {
                    ret.push('[0]');
                }
                ret.push(';\n');

                addIndent(ret, stack.length);
                ret.push('})\n');

                break;

            case 'CURR':
            case 'PAYL':
                cmd = line.substring(i, i + 7);
                if (cmd === 'CURRENT' || cmd === 'PAYLOAD') {
                    i = skipWhitespaces(line, i + 7);
                    if (i < line.length) {
                        concatizerErrorUnexpectedSymbol(index, i, line[i]);
                    }

                    addIndent(ret, stack.length);

                    if (cmd === 'CURRENT') {
                        ret.push('.text(function(item) { return item; })\n');
                    } else {
                        ret.push('.act(function ' + funcName + '() { if (_.payload) { this.appendChild(_.payload); }})\n');
                    }

                    break;
                }

            default:
                concatizerError(index, i, 'Unexpected command');
        }

        switch (cmd) {
            case 'TEST':
            case 'WHEN':
            case 'EACH':
                addIndent(ret, stack.length);
                ret.push((cmd === 'TEST' ? '.test(' : cmd === 'EACH' ? '.each(' : '.when(') + expr.expr + ')\n');
                stack[stack.length - 1].end = true;

                break;

            case 'ATTR':
                expr2 = concatizerExtractExpression(index, i);

                index = expr2.index;
                i = expr2.col;

                addIndent(ret, stack.length);
                ret.push('.attr(' + expr.expr + ', ' + expr2.expr + ')\n');

                break;
        }

        return index;
    }

    function concatizerProcessElement(index, stack, ret) {
        var elem = concatizerTokenizeSelector(index, code[index]),
            hasAttr,
            needComma;

        for (hasAttr in elem.attr) {
            break;
        }

        addIndent(ret, stack.length);

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

        ret.push(')\n');

        stack[stack.length - 1].end = true;
    }


    function concatizerProcess(index, stack, ret) {
        var line = strip(code[index]);

        switch (line[0]) {
            case '"':
            case "'":
            case '(':
                index = concatizerProcessTextExpression(index, stack, ret);
                break;

            case '@':
                index = concatizerProcessAtAttribute(index, stack, ret);
                break;

            default:
                stack[stack.length - 1].end = true;
                if (/[A-Z]/.test(line[0])) {
                    index = concatizerProcessCommand(index, stack, ret);
                } else {
                    concatizerProcessElement(index, stack, ret);
                }
        }

        return index;
    }


    function concatizerInsertVariables(ret) {
        var args = [],
            v;

        for (v in variables) {
            args.push(v);
        }

        if (args.length) {
            ret.splice(1, 0, indentWith + 'var ' + args.join(', ') + ';\n');
        }
    }


    concatizerCompile = function(src, minIndent, startIndex) {
        if (!startIndex) {
            source = src.split(/\n\r|\r\n|\r|\n/);
            code = src.split(/\n\r|\r\n|\r|\n/);
            concatizerClearComments();
        }

        var compiled = {},
            curTpl,
            template,
            ret = [],
            i,
            j,
            k,
            ends,
            line,
            stack = [{indent: -1}],
            tabs,
            spaces,
            args,
            name;

        if (minIndent) {
            stack.push({indent: minIndent, end: true});
            ret.push('$C()\n');
        }

        for (i = startIndex || 0; i < code.length; i++) {
            line = code[i];

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
                    concatizerError(i, j, 'Unexpected symbol (only tabs or spaces are allowed here)');
                }

                if (tabs && spaces) {
                    concatizerError(i, j, 'Please, never ever mix tabs and spaces');
                }

                j++;
            }

            k = j;
            ends = 0;

            while (j <= stack[stack.length - 1].indent) {
                k = stack.pop();

                if (k.end) {
                    ends++;
                }

                k = k.indent;
            }

            if (ends > 0) {
                addIndent(ret, stack.length + 1);
                ret.push('.end(' + (ends > 1 ? ends : '') + ')\n');
            }

            if ((k !== j) && (!minIndent || (minIndent && (j > minIndent)))) {
                concatizerError(i, j, 'Bad indentation');
            }

            if (j >= stack[stack.length - 1].indent) {
                if (j > stack[stack.length - 1].indent) {
                    k = {indent: j};
                    if (stack.push(k) === 2) {
                        k.end = true;
                    }
                }

                if (stack.length > 2) {
                    i = concatizerProcess(i, stack, ret);
                } else {
                    if (curTpl) {
                        addIndent(ret, 1);
                        ret.push('}');

                        concatizerInsertVariables(ret);

                        ret = ret.join('');

                        try {
                            eval('template = ' + ret);
                            compiled[curTpl] = ret;
                        } catch (e) {
                            console.log(ret);
                            throw e;
                        }

                        ret = [];
                    }

                    if (!minIndent) {
                        args = [];
                        name = [];

                        k = skipWhitespaces(line, 0);
                        line += ' ';

                        while (k < line.length) {
                            if (whitespace.test(line[k])) {
                                if (name.length) {
                                    name = name.join('');
                                    concatizerCheckName(i, k - name.length, name);
                                    args.push(name);
                                    name = [];
                                }
                            } else {
                                name.push(line[k]);
                            }

                            k++;
                        }

                        curTpl = currentTemplateName = args[0];

                        variables = {};

                        args.shift();
                        ret.push('function(_' + (args.length ? ', ' + args.join(', ') : '') + ') {\n');
                        addIndent(ret, stack.length);
                        ret.push('return $C(_.parent)\n');
                    } else {
                        // It's a PAYLOAD for CALL command or SET command.
                        break;
                    }
                }
            }
        }

        if (stack.length > 1) {
            ends = 0;

            if (minIndent && i < code.length) {
                stack.pop();
            }

            while (stack.length > 1) {
                k = stack.pop();

                if (k.end) {
                    ends++;
                }
            }

            if (ends > 0) {
                addIndent(ret, 2);
                ret.push('.end(' + (ends > 1 ? ends : '') + ')\n');
            }

            if (!minIndent) {
                ret.push('}');
            } else if (ret.length <= 3) {
                // Empty payload, just skip it.
                ret = [];
            }

            if (minIndent) {
                return {index: i - 1, ret: ret.join('')};
            } else {
                concatizerInsertVariables(ret);

                ret = ret.join('');

                try {
                    eval('template = ' + ret);
                    compiled[curTpl] = ret;
                } catch (e) {
                    console.log(ret);
                    throw e;
                }
            }
        }

        return compiled;
    }

})();
