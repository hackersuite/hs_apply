const applicationQuestionTemplate = '<p><strong>#questionText</strong>: #questionAnswer</p><br>';
const applicationFormQuestionTemplate = `
<div class="form-group">
  <label for="#scoreName">#scoreName:</label>
  <input class="form-control" type="number" name="#scoreName" min="1" max="5" value="0">
</div>`;
const applicationContainerID = '#application-data-container';

$(document).ready(function () {
  // Get the first application to review
  getNextApplication();

  // When the review is submitted, submit the review and try to get the next one
  $('#reviewForm').submit(function () {
    // Gets all the inputs from the form that are used for the application review
    var allInputs = document.querySelectorAll("#reviewForm input[type='number']");
    var totalScore = Array.from(allInputs).reduce((runningTotal, input) => runningTotal + Number(input.value), 0);
    var averageScore = totalScore / allInputs.length;
    var applicationID = document.querySelector("#reviewForm input[name='id']").value;

    $('#submit-form-btn').prop('disabled', true);
    $.ajax({
      type: 'POST',
      url: '/review/submit',
      data: {
        'applicationID': applicationID,
        'averageScore': averageScore
      }
    }).done(function () {
      $.notify({
        message: 'Review submitted successfully'
      }, {
        type: 'success'
      });
      getNextApplication();
    }).fail(function (error) {
      $('#submit-form-btn').prop('disabled', false);
      $.notify({
        message: error.responseJSON.message
      }, {
        type: 'danger'
      });
    });
  });
});

function makeGroupQuestionString(application, group) {
  if (group.length !== 2) return;

  var reviewGroup = '';
  group[1].forEach((property) => {
    var questionString = applicationQuestionTemplate
      .replace(/#questionText/g, property)
      .replace(/#questionAnswer/g, application[property] || 'Not Provided');
    reviewGroup += (questionString);
  });
  return reviewGroup;
}

function makeGroupScoreInputString(group) {
  return applicationFormQuestionTemplate.replace(/#scoreName/g, group);
}

function showApplication(applicationData) {
  // Clear the applicatipon section
  const container = $(applicationContainerID);
  container.empty();

  // Create the section to contain the application
  applicationData['reviewFields'].forEach((group) => {
    var questionString = makeGroupQuestionString(applicationData['application'], group);
    container.append(questionString);
  });

  // Reset the rating form
  $('#reviewForm div').not("input[type='submit']").remove();
  const formContainer = $('#reviewForm');

  // Add the application ID
  $('#applicationIDInput').prop('value', applicationData['application'].id);

  // Add the score inputs to the form
  var inputScoreGroups = [];
  applicationData['reviewFields'].forEach((group) => {
    if (group[0] === 'extra') return;
    else if (group[0] == 'ungrouped') {
      group[1].forEach((scoredQuestion) => {
        var questionString = makeGroupScoreInputString(scoredQuestion);
        inputScoreGroups.push(questionString);
      });
    } else {
      var questionString = makeGroupScoreInputString(group[0]);
      inputScoreGroups.push(questionString);
    }
  });

  inputScoreGroups.reverse().forEach((input) => {
    formContainer.prepend(input);
  });
}

function showReviewComplete() {
  // Hide the review form
  $('#reviewCard').css('display', 'none');

  // Show review complete message
  $(applicationContainerID)[0].textContent = "You have no more applications to review (for now!)";
}

function getNextApplication() {
  $.ajax({
    type: 'GET',
    url: '/review/next'
  }).done(function (applicationData) {
    console.log(applicationData);
    if (applicationData['application'] == undefined) {
      showReviewComplete();
    } else {
      showApplication(applicationData);
    }
  }).fail(function (error) {
    $.notify({
      message: error.responseJSON.message
    }, {
      type: 'danger'
    });
  });
}