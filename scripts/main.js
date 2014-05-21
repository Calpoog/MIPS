require(["underscore", "arch/instruction"], function(_, Instruction) {
    _.each([
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
            "j 38383","slt $2,$3,$4",
            "mfcZ $t2,$t3",
            "srl $v2,$v3,$v4",
            "mfhi $t2",
            'mult $t2, $t3',
            "addi $t2, $t3, 12345",
            "addi $t2, $t3, 12",
            "lw $fp, 12345($ra)",
            "andi $sp, $ra, 4",
            "lui $sp, 383"
        ], function(val) {
        var i = new Instruction(val);
        console.log(i.props());
    });
});