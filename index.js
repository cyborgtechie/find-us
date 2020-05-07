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
let cityQuery = "";

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
        $("#js-error-message").text(
          `There are no missing persons in this area!`
        );
      } else {
        displayResults(resJson);
      }
    })
    .catch(err => {
      $("#js-error-message").text(`Something went wrong: ${err.message}`);
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
  $("#js-error-message").empty();
  // iterate through the items array

  let records = shuffleArray(resJson.records);
  state.records = records;
  state.page = 0;
  if (records.length > 10) {
    records = records.slice(0, 10);
  }

  renderItems(records);

  // 7. display new search button
  // 8. Show CTA message to user
  $("#new-search-msg").html(
    `<h2 class="message-footer">Want to search in a new location?</h2>
      <button id="new-search-btn">Try again</button>`
  );
  //display the results section
  $(".results-txt")
    .removeClass("hidden")
    .show();
  $(".results-container")
    .removeClass("hidden")
    .show();
  $(".results").show();
  $("#new-search-msg").show();
}
//function to display next page of missing persons
function displayNext() {
  $("body").on("click", ".nextButton", e => {
    state.page++;
    let results = state.records.slice(state.page * 5, state.page * 5 + 5);
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
    <section class="mp-container">
    <ul class="mp-info">
      <li>
      <h3 class="fullName">${fullName}</h3>
      </li>
      
      <li><br /> <img src=${img} />
      </li>
      <li>  <h4 class="race"> Race/Ethnicity: ${raceethnicity} </h4>
      </li>
      <li>
      <h4 class="lastSeen"> Last seen: ${lastLocation} on ${dateoflastcontact}</h4>
      </li>
    
      <li> 
        <h4 class="link"> 
        Find out more information: <a target="_new" href=${link}>${link}</a>
        </h4> 
      </li>
    </ul>
  
    </section>
      `);

    $("#resources").show();
  }
  let nextButton = "";
  if (state.records.length > 10) {
    nextButton = `<button class="nextButton">Next</button>`;
  }
  $("#results-list").append(`${nextButton}`);
}
// 9. On click Clear form
// 10. Get form info on submit
function getnewSearch() {
  $("body").on("click", "#new-search-btn", function(e) {
    e.preventDefault();
    $(".results-container").hide();
    $(".results-txt").hide();
    $("#new-search-msg").hide();
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
