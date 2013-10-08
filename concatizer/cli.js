try {
    var concatizerCompile = require('./core.js'),
        fs = require('fs'),
        filenames = process.argv.slice(2);

    if (filenames.length) {
        var compiled = {},
            tmp,
            code,
            name,
            hasTemplates;

        for (var i = 0; i < filenames.length; i++) {
            code = fs.readFileSync(filenames[i], 'utf8');

            tmp = concatizerCompile(code);

            for (name in tmp) {
                compiled[name] = tmp[name];
                hasTemplates = true;
            }
        }

        if (!hasTemplates) {
            throw new Error('No templates compiled');
        }

        console.log('if (!$C.tpl) { $C.tpl = {}; }\n');

        for (name in compiled) {
            console.log('$C.tpl.' + name + ' = ' + compiled[name] + '\n');
        }

    } else {
        throw new Error('Filename is not supplied');
    }
} catch(e) {
    console.log(e.message);
    process.exit(1);
}
