var sapiens = document.getElementById("sapiens");

sapiens.onmouseover = function() {
  sapiens.style.fontSize = "400%";
  sapiens.style.backgroundColor = "lightgrey";
  sapiens.style.color = "black";
  document.getElementById("main").style.transform = "translateY(-50%)";
  document.getElementById("main").style.transform = "translateX(-50%)";
  document.getElementById("main").style.transition = "all 0.5s";
  document.getElementById("tagline").style.transition = "all 0.5s";
  document.getElementById("tagline").style.color = "white";
}

sapiens.onmouseleave = function() {
  sapiens.style.fontSize = "3em";
  sapiens.style.backgroundColor = "black";
  sapiens.style.color = "white";
  document.getElementById("main").style.transform = "translateY(-50%)";
  document.getElementById("main").style.transform = "translateX(-50%)";
  document.getElementById("main").style.transition = "all 0.5s";
  document.getElementById("tagline").style.transition = "all 0.5s";
  document.getElementById("tagline").style.color = "darkgray";
}