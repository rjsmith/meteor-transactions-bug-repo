/* Copyright (c) RSBA Technology Ltd 2015 - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

Jasmine.onTest(function() {
  describe('$pull', function () {
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
   
    it ('can be updated with $pull modifier', function () {
      // SETUP
      // EXECUTE
      tx.start('update foo');
      fooCollection.update(
        {_id: insertedFooDoc._id},
        {
          $pull: {
            foo: {
              bar: 1
            }
          }
        },
        {
          tx: true
        });
      tx.commit();
      
      // VERIFY
      var recoveredFoo = fooCollection.findOne(
      {_id: insertedFooDoc._id});
      expect(_.contains(recoveredFoo.foo, {bar: 1})).toBe(false);
      // Check transaction
      var txDoc = tx.Transactions.findOne({_id: recoveredFoo.transaction_id});
      console.log(JSON.stringify(txDoc));
      expect(txDoc.items.updated[0].inverse).toEqual(
        {"command":"$addToSet","data":[{"key":"foo","value":{"bar":1}}]}
        );
      
    })

    it ('can be updated with $pull modifier then undone and redone', function () {
      // SETUP
      tx.start('update foo');
      fooCollection.update(
        {_id: insertedFooDoc._id},
        {
          $pull: {
            foo: {
              bar: 1
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
      var fooCursor = fooCollection.find(
      {foo: {bar: 1}});
      expect(fooCursor.count()).toBe(1);

      // EXECUTE
      tx.redo();

      // VERIFY 
      fooCursor = fooCollection.find(
        {foo: {bar: 1}});
      expect(fooCursor.count()).toBe(0);
      
    })
  })
});
