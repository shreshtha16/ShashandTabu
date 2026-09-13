const fs = require('fs');
const path = require('path');
const assert = require('assert');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

assert(css.includes('--cream:#fcf8f4'), 'Expected the paper cream canvas token in style.css');
assert(css.includes('--paper:#fffdfb'), 'Expected the paper token in style.css');
assert(css.includes('--rose:#b86b76'), 'Expected the rose visual token in style.css');
assert(css.includes('--rose-soft:#e9c8c7'), 'Expected the rose-soft visual token in style.css');
assert(css.includes('font-family:"Cormorant Garamond"'), 'Expected the Cormorant Garamond heading font token in style.css');

console.log('Smoke test passed: original rose-and-paper visual tokens and serif typography detected.');
