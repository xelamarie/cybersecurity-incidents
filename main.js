const svg = d3.select("#chart");

const svgChartEl = document.getElementById("chart");

const margin = { top: 50, right: 200, bottom: 50, left: 50 },
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight - margin.top - margin.bottom;
const w = width - margin.right - margin.left;
const h = height - margin.top - margin.bottom;

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(); //.projection(projection);

const states = d3.json("https://d3js.org/us-10m.v2.json");
const stateData = d3.csv("states.csv");

const tableLabels = {
  Incident_Count: {
    tableName: "Top 10 States With Highest Count of Cyber Incidents",
    dataColumnName: "Incident Count",
  },
  "% Schools Impacted": {
    tableName: "Top 10 States With Highest % of Schools Impacted",
    dataColumnName: "% Schools Impacted",
  },
  "% Students Impacted": {
    tableName: "Top 10 States With Highest % of Students Impacted",
    dataColumnName: "% Students Impacted",
  },
};

const graphLabels = {
  Incident_Count: {
    tooltipLabel: "Incidents",
    domain: [5, 15, 25, 40, 50, 100, "200+"],
    legendTitle: "Incident Count",
  },
  "% Schools Impacted": {
    tooltipLabel: "% Schools Impacted",
    domain: [10, 15, 20, 30, 50, 60, 100],
    legendTitle: "% Schools Impacted",
  },
  "% Students Impacted": {
    tooltipLabel: "% Students Impacted",
    domain: [10, 15, 20, 30, 50, 60, 100],
    legendTitle: "% Students Impacted",
  },
};

Promise.all([states, stateData]).then(function (values) {
  document
    .getElementById("measure-select")
    .addEventListener("change", onSelectMeasure);

  function onSelectMeasure(evt) {
    const value = evt.currentTarget.value;
    ready(null, values[0], values[1], value);
  }
  ready(null, values[0], values[1], "Incident_Count");
});

function ready(error, states, stateData, measure) {
  const labels = graphLabels[measure];
  const uniqueStates = stateData.reduce((stateList, current) => {
    return stateList.add(current.State_Name);
  }, new Set([]));
  createMapAndLegend(states, stateData, labels.domain);

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
      map[item.State_Name] = item;
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
    const colorScale = d3.scaleThreshold().domain(colorDomain).range(colors);
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
          return colorScale(dataLookup[stateName][measure]);
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
       <font size="-1"><strong>${labels.tooltipLabel}: </strong>${data[measure]}</font><br />
       </div>`;
        tooltip.style.top = `${y + 195}px`;
        tooltip.style.left = `${x}px`;
        tooltip.style.display = "block";
      })
      .on("mouseout", function handleMouseOut(d) {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none";
        tooltip.innerHTML = "";
      });

    const legend = svg.append("g").attr("id", "legend");

    const legendX = width - 350;
    const legendY = 420;

    legend
      .append("text")
      .text(labels.legendTitle)
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
    const sorted = stateData.sort((a, b) => b[measure] - a[measure]);
    const limited = sorted.slice(0, 10);
    const tableBody = document.querySelector("#top-10 > tbody");

    const labels = tableLabels[measure];
    document.getElementById("table-caption").innerHTML = labels.tableName;
    document.getElementById("column-name").innerHTML = labels.dataColumnName;

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
      probCol.innerHTML = x[measure];
      row.appendChild(probCol);

      tableBody.appendChild(row);
    });
  }
}
