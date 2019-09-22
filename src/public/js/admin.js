$(document).ready(function () {
  // Create the chart data for applications over time
  applicantsLineChartData = [];
  if (applicationCreatedAtTimes) {
    applicationCreatedAtTimes.forEach((applicant, count) => {
      applicantsLineChartData.push({x: new Date(applicant.createdAt), y: count + 1});
    });
  }
  // Chart the chart using Chartist
  var applicantsLineChart = new Chartist.Line('#applicants-over-time-chart', {
    series: [{
      name: 'applicants',
      data: applicantsLineChartData
    }]
  }, {
    axisX: {
      type: Chartist.FixedScaleAxis,
      divisor: 5,
      labelInterpolationFnc: function(value) {
        return moment(value).format('MMM D');
      }
    },
    showPoint: false,
    chartPadding: {
      top: 20,
      bottom: 0
    },
  });
  // Animate the chart on load
  lineChartAnimation(applicantsLineChart);

  function lineChartAnimation(e) {
    e.on("draw", function(e) {
      "line" === e.type || "area" === e.type ? e.element.animate({
        d: {
          begin: 600,
          dur: 700,
          from: e.path.clone().scale(1, 0).translate(0, e.chartRect.height()).stringify(),
          to: e.path.clone().stringify(),
          easing: Chartist.Svg.Easing.easeOutQuint
        }
      }) : "point" === e.type && (seq++,
      e.element.animate({
        opacity: {
          begin: seq * delays,
          dur: durations,
          from: 0,
          to: 1,
          easing: "ease"
        }
      }))
    }),
    seq = 0
  }
  function barChartAnimation(event) {
    event.on("draw", function(e) {
      "bar" === e.type && (seq2++,
      e.element.animate({
        opacity: {
          begin: seq2 * delays2,
          dur: durations2,
          from: 0,
          to: 1,
          easing: "ease"
        }
      }))
    }),
    seq2 = 0
  }
});