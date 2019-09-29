function timeRemaining(seconds) {
  if (seconds < 0) seconds = 0;
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= (3600 * 24);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  return ""
      + days + (days == 1 ? " day, " : " days, ")
      + hours + "h, "
      + minutes + "m, "
      + seconds + "s";
}

if (window.hasOwnProperty("timeUntilClose")) {
  $("#secondsLeftDeadline").text(timeRemaining(timeUntilClose));
  setInterval(function () {
    timeUntilClose--;
    $("#secondsLeftDeadline").text(timeRemaining(timeUntilClose));
  }, 1000);
} else {
  $("#secondsLeftDeadline").text(timeRemaining(timeUntilOpen));
  setInterval(function () {
    timeUntilOpen--;
    $("#secondsLeftDeadline").text(timeRemaining(timeUntilOpen));
  }, 1000);
}