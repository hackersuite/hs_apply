function timeRemaining(seconds) {
  if (seconds < 0) seconds = 0;
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  return "" + days + (days == 1 ? " day, " : " days, ") + hours + "h, " + minutes + "m, " + seconds + "s";
}

if (Object.prototype.hasOwnProperty.call(window, "timeUntilClose")) {
  $("#secondsLeftDeadline").text(timeRemaining(window.timeUntilClose));
  setInterval(function() {
    window.timeUntilClose--;
    $("#secondsLeftDeadline").text(timeRemaining(window.timeUntilClose));
  }, 1000);
} else {
  $("#secondsLeftDeadline").text(timeRemaining(window.timeUntilOpen));
  setInterval(function() {
    window.timeUntilOpen--;
    $("#secondsLeftDeadline").text(timeRemaining(window.timeUntilOpen));
  }, 1000);
}
