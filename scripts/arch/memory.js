define(["underscore"], function(_) {
    
    // takes reference to a program object to load
    function Memory(program) {
        // memory is just an array of words
        // split memory up so we don't have to hold stuff that doesn't exist or may not ever
        var self = this,
            text = program.getText(),
            data = program.getData();
        
        self._memBottom = [];
        self._memTop = [];
        // remember _addresses of labels
        self._addresses = {};
            
        // load in the text from the bottom
        self._loadText(text);
        
        // load data above it
        self._loadData(data);
    }
    
    Memory.prototype.display = function() {
        var self = this,
            output = '';
        
        _.each(self._memBottom, function(block, addr) {
            output += addr.toString(16) + '\t' + block + '\n';
        });
        
        console.log(output);
    };
    
    Memory.prototype._loadText = function(text) {
        var self = this;
        _.each(text.getInstructions(), function(instr) {
            var label = instr.getLabel();
            
            if (label) {
                self._addresses[label] = self._memBottom.length;
            }
            
            self._memBottom.push(instr.quickLook());
        });
    };
    
    Memory.prototype._loadData = function(data) {
        var self = this
        _.each(data.getDirectives(), function(dir) {
            var type = dir.type,
                label = dir.label,
                value = dir.value;
            if (label) {
                self._addresses[label] = self._memBottom.length;
            }
            switch(type) {
                case 'word': case 'byte': case 'double': case 'float': case 'half':
                    self._memBottom.push(value);
                    break;
                case 'ascii':
                    value = value.split('');
                    if (dir.nt) {
                        self._memBottom = self._memBottom.concat(value);
                    } else {
                        value.push('\0');
                        self._memBottom = self._memBottom.concat(value);
                    }
                    break;
                case 'space':
                    self._memBottom = self._memBottom.concat(Array.fill(value, 0));
                    break;
            }
        });
    };
    
    Memory.prototype.loadWord = function(addr) {
        var self = this;
        
        return self._memBottom[addr];
    };
    
    Memory.prototype.loadHalf = function(addr, signed) {
        var self = this,
            m = self._memBottom[addr];
        
        // if unsigned or high bit of halfword is off, just give the lower bytes
        if (!signed || (signed && (0x00008000 & m) == 0)) {
            return 0x0000FFFF & self._memBottom[addr];
        } else {
            return 0xFFFF0000 | m;
        }
    };
    
    Memory.prototype.loadByte = function(addr, signed) {
        var self = this,
            m = self._memBottom[addr];
        
        // if unsigned or high bit of halfword is off, just give the lower bytes
        if (!signed || (signed && (0x00000080 & m) == 0)) {
            return 0x000000FF & self._memBottom[addr];
        } else {
            return 0xFFFFFF00 | m;
        }
    };
    
    return Memory;
    
});