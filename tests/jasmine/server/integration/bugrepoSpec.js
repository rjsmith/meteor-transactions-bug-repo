/* Copyright (c) RSBA Technology Ltd 2015 - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

Jasmine.onTest(function () {
  'use strict';

  describe('an inserted fooCollection', function () {
    var transaction_id, insertedFooDoc;

    beforeEach(function () {
      // Fake userId
      spyOn(Meteor,'userId').and.returnValue(true);

      tx.start('insert foo');
      fooCollection.insert({foo: 'bar'}, {tx: true});
      tx.commit();

      insertedFooDoc = fooCollection.findOne({foo: 'bar'});
      expect(insertedFooDoc.transaction_id).toBeDefined();
      transaction_id = insertedFooDoc.transaction_id; 
    });

    afterEach(function () {
      fooCollection.remove({});
      tx.Transactions.remove({});
    });

    it ('can be undone', function () {
      // SETUP

      // EXECUTE
      tx.undo(transaction_id);

      // VERIFY
      var fooCursor = fooCollection.find(
          {_id: insertedFooDoc._id});
      // Undo action should have removed record from collection
      expect(fooCursor.count()).toBe(0);
    });

    it ('can redo after an undo', function () {
      // SETUP
      tx.undo(transaction_id);
      var fooCursor = fooCollection.find(
          {_id: insertedFooDoc._id});
      // Undo action should have removed record from collection
      expect(fooCursor.count()).toBe(0);

      // EXECUTE
      // ** The redo will fail because the tx.checkPermission will return false
      tx.redo(transaction_id);

      // VERIFY
      var recoveredFooDoc = fooCollection.findOne({foo: 'bar'});
      expect(recoveredFooDoc).not.toBeNull();
      console.log('recoveredFooDoc:' + JSON.stringify(recoveredFooDoc));
      expect(recoveredFooDoc.transaction_id).toEqual(transaction_id);
    });
 

  })
})