const tma= require('timeago.js');
// format timestamp
tma.format(1544666010224);

// format date instance
tma.format(new Date(1544666010224));

console.log(tma);
