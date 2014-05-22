require(["underscore", "arch/instruction", "arch/tokenizer", "arch/program", "arch/memory"],
        function(_, Instruction, Tokenizer, Program, Memory) {
            
    String.prototype.removeSpaces = function() {
        return this.replace(/\s/g, '');
    };
    
    Array.fill = function(len, val) {
        return _.map(_.range(len), function() { return val; });
    };
    
/*    _.each([
            "slt $2,$3,$4",
            "mfcZ $2,$3",
            "srl $2,$3,$4",
            "mfhi $2",
            'mult $2, $3',
            "addi $2, $3, 12345",
            "addi $2, $3, 12",
            "lw $2, 12345($32)",
            "andi $2, $3, 4",
            "lui $34, 383",
            "j 38383",
            "slt $2,$3,$4",
            "mfcZ $t2,$t3",
            "srl $v2,$v3,$v4",
            "mfhi $t2",
            'mult $t2, $t3',
            "addi $t2, $t3, 12345",
            "addi $t2, $t3, 12",
            "lw $fp, 12345($ra)",
            "andi $sp, $ra, 4",
            "lui $sp, 383",
            "andi $zero, $dd, 43",
            "j freddyboy"
        ], function(val) {
        var i = new Instruction(val);
        console.log(i.props());
    });*/
    
    var t = "     #asldkfj    \n"+
"#dlkfjdlkjf\n"+
"    .data\n"+
"theString:\n"+
"    .space 64\n"+
'string: .ascii "calvin"\n'+
'string2: .asciiz "calvin"\n'+
"fred: .word 128,64\n"+
".word -78,-8\n"+
"    .text\n"+
"main:"+
"    lui      $v0, 8 # billy bob\n"+
"    lui      $a0, theString\n"+
" bob:    add      $a1, $a0, $s1\n"+
"    syscall\n"+
"    jr      $ra    \n";
    
    var p = new Program(t);
        mem = new Memory(p);
    p.display();
    mem.display();
});