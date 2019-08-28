var currentForm, nextForm, previousForm; // Forms
var left, opacity, scale; // Forms properties which we will animate
var animating; // Flag to prevent quick multi-click glitches

// Requires jQuery Easing

$(".next-form-stage").click(function () {
  if (animating) return false;
  animating = true;

  currentForm = $(this).closest("div .apply-form-card");
  nextForm = currentForm.next();

  // Activate next step on progressbar using the index of next_fs
  $("#progressbar li").eq($("div .apply-form-card").index(nextForm)).addClass("active");

  // Show the next partial-form
  nextForm.show();

  // Hide the current form with style
  currentForm.animate({
    opacity: 0
  }, {
    step: function (now, mx) {
      //as the opacity of currentForm reduces to 0 - stored in "now"
      //1. scale currentForm down to 80%
      scale = 0.2 * (now + 4);

      //2. bring nextForm from the right(50%)
      left = (now * 50) + "%";
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
      animating = false;
    },
    // This comes from the custom easing plugin
    easing: 'easeInOutBack'
  });
});

$(".previous-form-stage").click(function () {
  if (animating) return false;
  animating = true;

  currentForm = $(this).closest("div .apply-form-card");
  previousForm = currentForm.prev();

  //de-activate current step on progressbar
  $("#progressbar li").eq($("div .apply-form-card").index(currentForm)).removeClass("active");

  //show the previous fieldset
  previousForm.show();
  //hide the current fieldset with style
  currentForm.animate({
    opacity: 0
  }, {
    step: function (now, mx) {
      //as the opacity of currentForm reduces to 0 - stored in "now"
      //1. scale previousForm from 80% to 100%
      scale = 0.8 + (1 - now) * 0.2;
      //2. take currentForm to the right(50%) - from 0%
      left = ((1 - now) * 50) + "%";
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
      previousForm.css("position", "relative");
      animating = false;
    },
    //this comes from the custom easing plugin
    easing: 'easeInOutBack'
  });
});

function checkFormStageInputs() {
  var isValid = true;
  $('input').filter('[required]').each(function () {
    if ($(this).val() === '') {
      $('#confirm').prop('disabled', true)
      isValid = false;
      return false;
    }
  });
  if (isValid) {
    $('#confirm').prop('disabled', false)
  }
  return isValid;
}

$(".next-form-stage").click(function () {
  // Verify that the data has been filled in for the required fields

})