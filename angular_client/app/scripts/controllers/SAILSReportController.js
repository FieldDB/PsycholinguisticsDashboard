/* globals FieldDB, d3 */
'use strict';

/**
 * @ngdoc function
 * @name adminDashboardApp.controller:SAILSReportController
 * @description
 * # SAILSReportController
 * Controller of the adminDashboardApp
 */
angular.module('adminDashboardApp').controller('SAILSReportController', function($scope, $timeout) {
  $scope.loading = true;

  var stimuliDataList = {
    title: 'Stimuli',
    docsAreReorderable: false,
    showDocCheckboxes: false
  };
  if (FieldDB && FieldDB.DataList) {
    stimuliDataList = new FieldDB.DataList(stimuliDataList);
    $scope.stimuliCorpus = new FieldDB.Corpus();
    $scope.stimuliCorpus.loadOrCreateCorpusByPouchName('sails-fr-ca');
  }
  stimuliDataList.docIds = stimuliDataList.docIds || [];

  $scope.reactionTimeLineChart = {
    options: {
      chart: {
        type: 'lineChart',
        height: 450,
        margin: {
          top: 20,
          right: 20,
          bottom: 60,
          left: 65
        },
        x: function(stimulusResponse) {
          // "itemNumberInExperiment": 9,
          //       "subexperimentLabel": "Test"
          if (stimulusResponse && stimulusResponse.itemNumberInExperiment) {
            return stimulusResponse.itemNumberInExperiment;
          } else {
            return 0;
          }
        },
        y: function(stimulusResponse) {
          // console.log('getting y', stimulusResponse);
          if (stimulusResponse && stimulusResponse.response && stimulusResponse.response.reactionTimeAudioOffset) {
            return stimulusResponse.response.reactionTimeAudioOffset;
          } else {
            return 0;
          }
        },
        average: function(d) {
          // return d.mean;
          return d.mean;
        },

        color: d3.scale.category10().range(),
        transitionDuration: 300,
        useInteractiveGuideline: true,
        clipVoronoi: false,

        xAxis: {
          // axisLabel: 'X Axis',
          tickFormat: function(stimulusNumberInExperiment) {
            // if (stimulusResponse && stimulusResponse.stimulusId) {
            //   return stimulusResponse.stimulusId;
            // } else {
            //   return "NA";
            // }
            // if (stimulusNumberInExperiment && stimulusNumberInExperiment) {
            return stimulusNumberInExperiment;
            // } else {
            //   return 'NA';
            // }

            //todo DONT make it a date
            // return d3.time.format('%m/%d/%y')(new Date(d));
          },
          showMaxMin: true
          // staggerLabels: true
        },

        yAxis: {
          axisLabel: 'Reaction Time Post Audio Offset (ms)',
          tickFormat: function(reactionTimeAudioOffset) {
            // return reactionTimeAudioOffset;
            var formatted = d3.format(',f')(reactionTimeAudioOffset);
            return formatted;
            // return d3.format(',.1%')(reactionTimeAudioOffset);
          },
          showMaxMin: true,
          axisLabelDistance: 20
        }
      },
    },
    participants: []
  };

  $scope.isOutlier = function(response) {
    if (!response || !response.response) {
      console.warn('The response was missing a touch response');
      return true;
    }
    return false;
  };

  $scope.loadResponses = function(responses) {

    // var fossil = {};
    // responses = fossil.rows.map(function(doc) {
    //   return doc.value;
    // });
    $scope.reactionTimeLineChart.participants = [];
    $scope.participants = {};

    responses.map(function(response) {
      // console.log("looking at response", response);
      if (!response || !response[1] || !response[1].participant) {
        console.warn('this response contains no participant. not including it', response);
        return;
      }
      var participantId = response[1].participant;
      $scope.participants[participantId] = $scope.participants[participantId] || {
        key: participantId,
        values: [{
          itemNumberInExperiment: 0
        }, {
          itemNumberInExperiment: 1
        }, {
          itemNumberInExperiment: 2
        }, {
          itemNumberInExperiment: 3
        }, {
          itemNumberInExperiment: 4
        }, {
          itemNumberInExperiment: 5
        }, {
          itemNumberInExperiment: 6
        }, {
          itemNumberInExperiment: 7
        }, {
          itemNumberInExperiment: 8
        }, {
          itemNumberInExperiment: 9
        }, {
          itemNumberInExperiment: 10
        }, {
          itemNumberInExperiment: 11
        }, {
          itemNumberInExperiment: 12
        }, {
          itemNumberInExperiment: 13
        }, {
          itemNumberInExperiment: 14
        }, {
          itemNumberInExperiment: 15
        }, {
          itemNumberInExperiment: 16
        }, {
          itemNumberInExperiment: 17
        }, {
          itemNumberInExperiment: 18
        }, {
          itemNumberInExperiment: 19
        }, {
          itemNumberInExperiment: 20
        }]
      };
      if (!$scope.isOutlier(response[1]) && response[1].itemNumberInExperiment) {
        $scope.participants[participantId].values[response[1].itemNumberInExperiment] = response[1];
      }

      if (response[1] && response[1].stimulusId && stimuliDataList.docIds.indexOf(response[1].stimulusId) === -1) {
        stimuliDataList.docIds.push(response[1].stimulusId);
      }

    });
    var totalResponseTimeSum = 0;
    var totalResponseCount = 0;
    var sumReactionTimes = function(response) {
      if (response && response.response && response.response.reactionTimeAudioOffset) {
        participantResponseTimeSum = participantResponseTimeSum + response.response.reactionTimeAudioOffset;
      }
    };
    for (var participant in $scope.participants) {
      if (!$scope.participants.hasOwnProperty(participant)) {
        continue;
      }
      var participantResponseTimeSum = 0;
      $scope.participants[participant].values.map(sumReactionTimes);
      totalResponseTimeSum = totalResponseTimeSum + participantResponseTimeSum;
      totalResponseCount = totalResponseCount + $scope.participants[participant].values.length - 1;
      $scope.participants[participant].mean = participantResponseTimeSum / $scope.participants[participant].values.length - 1;
      $scope.reactionTimeLineChart.participants.push($scope.participants[participant]);
    }
    $scope.totalResponseCount = totalResponseCount;
    $scope.totalResponseTimeSum = totalResponseTimeSum;
    $scope.overallResponseTimeMean = totalResponseTimeSum / totalResponseCount;
    console.log('Mean overall response time ', $scope.overallResponseTimeMean);
    $scope.stimuliDataList = stimuliDataList;

    if (!$scope.$$phase) {
      $scope.$digest(); //$digest or $apply

      d3.selectAll('circle').on('click', function(item) {
        console.log('clicked', item);
        if (item && item.stimulusId) {
          console.log(item.prime.audioFile);
          $scope.stimuliDataList.docs[item.stimulusId].play();
        }
      });

    }
  };

  $timeout(function() {
    if (FieldDB && FieldDB.FieldDBObject && FieldDB.FieldDBObject.application && FieldDB.FieldDBObject.application.corpus) {
      FieldDB.FieldDBObject.application.corpus.fetchCollection('experiments', null, null, null, null, 'sails').then(function(results) {
        $scope.results = results;
        if (!$scope.$$phase) {
          $scope.$digest(); //$digest or $apply
        }
      });
      $scope.loading = false;
      FieldDB.FieldDBObject.application.corpus.fetchCollection('responses').then($scope.loadResponses);
    }
  }, 1000);
});
