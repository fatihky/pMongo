pMongo
======

Portable mongodb implementation for browser and node.js
It uses [shift.js](https://github.com/crcn/sift.js) as query engine and supports $push, $pop updates.
Example usage:
<
```javascript
var doc;
var p = new pMongo();

doc = p.add({some:{nested:{object: 274}}}); // newly added doc(includes _id field)
// doc._id: "0faa0a9a-18a6-429b-96d5-0a503ace47f9"
p.add({some:{other:{nested:{object: 256}}}});

// iterate over records
// you can specify query object as first argument here
p.iterate(function(doc, i){ console.log("doc:", doc, "index:", i); })
// iterate over query results
p.iterate({"some.nested.object": 274}, function(doc, i){ console.log("doc:", doc, "index:", i); })

// now query records
var results = p.find({"some.nested.object": 274});
// results: [{"some":{"nested":{"object":274}},"_id":"0faa0a9a-18a6-429b-96d5-0a503ace47f9"}]

// lets remove first doc
p.remove({_id: doc._id});

console.log(p.count()); // => 1
```
