import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat, toLonLat} from 'ol/proj';
import {Control, defaults as defaultControls} from 'ol/control';
const capitals = require('./country-capitals.json');

var Crosshair = function(Control) {
    function Crosshair(opt_options) {
        var options = opt_options || {};
  
        var img = document.createElement('img');
        img.src = require('./crosshair.png');
        img.style.height = '20px';
        img.style.width = '20px';
    
        var element = document.createElement('div');
        element.className = 'crosshair ol-unselectable';
        element.appendChild(img);
  
        Control.call(this, {
            element: element,
            target: options.target,
        });
    }
  
    if (Control) Crosshair.__proto__ = Control;
    Crosshair.prototype = Object.create( Control && Control.prototype );
    Crosshair.prototype.constructor = Crosshair;
  
    return Crosshair;
}(Control);

var HomeControl = function (Control) {
    function HomeControl(opt_options) {
        var options = opt_options || {};
  
        var button = document.createElement('button');
        button.innerHTML = 'H';
  
        var element = document.createElement('div');
        element.className = 'home ol-unselectable ol-control';
        element.appendChild(button);
  
        Control.call(this, {
            element: element,
            target: options.target,
        });
  
        button.addEventListener('click', this.handleHome.bind(this), false);
    }
  
    if (Control) HomeControl.__proto__ = Control;
    HomeControl.prototype = Object.create( Control && Control.prototype );
    HomeControl.prototype.constructor = HomeControl;
  
    HomeControl.prototype.handleHome = function handleHome() {
      this.getMap().getView().animate({
        center: fromLonLat([105.85, 21.05]),
        zoom: 4,
        rotation: 0
      });
    };
  
    return HomeControl;
  }(Control);

var 
    left_long = document.getElementById("left_long"),
    left_lat = document.getElementById("left_lat"),
    left_city = document.getElementById("left_city"),
    right_long = document.getElementById("right_long"),
    right_lat = document.getElementById("right_lat"),
    right_city = document.getElementById("right_city"),
    llongi = document.getElementById("left_long_input"),
    llati = document.getElementById("left_lat_input"),
    button = document.getElementById("button"),
    capt = document.getElementById("capitals");

function antipode(coord) {
    let long = coord[0] == 0 ? 180 : Math.sign(coord[0]) * (Math.abs(coord[0]) - 180),
        lat = -coord[1];
    return [long, lat];
};

function dist(capital, coord) {
    let lon1 = parseFloat(capital.CapitalLongitude);
    let lat1 = parseFloat(capital.CapitalLatitude);
    let lon2 = coord[0];
    let lat2 = coord[1];
    let dLat = (lat2 - lat1) * (Math.PI/180);
    let dLon = (lon2 - lon1) * (Math.PI/180);
    let a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

function nearestCapt(coord) {
    return capitals.sort((a, b) => dist(a, coord) - dist(b, coord))[0];
}

const map_a = new Map({
    controls: defaultControls().extend([new Crosshair(), new HomeControl()]),
    target: 'map_a',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: new View({
        center: fromLonLat([105.85, 21.05]),
        zoom: 4
    })
});

const map_b = new Map({
    controls: defaultControls().extend([new Crosshair()]),
    target: 'map_b',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: new View({
        center: [-74.15, -21.05],
        zoom: 4
    })
});

capitals.sort((a, b) => a.CountryName < b.CountryName ? -1 : a.CountryName > b.CountryName ? 1 : 0).forEach(capital => {
    let op = document.createElement('option');
    op.value = capital.CapitalName;
    op.innerHTML = `${capital.CountryName}: ${capital.CapitalName}`;
    capt.appendChild(op);
})

map_a.on('moveend', () => {
    let coord = toLonLat(map_a.getView().getCenter()), city = nearestCapt(coord);
    left_long.innerHTML = parseFloat(coord[0].toFixed(4));
    left_lat.innerHTML = parseFloat(coord[1].toFixed(4));
    left_city.innerHTML = `${city.CapitalName}, ${city.CountryName} (${dist(city, coord).toFixed(3)} km)`;
    llongi.value = parseFloat(coord[0].toFixed(4));
    llati.value = parseFloat(coord[1].toFixed(4));
    map_b.getView().animate({
        center: fromLonLat(antipode(coord)),
        zoom: map_a.getView().getZoom(),
        rotation: map_a.getView().getRotation()
    });
});

map_b.on('moveend', () => {
    let coord = toLonLat(map_b.getView().getCenter()), city = nearestCapt(coord);
    right_long.innerHTML = parseFloat(coord[0].toFixed(4));
    right_lat.innerHTML = parseFloat(coord[1].toFixed(4));
    right_city.innerHTML = `${city.CapitalName}, ${city.CountryName} (${dist(city, coord).toFixed(3)} km)`;
    map_a.getView().animate({
        center: fromLonLat(antipode(coord)),
        zoom: map_b.getView().getZoom(),
        rotation: map_b.getView().getRotation()
    });
});

button.onclick = () => {
    let coord = fromLonLat([llongi.value, llati.value]);
    map_a.getView().animate({
        center: coord
    });
};

capt.onchange = () => {
    let city = capitals.find(capital => capital.CapitalName == capt.value);
    let coord = fromLonLat([parseFloat(city.CapitalLongitude), parseFloat(city.CapitalLatitude)]);
    map_a.getView().animate({
        center: coord,
        zoom: 4,
        rotation: 0
    });
}