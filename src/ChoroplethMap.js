import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./App.css"; // Include your styles here

const ChoroplethMap = () => {
  const [educationData, setEducationData] = useState([]);
  const [countyData, setCountyData] = useState([]);
  const svgRef = useRef();

  useEffect(() => {
    // Fetch education data
    fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json")
      .then(response => response.json())
      .then(data => setEducationData(data));

    // Fetch county data
    fetch("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")
      .then(response => response.json())
      .then(data => setCountyData(topojson.feature(data, data.objects.counties).features));
  }, []);

  const drawChoroplethMap = useCallback(() => {
    const svg = d3.select(svgRef.current);

    // Create a color scale
    const colorScale = d3.scaleThreshold()
      .domain(d3.range(0, 101, 10)) // Updated domain for full range from 0% to 100%
      .range(d3.schemeBlues[9]); // Adjust range as needed, here using 9 shades of blue

    // Define tooltip
    const tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("opacity", 0);

    // Draw counties
    svg.selectAll("path")
      .data(countyData)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", d3.geoPath())
      .attr("fill", d => {
        const result = educationData.find(obj => obj.fips === d.id);
        return result ? colorScale(result.bachelorsOrHigher) : colorScale(0);
      })
      .attr("data-fips", d => d.id)
      .attr("data-education", d => {
        const result = educationData.find(obj => obj.fips === d.id);
        return result ? result.bachelorsOrHigher : 0;
      })
      .on("mouseover", (event, d) => {
        const result = educationData.find(obj => obj.fips === d.id);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`State: ${result ? result.state : 'N/A'}<br>Area: ${result ? result.area_name : 'N/A'}<br>Education: ${result ? result.bachelorsOrHigher : 0}%`)
          .attr("data-education", result ? result.bachelorsOrHigher : 0)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

    // Draw the legend
    const legend = svg.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${960 - 100}, 380)`); // Adjust position as needed

    const legendItemSize = 20;
    const legendSpacing = 5;
    const legendItems = colorScale.range().map((color, i) => {
      const domain = colorScale.domain();
      return {
        color,
        label: i === 0 ? `< ${domain[0]}%` : `${domain[i - 1]}% - ${domain[i]}%`,
      };
    });

    legend.selectAll("rect")
      .data(legendItems)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * (legendItemSize + legendSpacing))
      .attr("width", legendItemSize)
      .attr("height", legendItemSize)
      .attr("fill", d => d.color);

    legend.selectAll("text")
      .data(legendItems)
      .enter()
      .append("text")
      .attr("x", legendItemSize + 5)
      .attr("y", (d, i) => i * (legendItemSize + legendSpacing) + legendItemSize / 1.5)
      .text(d => d.label);
  }, [countyData, educationData]);

  useEffect(() => {
    if (educationData.length > 0 && countyData.length > 0) {
      drawChoroplethMap();
    }
  }, [educationData, countyData, drawChoroplethMap]);

  return (
    <div>
      <h1 id="title">United States Educational Attainment</h1>
      <p id="description">Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)</p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef} width={960} height={600}></svg>
      </div>
    </div>
  );
};

export default ChoroplethMap;
