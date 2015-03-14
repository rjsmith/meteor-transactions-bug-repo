/* Copyright (c) RSBA Technology Ltd 2015 - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/**
 * Tests for support of Mongo $addToSet + $each modifier in meteor-transactions
 */
Jasmine.onTest(function() {
  describe('$addToSet', function () {
    var transaction_id, insertedFooDoc;

    beforeEach(function () {
      // Fake userId
      spyOn(Meteor,'userId').and.returnValue(true);

      tx.start('insert foo');
      fooCollection.insert(
        {foo: [{bar: 1}, {bar: 2}, {bar: 3}]}, {tx: true});
      tx.commit();

      insertedFooDoc = fooCollection.findOne({foo: {$exists: true}});
      expect(insertedFooDoc.transaction_id).toBeDefined();
      transaction_id = insertedFooDoc.transaction_id; 
    });

    afterEach(function () {
      fooCollection.remove({});
      tx.Transactions.remove({});
    });
   
    it ('can be updated with $addToSet modifier', function () {
      // SETUP
      // EXECUTE
      tx.start('update foo');
      fooCollection.update(
        {_id: insertedFooDoc._id},
        {
          $addToSet: {
            foo: {
              bar: 4
            }
          }
        },
        {
          tx: true
        });
      tx.commit();
      
      // VERIFY
      var fooCursor = fooCollection.find(
      {foo: {$elemMatch: {bar: 4}}});
      expect(fooCursor.count()).toBe(1);
      var recoveredFoo = fooCursor.fetch()[0];

      // Check transaction
      var txDoc = tx.Transactions.findOne({_id: recoveredFoo.transaction_id});
      console.log(JSON.stringify(txDoc));
      expect(txDoc.items.updated[0].inverse).toEqual({"command":"$pull","data":[{"key":"foo","value":{"bar":4}}]});
      
    })

    it ('can be updated with $addToSet modifier and then undone and redone', function () {
      // SETUP
      tx.start('update foo');
      fooCollection.update(
        {_id: insertedFooDoc._id},
        {
          $addToSet: {
            foo: {
              bar: 4
            }
          }
        },
        {
          tx: true
        });
      tx.commit();

      // EXECUTE
      tx.undo();
      // VERIFY
      // 
      var fooCursor = fooCollection.find(
      {foo: {bar: 4}});
      expect(fooCursor.count()).toBe(0);

      // EXECUTE
      tx.redo();
      // VERIFY
      // 
      var fooCursor = fooCollection.find(
        {foo: {bar: 4}});
      expect(fooCursor.count()).toBe(1);
      
    })


    it ('can be updated with $addToSet modifier using $each', function () {
      // SETUP
      var newBars = [{bar: 4}, {bar: 5}];

      // EXECUTE
      tx.start('update foo');
      fooCollection.update(
        {_id: insertedFooDoc._id},
        {
          $addToSet: {
            foo: {$each: newBars}
          }
        },
        {tx: true});
      tx.commit();
      
      // VERIFY
      var fooCursor = fooCollection.find(
        {foo: {bar: 4}});
      expect(fooCursor.count()).toBe(1);      
      var recoveredFoo = fooCursor.fetch()[0];

      // Check transaction
      var txDoc = tx.Transactions.findOne({_id: recoveredFoo.transaction_id});
      console.log("txDoc:" + JSON.stringify(txDoc));


    })
  })
   
})