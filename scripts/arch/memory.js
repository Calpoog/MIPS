define(["underscore", "arch/instruction"], function(_, Instruction) {
    var nops = ['beq','bne','jal','j','jr'];
    
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
        self.startAddr = null;
        // remember _addresses of labels
        self._addresses = {};
            
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
    
    Memory.prototype.getLabelAddress = function(label) {
        return this._addresses[label];
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
    
    Memory.prototype.getInstructions = function() {
        var self = this;
        return _.filter(self._memBottom, function(block) {
            return (block instanceof Instruction);
        });
    };
    
    /*
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
                    adjusted = (self._addresses[props.immediate] - addr - 4) >> 2;
                }
                // j and jal addresses get shifted 2 left, so shift them 2 right here
                // lets them hold a lot more in the address range
                else if (_.contains(['j','jal'], props.opcode)) {
                    adjusted = adjusted >> 2;
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
        var self = this,
            instructions = text.getInstructions();
        _.each(instructions, function(instr, i) {
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
                        self._memBottom.push(
                            makeInstruction("beq", "$zero", "$zero", C),
                            makeInstruction("nop"));
                        break;
                    case 'bal':
                        // TODO: bgezal doesn't work yet
                        self._memBottom.spush(makeInstruction("bgezal", "$zero", C)); break;
                    case 'bgt': case 'ble':
                        self._memBottom.push(
                            makeInstruction("slt", "$at", rt, rs),
                            makeInstruction("beq", "$at", "$zero", C),
                            makeInstruction("nop"));
                        break;
                    case 'blt': case 'bge':
                        self._memBottom.push(
                            makeInstruction("slt", "$at", rs, rt),
                            makeInstruction("beq", "$at", "$zero", C),
                            makeInstruction("nop"));
                        break;
                    case 'bgtu':
                        self._memBottom.push(
                            makeInstruction("slt", "$at", rs, rt),
                            makeInstruction("bne", "$at", "$zero", C),
                            makeInstruction("nop"));
                        break;
                    case 'bgtz':
                        self._memBottom.push( 
                            makeInstruction("slt", "$at", rs, rt),
                            makeInstruction("bne", "$at", "$zero", C),
                            makeInstruction("nop"));
                        break;
                    case 'beqz':
                        self._memBottom.push(
                            makeInstruction("beq", rs, "$zero", C),
                            makeInstruction("nop"));
                        break;
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
                
                // certain instructions require a nop, put it in for them if they don't have it
                if (_.contains(nops, instr.props().opcode) && instructions[i+1]
                    && instructions[i+1].props().opcode != 'nop') {
                    self._memBottom.push(makeInstruction("nop"));
                }
            }
        });
    };*/
    
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