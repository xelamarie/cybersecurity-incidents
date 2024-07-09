const districtData = d3.csv("districts.csv");

Promise.all([districtData]).then(function ([data]) {
  let districts = [];

  document
    .getElementById("state-select")
    .addEventListener("change", onSelectState);

  document
    .getElementById("district-select")
    .addEventListener("click", (evt) => (evt.currentTarget.value = ""));

  document
    .getElementById("district-select")
    .addEventListener("change", onSelectDistrict);

  function onSelectState(evt) {
    const value = evt.currentTarget.value;
    districts = data
      .filter((d) => d.STATE === value)
      .sort((a, b) => {
        if (a.NAME < b.NAME) return -1;
        if (a.NAME > b.NAME) return 1;
        return 0;
      });

    const districtList = document.getElementById("school-districts");
    districtList.innerHTML = "";

    districts.forEach((d) => {
      const option = document.createElement("option");
      option.setAttribute("value", d.NAME);
      option.innerHTML = d.NAME;
      districtList.appendChild(option);
    });
  }

  function onSelectDistrict(evt) {
    const value = evt.currentTarget.value;
    console.log(value);
    const selectedDistrict = districts.find((d) => d.NAME === value);
    console.log(selectedDistrict);
    Object.keys(selectedDistrict).forEach((k) => {
      const span = document.getElementById(k);
      if (span) {
        span.innerHTML = selectedDistrict[k];
      }
    });
  }
});
