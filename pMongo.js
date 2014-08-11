function uuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid)}

var pMongo = function()
{
	this.data_store = []; // simple array
	this.do_not_add_if_exists = false;
}

pMongo.prototype.count = function()
{
	return this.data_store.length;
};

pMongo.prototype.add = function(doc)
{
	if(typeof doc._id === undefined || typeof doc._id != "string")
	{
		do
			doc._id = uuid();
		while(this.findOne(doc._id) !== null);
	}

	if(this.do_not_add_if_exists && this.findOne(doc._id) !== null)
		return null;

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

pMongo.prototype.getByIndex = function(index)
{
	if(typeof index == "undefined") return null;

	if(index > this.count())
		return null;

	return this.data_store[index];
};

pMongo.prototype.docIsMatching = function(doc, conds, limit_, skip_)
{
	for(var c in conds)
	{
		var cond = conds[c];

		switch(typeof cond)
		{
			case "object":
			{
				var gt, gte, lt, lte;

				for(k in cond)
				{
					switch(k)
					{
						case "$gt": // greater than
						case "$gte": // greater than or equal
						case "$lt": // less than or equal
						case "$lte": // less than or equal
						{
							if(typeof cond[k] != "number")
								throw "$gt, $gte, $lt and $lte queries require number";
							if(typeof doc[c] != "number")
								return false;

							if( (k == "$gt" && doc[c] <= cond[k]) || (k == "$gte" && doc[c] < cond[k])
							  || (k == "$lt" && doc[c] >= cond[k]) || (k == "$lte" && doc[c] > cond[k]))

								return false;
						} break;
						case "$in":
						case "$nin":
						{
							if(typeof doc[c] != "object")
								return false;
							if (!(doc[c] instanceof Array))
								return false;

							if((k == "$in" && doc[c].indexOf(cond[k]) < 0)
						    || (k == "$nin" && doc[c].indexOf(cond[k]) >= 0))
								return false;
						} break;
					}
				}

			} break;
			default:
				if(doc[c] != cond)
					return false;
		}
	}

	return true;
}


pMongo.prototype.find = function(conds, limit_, skip_)
{
	if(!conds) return null;

	var count = this.count();
	var limit = count
	  , skip = 0;

	if(skip_) skip = skip_;
	if(limit_)	limit = limit_;

	var results = [];

	for(var i = 0; i < count; i++)
	{
		var doc = this.getByIndex(i)

		var is_matching = this.docIsMatching(doc, conds, limit, skip);

		if(is_matching === true)
			results.push(doc);
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
}


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
