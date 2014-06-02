define(["underscore", "jquery", "arch/instruction", "arch/hex"], function(_, $, Instruction, Hex) {
    
    var $registers = $('#registers'),
        $memory = $('#memory'),
        $stack = $('#stack'),
        $stdin = $('#stdin'),
        execution = null;
        
    function regName(num) {
        if (num == 0) {
            return "$zero";
        } else if (num == 1) {
            return "$at";
        } else if (num <= 3) {
            return "$v"+(num-2);
        } else if (num <= 7) {
            return "$a"+(num-4);
        } else if (num <= 15) {
            return "$t"+(num-8);
        } else if (num <= 23) {
            return "$s"+(num-16);
        } else if (num <= 25) {
            return "$t"+(num-24+8);
        } else if (num <= 27) {
            return "$k"+(num-26);
        } else if (num == 28) {
            return "$gp";
        } else if (num == 29) {
            return "$sp";
        } else if (num == 30) {
            return "$fp";
        } else if (num == 31) {
            return "$ra";
        }
        return null;
    }
    
    return {
        init: function(e) {
            execution = e;
            
            $('#next').click(function() {
                execution.execute();
            });
            
            $('#run').click(function() {
                execution.run();
            });
        },
        update: function(exec) {
            var state = exec.state(),
                mem = state.mem,
                regs = state.regs,
                stack = mem.getStack();
                
            $registers.empty()
                .append('<div>PC: ' + execution._pc.toHex(32) + '</div>')
                .append('<div>COUNT: ' + execution.execCount + '</div>')
                .append('<div>TIME: ' + execution.execTime + '</div>')
                .append('<div>INSTR: ' + state.instr.props().orig + '</div>')
                .append('<div>ENCODING: ' + state.instr.encode() + '</div>');
            _.each(regs, function(reg, i) {
                $registers.append(
                    '<div>' + (regName(i)+'     ').substr(0,5).replace(/\s/g, '&nbsp;') + " " +
                    ('0'+i).substr(-2) + ": " +
                    parseInt(reg, 10).toHex(32) + ' ' + reg +
                    '</div>');
            });
            
            $memory.empty();
            _.each(mem.getMemory(), function(block, i) {
                $memory.append('<div>' + (i*4).toHex(32) + ": " + (block instanceof Instruction?block.props().orig:block) + '</div>');
            });
            
            $stack.empty();
            _.each(stack, function(block, i) {
                $stack.append('<div>' + (0x80000000-((stack.length-1-i)*4)).toHex(32) + ": " + (block instanceof Instruction?block.props().orig:block) + '</div>');
            });
        },
        getInput: function() {
            var val = $stdin.val();
            $stdin.val('');
            
            return val;
        },
        waitForInput: function(callback) {
            $stdin.keyup(function(e) {
                if (e.which == 13) {
                    $stdin.off('keyup');
                    callback();
                }
            });
        }
    };
});