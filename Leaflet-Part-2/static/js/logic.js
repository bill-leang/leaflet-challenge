// use d3 to pull in the data from the USGS website as a data promise, then call createMarkers() when fulfilled
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(createMarkers);
d3.json("./boundaries.json").then(createPlateBoundaries);

let plateBoundaryLayer = null;

//draw the plate boundaries
function createPlateBoundaries(response){
  // console.log("Plate boundaries: ",response);
  let plateBoundaries = response.features;
  let plateBoundaryMarkers = [];
  for (let index = 0; index < plateBoundaries.length; index++) {
    let plateBoundary = plateBoundaries[index];
    console.log("plate boundary: ", plateBoundary);
    let coordinates = plateBoundary.geometry.coordinates.map(coord => [coord[1],coord[0]]);
    let plateBoundaryMarker = L.polyline(coordinates, {
      color: "orange",
      weight: 2,
      opacity: 1
    });
    plateBoundaryMarkers.push(plateBoundaryMarker);
  }
  plateBoundaryLayer = L.layerGroup(plateBoundaryMarkers);
  // createMap(L.layerGroup(plateBoundaryMarkers));
}

// create the markers, which call createmap()
function createMarkers(response){
  console.log("earthquakes: ", response);

  let earthquakes = response.features;
  let earthquakeMarkers = [];
  for (let index = 0; index < earthquakes.length; index++) {
    let earthquake = earthquakes[index];
    // console.log('depth: ', earthquake.geometry.coordinates[2]);

    //each earthquake is a circle with a radius based on magnitude
    let earthquakeMarker = L.circle([earthquake.geometry.coordinates[1],earthquake.geometry.coordinates[0]],{
      // create a black border for each circle, weight is thickness in pixels
      color: "black",
      weight: 1,
      opacity: 1,
      // the fill color is based on the depth of the earthquake
      fillColor: depthColor(earthquake.geometry.coordinates[2]),
      
      fillOpacity: 0.7,
      // the radius is based on the magnitude of the earthquake
      radius: earthquake.properties.mag * 30000 
      // add a popup with the location, magnitude, and depth of the earthquake
    }).bindPopup("<h3>" + earthquake.properties.place + "<h3><h3>Magnitude: " + earthquake.properties.mag + "</h3><h3>Depth: "+ earthquake.geometry.coordinates[2] + " km</h3>");
    // add the earthquake marker to the earthquakeMarkers array
    earthquakeMarkers.push(earthquakeMarker);
  }
  // call createMap() with the earthquakeMarkers array
  createMap(L.layerGroup(earthquakeMarkers));
}

// function to determine color based on depth
function depthColor(depth){
    if(depth > 90){
        return "#8B0000"; //color is dark red     
    }
    else if(depth > 70){
        return "#FF0000"; //color is red
    }
    else if(depth > 50){
        return "#FF8C00"; //color is dark orange
    }
    else if(depth > 30){
        return "#FFA500"; //color is orange
    }
    else if(depth > 10){
        return "#FFD700"; //color is gold
    }
    else{
        return "#FFFF00"; //color is yellow
    }
    }

// create the map, called by createMarkers()
function createMap(earthquakeMarkers){
    // Create the tile layer that will be the background of our map.
  let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  //** add topo map  */
  let topographicMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a> contributors'
});

  // Create a baseMaps object to hold the streetmap layer.
  let baseMaps = {
    "Street Map": streetmap,
    "Topographic Map": topographicMap
  };
  // Create an overlayMaps object to hold the earthquakeMarkers layer.
  let overlayMaps = {
    "Earthquakes": earthquakeMarkers,
    "Plate Boundaries": plateBoundaryLayer	
  };
  // Create the map object at the <div> with id "map", and pass it the streetmap and earthquakeMarkers layers.
  let map = L.map("map",{
    // set the center of the map to the north west africa to show all the map from this zoom level
    center: [24.73, -15.0059],
    zoom: 2,
    // add the streetmap and earthquakeMarkers layers to the map
    layers: [streetmap, earthquakeMarkers, plateBoundaryLayer]
  });
  // Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(map);

  // Create a legend to display information about depth
  let legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
    
        let div = L.DomUtil.create('div', 'info legend'),
            depth = [0, 10, 30, 50, 70, 90],
            labels = [];
    
        // loop through our density intervals and generate a label with a colored square for each interval
        for (let index = 0; index < depth.length; index++) {
            // display the depth range and color for each range
            div.innerHTML +=
                '<i style="background:' + depthColor(depth[index] + 1) + '; display: inline-block; height: 10px; width: 10px;"></i> ' +
                depth[index] + (depth[index + 1] ? '&ndash;' + depth[index + 1] + '<br>' : '+');
        }
    
        return div;
    }
    legend.addTo(map);

};


