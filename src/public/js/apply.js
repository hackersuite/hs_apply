/* global Bloodhound */
$(document).ready(function() {
  var currentForm, nextForm, previousForm; // Forms
  var left, opacity, scale; // Forms properties which we will animate
  var animating; // Flag to prevent quick multi-click glitches
  currentForm = $('div .apply-form-card').first();

  $('#applyForm').submit(function () {
    var form = $(this)[0];
    var data = new FormData(form);
  
    $("#submit-form-btn").prop('disabled', true);
  
    $.ajax({
      type: 'POST',
      url: '/apply',
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false,
      cache: false,
      data: data,
      success: function (data) {
        window.location.replace("/");
      },
      error: function (error) {
        $("#submit-form-btn").prop('disabled', false);
        $.notify({
          message: error.responseJSON.message
        }, {
          type: 'danger'
        });
      }
    })
  
  })
  
  $('.submit-form').click(function () {
    if (!checkFormStageInputs()) {
      $.notify({
        message: 'Please fill in the required fields'
      }, {
        type: 'danger'
      });
    }
  });
  
  // Requires jQuery Easing
  $('.next-form-stage').click(function () {
    if (animating) return false;
  
    // Check the age input
    var ageInput = $(currentForm).find(":input[name='applicantAge']");
    if (ageInput.length > 0) {
      if (ageInput.val() < 18) {
        $.notify({
          message: 'You must be over the age of 18 to apply'
        }, {
          type: 'danger'
        });
        return false;
      }
    }
  
    if (!checkFormStageInputs()) {
      $.notify({
        message: 'Please fill in the required fields'
      }, {
        type: 'danger'
      });
      return false;
    }
    animating = true;
  
    currentForm = $(this).closest('div .apply-form-card');
    nextForm = currentForm.next();
  
    // Activate next step on progressbar using the index of next_fs
    $('#progressbar li').eq($('div .apply-form-card').index(nextForm)).addClass('active');
  
    // Show the next partial-form
    nextForm.show();
  
    // Hide the current form with style
    currentForm.animate({
      opacity: 0
    }, {
      step: function (now, mx) {
        //as the opacity of currentForm reduces to 0 - stored in 'now'
        //1. scale currentForm down to 80%
        scale = 0.2 * (now + 4);
  
        //2. bring nextForm from the right(50%)
        left = (now * 50) + '%';
        //3. increase opacity of nextForm to 1 as it moves in
        opacity = 1 - now;
        currentForm.css({
          'transform': 'scale(' + scale + ')',
          'position': 'absolute'
        });
        nextForm.css({
          'left': left,
          'opacity': opacity
        });
      },
      duration: 800,
      complete: function () {
        currentForm.hide();
        currentForm = nextForm;
        animating = false;
      },
      // This comes from the custom easing plugin
      easing: 'easeInOutBack'
    });
  });
  
  $('.previous-form-stage').click(function () {
    if (animating) return false;
    animating = true;
  
    currentForm = $(this).closest('div .apply-form-card');
    previousForm = currentForm.prev();
  
    //de-activate current step on progressbar
    $('#progressbar li').eq($('div .apply-form-card').index(currentForm)).removeClass('active');
  
    //show the previous fieldset
    previousForm.show();
    //hide the current fieldset with style
    currentForm.animate({
      opacity: 0
    }, {
      step: function (now, mx) {
        //as the opacity of currentForm reduces to 0 - stored in 'now'
        //1. scale previousForm from 80% to 100%
        scale = 0.8 + (1 - now) * 0.2;
        //2. take currentForm to the right(50%) - from 0%
        left = ((1 - now) * 50) + '%';
        //3. increase opacity of previousForm to 1 as it moves in
        opacity = 1 - now;
        currentForm.css({
          'left': left
        });
        previousForm.css({
          'transform': 'scale(' + scale + ')',
          'opacity': opacity
        });
      },
      duration: 800,
      complete: function () {
        currentForm.hide();
        previousForm.css('position', 'relative');
        currentForm = previousForm;
        animating = false;
      },
      //this comes from the custom easing plugin
      easing: 'easeInOutBack'
    });
  });
  
  function checkFormStageInputs() {
    var isValid = true;
    $(currentForm).find(':input[required]').each(function () {
      if (!$(this)[0].checkValidity()) {
        isValid = false;
        return false;
      }
    });
    return isValid;
  }
  
  var uniqueRadioGroups = [];
  $('.form-check-input[value=Other]').each(function () {
    // Get all the inputs for the 'other' option and hide them
    var elementName = $(this).attr('name');
    $('[name=' + elementName + 'Other]').hide();
    uniqueRadioGroups.push(elementName);
  });
  
  uniqueRadioGroups.forEach((groupName) => {
    $(`input[name=${groupName}]`).on('change', function () {
      var radioInputOther = $(this).attr('name') + 'Other';
      if ($(this).attr('value') === 'Other') {
        $(`[name=${radioInputOther}]`).fadeIn();
      } else {
        $(`[name=${radioInputOther}]`).fadeOut();
      }
    });
  });
  
  $('.form-file-simple .inputFileVisible, .form-file-simple .input-group-btn').click(function() {
    $(this).parent().parent().find('.inputFileHidden').trigger('click');
    $(this).parent().parent().addClass('is-focused');
  });
  
  $('.form-file-simple .inputFileHidden').change(function() {
    var shownFileInput = $(this).siblings('.input-group').find('.inputFileVisible');
    if (this.files[0].size > 5 * (1 << 20)) {
      // Notify the user the file chosen is invalid
      $.notify({
        message: 'Maximum file size is 5 MB'
      }, {
        type: 'danger'
      });
  
      // Remove the file from the input
      $(this).val('');
    } else {
      var name = $(this).get(0).files.item(0).name;
      $(shownFileInput).val(name);
    }
    $(shownFileInput).attr('value', '');
  });
  
  $('.form-file-simple .btn').on('focus', function() {
    $(this).parent().siblings().trigger('focus');
  });
  
  $('.form-file-simple .btn').on('focusout', function() {
    $(this).parent().siblings().trigger('focusout');
  });
  
  makeTypeahead('university', 'applicantUniversity', '/js/external/universities.json');
  makeTypeahead('degree', 'applicantDegree', '/js/external/degrees.json');

  function makeTypeahead(name, field, url) {
    $(`input[name="${field}"]`).typeahead({
      classNames: {
        input: "form-control",
        menu: "dropdown-menu",
        open: "inner show",
        suggestion: "dropdown-item",
        selectable: "list-group-item-action"
      }
    },
    {
      name: name,
      source: new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: url
      })
    });
  }
})
