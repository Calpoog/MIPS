define(["underscore", "arch/syntaxException"], function(_, SyntaxException) {
    // private static vars
    var instrCount = 0,
        types = {
            'r': ['add','addu','and','div','divu','jr','mfhi','mflo','mfc0','mult','multu','nor','xor','or','slt','sltu','sll','srl','sra','sub','subu'],
            'i': ['addi','addiu','andi','beq','bne','lbu','lhu','lui','lw','ori','sb','sh','slti','sltiu','sw'],
            'j': ['j','jal'],
            // pseudo instructions
            'p': ['move','clear','not','la','li','b','bal','bgt','blt','bge','ble','bgtu','bgtz','beqz','mul','div','rem']
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
            type: null,
            errors: [],
            orig: instr
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
                bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)\$([a-z]?\d+|[a-z]{2,4}))?(?:(?:\s*,\s*)(-?\d+|[A-Za-z_]\w*))?$/m);
                if (_.contains(['beq','bne'], props.opcode)) {
                    // s,t,C
                    props.rs = bits[1];
                    props.rt = bits[2];
                    props.immediate = bits[3];
                } else if (_.contains(['lw','lh','lhu','lb','lbu','sw','sh','sb'], props.opcode)) {
                    // t,C(s)
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)(-?\d+|[A-Za-z_]\w*))?\(\$([a-z]?\d+|[a-z]{2,4})\)$/m);
                    props.rt = bits[1];
                    props.immediate = bits[2];
                    props.rs = bits[3];
                } else if (_.contains(['addi','addiu','andi','ori','slti'], props.opcode)) {
                    // t,s,C
                    props.rt = bits[1];
                    props.rs = bits[2];
                    props.immediate = bits[3];
                } else if (_.contains(['lui'], props.opcode)) {
                    // t,C
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)(-?\d+|[A-Za-z_]\w*))?$/m);
                    props.rt = bits[1];
                    props.immediate = bits[2];
                }
                break;
            case 'j':
                bits = instr.match(/^\s*[a-z]{1,4}\s+(\d+|[A-Za-z_]\w*)$/m);
                props.immediate = bits[1];
                break;
            case 'p':
                // for (t,s) (t) and (d,s,t)
                bits = instr.match(/^[a-zZ]{1,6}\s\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)\$([a-z]?\d+|[a-z]{2,4}))?(?:(?:\s*,\s*)\$([a-z]?\d+|[a-z]{2,4}))?$/m);
                if (_.contains(['move','not'], props.opcode)) {
                    // t,s
                    props.rt = bits[1];
                    props.rs = bits[2];
                } else if (_.contains(['clear'], props.opcode)) {
                    // t
                    props.rt = bits[1];
                } else if (_.contains(['la'], props.opcode)) {
                    // d, label
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)([A-Za-z_]\w*))$/m);
                    props.rd = bits[1];
                    props.immediate = bits[2];
                } else if (_.contains(['li'], props.opcode)) {
                    // d, C(32)
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)(-?\d+))$/m);
                    props.rd = bits[1];
                    props.immediate = bits[2];
                } else if (_.contains(['b','bal'], props.opcode)) {
                    // label
                    bits = instr.match(/^\s*[a-z]{1,4}\s+([A-Za-z_]\w*)?$/m);
                    props.immediate = bits[1];
                } else if (_.contains(['bgt','blt','bge','ble','bgtu'], props.opcode)) {
                    // s,t,label
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)([A-Za-z_]\w*))$/m);
                    props.rs = bits[1];
                    props.rt = bits[2];
                    props.immediate = bits[3];
                } else if (_.contains(['bgtz','beqz'], props.opcode)) {
                    // s, label
                    bits = instr.match(/^\s*[a-z]{1,4}\s+\$([a-z]?\d+|[a-z]{2,4})(?:(?:\s*,\s*)([A-Za-z_]\w*))$/m);
                    props.rs = bits[1];
                    props.immediate = bits[2];
                } else if (_.contains(['mul','div','rem'], props.opcode)) {
                    // d,s,t
                    props.rd = bits[1];
                    props.rs = bits[2];
                    props.rt = bits[3];
                }
                break;
            default:
                throw new SyntaxException("Problem parsing instruction: " + instr);
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
        
        // register params only $12, $t2, or $ra types
        _.each(['rs','rt','rd'], function(register) {
            var reg = props[register],
                bits = [];
                
            if (reg === null || reg === undefined) { return; }
            else if (reg == 'zero') { props[register] = 0; return; }
            
            if (reg.match(/\d\d/)) {
                    props[register] = parseInt(reg, 10);
            } else if (reg.match(/[a-z]{2}/)) {
                switch (reg) {
                    case 'at': props[register] = 1; return;
                    case 'gp': props[register] = 28; return;
                    case 'sp': props[register] = 29; return;
                    case 'fp': props[register] = 30; return;
                    case 'ra': props[register] = 31; return;
                }
                _this._error("Unrecognized register value: " + reg);
            } else if (reg.match(/[a-z]\d/)) {
                var d = parseInt(reg.charAt(1), 10);
                switch(reg.charAt(0)) {
                    case 'v':
                        _this._errorIf(d>1, "v register out of range: " + reg);
                        props[register] = d + 2;
                        break;
                    case 'a':
                        _this._errorIf(d>3, "a register out of range: " + reg);
                        props[register] = d + 4;
                        break;
                    case 't':
                        _this._errorIf(d>9, "t register out of range: " + reg);
                        if (d <= 7) {
                            props[register] = d + 8;
                        } else {
                            props[register] = d + 24;
                        }
                        break;
                    case 's':
                        _this._errorIf(d>7, "s register out of range: " + reg);
                        props[register] = d + 16;
                        break;
                    case 'k':
                        _this._errorIf(d>1, "k register out of range: " + reg);
                        props[register] = d + 26;
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