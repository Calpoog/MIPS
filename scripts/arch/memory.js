define(["underscore", "arch/instruction"], function(_, Instruction) {
    
    // takes reference to a program object to load
    function Memory(assembler) {
        // memory is just an array of words
        // split memory up so we don't have to hold stuff that doesn't exist or may not ever
        // Memory is byte addressable, but 32bit, so addresses are multiples of 4
        var self = this,
            instructions = assembler.getInstructions(),
            data = assembler.getData();
        
        self._memBottom = [];
        self._memTop = [];
            
        // load in the text from the bottom
        self._loadText(instructions);
        
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
    
    Memory.prototype.getMemory = function() {
        return this._memBottom;
    };
    
    Memory.prototype.getStack = function() {
        return reverse(this._memTop);
    };
    
    function reverse(arr) {
        var narr = [];
        for (var i = arr.length - 1; i >= 0; i--) {
            narr.push(arr[i]);
        }
        return narr;
    }
    
    Memory.prototype._loadText = function(instructions) {
        var self = this;
        
        // throw these bad boys in memory
        self._memBottom = [].concat(instructions);
    };
    
    Memory.prototype._loadData = function(data) {
        var self = this;
        
        // dump the data out on top of the instructions
        self._memBottom = self._memBottom.concat(data.getDirectives());
    };
    
    
    // for all the loading stuff, addr incoming needs /4 to match mem array indices
    
    // set mem at addr to value. adjusts hex addr to array index and chooses between
    // top/bottom of memory (since we don't maintain the middle)
    Memory.prototype._memSet = function(addr, value) {
        this._memOp('set', addr, value);
    };
    Memory.prototype._memGet = function(addr) {
        return this._memOp('get', addr);
    };
    Memory.prototype._memOp = function(type, addr, value) {
        var self = this,
            diff = null,
            mem = self._memBottom;
        
        // convert to an array index
        addr /= 4;
        
        // if it's out of bounds of lower memory, try stack
        if (addr >= mem.length) {
            // we allocate '256MB', so subtract address from 256MB to get offset in stack array
            // Low indexes (0) of stack array are high address (0x80000000)
            addr = (0x80000000 >>> 2) - addr;
            mem = self._memTop;
            
            // if it's out of bounds of the stack, we need to add more room
            if (addr >= mem.length) {
                diff = addr - mem.length + 1;
                self._memTop = mem.concat(Array.fill(diff, 0));
                mem = self._memTop;
            }
        }
        
        if (type == 'get') {
            return mem[addr];
        }
        
        mem[addr] = value;
        return null; // satisfy strict
    };
    
    Memory.prototype.loadWord = function(addr) {
        var self = this;
        
        return self._memGet(addr);
    };
    
    Memory.prototype.loadHalf = function(addr, signed) {
        var self = this,
            m = self._memGet(addr);
        
        // if unsigned or high bit of halfword is off, just give the lower bytes
        if (!signed || (signed && (0x00008000 & m) === 0)) {
            return 0x0000FFFF & m;
        } else {
            return 0xFFFF0000 | m;
        }
    };
    
    Memory.prototype.loadByte = function(addr, signed) {
        var self = this,
            m = self._memBottom[addr];
        
        // if unsigned or high bit of byte is off, just give the lower bytes
        if (!signed || (signed && (0x00000080 & m) === 0)) {
            return 0x000000FF & m;
        } else {
            return 0xFFFFFF00 | m;
        }
    };
    
    Memory.prototype.store = function(type, addr, value) {
        var self = this,
            mask = 0xFFFFFFFF;
        
        if (type == 'half') {
            mask = 0xFFFF;
        } else if (type == 'byte') {
            mask = 0xFF;
        }
        
        self._memSet(addr, value & mask);
    };
    
    function makeInstruction() {
        var args = Array.prototype.slice.apply(arguments);
        return new Instruction(args[0] + " " + args.slice(1).join(", "));
    }
    
    return Memory;
    
});