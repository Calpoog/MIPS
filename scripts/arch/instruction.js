define(["underscore"], function(_) {
    // private static vars
    var instrCount = 0,
        types = {
            'r': ['add','addu','and','div','divu','jr','mfhi','mflo','mfc0','mult','multu','nor','xor','or','slt','sltu','sll','srl','sra','sub','subu'],
            'i': ['addi','addiu','andi','beq','bne','lbu','lhu','lui','lw','ori','sb','sh','slti','sltiu','sw'],
            'j': ['j','jal']
        };
    
    function Instruction(instr) {
        var bits = [];
        
        // public instance properties
        var props = {
            opcode: instr.split(' ')[0],
            rs: null,
            rt: null,
            rd: null,
            shamt: null,
            funct: null,
            immediate: null,
            addr: null,
            type: null,
            errors: []
        };
        this._props = props;
        
        // special case, syscall just leave it
        if (props.opcode == 'syscall') return;
        
        // first determine instruction type
        _.each(types, function(ops, type) {
            if (_.contains(ops, props.opcode)) {
                props.type = type;
            }
        });
        
        switch (props.type) {
            // grab r bits
            case 'r':
                bits = instr.match(/^[a-zZ]{1,4}\s\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)\$([a-z]?\d+|[a-z]{2,4}))?(?:(?:\s*,\s*)\$([a-z]?\d+|[a-z]{2,4}))?$/m);
                // wonky instructions
                if (_.contains(['mult','multu','div','divu'], props.opcode)) {
                    // s, t
                    props.rs = bits[1];
                    props.rt = bits[2];
                } else if (_.contains(['mfhi','mflo'], props.opcode)) {
                    // d
                    props.rd = bits[1];
                } else if (_.contains(['mfhi','mflo'], props.opcode)) {
                    // t, d
                    props.rt = bits[1];
                    props.rd = bits[2];
                } else if (_.contains(['sll','srl','sra'], props.opcode)) {
                    // d, t, shamt
                    props.rd = bits[1];
                    props.rt = bits[2];
                    props.shamt = bits[3];
                } else if (_.contains(['sllv','srlv','srav'], props.opcode)) {
                    // d, t, s
                    props.rd = bits[1];
                    props.rt = bits[2];
                    props.rs = bits[3];
                } else if (this.opcode == 'jr') {
                    // s
                    props.rs = bits[1];
                } else {
                    // d, s, t
                    props.rd = bits[1];
                    props.rs = bits[2];
                    props.rt = bits[3];
                }
                break;
            case 'i':
                bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)\$([a-z]?\d+|[a-z]{2,4}))?(?:(?:\s*,\s*)(\d+|[A-Za-z_]\w*))?$/m);
                if (_.contains(['addi','addiu','beq','bne'], props.opcode)) {
                    // s,t,C
                    props.rs = bits[1];
                    props.rt = bits[2];
                    props.immediate = bits[3];
                } else if (_.contains(['lw','lh','lhu','lb','lbu','sw','sh','sb'], props.opcode)) {
                    // t,C(s)
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)(\d+|[A-Za-z_]\w*))?\(\$([a-z]?\d+|[a-z]{2,4})\)$/m);
                    props.rt = bits[1];
                    props.immediate = bits[2];
                    props.rs = bits[3];
                } else if (_.contains(['andi','ori','slti'], props.opcode)) {
                    // t,s,C
                    props.rt = bits[1];
                    props.rs = bits[2];
                    props.immediate = bits[3];
                } else if (_.contains(['lui'], props.opcode)) {
                    // t,C
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)(\d+|[A-Za-z_]\w*))?$/m);
                    props.rt = bits[1];
                    props.immediate = bits[2];
                }
                break;
            case 'j':
                bits = instr.match(/^\s*[a-z]{1,4}\s+(\d+|[A-Za-z_]\w*)$/m);
                props.addr = bits[1];
                break;
                
        }
        
        // validate the parameters
        this._verifyRegisters();
        
        instrCount++;
        
        // public stuff that needs access to private vars
        this.props = function() {
            return props;
        };
    }
    
    /*
     * private static helper methods
     */
    function isNumber(val) {
        return (!isNaN(parseInt(val,10)));
    }
    
    /*
     * public instance methods
     */
    Instruction.prototype.props = function() {
        return this._props;
    };
    
    Instruction.prototype.quickLook = function() {
        return this._props.opcode;
    };
    
    Instruction.prototype.setLabel = function(label) {
        this._props.label = label;
    };
    Instruction.prototype.getLabel = function() {
        return this._props.label;
    };
    
    Instruction.prototype.get = function(attr) {
        return this._props[attr];
    };
    Instruction.prototype.set = function(attr, val) {
        this._props[attr] = val;
    };
    
    // set error state on condition
    Instruction.prototype._errorIf = function(cond, error) {
        if (cond) {
            this._error(error);
        }
    };
    Instruction.prototype._error = function(error) {
        this._props.errors.push(error);
    };
    
    // verify length and validity of instruction params
    Instruction.prototype._verifyRegisters = function() {
        var _this = this,
            props = _this._props,
            val = null;
        // check immediate for number vs label
        if (props.immediate) {
            if (isNumber(props.immediate)) {
                // treat it as number
                val = parseInt(props.immediate,10);
                if (!isNaN(val)) {
                    props.immediate = val;
                } else {
                    this._error("Invalid immediate value or label name");
                }
            } else {
                // this is a label, mark it for relocation
                props.relocate = true;
            }
        }
        
        // check address for number vs label
        if (props.addr) {
            if (isNumber(props.addr)) {
                // treat it as number
                val = parseInt(props.addr,10);
                if (!isNaN(val)) {
                    props.addr = val;
                } else {
                    this._error("Invalid address value or label name");
                }
            } else {
                // this is a label, mark it for relocation
                props.relocate = true;
            }
        }
        
        // register params only $12, $t2, or $ra types
        _.each(['rs','rt','rd'], function(register) {
            var reg = props[register],
                bits = [];
                
            if (reg === null || reg == undefined) { return; }
            else if (reg == 'zero') { props[register] = 0; return; }
            
            bits = reg.match(/([a-z])(\d)/);
            
            if (!bits) {
                // either letter-number, or letter-letter
                if (isNumber(reg)) {
                    props[register] = parseInt(reg, 10);
                } else {
                    switch (reg) {
                        case 'gp': props[register] = 28; return;
                        case 'sp': props[register] = 29; return;
                        case 'fp': props[register] = 30; return;
                        case 'ra': props[register] = 31; return;
                    }
                    _this._error("Unrecognized register value: " + reg);
                }
            } else if (bits) {
                bits.shift(); // shift off the entire match, don't need it
                bits[1] = parseInt(bits[1], 10);
                switch(bits[0]) {
                    case 'v':
                        _this._errorIf(bits[1]>1, "v register out of range: " + reg);
                        props[register] = bits[1] + 2;
                        break;
                    case 'a':
                        _this._errorIf(bits[1]>3, "a register out of range: " + reg);
                        props[register] = bits[1] + 4;
                        break;
                    case 't':
                        _this._errorIf(bits[1]>9, "t register out of range: " + reg);
                        if (bits[1] <= 7) {
                            props[register] = bits[1] + 8;
                        } else {
                            props[register] = bits[1] + 24;
                        }
                        break;
                    case 's':
                        _this._errorIf(bits[1]>7, "s register out of range: " + reg);
                        props[register] = bits[1] + 16;
                        break;
                    case 'k':
                        _this._errorIf(bits[1]>1, "k register out of range: " + reg);
                        props[register] = bits[1] + 26;
                        break;
                }
            }
        });
    };
    
    /*
     * public static methods
     */
    Instruction.getInstructionCount = function() {
        return instrCount;
    };
    
    return Instruction;
    
});