const applicationQuestionTemplate = '<p><strong>#question</strong>: #questionAnswer</p>';
const applicationContainerID = 'application-data-container';

$(document).ready(function () {
  // Get the first application to review
  getNextApplication();

  // When the review is submitted, submit the review and try to get the next one
  $('#reviewForm').submit(function () {
    var form = $(this)[0];
    var data = new FormData(form);
    console.log(data);
    $("#submit-form-btn").prop('disabled', true);

    $.ajax({
      type: 'POST',
      url: '/review/submit',
      cache: false,
      data: data,
      success: function () {
        $.notify({
          message: 'Review submitted successfully'
        }, {
          type: 'success'
        });
        getNextApplication();
      },
      error: function (error) {
        $('#submit-form-btn').prop('disabled', false);
        $.notify({
          message: error.responseJSON.message
        }, {
          type: 'danger'
        });
      }
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
    url: '/review/next',
    success: function (applicationData) {
      showApplication(applicationData);
    },
    error: function (error) {
      $.notify({
        message: error.responseJSON.message
      }, {
        type: 'danger'
      });
    }
  });
}