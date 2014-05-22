define(["underscore", "arch/memory"], function(_, Memory) {
    
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
    }
    
    Execution.prototype.doNext = function() {
        var self = this;
        
        self.execute();
    };
    
    Execution.prototype.execute = function() {
        var self = this,
            instr = self._instructions[self._pc],
            regs = self._regs,
            immediate = instr.get('immediate'),
            address = instr.get('address'),
            mem = self._memory;
            
        switch(instr.get('opcode')) {
            case 'add': regs[rd] = regs[rs] + regs[rt]; break;
            case 'addu': regs[rd] = (regs[rs] >>> 0) + (regs[rt] >>> 0); break;
            case 'sub': regs[rd] = regs[rs] - regs[rt]; break;
            case 'subu': regs[rd] = (regs[rs] >>> 0) - (regs[rt] >>> 0); break;
            case 'addi': regs[rt] = regs[rs] + immediate; break;
            case 'addiu': regs[rt] = regs[rs] + (immediate >>> 0); break;
            /* come back to this puzzler
            case 'mult':
                self._LO = ((regs[rs] * regs[rt]) <<< 32) >>> 32;
                self._HI = (regs[rs] * regs[rt]) >>> 32;
            */
            case 'div':
                self._LO = parseInt(regs[rs] / regs[rt]);
                self._HI = regs[rs] % regs[rt];
                break;
            case 'divu':
                self._LO = parseInt((regs[rs] >>> 0) / (regs[rt] >>> 0));
                self._HI = (regs[rs] >>> 0) % (regs[rt] >>> 0);
                break;
            case 'lw': regs[rt] = mem.loadWord(regs[rs] + immediate); break;
            case 'lh': regs[rt] = mem.loadHalf(regs[rs] + immediate, true); break;
            case 'lhu': regs[rt] = mem.loadHalf(regs[rs] + immediate, false); break;
            case 'lb': regs[rt] = mem.loadByte(regs[rs] + immediate, true); break;
            case 'lbu': regs[rt] = mem.loadByte(regs[rs] + immediate, false); break;
        }
        self._pc++;
    };
    
    return Execution;
    
});