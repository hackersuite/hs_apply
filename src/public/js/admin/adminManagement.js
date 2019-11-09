/* global allApplications */
var applicationsContainerID = "#applications-container";

function renderApplicationRow(container, applicant) {
  var applicantRow = `
  <tr>
    <td class="text-center">${applicant.name}</td>
    <td class="text-center">${applicant.email}</td>
    <td class="text-center">${applicant.university}</td>
    <td class="text-center">${applicant.yearOfStudy}</td>
    <td class="text-center">
      <i class="material-icons applicant-status check-valid">check_circle</i>
      <i class="material-icons applicant-status check-valid">check_circle</i>
      <i class="material-icons applicant-status check-invalid">error</i>
      <i class="material-icons applicant-status check-invalid">error</i>
    </td>
    <td class="td-actions text-center">
      <a class="btn btn-primary" role="button" rel="tooltip" href="manage/${applicant.id}" target="_blank">
        <i class="material-icons">person</i>
      </a>
      <a class="btn btn-info" role="button" rel="tooltip" href="invite/${applicant.id}/send">
        <i class="material-icons">email</i>
      </a>
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

$(document).ready(function () {
  $('#filterNameInput').on('input', (event) => {
    var elem = $(event.target);
    renderRows(elem.val());
  });
});

var current_page = 1;
var records_per_page = 20;

function prevPage()
{
    if (current_page > 1) {
        current_page--;
        changePage(current_page);
    }
}

function nextPage()
{
    if (current_page < numPages()) {
        current_page++;
        changePage(current_page);
    }
}

function changePage(page)
{
    var btn_next = document.getElementById("btn_next");
    var btn_prev = document.getElementById("btn_prev");
    var page_span = document.getElementById("page");

    // Validate page
    if (page < 1) page = 1;
    if (page > numPages()) page = numPages();

    const container = $(applicationsContainerID);
    container.empty();

    var applicantsOnPage = [];
    for (var i = (page-1) * records_per_page; i < (page * records_per_page); i++) {
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
}

function numPages()
{
    return Math.ceil(allApplications.length / records_per_page);
}

window.onload = function() {
    changePage(1);
};

