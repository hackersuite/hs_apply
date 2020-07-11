const applicationFields = partialApplication && partialApplication.partialApplication;
const applyFormRoot = '#applyForm';
const saveProgressIndicator = $('#save-progress');
const saveCompleteIndicator = $('#save-done');

$(document).ready(() => {
  // Get the partial application
  if (!applicationFields) return;

  let field = null, type = null;
  for (const [key, value] of Object.entries(applicationFields)) {
    // Skip any unfilled fields
    if (value == "") continue;

    field = $(`[name="${key}"]`);
    if (field.is('select')) {
      // The element is dropdown
      field.attr('title', value);
      field.next().find('div .filter-option-inner-inner').text(value);
    } else if (field.prop('type') == 'radio') {
      // The element is radio select, field.length >= 1
      // Find the element with the value we want to select
      // Beware, the "other" input box
      let selected = $(`:input[name="${key}"][value="${value}"]`);
      selected.prop('checked', true)
    } else {
      // Short/Long text boxes
      field.val(value);
      field.parent().addClass('is-filled');
    }
  } 
})

function psubmit() {
  showSavingStatus();

  // Extract the form data, gets all answers to questions
  const form = $(applyFormRoot)[0];
  const data = new FormData(form);

  $.ajax({
    type: 'POST',
    url: '/apply/partial',
    enctype: 'multipart/form-data',
    processData: false,
    contentType: false,
    cache: false,
    data: data,
    success: function (data) {
      showDoneStatus();
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
}

function showSavingStatus() {
  $('#save-done').hide();
  $('#save-progress').show();
}

function showDoneStatus() {
  $('#save-done').show();
  $('#save-progress').hide();
}