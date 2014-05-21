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
        
        // first determine instruction type
        _.each(types, function(ops, type) {
            if (_.contains(ops, props.opcode)) {
                props.type = type;
            }
        });
        
        switch (props.type) {
            // grab r bits
            case 'r':
                bits = instr.match(/^[a-zZ]{1,4}\s\$([a-z]?\d+|[a-z]{2})(?:(?:,\s|,)\$([a-z]?\d+|[a-z]{2}))?(?:(?:,\s|,)\$([a-z]?\d+|[a-z]{2}))?$/m);
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
                bits = instr.match(/^[a-z]{1,4}\s\$([a-z]?\d+|[a-z]{2})(?:(?:,\s|,)\$([a-z]?\d+|[a-z]{2}))?(?:(?:,\s|,)(\d+|[A-Za-z_]\w*))?$/m);
                if (_.contains(['addi','addiu','beq','bne'], props.opcode)) {
                    // s,t,C
                    props.rs = bits[1];
                    props.rt = bits[2];
                    props.immediate = bits[3];
                } else if (_.contains(['lw','lh','lhu','lb','lbu','sw','sh','sb'], props.opcode)) {
                    // t,C(s)
                    bits = instr.match(/^[a-z]{1,4}\s\$([a-z]?\d+|[a-z]{2})(?:(?:,\s|,)(\d+|[A-Za-z_]\w*))?\(\$([a-z]?\d+|[a-z]{2})\)$/m);
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
                    bits = instr.match(/^[a-z]{1,4}\s\$([a-z]?\d+|[a-z]{2})(?:(?:,\s|,)(\d+|[A-Za-z_]\w*))?$/m);
                    props.rt = bits[1];
                    props.immediate = bits[2];
                }
                break;
            case 'j':
                bits = instr.match(/^[a-z]{1,4}\s(\d+|[A-Za-z_]\w*)$/m);
                props.immediate = bits[1];
                break;
                
        }
        
        // TODO: verify lengths of props
        
        instrCount++;
        
        // public stuff that needs access to private vars
        this.props = function() {
            return props;
        };
    }
    
    // private static helper methods
    function isNumber(val) {
        return (!isNaN(parseInt(val,10)));
    }
    
    /*
     * public instance methods
     */
    Instruction.prototype.props = function() {
        return this._props;
    };
    
    // set error state on condition
    Instruction.prototype._errorIf = function(cond, error) {
        
    };
    
    // verify length and validity of instruction params
    Instruction.prototype._verifyRegisters = function() {
        var props = this._props,
            val = null;
        // check immediate for number vs label
        if (isNumber(props.immediate[0])) {
            // treat it as number
            val = parseInt(props.immediate,10);
            if (!isNaN(val)) {
                props.immediate = val;
            } else {
                props.errors.push("Invalid immediate value or label name");
            }
        } else {
            // this is a label, mark it for relocation
            props.relocate = true;
        }
        
        // register params only $12, $t2, or $ra types
        _.each(['rs','rt','rd'], function(register) {
            var reg = props[register],
                bits = reg.match(/([a-z])(\d)/);
            
            if (isNumber(reg)) {
                props[register] = parseInt(reg, 10);
            } else if (bits) {
                bits[1] = parseInt(bits[1], 10);
                switch(bits[0]) {
                    case 'v':
                        // TODO validate within range of V
                        props[register] = bits[1] + 2;
                        break;
                    case 'a':
                        props[register] = bits[1] + 4;
                        break;
                    case 't':
                        if (bits[1] <= 7) {
                            props[register] = bits[1] + 8;
                        } else {
                            props[register] = bits[1] + 24;
                        }
                        break;
                    case 's':
                        props[register] = bits[1] + 16;
                        break;
                    case 'k':
                        props[register] = bits[1] + 26;
                        break;
                }
            }
        });
    };
    
    // public static properties
    
    // public static methods
    Instruction.getInstructionCount = function() {
        return instrCount;
    };
    
    return Instruction;
    
});