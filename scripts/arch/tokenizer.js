define(["underscore"], function(_) {
    
    function Tokenizer() {
        
    }
    
    Tokenizer.prototype.tokenize = function(text) {
        var pieces = [];
        // remove everything to end of line after comments
        text = text.replace(/#.*$/gm, '');
        // remove spaces at beginning/end of lines
        text = text.replace(/^[^\S\r\n]+|[^\S\r\n]+$/gm, '');
        // reduce all spacing to 1
        text = text.replace(/([^\S\r\n])+/g, ' ');
        // remove newlines between label and instruction
        text = text.replace(/(\w+\:)\s*(.*)\n/, '$1 $2\n');
        // remove empty lines
        text = text.replace(/^\s*\n/gm, '');
        
        return _.map(text.split('\n').slice(0,-1), function(line) {
            var bits = line.split(': ');
            return {
                label: bits.length>1? bits[0] : null,
                command: bits.length>1? bits[1] : bits[0]
            };
        });
    };
    
    // singleton
    return new Tokenizer();
});