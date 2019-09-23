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
    "slice" === e.type && (seq2++,
    e.element.animate({
      opacity: {
        begin: seq2 * 200,
        dur: 400,
        from: 0,
        to: 1,
        easing: "ease"
      }
    }))
  }, seq2 = 0);
}

$(document).ready(function () {
  // Create the chart data for applications over time
  applicantsLineChartData = [];
  if (applicationCreatedAtTimes) {
    applicationCreatedAtTimes.forEach((createdAt, count) => {
      applicantsLineChartData.push({x: new Date(createdAt), y: count + 1});
    });
  }

  // Create the chart using Chartist
  var data = { series: [{
      name: 'applicants',
      data: applicantsLineChartData
    }]
  };
  var options = {
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
  }
  var applicantsLineChart = new Chartist.Line('#applicants-over-time-chart', data, options);
  // Animate the chart on load
  lineChartAnimation(applicantsLineChart);


  // Chart the pie chart using Chartist
  data = {
    labels: Object.keys(applicationGenderStats),
    series: Object.values(applicationGenderStats)
  };
  options = {
    labelInterpolationFnc: function(value) {
      return `${value} ` + Math.round(applicationGenderStats[value] / data.series.reduce((a, b) => a + b) * 100) + '%';
    }
  };
  var responsiveOptions = [
    ['screen and (max-width: 768px)', {
      labelOffset: 20
    }],
    ['screen and (min-width: 768) and (max-width: 992px)', {
      labelOffset: 55,
      chartPadding: 20
    }],
    ['screen and (min-width: 992)', {
      labelOffset: 55,
      chartPadding: 20
    }]
  ];
  var applicantsGenderPieChart = new Chartist.Pie('#applicants-gender', data, options, responsiveOptions);
  barChartAnimation(applicantsGenderPieChart);
});