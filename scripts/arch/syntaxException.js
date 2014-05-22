define([], function() {
    
    function syntaxException(msg) {
        this.message = msg;
        this.name = 'syntaxException';
    }
    
    return syntaxException;
    
});