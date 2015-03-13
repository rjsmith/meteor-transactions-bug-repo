

fooCollection = new Mongo.Collection('fooCollection');


tx.checkPermission =  function(action, collection, doc, modifier) {
  var check,
      userId = Meteor.userId();
  console.log('checkPermission '+action+' for collection:' + collection._name+' and doc:'+JSON.stringify(doc));
  return doc !== undefined;
};



