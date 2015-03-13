# Repo to reproduce a bug in the babrahams:transactions package

## Instructions to reproduce:

```console
JASMINE_CLIENT_UNIT=0 JASMINE_CLIENT_INTEGRATION=0 JASMINE_SERVER_UNIT=0  JASMINE_SERVER_INTEGRATION=1 meteor
```

Then navigate to http://localhost:3000 in your browser and open the Velocity HTML Reporter page to see the results.

The `an inserted fooCollection can redo after an undo` test fails

## The Problem

I have traced the problem to this line in the `_checkTransactionFields` method:

https://github.com/JackAdams/meteor-transactions/blob/master/lib/transactions_common.js#L684

When this method is being invoked for a redo of an previously undone 'inserted' action, the collection itself no longer contains the document.  This causes my overridden tx.checkPermission function to fail , because its `doc` parameter is undefined.  Which, in turn, causes the `tx.redo()` to fail.


## Possible Solution

Instead, I think this code should retrieve the `value.newDoc` object will holds a copy of the previously undone inserted document.  This code snippet seems to fix the problem:

```javascript
          var doc;
          if (key === 'removed' && value.doc && value.doc.transaction_id === txid) {
             doc = value.doc;
          } else if (key === 'inserted' && value.newDoc && value.newDoc.transaction_id === txid) {
            // Handle redo of an insert (after a previous undo)
            doc = value.newDoc;
          } else {
            doc = self.collectionIndex[collection].findOne({_id:value._id});
          }
```

If this code snippet replaces the `doc = (key === 'removed' && value.doc && value.doc.transaction_id === txid) ? value.doc : self.collectionIndex[collection].findOne({_id:value._id});` linem, the test passes.  It also seems to work in my actual application in which I first found the bug.

## In addition

It took me a long time to figure out that the `tx.redo()` was actually failing.
The reason is that, if `tx.undo` or `tx.redo` are called on the server, the return value from the Meteor method call is swallowed up silently.  Would it be possible to remove the `Meteor.isClient` check in the code sections below, so the `onTransactionExpired` callback is invoked?

```javascript
  Meteor.call("_meteorTransactionsRedo", txid, function(err,res) {
    if (Meteor.isClient && res) {
      self.onTransactionExpired.call();  
    }
  });
```



