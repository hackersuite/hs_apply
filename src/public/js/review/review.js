const applicationQuestionTemplate = '<p><strong>#questionText</strong>: #questionAnswer</p><br>';
const applicationContainerID = 'application-data-container';

$(document).ready(function () {
  // Get the first application to review
  getNextApplication();

  // When the review is submitted, submit the review and try to get the next one
  $('#reviewForm').submit(function () {
    // Gets all the inputs from the form that are used for the application review
    var allInputs = document.querySelectorAll("#reviewForm input[type='number']");
    var totalScore = Array.from(allInputs).reduce((runningTotal, input) => runningTotal + Number(input.value), 0);
    var averageScore = totalScore / allInputs.length;

    $("#submit-form-btn").prop('disabled', true);
    $.ajax({
      type: 'POST',
      url: '/review/submit',
      data: { "averageScore": averageScore }
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
      .replace(/#questionAnswer/g, application[property] || "Not Provided");
    reviewGroup += (questionString);
  });
  return reviewGroup;
}

function makeGroupScoreString(group) {
  // var questionString = applicationQuestionTemplate
  //   .replace(/#question/g, question.title)
  //   .replace(/#questionAnswer/g, question.answer);
  // return questionString;
}

function showApplication(applicationData) {
  // Show the next application
  console.log(applicationData);

  // Clear the applicatipon section
  const container = $("#" + applicationContainerID);
  container.empty();

  // Create the section to contain the application
  applicationData['reviewFields'].forEach((group) => {
    var questionString = makeGroupQuestionString(applicationData['application'], group);
    container.append(questionString);

    var scoreString = makeGroupScoreString(group);
  });

  // Reset the rating form
}

function getNextApplication() {
  $.ajax({
    type: 'GET',
    url: '/review/next'
  }).done(function (applicationData) {
      showApplication(applicationData);
  }).fail(function (error) {
    $.notify({
      message: error.responseJSON.message
    }, {
      type: 'danger'
    });
  });
}