define([], function() {
    // hex function
    Number.prototype.toHex = function(n) {
        var val = (this >>> 0).toString(16).toUpperCase();
        
        n = n || val.length;
        
        for (var i = val.length * 4; i < n; i+=4) {
            val = '0' + val;
        }
        return val;
    };
    
    // gets specific # of bits in binary of the number, optional shift amount
    Number.prototype.toFixedBinary = function(n, shamt) {
        var mask = 0xFFFFFFFF >> (32-n);
        
        shamt = shamt || 0;
        
        return (this & mask) << shamt;
    };
    
    return {};
});