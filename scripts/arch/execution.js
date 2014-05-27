define(["underscore", "arch/memory", "visual/executionView"],
    function(_, Memory, View) {
    
    // takes a program object to execute
    function Execution(program) {
        // load the program into memory
        this._memory = new Memory(program);
        
        // initialize the registers
        this._regs = Array.fill(32, 0);
        this._HI = 0;
        this._LO = 0;
        
        // grab the instructions from memory since pseudos have been replaced
        this._instructions = this._memory.getInstructions();
        
        // initialize program counter
        this._pc = this._memory.startAddr;
        
        // initialize view
        View.init(this, this._memory);
    }
    
    Execution.prototype.doNext = function() {
        var self = this;
        
        self.execute();
    };
    
    Execution.prototype.state = function() {
        var self = this;
        return {
            pc: self._pc-4,
            instr: self._instructions[(self._pc-4)/4],
            regs: self._regs,
            mem: self._memory
        };
    };
    
    Execution.prototype.execute = function() {
        var self = this,
            instr = self._instructions[self._pc/4],
            regs = self._regs,
            rd = instr.get('rd'),
            rs = instr.get('rs'),
            rt = instr.get('rt'),
            C = instr.get('immediate'),
            shamt = instr.get('shamt'),
            mem = self._memory,
            noInc = false;
            
        switch(instr.get('opcode')) {
            case 'add':     regs[rd] = regs[rs] + regs[rt]; break;
            case 'addu':    regs[rd] = (regs[rs] >>> 0) + (regs[rt] >>> 0); break;
            case 'sub':     regs[rd] = regs[rs] - regs[rt]; break;
            case 'subu':    regs[rd] = (regs[rs] >>> 0) - (regs[rt] >>> 0); break;
            case 'addi':    regs[rt] = regs[rs] + C; break;
            case 'addiu':   regs[rt] = regs[rs] + (C >>> 0); break;
            case 'mult':
                self._LO = (regs[rs] * regs[rt]) & 0xFFFFFFFF;
                self._HI = (regs[rs] * regs[rt]) >>> 32;
                break;
            case 'div':
                self._LO = parseInt(regs[rs] / regs[rt], 10);
                self._HI = regs[rs] % regs[rt];
                break;
            case 'divu':
                self._LO = parseInt((regs[rs] >>> 0) / (regs[rt] >>> 0), 10);
                self._HI = (regs[rs] >>> 0) % (regs[rt] >>> 0);
                break;
            case 'lw':      regs[rt] = mem.loadWord(regs[rs] + C); break;
            case 'lh':      regs[rt] = mem.loadHalf(regs[rs] + C, true); break;
            case 'lhu':     regs[rt] = mem.loadHalf(regs[rs] + C, false); break;
            case 'lb':      regs[rt] = mem.loadByte(regs[rs] + C, true); break;
            case 'lbu':     regs[rt] = mem.loadByte(regs[rs] + C, false); break;
            case 'sw':      mem.store('word', regs[rs] + C, regs[rt]); break;
            case 'sh':      mem.store('half', regs[rs] + C, regs[rt]); break;
            case 'sb':      mem.store('byte', regs[rs] + C, regs[rt]); break;
            case 'lui':     regs[rt] = C << 16; break;
            case 'mfhi':    regs[rd] = self._HI; break;
            case 'mflo':    regs[rd] = self._LO; break;
            case 'and':     regs[rd] = regs[rs] & regs[rd]; break;
            case 'andi':    regs[rt] = 0xFFFF & (regs[rs] & C); break;
            case 'or':      regs[rd] = regs[rs] | regs[rd]; break;
            case 'ori':     regs[rt] = 0xFFFF & (regs[rs] | C); break;
            case 'xor':     regs[rd] = regs[rs] ^ regs[rt]; break;
            case 'nor':     regs[rd] = ~(regs[rs] ^ regs[rt]); break;
            case 'slt':     regs[rd] = regs[rs] < regs[rt] ? 1 : 0; break;
            case 'slti':    regs[rd] = regs[rs] < C ? 1 : 0; break;
            case 'sll':     regs[rd] = regs[rt] << shamt; break;
            case 'srl':     regs[rd] = regs[rt] >>> shamt; break;
            case 'sra':     regs[rd] = regs[rt] >> shamt; break;
            case 'sllv':    regs[rd] = regs[rt] << regs[rs]; break;
            case 'srlv':    regs[rd] = regs[rt] >>> regs[rs]; break;
            case 'srav':    regs[rd] = regs[rt] >> regs[rs]; break;
            case 'beq':     self._pc += (regs[rs] == regs[rt] ? (4+4*C) : 4); noInc = true; break;
            case 'bne':     self._pc += (regs[rs] != regs[rt] ? (4+4*C) : 4); noInc = true; break;
            case 'j':       self._pc = ((self._pc + 4) & 0xF0000000) | (C << 2); noInc = true; break;
            case 'jr':      self._pc = regs[rs]; noInc = true; break;
            case 'jal':     
                self._regs[31] = self._pc + 8;
                self._pc = ((self._pc + 4) & 0xF0000000) | (C << 2);
                noInc = true;
                break;
            case 'syscall':
                // syscall looks in $v0 for command
                // TODO: Add float registers and stuff?
                switch(self._regs[2]) {
                    // print integer: $a0 is value to print
                    case 1: console.log(self._regs[4]); break;
                    // print float: $f12 is value to print
                    case 2: console.log(self._regs[0]); break;
                    // print double: $f12 is value to print
                    case 3: console.log(self._regs[0]); break;
                    // print string: $a0 is address of string
                    case 4:
                        var s = "",
                            c = '';
                        for (var i = self._regs[4]; c != '\0'; i+=4) {
                            c = mem.loadWord(i);
                            s += c;
                        }
                        console.log(s);
                        break;
                    // read integer: $v0 is value read
                    case 5: console.log(self._regs[4]); break;
                    // read float: $f0 is value read
                    case 6: console.log(self._regs[4]); break;
                    // read double: $f0 is value read
                    case 7: console.log(self._regs[4]); break;
                    // read string: $a0 is address where string will store
                    //              $a1 is # chars to read + 1
                    case 8: console.log(self._regs[4]); break;
                    // memory allocate: $a0 is # of bytes of storage
                    //                  $v0 is address of block
                    case 9: console.log(self._regs[4]); break;
                    // exit
                    case 10: console.log("DONE"); break;
                    // print char: $a0 is value to print as integer
                    case 11: console.log(self._regs[4]); break;
                    // read char: $v0 is value char read
                    case 12: console.log(self._regs[4]); break;
                }
                
        }
        
        if (!noInc) self._pc+=4;
        
        View.update(self);
    };
    
    return Execution;
    
});