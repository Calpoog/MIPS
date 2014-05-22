define(["underscore", "arch/syntaxException", "arch/instruction"],
       function(_, SyntaxException, Instruction) {
    
    function Text() {
        var self = this;
        self.labels = [],
        self.instructions = [];
    }
    
    Text.prototype.getInstructions = function() {
        var self = this;
        return self.instructions;
    };
    
    Text.prototype.processInstr = function(line) {
        var self = this,
            instr = new Instruction(line.command);
        
        // let the instruction know it's label so it's easier to pass around
        instr.setLabel(line.label);
        
        self.labels.push(line.label);
        self.instructions.push(instr);
    };
    
    Text.prototype.display = function() {
        var self = this;
        console.log(_.zip(self.labels, self.instructions));
    };
    
    return Text;
});