/*const height = 500;
const width = 700;*/

const svg = d3.select("#chart");

const svgChartEl = document.getElementById("chart");
//const resultsBtn = document.getElementById("results-button");

const margin = { top: 50, right: 200, bottom: 50, left: 50 },
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight - margin.top - margin.bottom;
const w = width - margin.right - margin.left;
const h = height - margin.top - margin.bottom;

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(); //.projection(projection);

const states = d3.json("https://d3js.org/us-10m.v2.json");
const stateData = d3.csv("states.csv");

const incidentsDomain = [5, 15, 25, 40, 50, 100, "200+"];
const studentsDomain = [5, 15, 25, 40, 50, 100, 200];
const duplicatedStudentsDomain = [5, 15, 25, 40, 50, 100, 200];

Promise.all([states, stateData]).then(function (values) {
  ready(null, values[0], values[1]);
});

function ready(error, states, stateData) {
  const uniqueStates = stateData.reduce((stateList, current) => {
    return stateList.add(current.State_Name);
  }, new Set([]));
  createMapAndLegend(states, stateData, incidentsDomain);
  //createMapAndLegend(states, stateData, studentsDomain);
  //createMapAndLegend(states, stateData, duplicatedStudentsDomain);

  function createSvg() {
    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("id", "choropleth")
      .attr("viewBox", "0 0 1080 680");

    return svg;
  }

  function clearSvg() {
    document.getElementById("choropleth")?.remove();
  }

  function createMapAndLegend(states, stateData, colorDomain) {
    const dataLookup = stateData.reduce((map, item) => {
      map[item.State_Name] = {
        incidents: item["Incident_Count"],
        studentsDuplicated: item["Total_Students_Duplicated"],
        studentsUnduplicated: item["Total_Students"],
      };
      return map;
    }, {});
    const colors = [
      "#07F49E",
      "#11CC99",
      "#1BA493",
      "#257C8E",
      "#2E5489",
      "#382C83",
      "#42047E",
    ];
    const colorScale = d3
      .scaleThreshold()
      .domain(colorDomain)
      //.scaleQuantile()
      //.domain(stateData.map((d) => d["Incident Count"]))
      .range(colors);
    clearSvg();
    const svg = createSvg();
    const stateContainer = svg.append("g").attr("id", "states");
    const data = topojson.feature(states, states.objects.states).features;
    stateContainer
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", function (d) {
        const stateName = d.properties.name.toUpperCase();
        if (dataLookup[stateName]) {
          return colorScale(dataLookup[stateName].incidents);
        }
        return "gray";
      })
      .on("mousemove", function handleMouseOver(d) {
        const [x, y] = d3.mouse(this);
        const stateName = d.properties.name.toUpperCase();
        const data = dataLookup[stateName] || {
          incidents: "N/A",
        };
        const tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = `<div>
       <strong></strong>${d.properties.name}<br />
       <font size="-1"><strong>Incidents: </strong>${data.incidents}</font><br />
       </div>`;
        tooltip.style.top = `${y + 200}px`;
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.display = "block";
      })
      .on("mouseout", function handleMouseOut(d) {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none";
        tooltip.innerHTML = "";
      });

    const legend = svg.append("g").attr("id", "legend");

    const legendX = width - 300;
    const legendY = 430;

    legend
      .append("text")
      .text("Incident Count")
      .attr("x", legendX)
      .attr("y", legendY - 30);

    colors.forEach((c, idx) => {
      legend
        .append("text")
        .text(
          colorScale
            .invertExtent(c)
            .map((x) => x || 0)
            .join("-")
        )
        .attr("x", legendX + 20)
        .attr("y", legendY + idx * 20);

      legend
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", legendX)
        .attr("y", legendY - 12 + idx * 20)
        .attr("fill", c);
    });
    updateTable(stateData);
  }

  function updateTable(stateData) {
    const sorted = stateData.sort(
      (a, b) => b.Incident_Count - a.Incident_Count
    );
    const limited = sorted.slice(0, 10);
    const tableBody = document.querySelector("#top-10 > tbody");
    tableBody.innerHTML = "";
    limited.forEach((x, idx) => {
      console.log(x);
      const row = document.createElement("tr");

      const rankCol = document.createElement("td");
      rankCol.innerHTML = idx + 1;
      row.appendChild(rankCol);

      const nameCol = document.createElement("td");
      nameCol.className = "state-name";
      nameCol.innerHTML = x.State_Name.toLowerCase();
      row.appendChild(nameCol);

      const probCol = document.createElement("td");
      probCol.innerHTML = x.Incident_Count;
      row.appendChild(probCol);

      tableBody.appendChild(row);
    });
  }
  /*
d3.json("https://d3js.org/us-10m.v2.json").then(async function (usData) {
  const stateData = await d3.csv("states.csv");
});

  function drawState(selectedStateId, coefs) {
    svgChartEl.innerHTML = "";

    const stateData = topojson
      .feature(usData, usData.objects.states)
      .features.filter((d) => d.id === selectedStateId);

    const countiesData = topojson
      .feature(usData, usData.objects.counties)
      .features.filter((d) => d.id.indexOf(selectedStateId) === 0);

    coefs.counties = countiesData.map((x) => ({
      id: x.id,
      name: x.properties.name,
      value: getFeatureCoef(codeToState[selectedStateId], "county_code_", x.id),
    }));

    const countyPredictions = coefs.counties.map((x) => {
      const odds = Math.exp(
        coefs.intercept + // intercept
          x.value + // county
          coefs.genderCoef + // gender
          coefs.raceCoef + // race/ethnicity
          coefs.ageCoef + // age
          coefs.oTypeCoef + // occupancy type
          Math.log(coefs.income / 1000) * coefs.incomeLogCoef + // income
          Math.log(coefs.loanAmount / 1000) * coefs.loanAmountLogCoef + // loan amount
          //coefs.interestRate * coefs.interestRateCoef + // interest rate
          //coefs.loanTerm * coefs.loanTermCoef + // loan term
          Math.log(coefs.propertyValue / 1000) * coefs.propertyValueCoef // property value
      );
      return {
        prediction: odds / (1 + odds),
        ...x,
      };
    });
    updateTable(countyPredictions);

    const colors = ["#F4EBED", "#D3B1B7", "#B27682", "#913C4C"];

    const colorScale = d3
      .scaleQuantile()
      .domain(countyPredictions.map((d) => d.prediction))
      .range(colors);

    const projection = d3.geoIdentity().fitSize([width, height], stateData[0]);

    const path = d3.geoPath().projection(projection);

    svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(countiesData)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", function (d) {
        return "county" + d.id;
      })
      .attr("fill", function (d) {
        const countyData = countyPredictions.find((x) => x.id === d.id);
        const color = colorScale(countyData.prediction);
        return color;
      })

      .on("mousemove", function handleMouseOver(d) {
        const [x, y] = d3.mouse(this);
        const countyData = countyPredictions.find((x) => x.id === d.id);
        const tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = `<div>
        <strong>County: </strong>${countyData.name}<br />
        <strong>${countyData.prediction.toFixed(4)}
        </div>`;
        tooltip.style.top = `${y + 400}px`;
        tooltip.style.left = `${x + 100}px`;
        tooltip.style.display = "block";
      })

      .on("mouseout", function (d) {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none";
        tooltip.innerHTML = "";
      });

    svg
      .append("path")
      .attr("class", "county-borders")
      .attr(
        "d",
        path(
          topojson.mesh(usData, usData.objects.counties, function (a, b) {
            return a !== b;
          })
        )
      );

    const legendBody = document.querySelector("#legend > tbody");
    legendBody.innerHTML = "";

    colors.reverse().forEach((x, idx) => {
      const row = document.createElement("tr");

      const colorCol = document.createElement("td");
      colorCol.style.width = "24px";
      colorCol.style.backgroundColor = x;
      colorCol.innerHTML = "&nbsp;";
      row.appendChild(colorCol);

      const probCol = document.createElement("td");
      probCol.innerHTML = colorScale
        .invertExtent(x)
        .map((x) => x.toFixed(4))
        .join("-");
      row.appendChild(probCol);

      legendBody.appendChild(row);
    });
  }

  function getFeatureCoef(state, prefix, value) {
    const key = `${prefix}${value}`;
    const coef = incidents
      .filter((x) => x.state === state)
      .find((x) => x.Feature === key);
    return coef ? parseFloat(coef.Coefficient) : 0;
  }

  function updateTable(countyPredictions) {
    const sorted = countyPredictions.sort(
      (a, b) => b.prediction - a.prediction
    );
    const limited = sorted.slice(0, 10);
    const tableBody = document.querySelector("#top-10 > tbody");
    tableBody.innerHTML = "";
    limited.forEach((x, idx) => {
      const row = document.createElement("tr");

      const rankCol = document.createElement("td");
      rankCol.innerHTML = idx + 1;
      row.appendChild(rankCol);

      const nameCol = document.createElement("td");
      nameCol.innerHTML = x.name;
      row.appendChild(nameCol);

      const probCol = document.createElement("td");
      probCol.innerHTML = x.prediction.toFixed(4);
      row.appendChild(probCol);

      tableBody.appendChild(row);
    });
  }

  function renderData() {
    const state = document.getElementById("state-select").value;
    const stateAbrev = codeToState[state];

    const gender = document.getElementById("gender-select").value;
    const genderCoef = getFeatureCoef(stateAbrev, "derived_sex_", gender);

    const age = document.getElementById("age-select").value;
    const ageCoef = getFeatureCoef(stateAbrev, "applicant_age_", age);

    const race = document.getElementById("race-select").value;
    const raceCoef = getFeatureCoef(stateAbrev, "race_ethnicity_", race);

    const oType = document.getElementById("occupancy_type-select").value;
    const oTypeCoef = getFeatureCoef(stateAbrev, "occupancy_type_", oType);

    const income = parseFloat(document.getElementById("income-entry").value);
    const incomeLogCoef = getFeatureCoef(stateAbrev, "income_log", "");

    const loanAmount = 305000; // median loan amount
    const loanAmountLogCoef = getFeatureCoef(stateAbrev, "loan_amount_log", "");

    const interestRate = 3.875; // median interest rate
    const interestRateCoef = getFeatureCoef(stateAbrev, "interest_rate", "");

    const loanTerm = 360; // // median loan term in months
    const loanTermCoef = getFeatureCoef(stateAbrev, "loan_term", "");

    const propertyValue = 375000; // median property value
    const propertyValueCoef = getFeatureCoef(
      stateAbrev,
      "property_value_log",
      ""
    );

    const intercept = getFeatureCoef(stateAbrev, "Intercept", "");

    coefs = {
      ageCoef,
      raceCoef,
      genderCoef,
      oTypeCoef,
      income,
      incomeLogCoef,
      loanAmount,
      loanAmountLogCoef,
      //interestRate,
      //interestRateCoef,
      //loanTerm,
      //loanTermCoef,
      propertyValue,
      propertyValueCoef,
      intercept,
    };

    drawState(state, coefs);
  }

  resultsBtn.addEventListener("click", (evt) => {
    renderData();
  });

  renderData();
});








/*Q5
// enter code to define margin and dimensions for svg
const margin = { top: 50, right: 200, bottom: 50, left: 50 },
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight - margin.top - margin.bottom;
const w = width - margin.right - margin.left;
const h = height - margin.top - margin.bottom;

// enter code to define projection and path required for Choropleth
// For grading, set the name of functions for projection and path as "projection" and "path"
const projection = d3.geoNaturalEarth1();
const path = d3.geoPath().projection(projection);

// define any other global variables
const world = d3.json("world_countries.json");
const gameData = d3.csv("ratings-by-country.csv");

Promise.all([world, gameData]).then(function (values) {
  // enter code to call ready() with required arguments
  ready(null, values[0], values[1]);
});

// this function should be called once the data from files have been read
// world: topojson from world_countries.json
// gameData: data from ratings-by-country.csv

function ready(error, world, gameData) {
  // enter code to extract all unique games from gameData
  const uniqueGames = gameData.reduce((gameList, current) => {
    return gameList.add(current.Game);
  }, new Set([]));

  // enter code to append the game options to the dropdown
  const gameDropdown = document.getElementById("gameDropdown");
  Array.from(uniqueGames)
    .sort()
    .forEach((game, idx) => {
      const option = document.createElement("option");
      option.setAttribute("value", game);
      option.innerText = game;
      if (idx === 0) {
        option.setAttribute("selected", true);
      }
      gameDropdown.appendChild(option);
    });
  // event listener for the dropdown. Update choropleth and legend when selection changes. Call createMapAndLegend() with required arguments.
  gameDropdown.addEventListener("change", (evt) => {
    createMapAndLegend(world, gameData, evt.currentTarget.value);
  });
  // create Choropleth with default option. Call createMapAndLegend() with required arguments.
  createMapAndLegend(world, gameData, gameDropdown.value);
}

function createSvg() {
  // enter code to create svg
  const svg = d3
    .select("body")
    .append("svg")
    .attr("id", "choropleth")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  return svg;
}

function clearSvg() {
  document.getElementById("choropleth")?.remove();
}

// this function should create a Choropleth and legend using the world and gameData arguments for a selectedGame
// also use this function to update Choropleth and legend when a different game is selected from the dropdown
function createMapAndLegend(world, gameData, selectedGame) {
  const filterGameData = gameData.filter((x) => {
    return x.Game === selectedGame;
  });
  const dataLookup = filterGameData.reduce((map, item) => {
    map[item.Country] = {
      rating: item["Average Rating"],
      users: item["Number of Users"],
    };
    return map;
  }, {});
  const colors = ["#238b45", "#74c476", "#bae4b3", "#edf8e9"].reverse();
  const colorScale = d3
    .scaleQuantile()
    .domain(filterGameData.map((d) => d["Average Rating"]))
    .range(colors);
  clearSvg();
  const svg = createSvg();
  const countryContainer = svg.append("g").attr("id", "countries");
  countryContainer
    .selectAll("path")
    .data(world.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", function (d) {
      const countryName = d.properties.name;
      if (dataLookup[countryName]) {
        return colorScale(dataLookup[countryName].rating);
      }
      return "gray";
    })
    .on("mousemove", function handleMouseOver(d) {
      const [x, y] = d3.mouse(this);
      const countryName = d.properties.name;
      const data = dataLookup[countryName] || { rating: "N/A", users: "N/A" };
      const tooltip = document.getElementById("tooltip");
      console.log(d);
      tooltip.innerHTML = `<div>
      <strong>Country: </strong>${countryName}<br />
      <strong>Game: </strong>${selectedGame}<br />
      <strong>Avg Rating: </strong>${data.rating}<br />
      <strong>Number of users: </strong>${data.users}
      </div>`;
      tooltip.style.top = `${y + 20}px`;
      tooltip.style.left = `${x + 20}px`;
      tooltip.style.display = "block";
    })
    .on("mouseout", function handleMouseOut(d) {
      const tooltip = document.getElementById("tooltip");
      tooltip.style.display = "none";
      tooltip.innerHTML = "";
    });

  const legend = svg.append("g").attr("id", "legend");

  colors.forEach((c, idx) => {
    legend
      .append("text")
      .text(
        colorScale
          .invertExtent(c)
          .map((x) => (Math.round(x * 100) / 100).toFixed(2))
          .join("-")
      )
      .attr("x", width + 150)
      .attr("y", 30 + idx * 20);

    legend
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("x", width + 130)
      .attr("y", 20 + idx * 20)
      .attr("fill", c);
  });
}
*/
}
