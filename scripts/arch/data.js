define(["underscore", "arch/syntaxException"], function(_, SyntaxException) {
    
    var directives = ['ascii','asciiz','byte','double',
            'float','half','space','word'];
    
    function Data() {
        var self = this;
        self.labels = [],
        self.values = [];
    }
    
    Data.prototype.processDirective = function(line) {
        var self = this,
            bits = line.command.match(/\.(\w+)(?:\s(.*))?/);
            label = line.label,
            // strip off directive
            cmd = bits[1],
            params = bits[2];
        if (!isDataDirective(cmd)) {
            throw new SyntaxException('Non data directive '+cmd+' outside .data section');
        }
        
        switch(cmd) {
            case 'word': case 'byte': case 'double': case 'float': case 'half':
                self._addListType(cmd, label, params);
                break;
            case 'ascii':
                self._addAscii(label, params, true);
                break;
            case 'asciiz':
                self._addAscii(label, params, false);
                break;
            case 'space':
                self._addSpace(label, params);
                break;
        }
    };
    
    Data.prototype._addListType = function(type, label, values) {
        var self = this;
        
        values = values.split(',');
        _.each(values, function(val, i) {
            // TODO: verify word fits
            self.labels.push(i == 0 ? label : '');
            self.values.push({
                label: label,
                value: val.removeSpaces(),
                type: type
            });
        });
    };
    
    Data.prototype._addAscii = function(label, ascii, nullTerminate) {
        var self = this;
        
        self.labels.push(label);
        self.values.push({
            label: label,
            value: ascii.replace(/"/g, ''),
            type: "ascii",
            nt: nullTerminate
        });
    };
    
    Data.prototype._addSpace = function(label, space) {
        var self = this;
        
        self.labels.push(label);
        self.values.push({
            label: label,
            value: parseInt(space, 10),
            type: "space"
        });
    };
    
    Data.prototype.getDirectives = function() {
        return this.values;
    };
    
    Data.prototype.display = function() {
        var self = this,
            output = '';
        _.each(self.labels, function(label, i) {
            output += label + ": " + JSON.stringify(self.values[i]) + '\n';
        });
        console.log(output);
    }
    
    function isDataDirective(cmd) {
        return _.contains(directives, cmd);
    }
    
    return Data;
});