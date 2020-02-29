const applicationQuestionTemplate = '<p><strong>#question</strong>: #questionAnswer</p>';
const applicationContainerID = 'application-data-container';

$(document).ready(function () {
  // Get the first application to review
  getNextApplication();

  // When the review is submitted, submit the review and try to get the next one
  $('#reviewForm').submit(function () {
    var form = $(this).serialize();
    $("#submit-form-btn").prop('disabled', true);

    $.ajax({
      type: 'POST',
      url: '/review/submit',
      data: form
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

function makeQuestionString(question) {
  var questionString = applicationQuestionTemplate
    .replace(/#question/g, question.title)
    .replace(/#questionAnswer/g, question.answer);
  return questionString;
}

function showApplication(applicationData) {
  // Show the next application
  console.log(applicationData);
  var questionString = makeQuestionString(applicationData);
  $("#" + applicationContainerID).append(questionString);

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