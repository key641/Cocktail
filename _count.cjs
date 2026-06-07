const fs = require("fs");
const c = fs.readFileSync("D:/Document/Cocktail/src/data/cocktails.ts", "utf8");
var matches = c.match(/id: "/g);
console.log("Total cocktails:", matches ? matches.length : 0);
var ids = c.match(/id: "([^"]+)"/g);
if (ids) ids.forEach(function(i) { console.log(i); });
