define(["underscore", "jquery"], function(_, $) {
    
    var $registers = $('#registers'),
        $memory = $('#memory'),
        execution = null;
    
    return {
        init: function(e) {
            execution = e;
            
            $('button').click(function() {
                execution.execute();
            });
        },
        updateRegisters: function(regs) {
            $registers.empty();
            _.each(regs, function(reg, i) {
                $registers.append('<div>' + i + ": " + reg + '</div>');
            });
        }
    };
    
});