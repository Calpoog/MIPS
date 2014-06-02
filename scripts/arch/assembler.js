define(["underscore", "arch/tokenizer", "arch/data", "arch/instruction"], function(_, Tokenizer, Data, Instruction) {
    // directives that can be in both data and text section
    var scopeDirectives = ['globl', 'extern'];
    
    function Assembler(text) {
        var self = this,
            lines = Tokenizer.tokenize(text);
        
        self._data = new Data();
        self._section = null;
        self._instructions = [];
        self._labels = {};
        self.startAddr = 0;
        
        //try {
            _.each(lines, function(line) {
                var command = line.command,
                    directive = command.match(/\.(\w+)/);
                    
                directive = directive ? directive[1] : null;
                    
                if (command == '.data') {
                    self._section = 'data';
                    return;
                } else if (command == '.text') {
                    self._section = 'text';
                    return;
                } else if (!self._section) {
                    // not in the .data or .text section, so error?
                    console.log("ERROR: " + command + " outside .data or .text section");
                    return;
                }
                
                if (self._section == 'data' || _.contains(scopeDirectives, directive)) {
                    self._processData(line);
                } else if (self._section == 'text') {
                    self._processText(line);
                }
            });
        //} catch(e) {
        //    if (e.name == "SyntaxException") { console.log(e); }
        //    else { throw e; }
        //}
        
        // offset data addresses
        self._data.offsetLabels(self._instructions.length * 4);
        
        // mixin the data labels with the instructions labels
        _.extend(self._labels, self._data.getDataLabels());
        
        // do a second pass for relocation
        self._secondPass();
    }
    
    Assembler.prototype._processData = function(line) {
        var self = this;
        
        self._data.processDirective(line);
    };
    
    Assembler.prototype._processText = function(line) {
        var self = this,
            label = line.label,
            instr = new Instruction(line.command),
            addr = self._instructions.length * 4;
    
        // let the instruction know its label
        instr.setLabel(label);
        
        // remember start of program
        if (label == 'main') {
            self.startAddr = addr;
        }
        
        // add label to symbol table
        self._labels[label] = addr;
        
        // expand pseudo instruction if necessary
        if (instr.props().type == 'p') {
            self._expandPseudo(instr);
        } else {
            // add instruction to list
            self._instructions.push(instr);
        }
    };
    
    Assembler.prototype.getInstructions = function() {
       return this._instructions; 
    };
    
    Assembler.prototype.getData = function() {
        return this._data;
    };
    
    /*
     * Expands pseudo operations into actual ops
     * Also adds nops for those that are converted to jumping instructions
     */
    Assembler.prototype._expandPseudo = function(instr) {
        var self = this,
            props = instr.props(),
            rt = '$'+props.rt,
            rs = '$'+props.rs,
            rd = '$'+props.rd,
            C = props.immediate;
            
        switch(props.opcode) {
            case 'move':
                self._instructions.push(makeInstruction("add", rt, rs, "$zero")); break;
            case 'clear':
                self._instructions.push(makeInstruction("add", rt, "$zero", "$zero")); break;
            case 'not':
                self._instructions.push(makeInstruction("nor", rt, rs, "$zero")); break;
            case 'la': case 'li':
                // these Cs actually need split up into lower and upper halves but we don't have the addresses yet
                // do that in the second pass
                var lui = makeInstruction("lui", rd, C),
                    ori = makeInstruction("ori", rd, rd, C);
                lui.set('loadUpper', true);
                ori.set('loadLower', true);
                self._instructions.push(lui, ori);
                break;
            case 'b':
                self._instructions.push(makeInstruction("beq", "$zero", "$zero", C));
                break;
            case 'bal':
                // TODO: bgezal doesn't work yet
                self._instructions.spush(makeInstruction("bgezal", "$zero", C)); break;
            case 'bgt': case 'ble':
                self._instructions.push(
                    makeInstruction("slt", "$at", rt, rs),
                    makeInstruction("beq", "$at", "$zero", C));
                break;
            case 'blt': case 'bge':
                self._instructions.push(
                    makeInstruction("slt", "$at", rs, rt),
                    makeInstruction("beq", "$at", "$zero", C));
                break;
            case 'bgtu':
                self._instructions.push(
                    makeInstruction("slt", "$at", rs, rt),
                    makeInstruction("bne", "$at", "$zero", C));
                break;
            case 'bgtz':
                self._instructions.push( 
                    makeInstruction("slt", "$at", rs, rt),
                    makeInstruction("bne", "$at", "$zero", C));
                break;
            case 'beqz':
                self._instructions.push(makeInstruction("beq", rs, "$zero", C));
                break;
            case 'mul':
                self._instructions.push(
                    makeInstruction("mult", rs, rt),
                    makeInstruction("mflo", rd));
                break;
            case 'div':
                self._instructions.push(
                    makeInstruction("div", rs, rt),
                    makeInstruction("mflo", rd));
                break;
            case 'rem':
                self._instructions.push(
                    makeInstruction("div", rs, rt),
                    makeInstruction("mfhi", rd));
                break;
        }
    };
    
    Assembler.prototype.display = function() {
        var self = this;
        
        self._data.display();
        self._text.display();
    };
    
    /*
     * Second pass relocates what it can
     */
    Assembler.prototype._secondPass = function() {
        var self = this;
        
        _.each(self._instructions, function(instr, i) {
            var addr = i * 4,
                props = instr.props(),
                adjusted = null;
                
            if (props.relocate && props.immediate !== null) {
                if (!self._labels.hasOwnProperty(props.immediate)) {
                    // assume that it's global in another file to be linked
                    console.log("Possible external: " + props.immediate);
                    return;
                }
                adjusted = self._labels[props.immediate];
                // PC relative
                if (_.contains(['bne','beq'], props.opcode)) {
                    adjusted = (adjusted - addr - 4) >> 2;
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
        });
    };
    
    function makeInstruction() {
        var args = Array.prototype.slice.apply(arguments);
        return new Instruction(args[0] + " " + args.slice(1).join(", "));
    }
    
    return Assembler;
    
});