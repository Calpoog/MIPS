require(["underscore", "arch/instruction", "arch/tokenizer", "arch/program",
        "arch/memory", "arch/execution"],
        function(_, Instruction, Tokenizer, Program, Memory, Execution) {
            
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
"main:\n"+
"addi $t0, $zero, 100\n"+
"addi $t2, $zero, 200\n"+
"addi $t3, $zero, 300\n"
;
    
    var p = new Program(t),
        e = new Execution(p);
    
    
});