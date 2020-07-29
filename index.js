"use strict";

let searchURL = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=namus-missings&facet=statedisplaynameoflastcontact`;
const state = {
  records: []
};

const landingPage = {
  homeSection: `
  <section id="starting-screen">
    <h2 class="description">An app that provides you information on missing persons in your area or state. This app includes their last known location, 
    description of the person, and resources you can utilize to help find them.
    </h2>
    <form id="search-form">
      <label for="city" id="city">Enter City</label>
      <input id="search-city" class="userInput" type="text" name="search-city" placeholder="Austin" focus spellcheck="true" required>
      <label for="state" id="state">Enter State</label>
      <input id="search-state" class="userInput" type="text" name="search-state" placeholder="TX" maxlength="2" focus spellcheck="true" required>
      <button id="search">Search</button>
      </form>
      </div>
  </section> `
};

$(document).ready(function() {
  $(".js-form").append(landingPage.homeSection);
  $(".results-container").hide();
  $("#resources").hide();
});

//combines searchURL with user input
function formatQueryParams(params) {
  const queryItems = Object.keys(params).map(
    key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  );
  return queryItems.join("&");
}
// 2. fetch info from namus api

function getMissingPerson(cityQuery, stateQuery) {
  cityQuery = cityQuery
    .toLowerCase()
    .split(" ")
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");

  let params = {
    facet: "cityoflastcontact",
    "refine.cityoflastcontact": cityQuery,
    "refine.statedisplaynameoflastcontact": stateQuery.toUpperCase(),
    rows: 1000
  };

  const queryString = formatQueryParams(params);
  const url = `${searchURL}&${queryString}`;

  Promise.all([fetch(url)])
    .then(res => {
      if (res[0].ok) {
        return res[0].json();
      }
      throw new Error(res[0].statusText);
    })
    .then(resJson => {
      if (!resJson.records.length) {
        $(".js-form").hide();
        $("#js-error-screen")
          .append(
            `<p class="error-message">There are no missing persons in this area!</p>`
          )
          .show();
      } else {
        displayResults(resJson);
      }
    })
    .catch(err => {
      $("#js-error-screen").append(
        `<p class="error-message">Something went wrong: ${err.message}</p>`
      );
    });
}
//get random array of MP's
function shuffleArray(resJson) {
  for (let i = resJson.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resJson[i], resJson[j]] = [resJson[j], resJson[i]];
  }
  return resJson;
}

// 5. displayResults by emptying landing page and filling it with results
function displayResults(resJson) {
  // if there are previous results, remove them
  $("#starting-screen").hide();
  $("#js-error-screen").empty();
  // iterate through the items array

  let records = shuffleArray(resJson.records);
  let ages = {};
  let races = {};
  let genders = {};
  records.forEach(record => {
    if (genders[record.fields.gender]) {
      genders[record.fields.gender]++;
    } else {
      genders[record.fields.gender] = 1;
    }
    if (races[record.fields.raceethnicity]) {
      races[record.fields.raceethnicity]++;
    } else {
      races[record.fields.raceethnicity] = 1;
    }
    const age = Math.floor(record.fields.computedmissingmaxage / 10) * 10;
    if (ages[age]) {
      ages[age]++;
    } else {
      ages[age] = 1;
    }
  });
  createAgeChart(ages);
  createRaceChart(races);
  createPieChart(genders);

  state.records = records;
  state.page = 0;
  if (records.length > 10) {
    records = records.slice(0, 10);
  }

  renderItems(records);

  // 7. display new search button
  // 8. Show CTA message to user
  $("#new-search-section").append(
    `<h2 class="message-footer title">Want to search in a new location?</h2>
      <button id="new-search-btn">Let's Go!</button>`
  );
  //display the results section
  $(".results-txt")
    .removeClass("hidden")
    .show();
  $(".results-container")
    .removeClass("hidden")
    .show();
  $(".results").show();
  $("#new-search-section").show();
}
//function to display next page of missing persons
function displayNext() {
  $("body").on("click", ".nextButton", _e => {
    state.page++;
    let results = state.records.slice(state.page * 10, state.page * 10 + 10);
    renderItems(results);
  });
  $("body").on("click", ".previousButton", _e => {
    if (state.page === 0) {
      return;
    }
    state.page--;
    let results = state.records.slice(state.page * 10, state.page * 10 + 10);
    renderItems(results);
  });
}

function renderItems(records) {
  $("#results-list").empty();
  for (let i = 0; i < records.length; i++) {
    const {
      firstname,
      middlename,
      lastname,
      cityoflastcontact,
      statedisplaynameoflastcontact,
      dateoflastcontact,
      link,
      image,
      raceethnicity
    } = records[i].fields;

    const fullName = `${firstname} ${
      middlename ? middlename : ""
    }  ${lastname}`;
    const lastLocation = `${cityoflastcontact}, ${statedisplaynameoflastcontact}`;
    const img =
      "https://public.opendatasoft.com/explore/dataset/namus-missings/files/" +
      image.id +
      "/300/";

    $("#results-list").append(`
    <h3 class="fullName">${fullName}</h3>
    <section class="mp-container">
      <ul class="mp-info">
       <li><img src=${img} /></li>
       <li>
          <h4 class="js-title"> Race/Ethnicity: ${raceethnicity} </h4>
       </li>
       <li>
          <h4 class="js-title"> 
             Last seen: ${lastLocation} on ${dateoflastcontact}
          </h4>
       </li>
       <li>
          <h4 class="js-title"> 
              <a target="_new" href=${link}>Find out more information</a>
          </h4>
       </li>
      </ul>
   </section>
      `);

    $("#resources").show();
  }
  let nextButton = "";
  if (state.page > 0) {
    nextButton += `<div class="pagination">
    <button class="previousButton">Previous</button>
    `;
  }
  if (state.records.length > state.page * 10) {
    nextButton += `<button class="nextButton">Next Page</button>
    </div>
    `;
  }
  $("#results-list").append(`${nextButton}`);
}

//Charts

function createAgeChart(ages) {
  var ctx = document.getElementById("ages").getContext("2d");
  var agesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(ages),
      datasets: [
        {
          label: `Number of Missing Persons by Age Group`,
          data: Object.values(ages),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
            "rgba(0, 255, 0, 0.2)",
            "rgba(199, 200, 255, 0.2)",
            "rgba(255, 142, 142, 0.2)",
            "rgba(255, 0, 0, 0.2)"
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(	0, 255, 0, 1)",
            "rgba(199, 200, 255, 1)",
            "rgba(255, 142, 142, 1)",
            "rgba(	255, 0, 0, 1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      legend: {
        labels: { fontColor: "white", fontSize: 18 }
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: false
            }
          }
        ]
      }
    }
  });
}

function createRaceChart(races) {
  var ctx = document.getElementById("races").getContext("2d");
  var agesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(races),
      datasets: [
        {
          label: `Number of Missing Persons by Race`,
          data: Object.values(races),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
            "rgba(0, 255, 0, 0.3)",
            "rgba(199, 200, 255, 0.2)",
            "rgba(255, 142, 142, 0.2)",
            "rgba(255, 0, 0, 0.2)"
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(	0, 255, 0, 1)",
            "rgba(199, 200, 255, 1)",
            "rgba(255, 142, 142, 1)",
            "rgba(	255, 0, 0, 1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      legend: {
        labels: { fontColor: "white", fontSize: 18 }
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  });
}

function createPieChart(genders) {
  var ctx = document.getElementById("genders").getContext("2d");

  var config = {
    type: "pie",
    data: {
      datasets: [
        {
          data: Object.values(genders),
          backgroundColor: ["#7efdd0", "#8ce8ff"],
          label: `Number of Missing Persons by Gender`
        }
      ],
      labels: Object.keys(genders)
    },
    options: {
      responsive: true
    }
  };
  var myPieChart = new Chart(ctx, config);
}

//function to allow user to do a new search
function getnewSearch() {
  $("body").on("click", "#new-search-btn", function(e) {
    e.preventDefault();
    $(".results-container").hide();
    $(".results-txt").hide();
    $("#new-search-section")
      .hide()
      .empty();
    $("#starting-screen").show();
    $(".userInput").val("");
  });
}

// 1. Get form info on submit and store in a variable...
function watchForm() {
  $("#search-form").submit(e => {
    e.preventDefault();
    let cityName = $("#search-city").val();
    let stateName = $("#search-state").val();
    getMissingPerson(cityName, stateName);
  });
}

function findUs() {
  getnewSearch();
  watchForm();
  displayNext();
}
//start app by calling findUs function
$(findUs);
