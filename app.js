document.getElementById("xml-file").addEventListener("change", uploadXML);

function uploadXML() {
  var fileInput = document.getElementById("xml-file");
  var file = fileInput.files[0];
  var reader = new FileReader();

  reader.onload = function (e) {
    var xmlContent = e.target.result;
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    var records = xmlDoc.getElementsByTagName("Record");
    var heartRates = [];
    var hrvs = [];

    for (var i = 0; i < records.length; i++) {
      var type = records[i].getAttribute("type");
      var startDate = records[i].getAttribute("startDate");

      if (
        type === "HKQuantityTypeIdentifierHeartRate" &&
        new Date(startDate) >= new Date("2024-01-01")
      ) {
        heartRates.push({
          value: parseFloat(records[i].getAttribute("value")),
          unit: records[i].getAttribute("unit"),
          source: records[i].getAttribute("sourceName"),
          startDate: new Date(startDate),
          endDate: new Date(records[i].getAttribute("endDate")),
        });
      }

      if (
        type === "HKQuantityTypeIdentifierHeartRateVariabilitySDNN" &&
        new Date(startDate) >= new Date("2024-01-01")
      ) {
        hrvs.push({
          value: parseFloat(records[i].getAttribute("value")),
          unit: records[i].getAttribute("unit"),
          source: records[i].getAttribute("sourceName"),
          startDate: new Date(startDate),
          endDate: new Date(records[i].getAttribute("endDate")),
        });
      }
    }

    var dailyAverages = calculateDailyAverages(heartRates);
    renderHeartRateChart(dailyAverages);
    var hrvData = calculateDailyHRV(hrvs);
    renderHRVChart(hrvData);
    var averageHeartRate = calculateAverageHeartRate(dailyAverages);
    var averageHRV = calculateAverageHRV(hrvData);
    displayHeartRateStatus(averageHeartRate);
    displayHRVStatus(averageHRV);
  };

  if (file) {
    reader.readAsText(file);
  } else {
    alert("파일을 선택해주세요.");
  }
}

function calculateDailyAverages(data) {
  var groupedData = {};
  data.forEach((record) => {
    var date = record.startDate.toISOString().split("T")[0];
    if (!groupedData[date]) {
      groupedData[date] = { sum: 0, count: 0 };
    }
    groupedData[date].sum += record.value;
    groupedData[date].count += 1;
  });

  var dailyAverages = [];
  for (var date in groupedData) {
    dailyAverages.push({
      date: new Date(date),
      average: groupedData[date].sum / groupedData[date].count,
    });
  }
  return dailyAverages;
}

function calculateDailyHRV(data) {
  var groupedData = {};
  data.forEach((record) => {
    var date = record.startDate.toISOString().split("T")[0];
    if (!groupedData[date]) {
      groupedData[date] = { sum: 0, count: 0 };
    }
    groupedData[date].sum += record.value;
    groupedData[date].count += 1;
  });

  var dailyHRV = [];
  for (var date in groupedData) {
    dailyHRV.push({
      date: new Date(date),
      average: groupedData[date].sum / groupedData[date].count,
    });
  }
  return dailyHRV;
}

function calculateAverageHeartRate(data) {
  var sum = data.reduce((total, record) => total + record.average, 0);
  return sum / data.length;
}

function calculateAverageHRV(data) {
  var sum = data.reduce((total, record) => total + record.average, 0);
  return sum / data.length;
}

function renderHeartRateChart(data) {
  var ctx = document.getElementById("heartRateChart").getContext("2d");
  var labels = data.map((record) => record.date);
  var values = data.map((record) => record.average);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "심박수",
          data: values,
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 20,
          },
        },
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}

function renderHRVChart(data) {
  var ctx = document.getElementById("hrvChart").getContext("2d");
  var labels = data.map((record) => record.date);
  var values = data.map((record) => record.average);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "HRV (SDNN)",
          data: values,
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 20,
          },
        },
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}

function displayHeartRateStatus(averageHeartRate) {
  document.getElementById(
    "heartRateStatus"
  ).innerText = `평균 심박수: ${averageHeartRate.toFixed(2)} bpm`;
}

function displayHRVStatus(averageHRV) {
  var status;
  if (averageHRV < 50) {
    status = "매우 낮음";
  } else if (averageHRV >= 50 && averageHRV < 100) {
    status = "낮음";
  } else if (averageHRV >= 100 && averageHRV < 150) {
    status = "보통";
  } else {
    status = "높음";
  }
  document.getElementById(
    "hrvStatus"
  ).innerText = `평균 HRV: ${averageHRV.toFixed(2)} ms (${status})`;
}
