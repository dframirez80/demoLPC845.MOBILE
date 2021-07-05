const w = window;
const d = document;
const buzzer = d.getElementById('buzzer');
const ledRojo = d.getElementById('ledRojo');
const ledVerde = d.getElementById('ledVerde');
const ledAzul = d.getElementById('ledAzul');
const btnPlus = d.getElementById('btn-plus');
const btnLess = d.getElementById('btn-less');
const segments = d.getElementById('number');
const s1 = d.getElementById('sw-s1');
const s2 = d.getElementById('sw-s2');
const sUser = d.getElementById('sw-user');
const sIsp = d.getElementById('sw-isp');
const valueT = d.getElementById('value-temp');
const valueP = d.getElementById('value-pres');
const valueH = d.getElementById('value-hum');
const valueL = d.getElementById('value-lux');
const valueR21 = d.getElementById('value-r21');
const valueR22 = d.getElementById('value-r22');

var flagC =false;

setInterval(() => {
    try {
        Device.CheckData(); //<-- executes C# code Mobile
        //window.chrome.webview.postMessage(message);       //<-- executes C# code PC
    }
    catch (err) {
    } 
}, 250);

// obj 
var txd = {
    id: 'pc',
    leds: 0,
    buzzer:0,
    dac:0,
    segments: 0,
};
// obj de respuesta para enviar
var rxd = {
    id: ' ', leds: 0, buzzer: 0, dac: 0, segments: 0,
    r21: 0,
    r22: 0,
    humedad: 0,
    presion: 900,
    temperatura: 0,
    lux: 0,
    s1: 0,
    s2: 0,
    user: 0,
    isp: 0,
}

d.addEventListener('click',e=>{
    // leds
    if(e.target == buzzer){
        e.target.classList.toggle('led-off');
        if (txd.buzzer) txd.buzzer = 0;
        else txd.buzzer = 1;
        rxd.buzzer = txd.buzzer;
        flagC = true;
    }
    if(e.target == ledRojo || e.target == ledVerde || e.target == ledAzul){
        e.target.classList.toggle('led-off');
         if (e.target == ledRojo) {
            if (txd.leds == 1) txd.leds = 0;
            else txd.leds = 1;
            ledVerde.classList.add('led-off');
            ledAzul.classList.add('led-off');
        } 
        if(e.target == ledVerde){
            if (txd.leds == 2) txd.leds = 0;
            else txd.leds = 2;
            ledRojo.classList.add('led-off');
            ledAzul.classList.add('led-off');
        } 
        if(e.target == ledAzul){
            if (txd.leds == 3) txd.leds = 0;
            else txd.leds = 3;
            ledVerde.classList.add('led-off');
            ledRojo.classList.add('led-off');
        } 
        rxd.leds = txd.leds;
        flagC = true;
    } 
    // 7 segmentos
    if(e.target == btnLess || e.target == btnPlus){
        if(e.target == btnLess && txd.segments > 0) txd.segments--; 
        if(e.target == btnPlus && txd.segments < 99) txd.segments++;
        segments.innerHTML = txd.segments.toString().padStart(2, '00'); 
        rxd.segments = txd.segments;
        flagC = true;
    }
    if(flagC == true){
        flagC = false;
        JStoCsharp(JSON.stringify(txd));
        //console.log(JSON.stringify(txd).toString());  
    }
});
//---------------------------------------------------------
function JStoCsharp(message) {
    try {
        Device.CallCSharp(message); //<-- executes C# code Mobile
        //window.chrome.webview.postMessage(message);       //<-- executes C# code PC
    }
    catch (err) {
        //alert(err);
    }
}
//---------------------------------------------------------
function messageFromCsharp(message) {
    //console.log(message);
    try {
        if (typeof (message) !== 'object') rxd = JSON.parse(message);
        else rxd = message;
        // datos de escritura
        if(rxd.id=='w'){                
            gaugeH.set(rxd.humedad); // set actual value
            valueH.innerHTML = rxd.humedad;
            gaugeT.set(rxd.temperatura); // set actual value
            valueT.innerHTML = rxd.temperatura;
            gaugeP.set(rxd.presion); // set actual value
            valueP.innerHTML = rxd.presion;
            gaugeL.set(rxd.lux); // set actual value
            valueL.innerHTML = rxd.lux;
            gaugeR21.set(rxd.r21); // set actual value
            valueR21.innerHTML = rxd.r21;
            gaugeR22.set(rxd.r22); // set actual value
            valueR22.innerHTML = rxd.r22;
            if(!rxd.s1){
                s1.classList.add('sw-on');
                s1.innerHTML='ON';
            } 
            else{
                s1.classList.remove('sw-on');
                s1.innerHTML='OFF';
            } 
            if(!rxd.s2){
                s2.classList.add('sw-on');
                s2.innerHTML='ON';
            } else{
                s2.classList.remove('sw-on');
                s2.innerHTML='OFF';
            } 
            if(!rxd.user){
                sUser.classList.add('sw-on');
                sUser.innerHTML='ON';
            } else{
                sUser.classList.remove('sw-on');
                sUser.innerHTML='OFF';
            } 
            if(!rxd.isp){
                sIsp.classList.add('sw-on');
                sIsp.innerHTML='ON';
            } else{
                sIsp.classList.remove('sw-on');
                sIsp.innerHTML='OFF';
            } 
        }
        if(rxd.id=='u'){
            if(rxd.leds == 0){
                ledRojo.classList.add('led-off');
                ledVerde.classList.add('led-off');
                ledAzul.classList.add('led-off');
            }
            if(rxd.leds == 1){
                ledRojo.classList.remove('led-off');
                ledVerde.classList.add('led-off');
                ledAzul.classList.add('led-off');
            }
            if(rxd.leds == 2){
                ledRojo.classList.add('led-off');
                ledVerde.classList.remove('led-off');
                ledAzul.classList.add('led-off');
            }
            if(rxd.leds == 3){
                ledRojo.classList.add('led-off');
                ledVerde.classList.add('led-off');
                ledAzul.classList.remove('led-off');
            }
            if(rxd.buzzer == 0) buzzer.classList.add('led-off');
            else buzzer.classList.remove('led-off');
            segments.innerHTML = rxd.segments.toString().padStart(2,'00'); 
        }
    }
    catch (err) {
        //alert("Mensaje desde C sharp " + err);
    }
}
//---------------------------------------------------------

var opts = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.15, // The line thickness
    radiusScale: 0.99, // Relative radius
    pointer: {
      length: 0.34, // // Relative to gauge radius
      strokeWidth: 0.053, // The thickness
      color: '#000000' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#E0E0E0',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
    staticZones: [
        {strokeStyle: "#00FF00", min: 0, max: 60}, // Red from 100 to 60
        {strokeStyle: "#5959e9", min: 60, max: 100}, // Yellow
     ],
    
  };
  var optsP = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.1, // The line thickness
    radiusScale: 0.99, // Relative radius
    pointer: {
      length: 0.34, // // Relative to gauge radius
      strokeWidth: 0.093, // The thickness
      color: '#000000' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#5959e9',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support    
  };
  var optsT = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.25, // The line thickness
    radiusScale: 0.99, // Relative radius
    pointer: {
      length: 0.49, // // Relative to gauge radius
      strokeWidth: 0.053, // The thickness
      color: '#000000' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#D76F6D',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
    staticZones: [
        {strokeStyle: "#6DC1D7", min: -20, max: 0}, // Red from 100 to 60
        {strokeStyle: "#ADD76D", min: 0, max: 80}, // Red from 100 to 60
        {strokeStyle: "#D76F6D", min: 80, max: 100}, // Yellow
     ],
    
  };
  var optsL = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.1, // The line thickness
    radiusScale: 0.99, // Relative radius
    pointer: {
      length: 0.34, // // Relative to gauge radius
      strokeWidth: 0.093, // The thickness
      color: '#000000' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#EDF938',   // Colors
    colorStop: '#E0E3AA',    // just experiment with them
    strokeColor: '#EDF938',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support    
  };
  var optsR = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.15, // The line thickness
    radiusScale: 0.99, // Relative radius
    pointer: {
      length: 0.34, // // Relative to gauge radius
      strokeWidth: 0.053, // The thickness
      color: '#000000' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#E0E0E0',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
  };
  var humedad = document.getElementById('gauge-hum'); // your canvas element
  var gaugeH = new Gauge(humedad).setOptions(opts); // create sexy gauge!
  gaugeH.maxValue = 100; // set max gauge value
  gaugeH.setMinValue(0);  // Prefer setter over gauge.minValue = 0
  gaugeH.animationSpeed = 32; // set animation speed (32 is default value)
  gaugeH.set(rxd.humedad); // set actual value

  var temp = document.getElementById('gauge-temp'); // your canvas element
  var gaugeT = new Gauge(temp).setOptions(optsT); // create sexy gauge!
  gaugeT.maxValue = 100; // set max gauge value
  gaugeT.setMinValue(-20);  // Prefer setter over gauge.minValue = 0
  gaugeT.animationSpeed = 32; // set animation speed (32 is default value)
  gaugeT.set(rxd.temperatura); // set actual value
  
  var presion = document.getElementById('gauge-pres'); // your canvas element
  var gaugeP = new Gauge(presion).setOptions(optsP); // create sexy gauge!
  gaugeP.maxValue = 1100; // set max gauge value
  gaugeP.setMinValue(900);  // Prefer setter over gauge.minValue = 0
  gaugeP.animationSpeed = 32; // set animation speed (32 is default value)
  gaugeP.set(rxd.presion); // set actual value
  
  var lux = document.getElementById('gauge-lux'); // your canvas element
  var gaugeL = new Gauge(lux).setOptions(optsL); // create sexy gauge!
  gaugeL.maxValue = 32500; // set max gauge value
  gaugeL.setMinValue(0);  // Prefer setter over gauge.minValue = 0
  gaugeL.animationSpeed = 32; // set animation speed (32 is default value)
  gaugeL.set(rxd.lux); // set actual value

  var r21 = document.getElementById('gauge-r21'); // your canvas element
  var gaugeR21 = new Gauge(r21).setOptions(optsR); // create sexy gauge!
  gaugeR21.maxValue = 4095; // set max gauge value
  gaugeR21.setMinValue(0);  // Prefer setter over gauge.minValue = 0
  gaugeR21.animationSpeed = 32; // set animation speed (32 is default value)
  gaugeR21.set(rxd.r21); // set actual value

  var r22 = document.getElementById('gauge-r22'); // your canvas element
  var gaugeR22 = new Gauge(r22).setOptions(optsR); // create sexy gauge!
  gaugeR22.maxValue = 4095; // set max gauge value
  gaugeR22.setMinValue(0);  // Prefer setter over gauge.minValue = 0
  gaugeR22.animationSpeed = 32; // set animation speed (32 is default value)
  gaugeR22.set(rxd.r22); // set actual value

  valueH.innerHTML = rxd.humedad;
  valueT.innerHTML = rxd.temperatura;
  valueP.innerHTML = rxd.presion;
  valueL.innerHTML = rxd.lux;
  valueR21.innerHTML = rxd.r21;
  valueR22.innerHTML = rxd.r22;
