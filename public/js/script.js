var sapiens = document.getElementById("sapiens");

sapiens.onmouseover = function() {
  sapiens.style.color = "black";
  sapiens.style.fontSize = "365%";
  sapiens.style.backgroundColor = "lightgrey";
  document.getElementById("headline").style.color = "white";
  document.getElementById("headline").style.fontSize = "1.4em";
  document.getElementById("headline").style.transition = "all 0.6s";
  document.getElementById("main").style.transform = "translateY(-50%)";
  document.getElementById("main").style.transform = "translateX(-50%)";
  document.getElementById("main").style.transition = "all 0.5s";
  document.getElementById("tagline").style.transition = "all 0.4s";
  document.getElementById("tagline").style.color = "black";
}

sapiens.onmouseleave = function() {
  sapiens.style.color = "white";
  sapiens.style.fontSize = "3em";
  sapiens.style.backgroundColor = "black";
  document.getElementById("headline").style.color = "black";
  document.getElementById("headline").style.fontSize = "0em";
  document.getElementById("headline").style.transition = "all 0.6s";
  document.getElementById("main").style.transform = "translateY(-50%)";
  document.getElementById("main").style.transform = "translateX(-50%)";
  document.getElementById("main").style.transition = "all 0.5s";
  document.getElementById("tagline").style.transition = "all 0.7s";
  document.getElementById("tagline").style.color = "darkgray";
}