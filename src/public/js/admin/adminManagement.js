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
      <button id="${applicant.id}-btn-checkin" class="btn btn-success" type="button" onclick="checkin('${applicant.id}')">
        <i class="material-icons">person_add</i>
      </button>
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

function checkin(id) {
  $.ajax({
    type: 'PUT',
    url: `/apply/${id}/checkin`,
    success: function (data) {
      $.notify({
        message: 'Hacker checked in'
      }, {
        type: 'success'
      });
    },
    error: function (error) {
      $.notify({
        message: error.responseJSON.message || "Hacker could not be checked in"
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



// function exportCSV() {
//   let csvContent = "data:text/csv;charset=utf-8,"; 

//   allApplications.forEach((applicant) => {
//     let applicantInfo = "\"" + applicant.name + "\"" + ", " + "\"" +  applicant.email + "\"" + ", " + "\"" + applicant.university + "\"" + ", " + "\"" + applicant.degree + "\"" +  ", " + "\"" +  applicant.yearOfStudy + "\"" + ", " + "\"" + applicant.workArea + "\"" + ", " + "\"" + applicant.skills + "\"" + ", " + "\"" + applicant.hackathonCount + "\"" + ", " + "\"" + applicant.whyChooseHacker + "\"" + ", " + "\"" + applicant.pastProjects + "\"" + "\r\n";
//     csvContent += applicantInfo; 
//   });

//   var encodedUri = encodeURI(csvContent);
//   window.open(encodedUri);
// }



$(document).ready(function () {
  $('#filterNameInput').on('input', (event) => {
    var elem = $(event.target);
    renderRows(elem.val());
  });
});