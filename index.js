// 1. Show description and search form
// 2. User will input their query and search button
// 3. User clicks search button, desc. and form go away
// 4. User clicks on new search button, results go away, and original home screen comes back

// 2. fetch info from namus api // done
// 3. then check response // done
// 4. if invalid throw error //done
// 5. if valid, display results
// 6. catch error, display err message //done
// 7. display new search button
// 8. Show new search message to user
// 9. On click Clear form
// 10. Get form info on submit

"use strict";
let searchURL = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=namus-missings&facet=statedisplaynameoflastcontact`;

const startingElems = {
  homeSection: `
  <section id="starting-screen">
    <h2 class="description">An app that provides you information on missing persons in your area or state. This app includes their last known location, 
    description of the person, and resources you can utilize to help find them.
    </h2>
    <form id="search-form">
      <label for="city" id="city">Enter City</label>
      <input id="search-city" class="userInput" type="text" name="search-city" placeholder="Austin" autofocus spellcheck="true" required>
      <label for="state" id="state">Enter State</label>
      <input id="search-state" class="userInput" type="text" name="search-state" placeholder="TX" maxlength="2" autofocus spellcheck="true" required>
      <button id="search">Search</button>
      </form>
  </section> `
};

$(document).ready(function() {
  $(".js-form").append(startingElems.homeSection);
});

//creates url with user input
function formatQueryParams(params) {
  const queryItems = Object.keys(params).map(
    key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  );
  return queryItems.join("&");
}

// 2. fetch info from namus api
function getMissingPerson(cityQuery, stateQuery) {
  // let cityoflastcontact = cityQuery
  let statedisplaynameoflastcontact = stateQuery;
  let params = {
    facet: "cityoflastcontact",
    "refine.cityoflastcontact": cityQuery,
    "refine.statedisplaynameoflastcontact": stateQuery
  };

  const queryString = formatQueryParams(params);
  const url = `${searchURL}&${queryString}`;

  console.log(url);

  fetch(url)
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error(res.statusText);
    })
    .then(resJson => displayResults(resJson))
    .catch(err => {
      $("#js-error-message").text(`Something went wrong: ${err.message}`);
    });
}

// 5. displayResults by emptying landing page and filling it with results
function displayResults(resJson) {
  // if there are previous results, remove them
  console.log(resJson);
  $("#results-list").empty();
  $("#starting-screen").hide();
  // iterate through the items array
  for (let i = 0; i < resJson.records.length; i++) {
    // for each record object in the items
    //array, add a list item to the results
    //list with the name, description,
    //and image of MP

    //get random array of MP's
    if (resJson.length > 0) {
      let random = getRandomMP(0, resJson.length - 1);
      console.log(resJson[random]);
    }
    function getRandomMP(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const fullName = `${resJson.records[i].fields.firstname} ${resJson.records[i].fields.middlename}  ${resJson.records[i].fields.lastname}`;
    const lastLocation = `${resJson.records[i].fields.cityoflastcontact}, ${resJson.records[i].fields.statedisplaynameoflastcontact}`;

    $("#results-list").append(`
    <section class="mp-info">
    <div>
      <li>
        <h3>${fullName}</h3>
      </li>
      </div>
      <div>
      <li>    
        <p>
         <img src=${resJson.records[i].fields.image}>
        </p>
      </li> 
      </div> 
      <div>
      <li>    
        <h4>
          Last seen: ${lastLocation} on ${resJson.records[i].fields.dateoflastcontact}
        </h4>
      </li>
      </div>
      <div>
      <li> 
        <h4 class="link"> 
        Find out more information: <a href=${resJson.records[i].fields.link}>${resJson.records[i].fields.link}</a>
        </h4> 
      </li>
      </div>
    </section>
      `);
  }
  // 7. display new search button
  // 8. Show CTA message to user
  $("#new-search-msg").html(
    `<p class="message footer">Want to search in a new location?</p>
      <button id="new-search-btn">Try again</button>`
  );
  //display the results section
  $(".results").show();
  $("#new-search-msg").show();
}

// 9. On click Clear form
// 10. Get form info on submit
function getnewSearch() {
  $("body").on("click", "#new-search-btn", function(e) {
    e.preventDefault();
    $(".results").hide();
    $("#new-search-msg").hide();
    $("#starting-screen").show();
    $(".userInput").empty();
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
}
//start app by calling findUs function
$(findUs);
