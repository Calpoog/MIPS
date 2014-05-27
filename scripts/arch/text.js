define(["underscore", "arch/syntaxException", "arch/instruction"],
       function(_, SyntaxException, Instruction) {
    
    function Text() {
        var self = this;
        self.instructions = [];
    }
    
    Text.prototype.getInstructions = function() {
        var self = this;
        return self.instructions;
    };
    
    Text.prototype.processInstr = function(line) {
        var self = this,
            instr = new Instruction(line.command);

        instr.setLabel(line.label);
        self.instructions.push(instr);
    };
    
    Text.prototype.display = function() {
        var self = this;
        console.log(_.zip(self.labels, self.instructions));
    };
    
    return Text;
});