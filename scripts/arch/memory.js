define(["underscore", "arch/instruction"], function(_, Instruction) {
    
    // takes reference to a program object to load
    function Memory(program) {
        // memory is just an array of words
        // split memory up so we don't have to hold stuff that doesn't exist or may not ever
        // Memory is byte addressable, but 32bit, so addresses are multiples of 4
        var self = this,
            text = program.getText(),
            data = program.getData();
        
        self._memBottom = [];
        self._memTop = [];
        self.startAddr = null;
        // remember _addresses of labels
        self._addresses = {};
            
        // load in the text from the bottom
        self._loadText(text);
        
        // load data above it
        self._loadData(data);
        
        // do a second pass to replace labels with addresses
        self._secondPass(text);
    }
    
    Memory.prototype.display = function() {
        var self = this,
            output = '';
        
        _.each(self._memBottom, function(block, addr) {
            output += addr.toString(16) + '\t' + block + '\n';
        });
        
        console.log(output);
    };
    
    Memory.prototype.getLabelAddress = function(label) {
        return this._addresses[label];
    };
    
    Memory.prototype.getMemory = function() {
        return this._memBottom;
    };
    
    Memory.prototype.getInstructions = function() {
        var self = this;
        return _.filter(self._memBottom, function(block) {
            return (block instanceof Instruction);
        });
    };
    
    Memory.prototype._secondPass = function(text) {
        var self = this;
        // for loop because we splice in new instructions, length grows
        for(var i = 0; i < self._memBottom.length; i++) {
            var instr = self._memBottom[i],
                addr = i * 4;
            
            // if we've passed the instructions, then stop
            if (!(instr instanceof Instruction)) return;
            
            var props = instr.props(),
                adjusted = self._addresses[props.immediate];
                
            if (props.relocate && props.immediate !== null) {
                // PC relative
                if (_.contains(['bne','beq'], props.opcode)) {
                    adjusted = self._addresses[props.immediate] - addr - 4;
                }
                instr.set('immediate', adjusted);
            }
            
            // la and li need the replaced label address bitwise broken up
            if (props.loadUpper) {
                instr.set('immediate', (props.immediate & 0xFFFF0000) >> 16);
            } else if (props.loadLower) {
                instr.set('immediate', props.immediate & 0xFFFF);
            }
        }
    };
    
    Memory.prototype._loadText = function(text) {
        var self = this;
        _.each(text.getInstructions(), function(instr) {
            var props = instr.props(),
                rt = '$'+props.rt,
                rs = '$'+props.rs,
                rd = '$'+props.rd,
                C = props.immediate,
                label = props.label,
                addr = self._memBottom.length * 4;
                
            if (label) {
                // record label address
                self._addresses[label] = addr;
                
                // remember start of program (label main)
                if (label == 'main') {
                    self.startAddr = addr;
                }
            }
            
            // convert pseudo instruction to real ones.
            if (props.type == 'p') {
                switch(props.opcode) {
                    case 'move':
                        self._memBottom.push(makeInstruction("add", rt, rs, "$zero")); break;
                    case 'clear':
                        self._memBottom.push(makeInstruction("add", rt, "$zero", "$zero")); break;
                    case 'not':
                        self._memBottom.push(makeInstruction("nor", rt, rs, "$zero")); break;
                    case 'la': case 'li':
                        // these Cs actually need split up into lower and upper halves but we don't have the addresses yet
                        // do that in the second pass
                        var lui = makeInstruction("lui", rd, C),
                            ori = makeInstruction("ori", rd, rd, C);
                        lui.set('loadUpper', true);
                        ori.set('loadLower', true);
                        self._memBottom.push(lui, ori);
                        break;
                    case 'b':
                        self._memBottom.push(makeInstruction("beq", "$zero", "$zero", C)); break;
                    case 'bal':
                        // TODO: bgezal doesn't work yet
                        self._memBottom.spush(makeInstruction("bgezal", "$zero", C)); break;
                    case 'bgt': case 'ble':
                        self._memBottom.push(
                            makeInstruction("slt", "$at", rt, rs),
                            makeInstruction("beq", "$at", "$zero", C));
                        break;
                    case 'blt': case 'bge':
                        self._memBottom.push(
                            makeInstruction("slt", "$at", rs, rt),
                            makeInstruction("beq", "$at", "$zero", C));
                        break;
                    case 'bgtu':
                        self._memBottom.push(
                            makeInstruction("slt", "$at", rs, rt),
                            makeInstruction("bne", "$at", "$zero", C));
                        break;
                    case 'bgtz':
                        self._memBottom.push( 
                            makeInstruction("slt", "$at", rs, rt),
                            makeInstruction("bne", "$at", "$zero", C));
                        break;
                    case 'beqz':
                        self._memBottom.push(makeInstruction("beq", rs, "$zero", C)); break;
                    case 'mul':
                        self._memBottom.push(
                            makeInstruction("mult", rs, rt),
                            makeInstruction("mflo", rd));
                        break;
                    case 'div':
                        self._memBottom.push(
                            makeInstruction("div", rs, rt),
                            makeInstruction("mflo", rd));
                        break;
                    case 'rem':
                        self._memBottom.push(
                            makeInstruction("div", rs, rt),
                            makeInstruction("mfhi", rd));
                        break;
                }
            } else {
                self._memBottom.push(instr);
            }
        });
    };
    
    Memory.prototype._loadData = function(data) {
        var self = this;
        _.each(data.getDirectives(), function(dir) {
            var type = dir.type,
                label = dir.label,
                value = dir.value;
            if (label) {
                self._addresses[label] = self._memBottom.length * 4;
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
    
    
    // for all the loading stuff, addr incoming needs /4 to match mem array indices
    Memory.prototype.loadWord = function(addr) {
        var self = this;
        addr /= 4;
        
        return self._memBottom[addr];
    };
    
    Memory.prototype.loadHalf = function(addr, signed) {
        var self = this,
            m = self._memBottom[addr];
            
        addr /= 4;
        
        // if unsigned or high bit of halfword is off, just give the lower bytes
        if (!signed || (signed && (0x00008000 & m) === 0)) {
            return 0x0000FFFF & self._memBottom[addr];
        } else {
            return 0xFFFF0000 | m;
        }
    };
    
    Memory.prototype.loadByte = function(addr, signed) {
        var self = this,
            m = self._memBottom[addr];
            
        addr /= 4;
        
        // if unsigned or high bit of halfword is off, just give the lower bytes
        if (!signed || (signed && (0x00000080 & m) === 0)) {
            return 0x000000FF & self._memBottom[addr];
        } else {
            return 0xFFFFFF00 | m;
        }
    };
    
    Memory.prototype.store = function(type, addr, value) {
        var self = this,
            mask = 0xFFFFFFFF;
            
        addr /= 4;
        
        if (type == 'half') {
            mask = 0xFFFF;
        } else if (type == 'byte') {
            mask = 0xFF;
        }
        
        self._memBottom[addr] = value & mask;
    };
    
    function makeInstruction() {
        var args = Array.prototype.slice.apply(arguments);
        return new Instruction(args[0] + " " + args.slice(1).join(", "));
    }
    
    return Memory;
    
});