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
        
        // grab the instructions
        this._instructions = program.getInstructions();
        
        // initialize program counter
        this._pc = 0;
        
        // initialize view
        View.init(this);
    }
    
    Execution.prototype.doNext = function() {
        var self = this;
        
        self.execute();
    };
    
    Execution.prototype.execute = function() {
        var self = this,
            instr = self._instructions[self._pc],
            regs = self._regs,
            rd = instr.get('rd'),
            rs = instr.get('rs'),
            rt = instr.get('rt'),
            C = instr.get('immediate'),
            address = instr.get('address'),
            shamt = instr.get('shamt'),
            mem = self._memory;
            
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
            case 'beq':     self._pc += (regs[rs] == regs[rt] ? (1 + C) : 0); break;
            case 'bne':     self._pc += (regs[rs] != regs[rt] ? (1 + C) : 0); break;
            case 'j':       self._pc = address; break;
            case 'jr':      self._pc = regs[rs]; break;
            case 'jal':     
                self._regs[31] = self._pc + 1;
                self._pc = address;
        }
        
        self._pc++;
        
        View.updateRegisters(self._regs);
    };
    
    return Execution;
    
});