/* global allApplications */
var applicationsContainerID = "#applications-container";

function renderApplicationRow(container, applicant) {
  const na = "Not Provided";
  const id = applicant && applicant["id"];

  var applicantRow = `
  <tr>
    <td class="text-center">${applicant && applicant["name"] || na}</td>
    <td class="text-center">${applicant && applicant["email"] || na}</td>
    <td class="text-center">${applicant && applicant["university"] || na}</td>
    <td class="text-center">${applicant && applicant["yearOfStudy"] || na}</td>
    <td class="text-center">${applicant && applicant["applicationStatus"] || na}</td>
    <td class="td-actions text-center">
      <a class="btn btn-primary" role="button" rel="tooltip" href="manage/${id}" target="_blank">
        <i class="material-icons">person</i>
      </a>
      <button id="${id}-btn" class="btn btn-info" type="button" onclick="invite('${id}')">
        <i class="material-icons">email</i>
      </button>
      <button id="${id}-btn-checkin" class="btn btn-success" type="button" onclick="checkin('${id}')">
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


//Khesim
function exportCSV() {
  let csvContent = "data:text/csv;charset=utf-8,"; 

  allApplications.forEach((applicant) => {
    let applicantInfo = "\"" + applicant.name + "\"" + ", " + "\"" +  applicant.email + "\"" + ", " + "\"" + applicant.university + "\"" + ", " + "\"" + applicant.degree + "\"" +  ", " + "\"" +  applicant.yearOfStudy + "\"" + ", " + "\"" + applicant.workArea + "\"" + ", " + "\"" + applicant.skills + "\"" + ", " + "\"" + applicant.hackathonCount + "\"" + ", " + "\"" + applicant.whyChooseHacker + "\"" + ", " + "\"" + applicant.pastProjects + "\"" + "\r\n";
    csvContent += applicantInfo; 
  });

  var encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}
//Khesim 


$(document).ready(function () {
  $('#filterNameInput').on('input', (event) => {
    var elem = $(event.target);
    renderRows(elem.val());
  });
});

var current_page = 1;
var records_per_page = 20;

function prevPage() {
  if (current_page > 1) {
    current_page--;
    changePage(current_page);
  }
}

function nextPage() {
  if (current_page < numPages()) {
    current_page++;
    changePage(current_page);
  }
}

function changePage(page) {
  var btn_next = document.getElementById("btn_next");
  var btn_prev = document.getElementById("btn_prev");
  var page_span = document.getElementById("page");

  // Validate page
  if (page < 1) page = 1;
  if (page > numPages()) page = numPages();

  const container = $(applicationsContainerID);
  container.empty();

  var applicantsOnPage = [];
  for (var i = (page-1) * records_per_page; i < Math.min(allApplications.length, page * records_per_page); i++) {
    renderApplicationRow(container, allApplications[i]);
  }

  if (page == 1) {
    btn_prev.style.visibility = "hidden";
  } else {
    btn_prev.style.visibility = "visible";
  }

  if (page == numPages()) {
    btn_next.style.visibility = "hidden";
  } else {
    btn_next.style.visibility = "visible";
  }

  page_span.textContent = page;
}

function numPages() {
  return Math.ceil(allApplications.length / records_per_page);
}

window.onload = function() {
  changePage(1);
};

