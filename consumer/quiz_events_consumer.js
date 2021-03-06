/***
Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
***/

'use strict'


var fs = require('fs')
var path = require('path')
var kcl = require('aws-kcl')
var Pusher = require('pusher')

var pusher = new Pusher({
  appId: '179269',
  key: 'a8f417a3a249b82d9f90',
  secret: 'a9926f7c77ca2133de1d',
  encrypted: true
})
pusher.port = 443

function recordProcessor() {
  var shardId

  return {

    initialize: function(initializeInput, completeCallback) {
      shardId = initializeInput.shardId
      pusher.trigger('test_channel', 'my_event', {
        "message": "Initializing consumer",
      })
      completeCallback()
    },

    processRecords: function(processRecordsInput, completeCallback) {
      if (!processRecordsInput || !processRecordsInput.records) {
        completeCallback()
        return
      }
      var records = processRecordsInput.records
      var record, data, sequenceNumber, partitionKey
      for (var i = 0; i < records.length; ++i) {
        record = records[i]
        //TODO Do somthing better with this data. Base 64 is bad!
        data = new Buffer(record.data, 'base64').toString()
        sequenceNumber = record.sequenceNumber
        partitionKey = record.partitionKey

        pusher.trigger('test_channel', 'my_event', {
          "key": partitionKey,
          "sequence_number": sequence_number,
          "data": data
        })
      }
      if (!sequenceNumber) {
        completeCallback()
        return
      }
      // If checkpointing, completeCallback should only be called once checkpoint is complete.
      processRecordsInput.checkpointer.checkpoint(sequenceNumber, function(err, sequenceNumber) {
        completeCallback()
      })
    },

    shutdown: function(shutdownInput, completeCallback) {
      pusher.trigger('test_channel', 'my_event', {
        "message": "Terminating consumer",
      })
      // Checkpoint should only be performed when shutdown reason is TERMINATE.
      if (shutdownInput.reason !== 'TERMINATE') {
        completeCallback()
        return
      }
      // Whenever checkpointing, completeCallback should only be invoked once checkpoint is complete.
      shutdownInput.checkpointer.checkpoint(function(err) {
        completeCallback()
      })
    }
  }
}

kcl(recordProcessor()).run()
