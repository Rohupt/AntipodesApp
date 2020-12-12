import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat, toLonLat} from 'ol/proj';
import {Control, defaults as defaultControls} from 'ol/control';

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

function antipode(coord) {
    let long = coord[0] == 0 ? 180 : Math.sign(coord[0]) * (Math.abs(coord[0]) - 180),
        lat = -coord[1];
    return [long, lat];
}

const map_a = new Map({
    controls: defaultControls().extend([new Crosshair()]),
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

var 
    left_long = document.getElementById("left_long"),
    left_lat = document.getElementById("left_lat"),
    right_long = document.getElementById("right_long"),
    right_lat = document.getElementById("right_lat"),
    llongi = document.getElementById("left_long_input"),
    llati = document.getElementById("left_lat_input"),
    button = document.getElementById("button");

map_a.on('moveend', () => {
    let coord = toLonLat(map_a.getView().getCenter());
    left_long.innerHTML = parseFloat(coord[0].toFixed(4));
    left_lat.innerHTML = parseFloat(coord[1].toFixed(4));
    llongi.value = parseFloat(coord[0].toFixed(4));
    llati.value = parseFloat(coord[1].toFixed(4));
    map_b.getView().animate({
        center: fromLonLat(antipode(coord)),
        zoom: map_a.getView().getZoom(),
        rotation: map_a.getView().getRotation()
    });
});

map_b.on('moveend', () => {
    let coord = toLonLat(map_b.getView().getCenter());
    right_long.innerHTML = parseFloat(coord[0].toFixed(4));
    right_lat.innerHTML = parseFloat(coord[1].toFixed(4));
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