define(["underscore", "arch/syntaxException"], function(_, SyntaxException) {
    
    var directives = ['ascii','asciiz','byte','double',
            'float','half','space','word','globl','extern'];
    
    function Data() {
        var self = this;
        self.values = [];
        self.globals = [];
        self.externs = [];
        self._labels = {};
    }
    
    Data.prototype.processDirective = function(line) {
        var self = this,
            bits = line.command.match(/\.(\w+)(?:\s(.*))?/),
            label = line.label,
            // strip off directive
            cmd = bits[1],
            params = bits[2],
            noLabel = false;
            
        if (!isDataDirective(cmd)) {
            throw new SyntaxException('Non data directive '+cmd+' outside .data section');
        }
        
        if (label && !_.contains(['globl','extern'], cmd)) self._labels[label] = self.values.length*4;
        
        switch(cmd) {
            case 'word': case 'byte': case 'double': case 'float': case 'half':
                self._addListType(cmd, label, params);
                break;
            case 'ascii':
                self._addAscii(label, params, false);
                break;
            case 'asciiz':
                self._addAscii(label, params, true);
                break;
            case 'space':
                self._addSpace(label, params);
                break;
            case 'globl':
                self.globals.push(params);
                break;
            case 'extern':
                self.externs.push(params);
                break;
        }
    };
    
    // relocates all of the addresses (since they come after instructions)
    Data.prototype.offsetLabels = function(offset) {
        var self = this;
        _.each(self._labels, function(addr, label) {
            self._labels[label] += offset;
        });
    };
    
    Data.prototype.getDataLabels = function() {
        return this._labels;
    };
    
    Data.prototype._addListType = function(type, label, values) {
        var self = this;
        
        values = values.split(',');
        _.each(values, function(val, i) {
            // TODO: verify word fits
            self.values.push(parseFloat(val.removeSpaces()));
        });
    };
    
    Data.prototype._addAscii = function(label, ascii, nullTerminate) {
        var self = this,
            values = ascii.replace(/"/g, '').replace(/\\n/, '\n').split('');
            
        _.each(values, function(val, i) {
            self.values.push(val);
        });
        
        if (nullTerminate) self.values.push('\0');
    };
    
    Data.prototype._addSpace = function(label, space) {
        var self = this;

        self.values = self.values.concat(Array.fill(space, 0));
    };
    
    Data.prototype.getDirectives = function() {
        return this.values;
    };
    
    Data.prototype.display = function() {
        var self = this,
            output = '';
        _.each(self.values, function(val, i) {
            output += val.label + ": " + JSON.stringify(val) + '\n';
        });
        console.log(output);
    };
    
    function isDataDirective(cmd) {
        return _.contains(directives, cmd);
    }
    
    return Data;
});