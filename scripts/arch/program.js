define(["underscore", "arch/tokenizer", "arch/data", "arch/text"], function(_, Tokenizer, Data, Text) {
    // directives that can be in both data and text section
    var scopeDirectives = ['globl', 'extern'];
    
    function Program(text) {
        var self = this,
            lines = Tokenizer.tokenize(text);
        
        self.data = new Data();
        self.section = null;
        self.text = new Text();
        
        //try {
            _.each(lines, function(line) {
                var command = line.command,
                    directive = command.match(/\.(\w+)/);
                    
                directive = directive ? directive[1] : null;
                    
                if (command == '.data') {
                    self.section = 'data';
                    return;
                } else if (command == '.text') {
                    self.section = 'text';
                    return;
                } else if (!self.section) {
                    // not in the .data or .text section, so error?
                    console.log("ERROR: " + command + " outside .data or .text section");
                    return;
                }
                
                if (self.section == 'data' || _.contains(scopeDirectives, directive)) {
                    self._processData(line);
                } else if (self.section == 'text') {
                    self._processText(line);
                }
            });
        //} catch(e) {
        //    if (e.name == "SyntaxException") { console.log(e); }
        //    else { throw e; }
        //}
    }
    
    Program.prototype._processData = function(line) {
        var self = this;
        
        self.data.processDirective(line);
    };
    
    Program.prototype._processText = function(line) {
        var self = this;
        
        self.text.processInstr(line);
    };
    
    Program.prototype.getInstructions = function() {
       return this.text.getInstructions(); 
    };
    
    Program.prototype.display = function() {
        var self = this;
        
        self.data.display();
        self.text.display();
    };
    
    Program.prototype.getData = function() {
        return this.data;
    };
    Program.prototype.getText = function() {
        return this.text;
    };
    
    return Program;
    
});