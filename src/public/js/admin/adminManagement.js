/* global allApplications */
var applicationsContainerID = "#applications-container";

function renderApplicationRow(container, applicant) {
  var applicantRow = `
  <tr>
    <td class="text-center">${applicant.name}</td>
    <td class="text-center">${applicant.email}</td>
    <td class="text-center">${applicant.university}</td>
    <td class="text-center">${applicant.yearOfStudy}</td>
    <td class="text-center">${applicant.applicationStatus}</td>
    <td class="td-actions text-center">
      <a class="btn btn-primary" role="button" rel="tooltip" href="manage/${applicant.id}" target="_blank">
        <i class="material-icons">person</i>
      </a>
      <button id="${applicant.id}-btn" class="btn btn-info" type="button" onclick="invite('${applicant.id}')">
        <i class="material-icons">email</i>
      </button>
      <a class="btn btn-success" role="button" rel="tooltip">
        <i class="material-icons">person_add</i>
      </a>
    </td>
  </tr>
  `;
  container.append(applicantRow);
}

function renderRows(term) {
  const searchTerm = term.toLowerCase();
  const container = $(applicationsContainerID);
  container.empty();

  allApplications.forEach((applicant) => {
    if (applicant.name.toLowerCase().startsWith(searchTerm)) {
      renderApplicationRow(container, applicant);
    }
  });
}

function invite(id) {
  $.ajax({
    type: 'PUT',
    url: `/invite/${id}/send`,
    success: function (data) {
      $("#" + id + "-btn").prop('disabled', true);
      $.notify({
        message: 'Sent invite successfully'
      }, {
        type: 'success'
      });
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
}

function batchInvite() {
  const users = $('#textAreaInviteIds').val();
  const emailType = $("#emailTypeDropdown").val();
  $.ajax({
    type: 'POST',
    url: `/invite/batchSend`,
    data: { users, emailType },
    success: function (data) {
      $.notify({
        message: 'Sent all invites successfully'
      }, {
        type: 'success'
      });
    },
    error: function (error) {
      $.notify({
        message: error.responseJSON.message
      }, {
        type: 'danger'
      });
    }
  })
}

$(document).ready(function () {
  $('#filterNameInput').on('input', (event) => {
    var elem = $(event.target);
    renderRows(elem.val());
  });
});