var sift;

if(typeof window != "undefined" && typeof window.sift != "undefined") {
	sift = window.sift;
} else if(typeof window == "undefined" && typeof require == "function") {
	sift = require("sift");
} else {
	throw new Error('sift.js(https://github.com/crcn/sift.js) required. please include it into your app.');
}

function uuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid)}

var pMongo = function()
{
	this._init();
};

pMongo.prototype._init = function()
{
	this.data_store = []; // simple array
	this.update_if_exists = true;
};

pMongo.prototype.count = function()
{
	return this.data_store.length;
};

pMongo.prototype.reset = function()
{
	this._init();
	return this;
};

pMongo.prototype.add = function(doc)
{
	if(typeof doc._id === undefined || typeof doc._id != "string")
	{
		do
			doc._id = uuid();
		while(this.findOne(doc._id) !== null);
	}

	if(this.findOne(doc._id) !== null)
	{
		if(this.update_if_exists)
			return this.update({_id: doc._id}, doc);
		else
			return null;
	}


	this.data_store.push(doc);
	return doc;
};

pMongo.prototype.findOne = function(_id)
{
	if(!_id) return null;

	for(var i = 0; i < this.count(); i++)
	{
		var doc = this.getByIndex(i);
		if(doc._id == _id)
			return doc;
	}

	return null;
};

pMongo.prototype.findIndex = function(_id)
{
	if(!_id) return -1;

	for(var i = 0; i < this.count(); i++)
	{
		var doc = this.getByIndex(i);
		if(doc._id == _id)
			return i;
	}

	return -1;
};

pMongo.prototype.getByIndex = function(index)
{
	if(typeof index == "undefined") return null;

	if(index > this.count())
		return null;

	return this.data_store[index];
};

pMongo.prototype.docIsMatching = function(doc, conds)
{
	return sift(conds, [doc]).length === 1 ? true : false;
};


pMongo.prototype.find = function(conds, limit_, skip_)
{
	var count = this.count();
	var limit = count
	  , skip = 0;

	if(typeof conds == "undefined")
	{
		if(typeof conds == "number") limit = conds;
		if(typeof limit_ == "number") skip = limit_;
		conds = {};
	} else if(typeof conds == "object") {
		if(typeof limit_ == "number") limit = limit_;
		if(typeof skip_ == "number") skip = skip_;
	} else if (typeof conds == "function") {
		this.iterate(conds);
	} else {
		throw new Error('first argument have to be o either object(query), number(limit), function(iterates all records)');
	}

	var results = sift(conds, this.data_store);
	
	if(skip > 0)
	{
		while(skip--)
			results = results.shift();
	}

	if(typeof results == "undefined")
		results = [];
	else if(limit < results.length) {
		while(limit--)
			results = results.pop();
	}

	if(typeof results == "undefined")
	{
		results = [];
	}

	return results;
};

pMongo.prototype.update = function(conds, fields)
{
	if(typeof fields != "object")
		throw "fields have to be a object";
	for(var i = 0; i < this.count(); i++)
	{
		var doc = this.getByIndex(i);
		var is_matching = this.docIsMatching(doc, conds);
		if(is_matching === true)
		{
			for(var j in fields)
			{
				switch(typeof fields[j])
				{
					case "object":
					{
						for(k in fields[j])
						{
							switch(k)
							{
								case '$inc':
								case '$dec':
								{
									if(typeof fields[j][k] == 'number') {
										if(typeof this.data_store[i][j] == 'undefined')
											this.data_store[i][j] = 0;
										else if(typeof this.data_store[i][j] != 'number')
											break;

										if(k == '$inc')
											this.data_store[i][j] += fields[j][k];
										else
											this.data_store[i][j] -= fields[j][k];
									}
								} break;
								case "$push":
								case "$pop":
									if(this.data_store[i][j] instanceof Array)
									{
										if(k == "$push")
											this.data_store[i][j].push(fields[j][k]);
										else if(k == "$pop")
										{
											console.log("pop: " + fields[j][k])
											var index = this.data_store[i][j].indexOf(fields[j][k]);
											if(index >= 0)
												this.data_store[i][j].splice(index, 1);
										}
									}
							}
						}
					} break;
					default:
						this.data_store[i][j] = fields[j];
				}
			}
		}
	}
};


pMongo.prototype.remove = function(conds)
{
	if(typeof conds == "undefined") return false;

	if(typeof conds == "string")
		return this.removeById(conds);
	if(typeof conds != "object")
		return false;

	var results = this.find(conds);
	for(var i in results)
		this.removeById(results[i]._id);

	return true;
};

pMongo.prototype.removeById = function(_id)
{
	if(typeof _id == "undefined") return false;

	for(var i = 0; i < this.count(); i++)
	{
		var doc = this.getByIndex(i);
		if(doc._id == _id)
			this.data_store.splice(i, 1);
	}

	return true;
};

pMongo.prototype.iterate = function(query, fn, end)
{
	if(typeof query == "function")
	{
		end = fn;
		fn = query;
		query = {};
	} else if (typeof query != "object") {
		throw new Error('query must be a object');
	}
	if(typeof fn != "function")
	{
		throw new Error('callback have to be a function');
	}
	var docs = this.find(query);
	docs.forEach(fn);
	if(typeof end == "function")
		end();
};

if(typeof module != "undefined")
	module.exports = pMongo;
else
	window.pMongo = pMongo;
