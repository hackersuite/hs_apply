function confirmPlace() {
  $.ajax({
    type: 'PUT',
    url: `/apply/confirm_place`,
    success: function (data) {
      window.location.hash = '#success';
      window.location.reload();
    },
    error: function (error) {
      $.notify({
        message: error.responseJSON.message || "Could not confirm your place!"
      }, {
        type: 'danger'
      });
    }
  })
}

$(document).ready(function () {
  if (window.location.hash === '#success') {
    $.notify({
      message: 'Place confirmed!'
    }, {
      type: 'success'
    });
  }
});
