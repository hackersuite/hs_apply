const applicationFields = partialApplication && partialApplication.partialApplication;
const applyFormRoot = '#applyForm';
const saveProgressIndicator = $('#save-progress');
const saveCompleteIndicator = $('#save-done');

const saveIntervalMilliseconds = 10 * 1000;
let lastSaveTime = Date.now();

function fillPartialApplication() {
  // Get the partial application
  if (!applicationFields) return;

  for (const [key, value] of Object.entries(applicationFields)) {
    // Skip any unfilled fields, or a <fieldname>Other which is instead used when <fieldname> is processed
    if (value == "" || key.match(/Other$/i) !== null) continue;

    let field = $(`${applyFormRoot} [name="${key}"]`);
    let questionType = field.attr('data-hs-type');
    if (questionType === 'dropdown') {
      // The element is dropdown
      field.attr('title', value);
      field.val(value);
      field.next().find('div .filter-option-inner-inner').text(value);
    } else if (questionType === 'radio') {
      // The element is radio select, field.length >= 1
      // Find the element with the value we want to select
      // Beware, the "other" input box, we need to select the radio button AND fill the input box
      let selected = $(`:input[name="${key}"][value="${value}"]`);
      if (value === 'Other') {
        let inputBox = $(`:input[name="${key}Other"]`);
        inputBox.val(applicationFields[`${key}Other`]).show();
      }
      selected.prop('checked', true);
    } else if (field.parent().hasClass('twitter-typeahead')) {
      let typeaheadInput = field.parent().parent();
      typeaheadInput.addClass('is-filled');
      field.val(value);
    } else {
      // Short/Long/Number text boxes
      field.val(value);
      field.parent().addClass('is-filled');
    }
  }

  // In order to save the application as they fill it in, we attach listener events to the input fields
  attachFocusOutEvents();
}

function attachFocusOutEvents() {
  for (const [key, value] of Object.entries(applicationFields)) {
    $(`${applyFormRoot} [name="${key}"]`).bind('focusout', didFillField);
  }
}

function didFillField() {
  // Check if we should save the form, we only save every N seconds to prevent spamming of save events
  let shouldSave = (Date.now() - lastSaveTime) > saveIntervalMilliseconds;
  console.log(`Is saving ${shouldSave}`);
  if (shouldSave) {
    lastSaveTime = Date.now();
    partialApplicationSubmit();
  }
}

function partialApplicationSubmit() {
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
      //$('#submit-form-btn').prop('disabled', false);
      // $.notify({
      //   message: error.responseJSON.message
      // }, {
      //   type: 'danger'
      // });
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