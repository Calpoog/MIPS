define(["underscore", "jquery", "arch/instruction"], function(_, $, Instruction) {
    
    var $registers = $('#registers'),
        $memory = $('#memory'),
        execution = null;
        
    function hex(n) {
        return n.toString(16);
    }
    
    return {
        init: function(e) {
            execution = e;
            
            $('button').click(function() {
                execution.execute();
            });
        },
        update: function(exec) {
            var state = exec.state(),
                mem = state.mem,
                regs = state.regs;
                
            $registers.empty()
                .append('<div>PC: ' + hex(execution._pc) + '</div>')
                .append('<div>INSTR: ' + state.instr.props().orig + '</div>');
            _.each(regs, function(reg, i) {
                $registers.append('<div>' + i + ": " + hex(reg) + '</div>');
            });
            
            $memory.empty();
            _.each(mem.getMemory(), function(block, i) {
                $memory.append('<div>' + hex(i*4) + ": " + (block instanceof Instruction?block.props().orig:block)  + '</div>');
            });
        }
    };
    
});